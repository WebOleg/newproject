import { NextRequest, NextResponse } from 'next/server'
import { getMongoClient, getDbName } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { buildTransactionFilter, buildChargebackFilter } from '@/lib/analytics-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const session = await requireSession()

        const searchParams = request.nextUrl.searchParams
        const startDate = searchParams.get('start_date')
        const endDate = searchParams.get('end_date')

        // Default to a wide range if not provided
        const start = startDate ? new Date(`${startDate}T00:00:00Z`) : new Date('2020-01-01T00:00:00Z')
        const end = endDate ? new Date(`${endDate}T23:59:59Z`) : new Date()

        if (!endDate) {
            end.setHours(23, 59, 59, 999)
        }

        const client = await getMongoClient()
        const db = client.db(getDbName())
        const txColl = db.collection('emp_reconcile_transactions')
        const cbColl = db.collection('emp_chargebacks')

        // Build filters with organization boundaries
        const txBaseFilter: any = { transactionDateObj: { $gte: start, $lte: end } }
        const txOrgFilter = await buildTransactionFilter(session)
        const txFilter = txOrgFilter ? { $and: [txBaseFilter, txOrgFilter] } : txBaseFilter

        const cbBaseFilter: any = {
            postDateObj: { $gte: start, $lte: end },
            reasonCode: 'MD01' // Filter for MD01 chargebacks only
        }
        const cbOrgFilter = await buildChargebackFilter(session)
        const cbFilter = cbOrgFilter ? { $and: [cbBaseFilter, cbOrgFilter] } : cbBaseFilter

        // Get MD01 chargebacks grouped by bank
        const md01ChargebacksByBank = await cbColl.aggregate([
            { $match: cbFilter },
            {
                $lookup: {
                    from: 'emp_reconcile_transactions',
                    localField: 'originalTransactionUniqueId',
                    foreignField: 'uniqueId',
                    as: 'originalTransaction'
                }
            },
            {
                $addFields: {
                    iban: {
                        $ifNull: [
                            { $arrayElemAt: ['$originalTransaction.bankAccountNumber', 0] },
                            '$cardNumber'
                        ]
                    }
                }
            },
            {
                $addFields: {
                    countryCode: {
                        $cond: {
                            if: { $and: [
                                { $ne: ['$iban', null] },
                                { $ne: ['$iban', ''] },
                                { $gte: [{ $strLenCP: '$iban' }, 2] }
                            ]},
                            then: { $toUpper: { $substrCP: ['$iban', 0, 2] } },
                            else: 'XX'
                        }
                    },
                    bankCode: {
                        $cond: {
                            if: { $and: [
                                { $ne: ['$iban', null] },
                                { $ne: ['$iban', ''] },
                                { $gte: [{ $strLenCP: '$iban' }, 8] }
                            ]},
                            then: { $substrCP: ['$iban', 4, 4] },
                            else: 'Unknown'
                        }
                    },
                    bankWithCountry: {
                        $cond: {
                            if: { $and: [
                                { $ne: ['$iban', null] },
                                { $ne: ['$iban', ''] },
                                { $gte: [{ $strLenCP: '$iban' }, 8] }
                            ]},
                            then: {
                                $concat: [
                                    { $toUpper: { $substrCP: ['$iban', 0, 2] } },
                                    '-',
                                    { $substrCP: ['$iban', 4, 4] }
                                ]
                            },
                            else: 'Unknown'
                        }
                    }
                }
            },
            {
                $group: {
                    _id: '$bankWithCountry',
                    md01Count: { $sum: 1 },
                    countryCode: { $first: '$countryCode' }
                }
            },
            { $sort: { md01Count: -1 } }
        ]).toArray()

        // Get approved transactions grouped by bank (for the banks that have MD01 chargebacks)
        const banksWithMd01 = md01ChargebacksByBank.map(item => item._id)

        const approvedByBank = await txColl.aggregate([
            {
                $match: {
                    ...txFilter,
                    status: 'approved',
                    type: { $nin: ['chargeback', 'void', 'refund', 'chargeback_request', 'retrieval_request'] }
                }
            },
            {
                $addFields: {
                    bankWithCountry: {
                        $cond: {
                            if: { $and: [
                                { $ne: ['$bankAccountNumber', null] },
                                { $ne: ['$bankAccountNumber', ''] },
                                { $gte: [{ $strLenCP: '$bankAccountNumber' }, 8] }
                            ]},
                            then: {
                                $concat: [
                                    { $toUpper: { $substrCP: ['$bankAccountNumber', 0, 2] } },
                                    '-',
                                    { $substrCP: ['$bankAccountNumber', 4, 4] }
                                ]
                            },
                            else: 'Unknown'
                        }
                    }
                }
            },
            {
                $group: {
                    _id: '$bankWithCountry',
                    approvedCount: { $sum: 1 }
                }
            }
        ]).toArray()

        // Create a map for easy lookup
        const approvedMap = new Map(
            approvedByBank.map(item => [item._id, item.approvedCount])
        )

        // Merge the data
        const bankAnalysis = md01ChargebacksByBank.map(item => {
            const bank = item._id
            const md01Count = item.md01Count
            const approvedCount = approvedMap.get(bank) || 0
            const totalTransactions = approvedCount + md01Count
            const md01Percentage = totalTransactions > 0
                ? ((md01Count / totalTransactions) * 100).toFixed(2)
                : '0.00'
            const approvedPercentage = totalTransactions > 0
                ? ((approvedCount / totalTransactions) * 100).toFixed(2)
                : '0.00'

            return {
                bank,
                countryCode: item.countryCode,
                md01Count,
                approvedCount,
                totalTransactions,
                md01Percentage: parseFloat(md01Percentage),
                approvedPercentage: parseFloat(approvedPercentage)
            }
        }).filter(item => item.totalTransactions > 0)

        // Calculate totals
        const totalMd01 = bankAnalysis.reduce((sum, item) => sum + item.md01Count, 0)
        const totalApproved = bankAnalysis.reduce((sum, item) => sum + item.approvedCount, 0)
        const totalTransactions = totalMd01 + totalApproved
        const overallMd01Rate = totalTransactions > 0
            ? ((totalMd01 / totalTransactions) * 100).toFixed(2)
            : '0.00'

        return NextResponse.json({
            bankAnalysis,
            summary: {
                totalMd01,
                totalApproved,
                totalTransactions,
                overallMd01Rate,
                numberOfBanks: bankAnalysis.length
            }
        })
    } catch (error: any) {
        console.error('[MD01 Bank Analysis] Error:', error)
        return NextResponse.json({ error: error.message || 'Failed to fetch MD01 analysis' }, { status: 500 })
    }
}
