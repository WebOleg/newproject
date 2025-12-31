import { Db, ObjectId } from 'mongodb'
import { getFieldValue } from './field-aliases'

export const DAYS_THRESHOLD = 30

export type ThresholdViolation = {
  iban: string
  rowIndex: number
  daysAgo: number
  source: 'reconcile' | 'upload' | 'emp_submission'
  filename?: string
  date: Date
}

export type ThresholdCheckResult = {
  violations: ThresholdViolation[]
  violatedIbans: Set<string>
  checkedCount: number
}

/**
 * Extract IBANs from records with their row indexes
 * Returns normalized IBANs (uppercase, no spaces) with original row index
 */
export function extractIbansFromRecords(
  records: Record<string, string>[]
): Array<{ iban: string; rowIndex: number }> {
  return records
    .map((record, index) => {
      const iban = getFieldValue(record, 'iban')
      return iban ? { iban: iban.toUpperCase().replace(/\s+/g, ''), rowIndex: index } : null
    })
    .filter((item): item is { iban: string; rowIndex: number } => item !== null)
}

/**
 * Check IBANs against cooling down threshold
 * Queries both emp_reconcile_transactions and uploads collections
 * Returns all violations found
 *
 * @param db - MongoDB database instance
 * @param ibansToCheck - Array of IBANs with their row indexes
 * @param currentUploadId - Optional current upload ID to exclude from checks
 * @param customDaysThreshold - Optional custom cooling period in days (default: DAYS_THRESHOLD)
 */
export async function check30DayThreshold(
  db: Db,
  ibansToCheck: Array<{ iban: string; rowIndex: number }>,
  currentUploadId?: string,
  customDaysThreshold?: number
): Promise<ThresholdCheckResult> {
  if (ibansToCheck.length === 0) {
    return { violations: [], violatedIbans: new Set(), checkedCount: 0 }
  }

  const daysThreshold = customDaysThreshold ?? DAYS_THRESHOLD
  const normalizedIbans = ibansToCheck.map(item => item.iban)
  const thresholdDate = new Date()
  thresholdDate.setDate(thresholdDate.getDate() - daysThreshold)

  const reconcileCollection = db.collection('emp_reconcile_transactions')
  const uploadsCollection = db.collection('uploads')

  // Map to store IBAN -> most recent occurrence info
  type IbanInfo = { date: Date; source: 'reconcile' | 'upload' | 'emp_submission'; filename?: string }
  const ibanInfoMap = new Map<string, IbanInfo>()

  // Query both collections in parallel for performance
  const [reconcileTransactions, recentUploads] = await Promise.all([
    // 1. Check emp_reconcile_transactions
    reconcileCollection.find({
      $or: [
        { bankAccountNumber: { $in: normalizedIbans } },
        { bank_account_number: { $in: normalizedIbans } }
      ],
      transactionDateObj: { $gte: thresholdDate }
    }).project({
      bankAccountNumber: 1,
      bank_account_number: 1,
      transactionDateObj: 1
    }).toArray(),

    // 2. Check uploads collection
    uploadsCollection.find({
      createdAt: { $gte: thresholdDate },
      ...(currentUploadId && { _id: { $ne: new ObjectId(currentUploadId) } })
    }).project({
      records: 1,
      rows: 1,
      createdAt: 1,
      updatedAt: 1,
      filename: 1
    }).toArray()
  ])

  // Process reconcile transactions
  for (const tx of reconcileTransactions) {
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

  // Process uploads collection
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

  // Build violations list with row indexes
  const now = new Date()
  const violations: ThresholdViolation[] = []

  for (const item of ibansToCheck) {
    const info = ibanInfoMap.get(item.iban)
    if (info) {
      const daysAgo = Math.floor((now.getTime() - info.date.getTime()) / (1000 * 60 * 60 * 24))
      violations.push({
        iban: item.iban,
        rowIndex: item.rowIndex,
        daysAgo,
        source: info.source,
        filename: info.filename,
        date: info.date
      })
    }
  }

  return {
    violations,
    violatedIbans: new Set(violations.map(v => v.iban)),
    checkedCount: ibansToCheck.length
  }
}
