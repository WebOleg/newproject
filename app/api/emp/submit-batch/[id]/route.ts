import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 800 // 800 seconds for bulk processing
import { getMongoClient, getDbName } from '@/lib/db'
import { ObjectId } from 'mongodb'
import { mapRecordToSddSale, type FieldMapping, stripRetrySuffix, buildRetryTransactionId, type CompanyConfig, getDefaultCompanyConfig } from '@/lib/emp'
import { submitSddSale, maskIban, type SddSaleResponse } from '@/lib/emerchantpay'
import { reconcileTransaction } from '@/lib/emerchantpay-reconcile'
import { requireWriteAccess } from '@/lib/auth'
import { check30DayThreshold, extractIbansFromRecords } from '@/lib/emp-threshold'
import { getFieldValue } from '@/lib/field-aliases'

export const runtime = 'nodejs'

const APPROVED_STATUSES = new Set(['approved', 'success', 'successful'])
const PENDING_STATUSES = new Set(['pending', 'in_progress', 'processing', 'pending_async', 'created'])

function isDuplicateTransactionError(res?: SddSaleResponse | null, err?: any): boolean {
  const messages: string[] = []
  if (res?.message) messages.push(res.message)
  if (res?.technicalMessage) messages.push(res.technicalMessage)
  if (err?.message) messages.push(err.message)

  return messages.some((raw) => {
    const msg = (raw || '').toLowerCase()
    if (!msg) return false
    if (msg.includes('transaction id') && msg.includes('already')) return true
    if (msg.includes('transaction_id') && msg.includes('already')) return true
    if (msg.includes('duplicate transaction')) return true
    if (msg.includes('duplicate') && msg.includes('transactionid')) return true
    return false
  })
}

