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
  return Buffer.from(new Uint8Array(sig)).toString('base64')
}

async function sendOtpEmail(to: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM || 'MeLinux Admin <onboarding@resend.dev>'

  if (!apiKey) {
    console.error('Resend missing API key, output OTP to console')
    console.log('OTP for', to, 'is', code)
    return
  }

  console.log('[Resend] Sending OTP', { to, from })

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: 'Your MeLinux admin login code',
      text: `Your one-time login code is: ${code}\n\nThis code expires in 5 minutes.`,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('[Resend ERROR]', res.status, body)
    console.log('OTP fallback (not sent):', code)
    throw new Error('Failed to send OTP email')
  }

  console.log('[Resend] OTP email sent successfully')
}

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()

    const configuredUser = process.env.EMP_ADMIN_USER || 'admin'
    const configuredPass = process.env.EMP_ADMIN_PASS || 'admin'

    if (username !== configuredUser || password !== configuredPass) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const adminEmail = process.env.EMP_ADMIN_EMAIL
    if (!adminEmail) {
      return NextResponse.json({ error: '2FA not configured' }, { status: 500 })
    }

    // 1) Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // 2) Build a short-lived "temp token" (stateless)
    const secret = process.env.EMP_SESSION_SECRET || 'dev-secret'
    const ts = Date.now().toString()
    const otpSig = await hmacSHA256(secret, otp + '.' + ts)
    const raw = `${username}.${ts}.${otpSig}`
    const tempToken = Buffer.from(raw).toString('base64')

    // 3) Send OTP via email
    await sendOtpEmail(adminEmail, otp)

    // 4) Tell client to ask for OTP next
    return NextResponse.json({
      ok: true,
      step: 'otp_required',
      tempToken,
      debugOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    })
  } catch (err: any) {
    console.error('Login error:', err)
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
