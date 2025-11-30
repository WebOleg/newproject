import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// IMPORTANT: change to nodejs for SMTP (nodemailer)
export const runtime = 'nodejs'

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
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT ?? 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM || user

  console.log('SMTP config (masked):', {
    host,
    port,
    user,
    from,
  })

  if (!host || !user || !pass) {
    console.error('SMTP not fully configured')
    console.log('OTP for', to, 'is', code)
    throw new Error('SMTP not fully configured')
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // Aruba: 465 -> SSL, 587 -> STARTTLS
    auth: { user, pass },
  })

  try {
    // Verify the connection & auth
    await transporter.verify()
    console.log('SMTP connection verified')

    const info = await transporter.sendMail({
      from,
      to,
      subject: 'Your MeLinux admin login code',
      text: `Your one-time login code is: ${code}\n\nIt expires in 5 minutes.`,
    })

    console.log('OTP email sent:', info.messageId, info.accepted, info.rejected)
  } catch (err) {
    console.error('Error sending OTP email:', err)
    console.log('OTP for', to, 'is', code)
    throw err
  }
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

    // 3) Send OTP via email (or log if SMTP incomplete)
    await sendOtpEmail(adminEmail, otp)

    // 4) Tell client to ask for OTP next
    return NextResponse.json({
      ok: true,
      step: 'otp_required',
      tempToken,
      // Optional helper while developing – comment out in prod if you want
      debugOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    })
  } catch (err: any) {
    console.error('Login error:', err)
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
