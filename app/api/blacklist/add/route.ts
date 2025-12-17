import { NextRequest, NextResponse } from 'next/server'
import { addToBlacklist } from '@/lib/blacklist'
import { requireWriteAccess } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/blacklist/add
 * Manually add an IBAN to the blacklist
 */
export async function POST(request: NextRequest) {
  try {
    await requireWriteAccess()

    const { iban, name, email, reason, chargebackCode } = await request.json()

    if (!iban) {
      return NextResponse.json({ error: 'IBAN is required' }, { status: 400 })
    }

    const added = await addToBlacklist({
      iban,
      ibanMasked: maskIban(iban),
      name: name || undefined,
      email: email || undefined,
      reason: reason || (chargebackCode ? `Chargeback ${chargebackCode}` : 'Manual blacklist'),
      createdAt: new Date(),
      createdBy: 'manual'
    })

    if (added) {
      return NextResponse.json({
        success: true,
        message: 'IBAN successfully blacklisted',
        iban: maskIban(iban)
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'IBAN already blacklisted',
        iban: maskIban(iban)
      }, { status: 409 })
    }
  } catch (error: any) {
    console.error('[Add Blacklist] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add to blacklist' },
      { status: 500 }
    )
  }
}

function maskIban(iban: string): string {
  if (!iban || iban.length < 8) return iban
  const normalized = iban.replace(/\s/g, '')
  return normalized.substring(0, 4) + '****' + normalized.substring(normalized.length - 4)
}