/**
 * POST /api/emp/submit-batch/[id]
 * Bulk submission - processes records with configurable parameters
 * - Configurable concurrency (1-50 parallel requests, default 20)
 * - Configurable chunk size (1-100, default 20)
 * - Optional maxRecords limit to sync only subset
 * - Optional amount filtering to sync specific amount values
 * - Progress tracking via periodic DB updates
 * - 800s timeout limit
 * - Skips blacklisted records
 * Only Super Owner can submit to gateway
 *
 * Request body (optional):
 * {
 *   concurrency?: number,      // 1-50, default 20
 *   chunkSize?: number,        // 1-100, default 20
 *   maxRecords?: number,       // limit processing, default all (ignored if filterByAmount is set)
 *   filterByAmount?: string,   // filter to specific amount (e.g., "1.99")
 *   amountLimit?: number       // limit records with filtered amount (requires filterByAmount)
 * }
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const startTime = Date.now()

  try {
    await requireWriteAccess()

    const { id } = await ctx.params

    // Parse request body for configuration options
    const body = await req.json().catch(() => ({}))
    const configConcurrency = body.concurrency ? Math.min(50, Math.max(1, parseInt(body.concurrency))) : 20
    const configChunkSize = body.chunkSize ? Math.min(100, Math.max(1, parseInt(body.chunkSize))) : 20
    const configMaxRecords = body.maxRecords ? Math.max(1, parseInt(body.maxRecords)) : null
    const configFilterByAmount = body.filterByAmount || null
    const configAmountLimit = body.amountLimit ? Math.max(1, parseInt(body.amountLimit)) : null

    const client = await getMongoClient()
    const db = client.db(getDbName())
    const uploads = db.collection('uploads')
    const settings = db.collection('settings')
    const accounts = db.collection('accounts')

    const doc = await uploads.findOne({ _id: new ObjectId(id) }) as any
    if (!doc) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
    }

    if (!doc.records || !Array.isArray(doc.records)) {
      return NextResponse.json({ error: 'Invalid upload: no records found' }, { status: 400 })
    }

    // Load field mapping
    const settingsDoc = await settings.findOne({ _id: 'field-mapping' as any })
    const customMapping = settingsDoc?.mapping as FieldMapping | null

    // Fetch account settings if assigned, otherwise use default config
    let companyConfig: CompanyConfig | null = null
    if (doc.accountId) {
      const account = await accounts.findOne({ _id: new ObjectId(doc.accountId) }) as any
      if (account) {
        companyConfig = {
          name: account.name,
          contactEmail: account.contactEmail,
          returnUrls: account.returnUrls,
          dynamicDescriptor: account.dynamicDescriptor,
          fallbackDescription: account.fallbackDescription,
        }
      }
    }

    // Use default config if no account is assigned (e.g., superOwner uploads)
    if (!companyConfig) {
      companyConfig = getDefaultCompanyConfig()
    }

    const records: Record<string, string>[] = doc.records || []
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'No records to submit' }, { status: 400 })
    }

    // Ensure rows[] exists
    const rows = (doc.rows && Array.isArray(doc.rows) && doc.rows.length === records.length)
      ? doc.rows
      : records.map(() => ({ status: 'pending', attempts: 0 }))

    // Check 30-day threshold before submission
    const ibansToCheck = extractIbansFromRecords(records)
    if (ibansToCheck.length > 0) {
      const thresholdResult = await check30DayThreshold(db, ibansToCheck, id)

      if (thresholdResult.violations.length > 0) {
        // Mark violating rows as error
        for (const violation of thresholdResult.violations) {
          rows[violation.rowIndex].status = 'error'
          rows[violation.rowIndex].emp = {
            message: `Invalid: IBAN processed ${violation.daysAgo} day(s) ago (must wait 7 days)`
          }
          rows[violation.rowIndex].attempts = (rows[violation.rowIndex].attempts || 0) + 1
          rows[violation.rowIndex].lastAttemptAt = new Date()
        }

        // Update database with error rows
        await uploads.updateOne({ _id: doc._id }, { $set: { rows, updatedAt: new Date() } })

        console.log(`[Submit Batch] Marked ${thresholdResult.violations.length} row(s) as threshold violations`)
      }
    }

    // Get all rows that need processing (skip approved, blacklisted, and error)
    let rowsToProcess = records
      .map((_, i) => i)
      .filter(i => rows[i]?.status !== 'approved' && rows[i]?.status !== 'blacklisted' && rows[i]?.status !== 'error')

    // Filter by amount if specified
    if (configFilterByAmount) {
      const beforeFilterCount = rowsToProcess.length
      rowsToProcess = rowsToProcess.filter(i => {
        const amount = getFieldValue(records[i], 'amount')
        return amount === configFilterByAmount
      })
      console.log(`[Bulk] Filtered by amount ${configFilterByAmount}: ${rowsToProcess.length} records (from ${beforeFilterCount})`)

      // Limit to amountLimit if specified
      if (configAmountLimit && rowsToProcess.length > configAmountLimit) {
        rowsToProcess = rowsToProcess.slice(0, configAmountLimit)
        console.log(`[Bulk] Limited to ${configAmountLimit} records with amount ${configFilterByAmount}`)
      }
    } else {
      // Limit to maxRecords if specified (only when not filtering by amount)
      if (configMaxRecords && rowsToProcess.length > configMaxRecords) {
        rowsToProcess = rowsToProcess.slice(0, configMaxRecords)
        console.log(`[Bulk] Limited processing to ${configMaxRecords} records`)
      }
    }

    if (rowsToProcess.length === 0) {
      const approvedCount = rows.filter((r: any) => r.status === 'approved').length
      const errorCount = rows.filter((r: any) => r.status === 'error').length
      const blacklistedCount = rows.filter((r: any) => r.status === 'blacklisted').length

      return NextResponse.json({
        ok: true,
        message: 'All records already processed',
        processed: 0,
        total: records.length,
        approved: approvedCount,
        errors: errorCount,
        blacklisted: blacklistedCount,
        pending: 0,
      })
    }

    console.log(`[Bulk] Starting bulk submission: ${rowsToProcess.length} records to process (concurrency: ${configConcurrency}, chunk size: ${configChunkSize})`)

    // Configurable concurrency bulk processing
    const CONCURRENCY = configConcurrency
    const errors: Array<{ rowIndex: number; message: string }> = []
    let processed = 0
    let lastDbUpdate = Date.now()
    const DB_UPDATE_INTERVAL = 5000 // Update DB every 5 seconds

    const processRow = async (rowIndex: number): Promise<void> => {
      const record = records[rowIndex]

      let request
      try {
        request = mapRecordToSddSale(record, rowIndex, customMapping, doc.originalFilename || doc.filename, companyConfig)
      } catch (validationError: any) {
        const rowState = rows[rowIndex]
        rowState.status = 'error'
        rowState.emp = { message: validationError?.message || 'Validation failed' }
        rowState.attempts = (rowState.attempts || 0) + 1
        rowState.lastAttemptAt = new Date()
        errors.push({ rowIndex, message: validationError?.message || 'Validation failed' })
        return
      }

      const rowState = rows[rowIndex]
      const baseTransactionId = rowState.baseTransactionId || stripRetrySuffix(request.transactionId)
      rowState.baseTransactionId = baseTransactionId

      const maxDuplicateRetries = 3
      let retryCount = typeof rowState.retryCount === 'number' && rowState.retryCount > 0 ? rowState.retryCount : 0
      let duplicateAttempts = 0
      let finalResponse: SddSaleResponse | null = null
      let finalError: any = null
      let currentRequest = request
      let resolvedViaExisting = false

      while (true) {
        const transactionIdForAttempt = buildRetryTransactionId(baseTransactionId, retryCount)
        if (transactionIdForAttempt !== currentRequest.transactionId) {
          currentRequest = { ...currentRequest, transactionId: transactionIdForAttempt }
        }

        rowState.retryCount = retryCount
        rowState.attempts = (rowState.attempts || 0) + 1
        rowState.lastAttemptAt = new Date()
        rowState.request = { ...currentRequest, iban: maskIban(currentRequest.iban) }
        rowState.status = 'submitted'

        try {
          finalResponse = await submitSddSale(currentRequest)
          finalError = null
        } catch (err: any) {
          finalError = err
          finalResponse = null
        }

        if (finalResponse?.ok) {
          rowState.emp = {
            uniqueId: finalResponse.uniqueId,
            redirectUrl: finalResponse.redirectUrl,
            message: finalResponse.message,
            technicalMessage: finalResponse.technicalMessage,
          }
          rowState.status = finalResponse.status === 'approved' ? 'approved' : 'submitted'
          break
        }

        const duplicate = isDuplicateTransactionError(finalResponse, finalError)
        if (duplicate) {
          let reconciliation
          try {
            reconciliation = await reconcileTransaction({ transactionId: transactionIdForAttempt })
          } catch (reconError: any) {
            reconciliation = { ok: false, message: reconError?.message } as any
          }

          const reconStatus = (reconciliation?.status || '').toLowerCase()
          const isReconApproved = reconciliation?.ok && APPROVED_STATUSES.has(reconStatus)
          const isReconPending = reconciliation?.ok && PENDING_STATUSES.has(reconStatus)

          if (isReconApproved || isReconPending) {
            rowState.emp = {
              uniqueId: reconciliation.uniqueId,
              message: reconciliation.message || finalResponse?.message,
              technicalMessage: reconciliation.technicalMessage,
            }
            rowState.empStatus = reconciliation.status
            rowState.status = isReconApproved ? 'approved' : 'submitted'
            resolvedViaExisting = true
            break
          }

          retryCount += 1
          duplicateAttempts += 1
          rowState.retryCount = retryCount
          rowState.duplicateRetries = duplicateAttempts

          try {
            console.warn('[Bulk] duplicate transaction_id, retrying with suffix', {
              rowIndex,
              previousTransactionId: transactionIdForAttempt,
              nextTransactionId: buildRetryTransactionId(baseTransactionId, retryCount),
              duplicateAttempts,
            })
          } catch { }

          if (duplicateAttempts > maxDuplicateRetries) {
            const message = finalResponse?.message || finalError?.message || 'Duplicate transaction_id after retries'
            rowState.status = 'error'
            rowState.emp = {
              message,
              technicalMessage: finalResponse?.technicalMessage || finalError?.stack,
            }
            errors.push({ rowIndex, message })
            break
          }

          continue
        }

        const message = finalResponse?.message || finalError?.message || 'Submit failed'
        rowState.status = 'error'
        rowState.emp = {
          message,
          technicalMessage: finalResponse?.technicalMessage || finalError?.stack,
          uniqueId: finalResponse?.uniqueId,
        }
        errors.push({ rowIndex, message })
        break
      }

      rowState.lastTransactionId = currentRequest.transactionId

      if (!resolvedViaExisting && finalResponse && !finalResponse.ok && rowState.status !== 'error') {
        // Ensure errors capture any non-success state that slipped through
        errors.push({ rowIndex, message: finalResponse.message || 'Submit failed' })
      }

      processed++

      // Periodic DB update for progress tracking
      const now = Date.now()
      if (now - lastDbUpdate > DB_UPDATE_INTERVAL) {
        lastDbUpdate = now
        await uploads.updateOne({ _id: doc._id }, {
          $set: { rows, updatedAt: new Date() },
        }).catch(err => console.error('[Bulk] DB update error:', err))

        console.log(`[Bulk] Progress: ${processed}/${rowsToProcess.length} (${Math.round(processed / rowsToProcess.length * 100)}%)`)
      }
    }

    // Process all rows with controlled concurrency
    const chunks: number[][] = []
    for (let i = 0; i < rowsToProcess.length; i += CONCURRENCY) {
      chunks.push(rowsToProcess.slice(i, i + CONCURRENCY))
    }

    for (const chunk of chunks) {
      await Promise.all(chunk.map(processRow))
    }

    // Final update with counts
    const approvedCount = rows.filter((r: any) => r.status === 'approved').length
    const errorCount = rows.filter((r: any) => r.status === 'error').length
    const pendingCount = rows.filter((r: any) => r.status === 'pending').length
    const blacklistedCount = rows.filter((r: any) => r.status === 'blacklisted').length

    await uploads.updateOne({ _id: doc._id }, {
      $set: {
        rows,
        approvedCount,
        errorCount,
        blacklistedCount,
        updatedAt: new Date(),
      }
    })

    const runtime = Date.now() - startTime
    console.log(`[Bulk] Complete: ${processed} processed, ${approvedCount} approved, ${errorCount} errors, ${blacklistedCount} blacklisted, ${runtime}ms`)

    return NextResponse.json({
      ok: true,
      processed,
      total: records.length,
      approved: approvedCount,
      errors: errorCount,
      blacklisted: blacklistedCount,
      pending: pendingCount,
      errorDetails: errors.slice(0, 20), // Return first 20 errors for debugging
      runtime,
    })
  } catch (err: any) {
    console.error('[Bulk] Fatal error:', err)
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
