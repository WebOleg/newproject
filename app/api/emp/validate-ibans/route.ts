import { NextRequest, NextResponse } from 'next/server'
import { getMongoClient, getDbName } from '@/lib/db'
import { requireSession } from '@/lib/auth'

const DAYS_THRESHOLD = 7

/**
 * POST /api/emp/validate-ibans
 * 
 * Checks if IBANs exist in emp_reconcile_transactions
 * and are older than 7 days
 * 
 * Body: { ibans: string[] }
 * Returns: { duplicates: { iban: string, daysAgo: number }[] }
 */
export async function POST(request: NextRequest) {
  try {
    await requireSession()

    const body = await request.json()
    const ibans: string[] = body.ibans || []

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

    // Calculate date threshold (7 days ago)
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() - DAYS_THRESHOLD)

    // Find transactions with matching IBANs older than 7 days
    const existingTransactions = await reconcileCollection.find({
      $or: [
        { bankAccountNumber: { $in: normalizedIbans } },
        { bank_account_number: { $in: normalizedIbans } }
      ],
      transactionDateObj: { $lt: thresholdDate }
    }).project({
      bankAccountNumber: 1,
      bank_account_number: 1,
      transactionDateObj: 1
    }).toArray()

    // Build map of IBAN -> oldest transaction date
    const ibanDateMap = new Map<string, Date>()
    
    for (const tx of existingTransactions) {
      const iban = (tx.bankAccountNumber || tx.bank_account_number || '')
        .toUpperCase().replace(/\s+/g, '')
      
      if (!iban) continue

      const txDate = tx.transactionDateObj
      const existing = ibanDateMap.get(iban)
      
      // Keep the oldest date
      if (!existing || (txDate && txDate < existing)) {
        ibanDateMap.set(iban, txDate)
      }
    }

    // Calculate days ago for each duplicate
    const now = new Date()
    const duplicates = Array.from(ibanDateMap.entries()).map(([iban, date]) => {
      const daysAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
      return { iban, daysAgo }
    })

    console.log(`[Validate IBANs] Checked ${normalizedIbans.length} IBANs, found ${duplicates.length} duplicates older than ${DAYS_THRESHOLD} days`)

    return NextResponse.json({ duplicates })
  } catch (error: any) {
    console.error('[Validate IBANs] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Validation failed' },
      { status: 500 }
    )
  }
}
