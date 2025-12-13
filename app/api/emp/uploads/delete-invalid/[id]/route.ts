import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getMongoClient, getDbName } from '@/lib/db'
import { requireSession, canManageUpload } from '@/lib/auth'
import { validateRows } from '@/lib/validation'
import { getFieldValue } from '@/lib/field-aliases'

export const runtime = 'nodejs'

/**
 * DELETE /api/emp/uploads/delete-invalid/[id]
 *
 * Deletes all invalid rows from an upload (validation errors, blacklisted, recently processed)
 * Only Super Owner or Owner (if draft) can delete rows
 *
 * Query params: skipAddressValidation (optional boolean)
 */
export async function DELETE(req: Request, ctx: { params: { id: string } }) {
  try {
    const session = await requireSession()
    const uploadId = ctx.params.id

    // Get skipAddressValidation from query params
    const url = new URL(req.url)
    const skipAddressValidation = url.searchParams.get('skipAddressValidation') === 'true'

    const client = await getMongoClient()
    const db = client.db(getDbName())
    const uploads = db.collection('uploads')

    const doc = await uploads.findOne({ _id: new ObjectId(uploadId) }) as any
    if (!doc) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
    }

    if (!canManageUpload(session, doc)) {
      return NextResponse.json({ error: 'Forbidden: Cannot delete rows from this upload' }, { status: 403 })
    }

    const records: Record<string, string>[] = doc.records || []
    const rows: any[] = doc.rows || []

    if (records.length === 0) {
      return NextResponse.json({ error: 'No records in upload' }, { status: 400 })
    }

    // Get validation errors (respecting skipAddressValidation setting)
    const validation = validateRows(records, { skipAddressValidation })
    const invalidIndexes = new Set(validation.invalidRows.map(r => r.index))

    // Also include blacklisted rows
    rows.forEach((r: any, i: number) => {
      if (r?.status === 'blacklisted') {
        invalidIndexes.add(i)
      }
    })

    // Check for IBANs processed within last 7 days (7-day rule)
    const DAYS_THRESHOLD = 7
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() - DAYS_THRESHOLD)

    // Get all IBANs from records
    const ibansToCheck = records
      .map((record, index) => {
        const iban = getFieldValue(record, 'iban')
        return iban ? { iban: iban.toUpperCase().replace(/\s+/g, ''), index } : null
      })
      .filter(Boolean) as { iban: string; index: number }[]

    if (ibansToCheck.length > 0) {
      const normalizedIbans = ibansToCheck.map(item => item.iban)
      const reconcileCollection = db.collection('emp_reconcile_transactions')
      const uploadsCollection = db.collection('uploads')

      // Check 1: emp_reconcile_transactions
      const existingTransactions = await reconcileCollection.find({
        $or: [
          { bankAccountNumber: { $in: normalizedIbans } },
          { bank_account_number: { $in: normalizedIbans } }
        ],
        transactionDateObj: { $gte: thresholdDate }
      }).project({
        bankAccountNumber: 1,
        bank_account_number: 1
      }).toArray()

      const recentlyProcessedIbans = new Set<string>()
      existingTransactions.forEach((tx: any) => {
        const iban = (tx.bankAccountNumber || tx.bank_account_number || '')
          .toUpperCase().replace(/\s+/g, '')
        if (iban) recentlyProcessedIbans.add(iban)
      })

      // Check 2 & 3: Other uploads and EMP submissions
      const recentUploads = await uploadsCollection.find({
        _id: { $ne: new ObjectId(uploadId) },
        createdAt: { $gte: thresholdDate }
      }).project({
        records: 1,
        rows: 1,
        createdAt: 1,
        updatedAt: 1
      }).toArray()

      for (const upload of recentUploads) {
        const uploadRecords = upload.records || []
        const uploadRows = upload.rows || []

        for (let i = 0; i < uploadRecords.length; i++) {
          const record = uploadRecords[i]
          const row = uploadRows[i]

          const iban = getFieldValue(record, 'iban')
          if (!iban) continue

          const normalizedIban = iban.toUpperCase().replace(/\s+/g, '')

          // Check if this IBAN is in our list
          if (normalizedIbans.includes(normalizedIban)) {
            // Check if uploaded within 7 days OR submitted to EMP within 7 days
            const wasSubmittedToEmp = row?.emp || row?.status === 'approved' || row?.status === 'submitted' || row?.status === 'error'
            const relevantDate = wasSubmittedToEmp && upload.updatedAt ? upload.updatedAt : upload.createdAt

            if (relevantDate >= thresholdDate) {
              recentlyProcessedIbans.add(normalizedIban)
            }
          }
        }
      }

      // Mark rows with recently processed IBANs as invalid
      ibansToCheck.forEach(item => {
        if (recentlyProcessedIbans.has(item.iban)) {
          invalidIndexes.add(item.index)
        }
      })
    }

    if (invalidIndexes.size === 0) {
      return NextResponse.json({
        ok: true,
        message: 'No invalid rows to delete',
        deletedCount: 0,
        newRecordCount: records.length,
      })
    }

    console.log(`[Delete Invalid] Deleting ${invalidIndexes.size} invalid rows from upload ${uploadId}`)

    // Filter out invalid rows
    const newRecords = records.filter((_, i) => !invalidIndexes.has(i))
    const newRows = rows.filter((_, i) => !invalidIndexes.has(i))

    // Recalculate counts
    const approvedCount = newRows.filter((r: any) => r.status === 'approved').length
    const errorCount = newRows.filter((r: any) => r.status === 'error').length

    // Update the upload document
    await uploads.updateOne(
      { _id: new ObjectId(uploadId) },
      {
        $set: {
          records: newRecords,
          rows: newRows,
          recordCount: newRecords.length,
          approvedCount,
          errorCount,
          updatedAt: new Date(),
        },
      }
    )

    console.log(`[Delete Invalid] Successfully deleted ${invalidIndexes.size} rows. New count: ${newRecords.length}`)

    return NextResponse.json({
      ok: true,
      message: `Deleted ${invalidIndexes.size} invalid row(s)`,
      deletedCount: invalidIndexes.size,
      newRecordCount: newRecords.length,
    })
  } catch (err: any) {
    console.error('[Delete Invalid] Error:', err)
    return NextResponse.json({
      error: err?.message || 'Failed to delete invalid rows'
    }, { status: 500 })
  }
}
