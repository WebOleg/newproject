import { NextRequest, NextResponse } from 'next/server'
import { getMongoClient, getDbName } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { buildTransactionFilter } from '@/lib/analytics-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const session = await requireSession()

        const client = await getMongoClient()
        const db = client.db(getDbName())
        const txColl = db.collection('emp_reconcile_transactions')
        const cbColl = db.collection('emp_chargebacks')

        // Build filter with organization filtering
        const txOrgFilter = await buildTransactionFilter(session)
        const baseFilter = txOrgFilter || {}

        // Secondary transaction types to exclude
        const secondaryTypes = ['chargeback', 'void', 'refund', 'chargeback_request', 'retrieval_request']

        // 1. Get pending_async transactions grouped by amount
        const pendingAsyncByAmount = await txColl.aggregate([
            {
                $match: {
                    ...baseFilter,
                    status: 'pending_async',
                    type: { $nin: secondaryTypes }
                }
            },
            {
                $group: {
                    _id: '$amount',
                    count: { $sum: 1 },
                    currency: { $first: '$currency' }
                }
            },
            { $sort: { count: -1 } }
        ]).toArray()

        // 2. Get total pending_async count
        const totalPendingAsync = await txColl.countDocuments({
            ...baseFilter,
            status: 'pending_async',
            type: { $nin: secondaryTypes }
        })

        // 3. Calculate percentages and format data
        const pendingAsyncData = pendingAsyncByAmount.map((item: any) => {
            const percentage = totalPendingAsync > 0 ? (item.count / totalPendingAsync) * 100 : 0
            return {
                amount: item._id,
                count: item.count,
                currency: item.currency || 'EUR',
                percentage: percentage.toFixed(2) + '%',
                percentageNum: parseFloat(percentage.toFixed(2))
            }
        })

        // 4. Get chargeback statistics for calculator
        const chargebackCount = await cbColl.countDocuments(baseFilter)

        const approvedCount = await txColl.countDocuments({
            ...baseFilter,
            status: 'approved',
            type: { $nin: secondaryTypes }
        })

        // Current chargeback rate
        const totalTransactions = approvedCount + chargebackCount
        const currentChargebackRate = totalTransactions > 0 ? (chargebackCount / totalTransactions) * 100 : 0

        // Calculate how many approved transactions needed to stay below 25%
        // Formula: chargebacks / (approved + chargebacks) < 0.25
        // Solving for approved: approved > (chargebacks / 0.25) - chargebacks
        // Simplified: approved > chargebacks * 3
        const targetRate = 25
        const neededApprovedFor25 = Math.ceil((chargebackCount / (targetRate / 100)) - chargebackCount)
        const additionalApprovedNeeded = Math.max(0, neededApprovedFor25 - approvedCount)

        // Calculate for other common thresholds
        const thresholds = [10, 15, 20, 25, 30].map(threshold => {
            const neededApproved = Math.ceil((chargebackCount / (threshold / 100)) - chargebackCount)
            const additional = Math.max(0, neededApproved - approvedCount)
            const wouldMeetThreshold = currentChargebackRate <= threshold

            return {
                threshold,
                currentlyMeets: wouldMeetThreshold,
                neededApproved,
                currentApproved: approvedCount,
                additionalNeeded: additional
            }
        })

        return NextResponse.json({
            pendingAsync: {
                total: totalPendingAsync,
                byAmount: pendingAsyncData
            },
            chargebackCalculator: {
                currentStats: {
                    chargebacks: chargebackCount,
                    approved: approvedCount,
                    total: totalTransactions,
                    chargebackRate: currentChargebackRate.toFixed(2) + '%',
                    chargebackRateNum: parseFloat(currentChargebackRate.toFixed(2))
                },
                thresholds
            }
        })
    } catch (error: any) {
        console.error('[Pending Async Analysis] Error:', error)
        return NextResponse.json({ error: error.message || 'Failed to fetch pending async analysis' }, { status: 500 })
    }
}
