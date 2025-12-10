import { NextRequest, NextResponse } from 'next/server'
import { getBlacklistedIbans } from '@/lib/blacklist'

export async function POST(request: NextRequest) {
  try {
    const { ibans } = await request.json()
    
    if (!ibans || !Array.isArray(ibans)) {
      return NextResponse.json({ error: 'ibans array required' }, { status: 400 })
    }
    
    const blacklisted = await getBlacklistedIbans(ibans)
    
    return NextResponse.json({
      blacklistedIbans: Array.from(blacklisted),
      count: blacklisted.size
    })
  } catch (error: any) {
    console.error('Blacklist check error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
