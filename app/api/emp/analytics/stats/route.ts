import { NextRequest, NextResponse } from 'next/server'
import { getMongoClient, getDbName } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { buildTransactionFilter, buildChargebackFilter } from '@/lib/analytics-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// SEPA chargeback reason code descriptions
const REASON_CODE_DESCRIPTIONS: Record<string, string> = {
  'AC01': 'Invalid/Incorrect Account Identifier',
  'AC04': 'Account Closed',
  'AC06': 'Account Blocked',
  'AM04': 'Insufficient Funds',
  'MD01': 'Missing or Invalid Mandate',
  'MD06': 'Refund Requested by Debtor',
  'MS02': 'Reason Not Specified (Customer)',
  'MS03': 'Reason Not Specified (Bank)',
  'SL01': 'Specific Service by Debtor Agent',
  'RR04': 'Regulatory Reasons'
}

// Codes that trigger immediate IBAN blacklisting
const BLACKLIST_TRIGGER_CODES = ['AC01', 'AC04']

function getReasonDescription(code: string): string {
  const upperCode = code?.trim().toUpperCase()
  return REASON_CODE_DESCRIPTIONS[upperCode] || code || 'Unknown'
}

function triggersBlacklist(code: string): boolean {
  return BLACKLIST_TRIGGER_CODES.includes(code?.trim().toUpperCase())
}

