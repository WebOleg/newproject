// app/api/emp/auth/verify-otp/route.ts
import { NextResponse } from 'next/server'

export const runtime = 'edge'

const enc = new TextEncoder()

async function hmacSHA256(secret: string, data: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
}

export async function POST(req: Request) {
  try {
    const { code, tempToken } = await req.json()

    if (!code || !tempToken) {
      return NextResponse.json({ error: 'Missing code or token' }, { status: 400 })
    }

    const secret = process.env.EMP_SESSION_SECRET || 'dev-secret'

    // Decode tempToken: username.ts.otpSig
    let decoded: string
    try {
      decoded = atob(tempToken)
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    const parts = decoded.split('.')
    if (parts.length !== 3) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    const [username, ts, storedOtpSig] = parts

    const issuedAt = Number(ts)
    const now = Date.now()

    // 5 min expiry window
    if (!issuedAt || Number.isNaN(issuedAt) || now - issuedAt > 5 * 60 * 1000) {
      return NextResponse.json({ error: 'OTP expired' }, { status: 400 })
    }

    // Recompute HMAC over "code.ts" and compare with stored signature
    const expectedSig = await hmacSHA256(secret, `${code}.${ts}`)
    if (expectedSig !== storedOtpSig) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 401 })
    }

    // OTP is valid -> issue final session cookie
    const sessionTs = Date.now().toString()
    const sessionSig = await hmacSHA256(secret, `${username}.${sessionTs}`)
    const value = `${username}.${sessionTs}.${sessionSig}`

    const res = NextResponse.json({ ok: true })
    res.cookies.set('emp_session', value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    })

    return res
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
