import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getMongoClient, getDbName } from '@/lib/db'
import { requireSession, canManageUpload } from '@/lib/auth'
import { validateRows } from '@/lib/validation'

export const runtime = 'nodejs'

/**
 * DELETE /api/emp/uploads/delete-invalid/[id]
 * 
 * Deletes all invalid rows from an upload (validation errors, blacklisted, recently processed)
 * Only Super Owner or Owner (if draft) can delete rows
 */
export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  try {
    const session = await requireSession()
    const uploadId = ctx.params.id

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

    // Get validation errors
    const validation = validateRows(records)
    const invalidIndexes = new Set(validation.invalidRows.map(r => r.index))

    // Also include blacklisted rows
    rows.forEach((r: any, i: number) => {
      if (r?.status === 'blacklisted') {
        invalidIndexes.add(i)
      }
    })

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
