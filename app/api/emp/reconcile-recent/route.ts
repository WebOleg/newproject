import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { compareWithEmp } from '@/lib/emerchantpay-reconcile'
import { getMongoClient, getDbName } from '@/lib/db'
import { ObjectId } from 'mongodb'
import { requireWriteAccess } from '@/lib/auth'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes max

/**
 * POST /api/emp/reconcile-recent
 * Reconciles ALL uploads from the last 24 hours
 * Returns summary of all reconciliations
 * Only Super Owner can reconcile (hits external emerchantpay API)
 */
export async function POST(req: Request) {
  try {
    await requireWriteAccess()

    const client = await getMongoClient()
    const db = client.db(getDbName())
    const uploads = db.collection('uploads')

    // Get all uploads from last 24 hours
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    const recentUploads = await uploads.find({
      createdAt: { $gte: oneDayAgo }
    }).toArray()

    if (recentUploads.length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'No uploads found in the last 24 hours',
        reconciledCount: 0,
        results: []
      })
    }

    console.log(`[Reconcile Recent] Found ${recentUploads.length} uploads from last 24 hours`)

    // Reconcile each upload
    const results = []
    let totalApproved = 0
    let totalErrors = 0
    let totalPending = 0

    for (const upload of recentUploads) {
      try {
        const uploadId = upload._id.toString()

        // Extract records with their submission status
        const records = (upload.records || []).map((record: any, idx: number) => {
          const rowStatus = upload.rows?.[idx]
          return {
            transactionId: record.TransactionId || record.transactionId || `${uploadId}-${idx}`,
            uniqueId: rowStatus?.emp?.uniqueId,
            status: rowStatus?.status || 'pending',
          }
        })

        // Compare with EMP
        const report = await compareWithEmp(records)

        // Update individual row statuses and error messages from EMP
        const updateOps: any = {
          lastReconciledAt: new Date(),
          reconciliationReport: report,
        }

        const rowUpdates: any = {}
        report.details.forEach((detail) => {
          const rowIndex = detail.csvRowIndex

          // Update empStatus and empError
          if (detail.empStatus || detail.message) {
            rowUpdates[`rows.${rowIndex}.empError`] = detail.message
            rowUpdates[`rows.${rowIndex}.empStatus`] = detail.empStatus
          }

          // Update the status field based on empStatus to fix green highlighting
          if (detail.status === 'approved') {
            rowUpdates[`rows.${rowIndex}.status`] = 'approved'
          } else if (detail.status === 'error') {
            rowUpdates[`rows.${rowIndex}.status`] = 'error'
          } else if (detail.status === 'pending') {
            rowUpdates[`rows.${rowIndex}.status`] = 'pending'
          } else if (detail.status === 'missing_in_emp') {
            rowUpdates[`rows.${rowIndex}.status`] = 'error'
            if (!detail.message) {
              rowUpdates[`rows.${rowIndex}.empError`] = 'Transaction not found in payment gateway'
            }
          }
        })

        if (Object.keys(rowUpdates).length > 0) {
          Object.assign(updateOps, rowUpdates)
        }

        await uploads.updateOne(
          { _id: new ObjectId(uploadId) },
          { $set: updateOps }
        )

        totalApproved += report.approved
        totalErrors += report.error
        totalPending += report.pending

        results.push({
          uploadId,
          filename: upload.filename || 'Unknown',
          report: {
            total: report.total,
            approved: report.approved,
            error: report.error,
            pending: report.pending,
          },
          success: true,
        })

        console.log(`[Reconcile Recent] ${upload.filename}: ${report.approved} approved, ${report.error} errors, ${report.pending} pending`)
      } catch (err: any) {
        console.error(`[Reconcile Recent] Failed for upload ${upload._id}:`, err)
        results.push({
          uploadId: upload._id.toString(),
          filename: upload.filename || 'Unknown',
          error: err.message,
          success: false,
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failedCount = results.filter(r => !r.success).length

    console.log(`[Reconcile Recent] Complete: ${successCount} uploads reconciled, ${failedCount} failed`)

    return NextResponse.json({
      ok: true,
      reconciledCount: successCount,
      failedCount,
      totalApproved,
      totalErrors,
      totalPending,
      results,
    })
  } catch (err: any) {
    console.error('[Reconcile Recent] Error:', err)
    return NextResponse.json(
      { error: err?.message || 'Reconcile failed' },
      { status: 500 }
    )
  }
}
