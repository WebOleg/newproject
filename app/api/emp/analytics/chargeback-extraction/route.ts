import { NextResponse } from 'next/server'
import { getMongoClient, getDbName } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 60

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/emp/analytics/chargeback-extraction
 * 
 * Extracts chargebacks grouped by upload file/batch
 * Purpose: Send to clients for correction of affected transactions
 * Uses SAME logic as batch-chargebacks route
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

    console.log(`[Chargeback Extraction] Found ${uploads.length} uploads`)

    // Fetch all chargebacks from cache
    const chargebacksCollection = db.collection('emp_chargebacks')
    const allChargebacks = await chargebacksCollection.find({}).toArray()
    
    console.log(`[Chargeback Extraction] Found ${allChargebacks.length} chargebacks`)
    
    // Debug: log first chargeback structure
    if (allChargebacks.length > 0) {
      console.log(`[Chargeback Extraction] Sample chargeback:`, JSON.stringify(allChargebacks[0], null, 2))
    }

    // Step 1: Get originalTransactionUniqueId from chargebacks
    const originalTransactionUniqueIds = new Set(
      allChargebacks
        .map(cb => cb.originalTransactionUniqueId || cb.original_transaction_unique_id)
        .filter(Boolean)
    )
    
    console.log(`[Chargeback Extraction] Looking up ${originalTransactionUniqueIds.size} original transaction IDs in reconcile`)

    // Step 2: Look up original transactions in reconcile by uniqueId
    const reconcileCollection = db.collection('emp_reconcile_transactions')
    const originalTransactions = await reconcileCollection
      .find({ uniqueId: { $in: Array.from(originalTransactionUniqueIds) } })
      .toArray()
    
    console.log(`[Chargeback Extraction] Found ${originalTransactions.length} matching original transactions in reconcile`)
    
    // Step 3: Create map of originalTransactionUniqueId -> transactionId + customer info
    const originalUniqueIdToTransactionData = new Map<string, any>()
    for (const tx of originalTransactions) {
      const transactionId = tx.transactionId || tx.transaction_id
      if (transactionId && tx.uniqueId) {
        originalUniqueIdToTransactionData.set(tx.uniqueId, {
          transactionId,
          customerName: tx.customerName || tx.customer_name,
          iban: tx.bankAccountNumber || tx.bank_account_number,
        })
      }
    }
    
    console.log(`[Chargeback Extraction] Mapped ${originalUniqueIdToTransactionData.size} original transactions to transaction IDs`)
    if (originalUniqueIdToTransactionData.size > 0) {
      const firstEntry = Array.from(originalUniqueIdToTransactionData.entries())[0]
      console.log(`[Chargeback Extraction] Sample mapping: ${firstEntry[0]} -> ${firstEntry[1].transactionId}`)
    }
    
    // Step 4: Create transactionId -> chargeback data map with customer info
    const transactionIdToChargeback = new Map<string, any>()
    for (const cb of allChargebacks) {
      const originalTxUniqueId = cb.originalTransactionUniqueId || cb.original_transaction_unique_id
      if (!originalTxUniqueId) continue
      
      const txData = originalUniqueIdToTransactionData.get(originalTxUniqueId)
      if (!txData) continue
      
      const chargebackData = {
        uniqueId: cb.uniqueId || cb.unique_id,
        originalTransactionUniqueId: originalTxUniqueId,
        transactionId: txData.transactionId,
        reasonCode: cb.reasonCode || cb.reason_code || 'UNKNOWN',
        reasonDescription: cb.reasonDescription || cb.reason_description || '',
        amount: cb.amount || 0,
        postDate: cb.postDate || cb.post_date || '',
        arn: cb.arn || '',
        customerName: txData.customerName,
        iban: txData.iban,
      }
      
      transactionIdToChargeback.set(txData.transactionId, chargebackData)
    }
    
    console.log(`[Chargeback Extraction] Mapped ${transactionIdToChargeback.size} chargebacks by transaction ID`)
    if (transactionIdToChargeback.size > 0) {
      const firstEntry = Array.from(transactionIdToChargeback.entries())[0]
      console.log(`[Chargeback Extraction] Sample chargeback mapping:`, firstEntry)
    }

    // Process each upload batch
    const results = []
    let totalChargebacks = 0

    for (const upload of uploads) {
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
        console.log(`[Chargeback Extraction] Sample upload ${upload.filename} has ${uploadTransactionIds.size} transaction IDs`)
        console.log(`[Chargeback Extraction] First 3 transaction IDs:`, Array.from(uploadTransactionIds).slice(0, 3))
        console.log(`[Chargeback Extraction] First 3 chargeback transaction IDs:`, Array.from(transactionIdToChargeback.keys()).slice(0, 3))
      }

      // Find chargebacks matching this upload's transaction IDs
      const batchChargebacks: any[] = []
      for (const transactionId of Array.from(uploadTransactionIds)) {
        const cb = transactionIdToChargeback.get(transactionId)
        if (cb) {
          batchChargebacks.push(cb)
          totalChargebacks++
        }
      }
      
      // Debug: log match results for first upload
      if (results.length === 0) {
        console.log(`[Chargeback Extraction] Upload ${upload.filename}: ${batchChargebacks.length} chargebacks matched via transaction ID`)
      }

      // Only include batches that have chargebacks
      if (batchChargebacks.length > 0) {
        results.push({
          filename: upload.originalFilename || upload.filename || 'Unknown',
          uploadDate: upload.createdAt?.toISOString() || new Date().toISOString(),
          totalTransactions: rows.length,
          chargebacks: batchChargebacks,
        })
      }
    }

    console.log(`[Chargeback Extraction] Returning ${results.length} batches with ${totalChargebacks} total chargebacks`)

    const response = NextResponse.json({
      success: true,
      batches: results,
      totalBatches: results.length,
      totalChargebacks,
    })
    
    // Prevent any caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response

  } catch (error: any) {
    console.error('[Chargeback Extraction] Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to extract chargebacks'
      },
      { status: 500 }
    )
  }
}


