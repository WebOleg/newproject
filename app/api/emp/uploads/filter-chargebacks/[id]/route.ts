import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getMongoClient, getDbName } from '@/lib/db'
import { requireWriteAccess } from '@/lib/auth'
import { checkBlacklist } from '@/lib/blacklist'
import { getFieldValue } from '@/lib/field-aliases'

export const runtime = 'nodejs'

/**
 * POST /api/emp/uploads/filter-chargebacks/[id]
 * 
 * Removes rows from upload that have:
 * 1. IBANs matching chargebacks in cache
 * 2. IBAN, email, name, or BIC in blacklist
 * Only Super Owner can filter uploads
 */
export async function POST(_req: Request, ctx: { params: { id: string } }) {
  try {
    await requireWriteAccess()

    const { id } = ctx.params

    const client = await getMongoClient()
    const db = client.db(getDbName())
    const uploads = db.collection('uploads')
    const chargebacksCollection = db.collection('emp_chargebacks')
    const reconcileCollection = db.collection('emp_reconcile_transactions')

    // Get the upload document
    const doc = await uploads.findOne({ _id: new ObjectId(id) }) as any
    if (!doc) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
    }

    const records: Record<string, string>[] = doc.records || []
    const rows: any[] = doc.rows || []

    if (records.length === 0) {
      return NextResponse.json({ error: 'No records in upload' }, { status: 400 })
    }

    console.log(`[Filter Chargebacks] Processing upload ${id} with ${records.length} records`)

    // ============ PART 1: CHARGEBACK FILTERING ============
    
    // Step 1: Get all chargebacks from cache
    const allChargebacks = await chargebacksCollection.find({}).toArray()
    console.log(`[Filter Chargebacks] Found ${allChargebacks.length} chargebacks in cache`)

    // Step 2: Get originalTransactionUniqueIds from chargebacks
    const originalTransactionUniqueIds = new Set(
      allChargebacks
        .map(cb => cb.originalTransactionUniqueId || cb.original_transaction_unique_id)
        .filter(Boolean)
    )

    console.log(`[Filter Chargebacks] Looking up ${originalTransactionUniqueIds.size} original transaction IDs`)

    // Step 3: Look up original transactions to get bankAccountNumber/cardNumber
    const originalTransactions = await reconcileCollection
      .find({ uniqueId: { $in: Array.from(originalTransactionUniqueIds) } })
      .toArray()

    console.log(`[Filter Chargebacks] Found ${originalTransactions.length} original transactions`)

    // Step 4: Extract bankAccountNumber or cardNumber from original transactions
    const chargebackAccounts = new Set<string>()

    for (const tx of originalTransactions) {
      const account = tx.bankAccountNumber || tx.bank_account_number || tx.cardNumber || tx.card_number

      if (account && typeof account === 'string') {
        const normalized = account.replace(/\s+/g, '').toUpperCase()
        if (normalized.length > 0) {
          chargebackAccounts.add(normalized)
        }
      }
    }

    console.log(`[Filter Chargebacks] Extracted ${chargebackAccounts.size} unique account numbers with chargebacks`)

    // ============ PART 2: BLACKLIST FILTERING ============
    
    // Extract data for blacklist check
    const ibans = records
      .map(r => getFieldValue(r, 'iban'))
      .filter((iban): iban is string => !!iban)
      .map(iban => iban.replace(/\s/g, '').toUpperCase())

    const emails = records
      .map(r => getFieldValue(r, 'email'))
      .filter((email): email is string => !!email)

    const names = records
      .map(r => {
        const name = getFieldValue(r, 'name') || ''
        const firstName = getFieldValue(r, 'first_name') || getFieldValue(r, 'firstname') || ''
        const lastName = getFieldValue(r, 'last_name') || getFieldValue(r, 'lastname') || getFieldValue(r, 'surname') || ''
        return name || `${lastName} ${firstName}`.trim()
      })
      .filter((name): name is string => !!name)

    const bics = records
      .map(r => getFieldValue(r, 'bic'))
      .filter((bic): bic is string => !!bic)

    // Check blacklist
    let blacklistedIbans = new Set<string>()
    let blacklistedEmails = new Set<string>()
    let blacklistedNames = new Set<string>()
    let blacklistedBics = new Set<string>()

    try {
      const result = await checkBlacklist(ibans, emails, names, bics)
      blacklistedIbans = result.blacklistedIbans
      blacklistedEmails = result.blacklistedEmails
      blacklistedNames = result.blacklistedNames
      blacklistedBics = result.blacklistedBics
      
      console.log(`[Filter Chargebacks] Blacklist check: ${blacklistedIbans.size} IBANs, ${blacklistedEmails.size} emails, ${blacklistedNames.size} names, ${blacklistedBics.size} BICs`)
    } catch (blError: any) {
      console.error('[Filter Chargebacks] Blacklist check error:', blError)
    }

    // ============ PART 3: FILTER RECORDS ============

    const remainingRecords: Record<string, string>[] = []
    const remainingRows: any[] = []
    const removedRecords: Record<string, string>[] = []
    let removedByChargeback = 0
    let removedByBlacklist = 0

    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      
      // Get IBAN
      const iban = getFieldValue(record, 'iban') || ''
      const normalizedIban = iban.replace(/\s+/g, '').toUpperCase()
      
      // Get email
      const email = getFieldValue(record, 'email') || ''
      const normalizedEmail = email.trim().toLowerCase()
      
      // Get name
      const nameField = getFieldValue(record, 'name') || ''
      const firstName = getFieldValue(record, 'first_name') || getFieldValue(record, 'firstname') || ''
      const lastName = getFieldValue(record, 'last_name') || getFieldValue(record, 'lastname') || getFieldValue(record, 'surname') || ''
      const fullName = nameField || `${lastName} ${firstName}`.trim()
      const normalizedName = fullName.toUpperCase()
      
      // Get BIC
      const bic = getFieldValue(record, 'bic') || ''
      const normalizedBic = bic.trim().toUpperCase()

      // Check chargeback
      const hasChargeback = normalizedIban && chargebackAccounts.has(normalizedIban)
      
      // Check blacklist
      const ibanBlacklisted = blacklistedIbans.has(normalizedIban)
      const emailBlacklisted = blacklistedEmails.has(normalizedEmail)
      const nameBlacklisted = blacklistedNames.has(normalizedName)
      const bicBlacklisted = blacklistedBics.has(normalizedBic)
      const isBlacklisted = ibanBlacklisted || emailBlacklisted || nameBlacklisted || bicBlacklisted

      if (hasChargeback || isBlacklisted) {
        removedRecords.push(record)
        if (hasChargeback) removedByChargeback++
        if (isBlacklisted) removedByBlacklist++
        
        if (removedRecords.length <= 5) {
          const reasons = []
          if (hasChargeback) reasons.push('chargeback')
          if (ibanBlacklisted) reasons.push('IBAN blacklisted')
          if (emailBlacklisted) reasons.push('email blacklisted')
          if (nameBlacklisted) reasons.push('name blacklisted')
          if (bicBlacklisted) reasons.push('BIC blacklisted')
          console.log(`[Filter Chargebacks] Removing row ${i}: ${reasons.join(', ')}`)
        }
      } else {
        remainingRecords.push(record)
        if (rows[i]) {
          remainingRows.push(rows[i])
        }
      }
    }

    const totalRemoved = removedRecords.length
    console.log(`[Filter Chargebacks] Removed ${totalRemoved} rows (${removedByChargeback} chargebacks, ${removedByBlacklist} blacklisted), ${remainingRecords.length} remaining`)

    // Step 7: Update the upload document
    await uploads.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          records: remainingRecords,
          rows: remainingRows,
          recordCount: remainingRecords.length,
          filteredRecords: removedRecords,
          updatedAt: new Date(),
          chargebackFilteredAt: new Date(),
          chargebackFilterStats: {
            originalCount: records.length,
            removedCount: totalRemoved,
            removedByChargeback,
            removedByBlacklist,
            remainingCount: remainingRecords.length,
            chargebackAccountsChecked: chargebackAccounts.size,
            blacklistChecked: {
              ibans: blacklistedIbans.size,
              emails: blacklistedEmails.size,
              names: blacklistedNames.size,
              bics: blacklistedBics.size,
            },
          },
        },
      }
    )

    return NextResponse.json({
      ok: true,
      message: `Removed ${totalRemoved} row(s) (${removedByChargeback} chargebacks, ${removedByBlacklist} blacklisted)`,
      removedCount: totalRemoved,
      removedByChargeback,
      removedByBlacklist,
      remainingCount: remainingRecords.length,
      originalCount: records.length,
      chargebackAccountsChecked: chargebackAccounts.size,
    })
  } catch (err: any) {
    console.error('[Filter Chargebacks] Error:', err)
    return NextResponse.json({
      error: err?.message || 'Failed to filter chargebacks'
    }, { status: 500 })
  }
}
