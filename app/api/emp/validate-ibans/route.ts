import { NextRequest, NextResponse } from 'next/server'
import { getMongoClient, getDbName } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { getFieldValue } from '@/lib/field-aliases'

const DAYS_THRESHOLD = 30

/**
 * POST /api/emp/validate-ibans
 *
 * Checks if IBANs exist in (within last 30 days):
 * 1. emp_reconcile_transactions (recently processed)
 * 2. uploads collection (recently uploaded)
 * 3. uploads collection rows (submitted to EMP gateway)
 *
 * Body: { ibans: string[], currentUploadId?: string }
 * Returns: { duplicates: { iban: string, daysAgo: number, source: string, filename?: string }[] }
 */
export async function POST(request: NextRequest) {
  try {
    await requireSession()

    const body = await request.json()
    const ibans: string[] = body.ibans || []
    const currentUploadId: string | undefined = body.currentUploadId

    if (!ibans.length) {
      return NextResponse.json({ duplicates: [] })
    }

    // Normalize IBANs (uppercase, no spaces)
    const normalizedIbans = ibans.map(iban =>
      iban?.toUpperCase().replace(/\s+/g, '') || ''
    ).filter(Boolean)

    const client = await getMongoClient()
    const db = client.db(getDbName())
    const reconcileCollection = db.collection('emp_reconcile_transactions')
    const uploadsCollection = db.collection('uploads')

    // Calculate date threshold (30 days ago)
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() - DAYS_THRESHOLD)

    // Map to store IBAN -> { date, source, filename }
    type IbanInfo = { date: Date; source: string; filename?: string }
    const ibanInfoMap = new Map<string, IbanInfo>()

    // ===== 1. Check emp_reconcile_transactions =====
    const existingTransactions = await reconcileCollection.find({
      $or: [
        { bankAccountNumber: { $in: normalizedIbans } },
        { bank_account_number: { $in: normalizedIbans } }
      ],
      transactionDateObj: { $gte: thresholdDate }  // Within last 30 days
    }).project({
      bankAccountNumber: 1,
      bank_account_number: 1,
      transactionDateObj: 1
    }).toArray()

    for (const tx of existingTransactions) {
      const iban = (tx.bankAccountNumber || tx.bank_account_number || '')
        .toUpperCase().replace(/\s+/g, '')

      if (!iban) continue

      const txDate = tx.transactionDateObj
      const existing = ibanInfoMap.get(iban)

      // Keep the most recent date
      if (!existing || (txDate && txDate > existing.date)) {
        ibanInfoMap.set(iban, { date: txDate, source: 'reconcile' })
      }
    }

    // ===== 2. Check uploads collection (recently uploaded) =====
    const uploadsQuery: any = {
      createdAt: { $gte: thresholdDate }
    }

    // Exclude current upload if provided
    if (currentUploadId) {
      try {
        uploadsQuery._id = { $ne: new ObjectId(currentUploadId) }
      } catch (err) {
        console.warn('[Validate IBANs] Invalid currentUploadId:', currentUploadId)
      }
    }

    const recentUploads = await uploadsCollection.find(uploadsQuery).project({
      records: 1,
      rows: 1,
      createdAt: 1,
      filename: 1,
      updatedAt: 1
    }).toArray()

    for (const upload of recentUploads) {
      const records = upload.records || []
      const rows = upload.rows || []
      const uploadDate = upload.createdAt || new Date()
      const filename = upload.filename || 'Unknown'

      for (let i = 0; i < records.length; i++) {
        const record = records[i]
        const row = rows[i]

        const iban = getFieldValue(record, 'iban')
        if (!iban) continue

        const normalizedIban = iban.toUpperCase().replace(/\s+/g, '')

        // Only include if it's in our search list
        if (!normalizedIbans.includes(normalizedIban)) continue

        // Check if this row was submitted to EMP gateway
        const wasSubmittedToEmp = row?.emp || row?.status === 'approved' || row?.status === 'submitted' || row?.status === 'error'

        // Use the most recent date: either when it was submitted (updatedAt) or uploaded (createdAt)
        const relevantDate = wasSubmittedToEmp && upload.updatedAt ? upload.updatedAt : uploadDate
        const source = wasSubmittedToEmp ? 'emp_submission' : 'upload'

        const existing = ibanInfoMap.get(normalizedIban)

        // Keep the most recent occurrence
        if (!existing || relevantDate > existing.date) {
          ibanInfoMap.set(normalizedIban, {
            date: relevantDate,
            source,
            filename
          })
        }
      }
    }

    // Calculate days ago for each duplicate
    const now = new Date()
    const duplicates = Array.from(ibanInfoMap.entries()).map(([iban, info]) => {
      const daysAgo = Math.floor((now.getTime() - info.date.getTime()) / (1000 * 60 * 60 * 24))
      return {
        iban,
        daysAgo,
        source: info.source,
        filename: info.filename
      }
    })

    const reconcileCount = duplicates.filter(d => d.source === 'reconcile').length
    const uploadCount = duplicates.filter(d => d.source === 'upload').length
    const empSubmissionCount = duplicates.filter(d => d.source === 'emp_submission').length

    console.log(`[Validate IBANs] Checked ${normalizedIbans.length} IBANs, found ${duplicates.length} within last ${DAYS_THRESHOLD} days (${reconcileCount} reconcile, ${uploadCount} uploads, ${empSubmissionCount} EMP submissions)`)

    return NextResponse.json({ duplicates })
  } catch (error: any) {
    console.error('[Validate IBANs] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Validation failed' },
      { status: 500 }
    )
  }
}
