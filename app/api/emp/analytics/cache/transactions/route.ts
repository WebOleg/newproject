import { NextRequest, NextResponse } from 'next/server'
import { getMongoClient, getDbName } from '@/lib/db'
import { fetchReconcileTransactions } from '@/app/api/emp/analytics/transactions/route'

// GET: read cached reconcile transactions for a date range
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'start_date and end_date are required' }, { status: 400 })
    }

    const client = await getMongoClient()
    const db = client.db(getDbName())
    const coll = db.collection('emp_reconcile_transactions')

    const start = new Date(`${startDate}T00:00:00Z`)
    const end = new Date(`${endDate}T23:59:59Z`)

    const items = await coll
      .find({ transactionDateObj: { $gte: start, $lte: end } })
      .project({ _id: 0 })
      .toArray()

    return NextResponse.json({ success: true, transactions: items, count: items.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to read cache' }, { status: 500 })
  }
}

// POST: resync (fetch remote via reconcile and cache) for a date range
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const startDate = body.start_date
    const endDate = body.end_date
    const clearCache = body.clear_cache !== false // Default to true
    
    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'start_date and end_date are required' }, { status: 400 })
    }

    console.log(`[Transaction Cache] Resyncing from ${startDate} to ${endDate}, clear_cache=${clearCache}`)

    // Call the core logic directly instead of HTTP fetch
    const items = await fetchReconcileTransactions(startDate, endDate)
    
    console.log(`[Transaction Cache] Fetched ${items.length} transactions from API`)

    // Cache in MongoDB
    const client = await getMongoClient()
    const db = client.db(getDbName())
    const coll = db.collection('emp_reconcile_transactions')

    // Count before clear
    const beforeCount = await coll.countDocuments()
    console.log(`[Transaction Cache] Database had ${beforeCount} transactions before sync`)

    // Clear existing cache if requested (default behavior)
    if (clearCache) {
      const deleteResult = await coll.deleteMany({})
      console.log(`[Transaction Cache] Cleared ${deleteResult.deletedCount} old transactions`)
    }

    // Insert new data
    if (items.length > 0) {
      const docs = items.map(t => {
        const transactionDateObj = t.transactionDate ? new Date(t.transactionDate) : null
        return {
          ...t,
          transactionDateObj,
          cachedAt: new Date(),
          rangeStart: startDate,
          rangeEnd: endDate,
        }
      })
      
      await coll.insertMany(docs, { ordered: false })
    }

    // Count after insert
    const afterCount = await coll.countDocuments()
    console.log(`[Transaction Cache] Database now has ${afterCount} transactions`)
    console.log(`[Transaction Cache] Net change: ${afterCount - beforeCount}`)

    return NextResponse.json({ 
      success: true, 
      fetched: items.length,
      beforeCount,
      afterCount,
      cleared: clearCache,
    })
  } catch (error: any) {
    console.error('[Transaction Cache] Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to cache' }, { status: 500 })
  }
}


