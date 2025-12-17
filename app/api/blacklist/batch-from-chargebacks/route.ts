import { NextRequest, NextResponse } from 'next/server'
import { getMongoClient, getDbName } from '@/lib/db'
import { addToBlacklist } from '@/lib/blacklist'
import { requireWriteAccess } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Codes that trigger automatic blacklisting
const BLACKLIST_TRIGGER_CODES = ['AC01', 'AC04']

/**
 * POST /api/blacklist/batch-from-chargebacks
 * Batch process all AC01/AC04 chargebacks and blacklist their IBANs
 */
export async function POST(request: NextRequest) {
  try {
    await requireWriteAccess()

    const client = await getMongoClient()
    const db = client.db(getDbName())
    const cbColl = db.collection('emp_chargebacks')
    const txColl = db.collection('emp_reconcile_transactions')

    // Find all chargebacks with blacklist trigger codes
    const chargebacks = await cbColl.aggregate([
      {
        $match: {
          reasonCode: { $in: BLACKLIST_TRIGGER_CODES }
        }
      },
      {
        $lookup: {
          from: 'emp_reconcile_transactions',
          localField: 'originalTransactionUniqueId',
          foreignField: 'uniqueId',
          as: 'originalTransaction'
        }
      },
      {
        $addFields: {
          iban: {
            $ifNull: [
              { $arrayElemAt: ['$originalTransaction.bankAccountNumber', 0] },
              null
            ]
          },
          customerName: {
            $ifNull: [
              { $arrayElemAt: ['$originalTransaction.customerName', 0] },
              null
            ]
          },
          customerEmail: {
            $ifNull: [
              { $arrayElemAt: ['$originalTransaction.customerEmail', 0] },
              null
            ]
          }
        }
      },
      {
        $match: {
          iban: { $ne: null, $ne: '' }
        }
      }
    ]).toArray()

    const results = {
      processed: 0,
      added: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[]
    }

    // Process each chargeback
    for (const cb of chargebacks) {
      results.processed++

      try {
        const added = await addToBlacklist({
          iban: cb.iban,
          ibanMasked: maskIban(cb.iban),
          name: cb.customerName || undefined,
          email: cb.customerEmail || undefined,
          reason: `Chargeback ${cb.reasonCode}: ${getReasonDescription(cb.reasonCode)}`,
          createdAt: new Date(),
          createdBy: 'system-auto-blacklist'
        })

        if (added) {
          results.added++
          results.details.push({
            iban: maskIban(cb.iban),
            reasonCode: cb.reasonCode,
            status: 'added'
          })
        } else {
          results.skipped++
          results.details.push({
            iban: maskIban(cb.iban),
            reasonCode: cb.reasonCode,
            status: 'already_blacklisted'
          })
        }
      } catch (error: any) {
        results.errors++
        results.details.push({
          iban: maskIban(cb.iban),
          reasonCode: cb.reasonCode,
          status: 'error',
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      ...results
    })
  } catch (error: any) {
    console.error('[Batch Blacklist] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Batch blacklist failed' },
      { status: 500 }
    )
  }
}

function maskIban(iban: string): string {
  if (!iban || iban.length < 8) return iban
  const normalized = iban.replace(/\s/g, '')
  return normalized.substring(0, 4) + '****' + normalized.substring(normalized.length - 4)
}

function getReasonDescription(code: string): string {
  const descriptions: Record<string, string> = {
    'AC01': 'Invalid/Incorrect Account Identifier',
    'AC04': 'Account Closed'
  }
  return descriptions[code] || code
}
