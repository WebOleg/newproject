import { NextResponse } from 'next/server'
import { getMongoClient, getDbName } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 60

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface BatchChargebackAnalysis {
  uploadId: string
  filename: string
  createdAt: string
  totalRecords: number
  approvedCount: number
  chargebackCount: number
  chargebackRate: string
  chargebackAmount: number
  chargebacks: Array<{
    uniqueId?: string
    originalTransactionUniqueId: string
    transactionId: string
    reasonCode: string
    reasonDescription: string
    amount: number
    postDate: string
    arn?: string
  }>
}

/**
 * GET /api/emp/analytics/batch-chargebacks
 * 
 * Analyzes chargebacks by batch upload
 * Links chargebacks (from emp_chargebacks collection) to uploads (via uniqueId)
 */
export async function GET(req: Request) {
  try {
    const client = await getMongoClient()
    const db = client.db(getDbName())
    
    // Fetch all uploads with their rows (we need baseTransactionId)
    const uploadsCollection = db.collection('uploads')
    const uploads = await uploadsCollection
      .find({}, {
        projection: {
          _id: 1,
          filename: 1,
          originalFilename: 1,
          createdAt: 1,
          recordCount: 1,
          approvedCount: 1,
          rows: 1, // Need rows to get baseTransactionId
        }
      })
      .sort({ createdAt: -1 })
      .toArray()

    console.log(`[Batch Chargebacks] Found ${uploads.length} uploads`)

    // Fetch all chargebacks from cache
    const chargebacksCollection = db.collection('emp_chargebacks')
    const allChargebacks = await chargebacksCollection.find({}).toArray()
    
    console.log(`[Batch Chargebacks] Found ${allChargebacks.length} chargebacks`)
    
    // Debug: log first chargeback structure
    if (allChargebacks.length > 0) {
      console.log(`[Batch Chargebacks] Sample chargeback:`, JSON.stringify(allChargebacks[0], null, 2))
    }

    // Step 1: Get originalTransactionUniqueId from chargebacks
    const originalTransactionUniqueIds = new Set(
      allChargebacks
        .map(cb => cb.originalTransactionUniqueId || cb.original_transaction_unique_id)
        .filter(Boolean)
    )
    
    console.log(`[Batch Chargebacks] Looking up ${originalTransactionUniqueIds.size} original transaction IDs in reconcile`)
    console.log(`[Batch Chargebacks] Sample chargeback:`, allChargebacks[0])

    // Step 2: Look up original transactions in reconcile by uniqueId
    const reconcileCollection = db.collection('emp_reconcile_transactions')
    const originalTransactions = await reconcileCollection
      .find({ uniqueId: { $in: Array.from(originalTransactionUniqueIds) } })
      .toArray()
    
    console.log(`[Batch Chargebacks] Found ${originalTransactions.length} matching original transactions in reconcile`)
    
    // Step 3: Create map of originalTransactionUniqueId -> transactionId
    const originalUniqueIdToTransactionId = new Map<string, string>()
    for (const tx of originalTransactions) {
      const transactionId = tx.transactionId || tx.transaction_id
      if (transactionId && tx.uniqueId) {
        originalUniqueIdToTransactionId.set(tx.uniqueId, transactionId)
      }
    }
    
    console.log(`[Batch Chargebacks] Mapped ${originalUniqueIdToTransactionId.size} original transactions to transaction IDs`)
    if (originalUniqueIdToTransactionId.size > 0) {
      const firstEntry = Array.from(originalUniqueIdToTransactionId.entries())[0]
      console.log(`[Batch Chargebacks] Sample mapping: ${firstEntry[0]} -> ${firstEntry[1]}`)
    }
    
    // Step 4: Create transactionId -> chargeback data map
    const transactionIdToChargeback = new Map<string, any>()
    for (const cb of allChargebacks) {
      const originalTxUniqueId = cb.originalTransactionUniqueId || cb.original_transaction_unique_id
      if (!originalTxUniqueId) continue
      
      const transactionId = originalUniqueIdToTransactionId.get(originalTxUniqueId)
      if (!transactionId) continue
      
      const chargebackData = {
        uniqueId: cb.uniqueId || cb.unique_id,
        originalTransactionUniqueId: originalTxUniqueId,
        transactionId,
        reasonCode: cb.reasonCode || cb.reason_code || 'UNKNOWN',
        reasonDescription: cb.reasonDescription || cb.reason_description || '',
        amount: cb.amount || 0,
        postDate: cb.postDate || cb.post_date || '',
        arn: cb.arn || '',
      }
      
      transactionIdToChargeback.set(transactionId, chargebackData)
    }
    
    console.log(`[Batch Chargebacks] Mapped ${transactionIdToChargeback.size} chargebacks by transaction ID`)
    if (transactionIdToChargeback.size > 0) {
      const firstEntry = Array.from(transactionIdToChargeback.entries())[0]
      console.log(`[Batch Chargebacks] Sample chargeback mapping:`, firstEntry)
    }
    
    // Track which chargebacks have been matched to batches
    const matchedChargebackIds = new Set<string>()

    // Analyze each upload
    const results: BatchChargebackAnalysis[] = []

    for (const upload of uploads) {
      const uploadId = upload._id.toString()
      const rows = upload.rows || []
      
      // Extract all baseTransactionIds from this upload's rows
      const uploadTransactionIds = new Set<string>()
      for (const row of rows) {
        const baseTransactionId = row.baseTransactionId
        if (baseTransactionId) {
          uploadTransactionIds.add(baseTransactionId)
        }
      }
      
      // Debug: log first upload's transaction IDs
      if (uploadTransactionIds.size > 0 && results.length === 0) {
        console.log(`[Batch Chargebacks] Sample upload ${upload.filename} has ${uploadTransactionIds.size} transaction IDs`)
        console.log(`[Batch Chargebacks] First 3 transaction IDs:`, Array.from(uploadTransactionIds).slice(0, 3))
        console.log(`[Batch Chargebacks] First 3 chargeback transaction IDs:`, Array.from(transactionIdToChargeback.keys()).slice(0, 3))
      }

      // Find chargebacks matching this upload's transaction IDs
      const uploadChargebacks: any[] = []
      let totalChargebackAmount = 0

      for (const transactionId of Array.from(uploadTransactionIds)) {
        const chargeback = transactionIdToChargeback.get(transactionId)
        if (chargeback) {
          uploadChargebacks.push(chargeback)
          totalChargebackAmount += chargeback.amount || 0
          matchedChargebackIds.add(chargeback.originalTransactionUniqueId)
        }
      }
      
      // Debug: log match results for first upload
      if (results.length === 0) {
        console.log(`[Batch Chargebacks] Upload ${upload.filename}: ${uploadChargebacks.length} chargebacks matched via transaction ID`)
      }

      const approvedCount = upload.approvedCount || 0
      const chargebackCount = uploadChargebacks.length
      const chargebackRate = approvedCount > 0 
        ? ((chargebackCount / approvedCount) * 100).toFixed(2) + '%'
        : '0%'

      results.push({
        uploadId,
        filename: upload.originalFilename || upload.filename || 'Unknown',
        createdAt: upload.createdAt?.toISOString() || '',
        totalRecords: upload.recordCount || 0,
        approvedCount,
        chargebackCount,
        chargebackRate,
        chargebackAmount: totalChargebackAmount,
        chargebacks: uploadChargebacks,
      })
    }

    // Sort by chargeback count descending
    results.sort((a, b) => b.chargebackCount - a.chargebackCount)

    // Calculate totals from matched chargebacks only
    const totalMatchedChargebacks = matchedChargebackIds.size
    const totalUnmatchedChargebacks = allChargebacks.length - totalMatchedChargebacks
    
    console.log(`[Batch Chargebacks] Analysis complete: ${results.length} batches analyzed`)
    console.log(`[Batch Chargebacks] Total chargebacks in DB: ${allChargebacks.length}`)
    console.log(`[Batch Chargebacks] Matched to batches: ${totalMatchedChargebacks}`)
    console.log(`[Batch Chargebacks] Unmatched (no batch found): ${totalUnmatchedChargebacks}`)
    
    if (totalUnmatchedChargebacks > 0) {
      console.warn(`[Batch Chargebacks] ⚠️ ${totalUnmatchedChargebacks} chargebacks could not be matched to any batch!`)
      console.warn(`[Batch Chargebacks] Possible reasons:`)
      console.warn(`[Batch Chargebacks]   - Transaction not in reconcile cache`)
      console.warn(`[Batch Chargebacks]   - Transaction ID not in any upload batch`)
      console.warn(`[Batch Chargebacks]   - Batch upload was deleted`)
      
      // Sample unmatched
      const unmatchedSample = allChargebacks
        .filter(cb => !matchedChargebackIds.has(cb.originalTransactionUniqueId || cb.original_transaction_unique_id))
        .slice(0, 3)
      console.log(`[Batch Chargebacks] Sample unmatched chargebacks:`, unmatchedSample.map(cb => ({
        originalTransactionUniqueId: cb.originalTransactionUniqueId || cb.original_transaction_unique_id,
        uniqueId: cb.uniqueId || cb.unique_id,
        amount: cb.amount,
        postDate: cb.postDate || cb.post_date,
      })))
    }

    const response = NextResponse.json({
      success: true,
      batches: results,
      totalBatches: results.length,
      totalChargebacks: totalMatchedChargebacks, // Use matched count, not total DB count
      totalChargebacksInDb: allChargebacks.length,
      unmatchedChargebacks: totalUnmatchedChargebacks,
      timestamp: new Date().toISOString(), // Add timestamp for debugging
    })
    
    // Prevent any caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response

  } catch (error: any) {
    console.error('[Batch Chargebacks] Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to analyze batch chargebacks'
      },
      { status: 500 }
    )
  }
}

