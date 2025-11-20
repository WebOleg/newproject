import { NextRequest, NextResponse } from 'next/server'
import { getMongoClient, getDbName } from '@/lib/db'
import { fetchChargebacksByDateRange } from '@/app/api/emp/analytics/chargebacks/route'
import { fetchReconcileTransactions } from '@/app/api/emp/analytics/transactions/route'

// GET: read cached chargebacks for a date range
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
    const coll = db.collection('emp_chargebacks')

    const start = new Date(`${startDate}T00:00:00Z`)
    const end = new Date(`${endDate}T23:59:59Z`)

    const items = await coll
      .find({ postDateObj: { $gte: start, $lte: end } })
      .project({ _id: 0 })
      .toArray()

    return NextResponse.json({ success: true, chargebacks: items, count: items.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to read cache' }, { status: 500 })
  }
}

// POST: resync (fetch remote via chargebacks/by_date for date range) and cache
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const startDate = body.start_date
    const endDate = body.end_date
    const clearCache = body.clear_cache !== false // Default to true
    
    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'start_date and end_date are required' }, { status: 400 })
    }

    console.log(`[Chargeback Cache] Resyncing from ${startDate} to ${endDate}, clear_cache=${clearCache}`)

    // Fetch from chargebacks API
    const items = await fetchChargebacksByDateRange(startDate, endDate)
    
    console.log(`[Chargeback Cache] Fetched ${items.length} chargebacks from API`)

    // Cache in MongoDB
    const client = await getMongoClient()
    const db = client.db(getDbName())
    const coll = db.collection('emp_chargebacks')

    // Count before clear
    const beforeCount = await coll.countDocuments()
    console.log(`[Chargeback Cache] Database had ${beforeCount} chargebacks before sync`)

    // Clear existing cache if requested (default behavior)
    if (clearCache) {
      const deleteResult = await coll.deleteMany({})
      console.log(`[Chargeback Cache] Cleared ${deleteResult.deletedCount} old chargebacks`)
    }

    // Insert new data
    if (items.length > 0) {
      // Debug: Check first few items
      console.log(`[Chargeback Cache] Sample chargebacks to insert:`, items.slice(0, 3).map(cb => ({
        uniqueId: cb.uniqueId,
        arn: cb.arn,
        amount: cb.amount,
        postDate: cb.postDate,
      })))
      
      const docs = items.map(cb => {
        const postDateObj = cb.postDate ? new Date(`${cb.postDate}T00:00:00Z`) : null
        return {
          ...cb,
          postDateObj,
          cachedAt: new Date(),
          rangeStart: startDate,
          rangeEnd: endDate,
        }
      })
      
      await coll.insertMany(docs, { ordered: false })
    }

    // Count after insert
    const afterCount = await coll.countDocuments()
    console.log(`[Chargeback Cache] Database now has ${afterCount} chargebacks`)
    console.log(`[Chargeback Cache] Net change: ${afterCount - beforeCount}`)

    return NextResponse.json({ 
      success: true, 
      fetched: items.length,
      beforeCount,
      afterCount,
      cleared: clearCache,
    })
  } catch (error: any) {
    console.error('[Chargeback Cache] Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to cache' }, { status: 500 })
  }
}


