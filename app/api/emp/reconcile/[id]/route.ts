import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { compareWithEmp } from '@/lib/emerchantpay-reconcile'
import { getMongoClient, getDbName } from '@/lib/db'
import { ObjectId } from 'mongodb'
import { requireWriteAccess } from '@/lib/auth'

export const runtime = 'nodejs'

/**
 * POST /api/emp/reconcile/[id]
 * Reconciles an upload by fetching all transactions from EMP and comparing with CSV
 * Returns a report of what's approved, pending, error, or missing
 * Only Super Owner can reconcile (hits external emerchantpay API)
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireWriteAccess()
    
    const { id } = await params
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid upload ID' }, { status: 400 })
    }

    const client = await getMongoClient()
    const db = client.db(getDbName())
    const uploads = db.collection('uploads')

    const upload = await uploads.findOne({ _id: new ObjectId(id) })
    if (!upload) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
    }

    // Extract records with their submission status
    const records = (upload.records || []).map((record: any, idx: number) => {
      const rowStatus = upload.rows?.[idx]
      return {
        transactionId: record.TransactionId || record.transactionId || `${id}-${idx}`,
        uniqueId: rowStatus?.emp?.uniqueId,
        status: rowStatus?.status || 'pending',
      }
    })

    // Compare with EMP
    const report = await compareWithEmp(records)

    // Update the upload with reconciliation timestamp and sync row errors
    const updateOps: any = {
      lastReconciledAt: new Date(),
      reconciliationReport: report,
    }

    // Update individual row statuses and error messages from EMP
    const rowUpdates: any = {}
    report.details.forEach((detail) => {
      const rowIndex = detail.csvRowIndex

      // Update empStatus and empError
      if (detail.empStatus || detail.message) {
        rowUpdates[`rows.${rowIndex}.empError`] = detail.message
        rowUpdates[`rows.${rowIndex}.empStatus`] = detail.empStatus
      }

      // CRITICAL FIX: Update the status field based on empStatus to fix green highlighting
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
      // Note: 'not_submitted' rows keep their existing status (usually 'pending')
    })

    if (Object.keys(rowUpdates).length > 0) {
      Object.assign(updateOps, rowUpdates)
    }

    await uploads.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateOps }
    )

    return NextResponse.json({ ok: true, report })
  } catch (err: any) {
    console.error('[Reconcile] Error:', err)
    return NextResponse.json(
      { error: err?.message || 'Reconcile failed' },
      { status: 500 }
    )
  }
}