export async function GET(request: NextRequest) {
    try {
        const session = await requireSession()

        const searchParams = request.nextUrl.searchParams
        const startDate = searchParams.get('start_date')
        const endDate = searchParams.get('end_date')

        // Default to a wide range if not provided (effectively "all time" for this context)
        const start = startDate ? new Date(`${startDate}T00:00:00Z`) : new Date('2020-01-01T00:00:00Z')
        const end = endDate ? new Date(`${endDate}T23:59:59Z`) : new Date()

        // Ensure end date covers the full day if it's today
        if (!endDate) {
            end.setHours(23, 59, 59, 999)
        }

        const client = await getMongoClient()
        const db = client.db(getDbName())
        const txColl = db.collection('emp_reconcile_transactions')
        const cbColl = db.collection('emp_chargebacks')

        // --- 1. Transactions Aggregation ---
        const txBaseFilter: any = { transactionDateObj: { $gte: start, $lte: end } }
        const txOrgFilter = await buildTransactionFilter(session)
        const txFilter = txOrgFilter ? { $and: [txBaseFilter, txOrgFilter] } : txBaseFilter

        const secondaryTypes = ['chargeback', 'void', 'refund', 'chargeback_request', 'retrieval_request']

        // 1. Get Raw Count (all transactions in range)
        const rawCountPromise = txColl.countDocuments(txFilter)

        // 2. Get Base Stats (exclude secondary types)
        const baseStatsPromise = txColl.aggregate([
            {
                $match: {
                    ...txFilter,
                    type: { $nin: secondaryTypes }
                }
            },
            {
                $facet: {
                    // Group by Type
                    byType: [
                        { $group: { _id: { $toLower: '$type' }, count: { $sum: 1 } } }
                    ],
                    // Group by Status
                    byStatus: [
                        { $group: { _id: { $toLower: '$status' }, count: { $sum: 1 } } }
                    ],
                    // Group by Scheme
                    byScheme: [
                        {
                            $group: {
                                _id: { $ifNull: ['$cardScheme', 'SEPA Direct Debit'] },
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    // Timeline
                    timeline: [
                        {
                            $group: {
                                _id: { $substr: ['$transactionDate', 0, 10] },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { _id: 1 } }
                    ],
                    // Approved Stats (for Volume)
                    approvedStats: [
                        {
                            $match: {
                                status: { $in: ['approved', 'pending_async', 'chargebacked'] }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                count: { $sum: 1 },
                                volume: { $sum: '$amount' },
                                currencies: { $addToSet: '$currency' }
                            }
                        }
                    ],
                    // Total Base Count
                    totalCount: [
                        { $count: 'count' }
                    ]
                }
            }
        ]).toArray()

        // --- 2. Approved Transactions by Country (only approved, excluding pending_async and chargebacked) ---
        const approvedByCountryPromise = txColl.aggregate([
            {
                $match: {
                    ...txFilter,
                    type: { $nin: secondaryTypes },
                    status: 'approved' // Only approved transactions
                }
            },
            {
                $addFields: {
                    countryCode: {
                        $cond: {
                            if: { $and: [
                                { $ne: ['$bankAccountNumber', null] },
                                { $ne: ['$bankAccountNumber', ''] },
                                { $gte: [{ $strLenCP: '$bankAccountNumber' }, 2] }
                            ]},
                            then: { $toUpper: { $substrCP: ['$bankAccountNumber', 0, 2] } },
                            else: 'Unknown'
                        }
                    }
                }
            },
            {
                $group: {
                    _id: '$countryCode',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]).toArray()

        // --- 2b. All Transactions by Country (including chargebacked) ---
        const txByCountryPromise = txColl.aggregate([
            {
                $match: {
                    ...txFilter,
                    type: { $nin: secondaryTypes },
                    status: { $in: ['approved', 'pending_async', 'chargebacked'] }
                }
            },
            {
                $addFields: {
                    countryCode: {
                        $cond: {
                            if: { $and: [
                                { $ne: ['$bankAccountNumber', null] },
                                { $ne: ['$bankAccountNumber', ''] },
                                { $gte: [{ $strLenCP: '$bankAccountNumber' }, 2] }
                            ]},
                            then: { $toUpper: { $substrCP: ['$bankAccountNumber', 0, 2] } },
                            else: 'Unknown'
                        }
                    }
                }
            },
            {
                $group: {
                    _id: '$countryCode',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]).toArray()

        // --- 3. Chargebacks Aggregation ---
        const cbBaseFilter: any = { postDateObj: { $gte: start, $lte: end } }
        const cbOrgFilter = await buildChargebackFilter(session)
        const cbFilter = cbOrgFilter ? { $and: [cbBaseFilter, cbOrgFilter] } : cbBaseFilter

        // Aggregate chargebacks with lookup to original transactions for IBAN data
        const cbStatsPromise = cbColl.aggregate([
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
                    // Get IBAN from original transaction or use cardNumber as fallback
                    iban: {
                        $ifNull: [
                            { $arrayElemAt: ['$originalTransaction.bankAccountNumber', 0] },
                            '$cardNumber'
                        ]
                    }
                }
            },
            {
                $facet: {
                    totalCount: [{ $count: 'count' }],
                    byReason: [
                        {
                            $group: {
                                _id: '$reasonCode',
                                count: { $sum: 1 },
                                description: { $first: '$reasonDescription' }
                            }
                        },
                        { $sort: { count: -1 } },
                        { $limit: 10 }
                    ],
                    byCountry: [
                        {
                            $addFields: {
                                // Extract country code from IBAN (first 2 characters)
                                countryCode: {
                                    $cond: {
                                        if: { $and: [
                                            { $ne: ['$iban', null] },
                                            { $ne: ['$iban', ''] },
                                            { $gte: [{ $strLenCP: '$iban' }, 2] }
                                        ]},
                                        then: { $toUpper: { $substrCP: ['$iban', 0, 2] } },
                                        else: 'Unknown'
                                    }
                                }
                            }
                        },
                        {
                            $group: {
                                _id: '$countryCode',
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { count: -1 } },
                        { $limit: 10 }
                    ],
                    byBank: [
                        {
                            $addFields: {
                                // Extract country code (first 2 chars)
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
                                // Extract bank code from IBAN (characters 4-7 for most IBANs)
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
                                // Combine country code and bank code
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
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { count: -1 } },
                        { $limit: 10 }
                    ],
                    byAmount: [
                        {
                            $group: {
                                _id: '$amount',
                                count: { $sum: 1 },
                                currency: { $first: '$currency' }
                            }
                        },
                        { $sort: { count: -1 } },
                        { $limit: 20 }
                    ]
                }
            }
        ]).toArray()

        const [rawCount, baseStatsResults, approvedByCountryResults, txByCountryResults, cbResults] = await Promise.all([
            rawCountPromise,
            baseStatsPromise,
            approvedByCountryPromise,
            txByCountryPromise,
            cbStatsPromise
        ])

        // Process Results
        const baseStatsData = baseStatsResults[0] || {}
        const cbData = cbResults[0] || { totalCount: [], byReason: [] }

        const approvedStats = baseStatsData.approvedStats?.[0] || { count: 0, volume: 0, currencies: [] }

        const totalChargebacks = cbData.totalCount?.[0]?.count || 0
        const approvedCount = approvedStats.count
        const baseCount = baseStatsData.totalCount?.[0]?.count || 0

        // Format Volume
        const totalVolume = approvedStats.volume
        const currencies = approvedStats.currencies || []
        const currency = currencies.length === 1 ? currencies[0] : 'EUR'

        const volumeFormatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'EUR',
        }).format(totalVolume / 100)

        // Calculate Chargeback Rate
        const chargebackRate = approvedCount > 0
            ? ((totalChargebacks / approvedCount) * 100).toFixed(2) + '%'
            : '0%'

        // Old transactionsByType logic removed as per user request to use Status breakdown
        // const transactionsByType = ...    }

        let transactionsByStatus = (baseStatsData.byStatus || [])
            .map((i: any) => ({
                name: (i._id || 'unknown').charAt(0).toUpperCase() + (i._id || 'unknown').slice(1),
                value: i.count
            }))
            .filter((item: any) => item.name !== 'Chargebacked') // Remove duplicate from aggregation if exists

        // Add chargebacks to status groups if any
        if (totalChargebacks > 0) {
            transactionsByStatus.push({ name: 'Chargebacked', value: totalChargebacks })
        }

        // Custom Sort Order for Status (and now Type as requested)
        const statusOrder = ['Approved', 'Chargebacked', 'Pending_async', 'Error']
        const sortStatus = (a: any, b: any) => {
            const indexA = statusOrder.indexOf(a.name)
            const indexB = statusOrder.indexOf(b.name)

            if (indexA !== -1 && indexB !== -1) return indexA - indexB
            if (indexA !== -1) return -1
            if (indexB !== -1) return 1
            return 0
        }

        transactionsByStatus.sort(sortStatus)

        // User requested "Transactions by Type" to show ONLY Approved vs Chargebacked
        const transactionsByType = transactionsByStatus.filter((item: any) =>
            item.name === 'Approved' || item.name === 'Chargebacked'
        )

        // User requested "Card Schemes" to be hardcoded to "IBANs"
        const transactionsByScheme = [{
            name: 'IBANs',
            value: approvedCount
        }]

        const transactionTimeline = (baseStatsData.timeline || []).map((i: any) => ({
            date: i._id,
            count: i.count
        }))

        const chargebacksByReason = (cbData.byReason || []).map((i: any) => {
            const code = i._id || 'UNK'
            const description = getReasonDescription(code)
            return {
                code,
                name: `${code} - ${description}`,
                value: i.count,
                description: i.description || description,
                blacklistTrigger: triggersBlacklist(code)
            }
        })

        // Merge approved-only transactions and chargebacks by country
        const approvedByCountryMap = new Map(
            approvedByCountryResults.map((item: any) => [item._id, item.count])
        )
        const cbByCountryMapForApproved = new Map(
            (cbData.byCountry || []).map((item: any) => [item._id, item.count])
        )

        const allCountriesApproved = new Set([...approvedByCountryMap.keys(), ...cbByCountryMapForApproved.keys()])

        const approvedByCountry = Array.from(allCountriesApproved)
            .map(country => {
                const approved = Number(approvedByCountryMap.get(country) || 0)
                const chargebacks = Number(cbByCountryMapForApproved.get(country) || 0)
                const total = approved + chargebacks
                const chargebackRateNum = total > 0 ? (chargebacks / total) * 100 : 0

                return {
                    country: country || 'Unknown',
                    total: total,
                    approved: approved,
                    chargebacks: chargebacks,
                    chargebackRate: chargebackRateNum.toFixed(2) + '%'
                }
            })
            .filter(item => item.total > 0)
            .sort((a, b) => b.total - a.total)
            .slice(0, 10)

        // Merge transactions and chargebacks by country
        const txByCountryMap = new Map(
            txByCountryResults.map((item: any) => [item._id, item.count])
        )
        const cbByCountryMap = new Map(
            (cbData.byCountry || []).map((item: any) => [item._id, item.count])
        )

        // Get all unique countries
        const allCountries = new Set([...txByCountryMap.keys(), ...cbByCountryMap.keys()])

        const chargebacksByCountry = Array.from(allCountries)
            .map(country => {
                const totalTx = Number(txByCountryMap.get(country) || 0)
                const chargebacks = Number(cbByCountryMap.get(country) || 0)
                const successful = totalTx - chargebacks
                const chargebackRateNum = totalTx > 0 ? (chargebacks / totalTx) * 100 : 0

                return {
                    country: country || 'Unknown',
                    total: totalTx,
                    successful: successful,
                    chargebacks: chargebacks,
                    chargebackRate: chargebackRateNum.toFixed(2) + '%'
                }
            })
            .filter(item => item.total > 0)
            .sort((a, b) => b.total - a.total)
            .slice(0, 10)

        const chargebacksByBank = (cbData.byBank || []).map((i: any) => ({
            bank: i._id || 'Unknown',
            value: i.count
        }))

        const chargebacksByAmount = (cbData.byAmount || []).map((i: any) => ({
            amount: i._id,
            count: i.count,
            currency: i.currency || 'EUR'
        }))

        const stats = {
            totalTransactions: approvedCount,
            baseTransactionsCount: baseCount,
            totalVolume: volumeFormatted,
            totalChargebacks,
            chargebackRate,
            transactionsByType,
            transactionsByStatus,
            transactionsByScheme,
            transactionTimeline,
            chargebacksByReason,
            approvedByCountry,
            chargebacksByCountry,
            chargebacksByBank,
            chargebacksByAmount,
            rawReconcileCount: rawCount
        }

        return NextResponse.json(stats)
    } catch (error: any) {
        console.error('[Analytics Stats] Error:', error)
        return NextResponse.json({ error: error.message || 'Failed to fetch stats' }, { status: 500 })
    }
}
