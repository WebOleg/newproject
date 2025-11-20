import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()
    const configuredUser = process.env.EMP_ADMIN_USER || 'admin'
    const configuredPass = process.env.EMP_ADMIN_PASS || 'admin'
    if (username !== configuredUser || password !== configuredPass) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const secret = process.env.EMP_SESSION_SECRET || 'dev-secret'
    const ts = Date.now().toString()
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const data = `${username}.${ts}`
    const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data))
    const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    const value = `${username}.${ts}.${sig}`

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


