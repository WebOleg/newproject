import { NextResponse } from 'next/server'
import { verifyOTP } from '@/lib/db/otp'
import { findUserById, createSession, findAgencyById, findAccountById } from '@/lib/db/users'

export async function POST(req: Request) {
  try {
    const { userId, code } = await req.json()

    if (!userId || !code) {
      return NextResponse.json(
        { error: 'User ID and verification code are required' },
        { status: 400 }
      )
    }

    // Verify OTP
    const result = await verifyOTP(userId, code)

    if (!result.valid) {
      return NextResponse.json(
        {
          error: result.error || 'Invalid verification code',
          attemptsRemaining: result.attemptsRemaining
        },
        { status: 401 }
      )
    }

    // OTP is valid - get user and create session
    const user = await findUserById(userId)

    if (!user || user.status !== 'active') {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 404 }
      )
    }

    // Create session
    const userAgent = req.headers.get('user-agent') || undefined
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined
    const token = await createSession(userId, userAgent, ip)

    // Get agency and account names
    let agencyName: string | undefined
    let accountName: string | undefined

    if (user.agencyId) {
      const agency = await findAgencyById(user.agencyId.toString())
      agencyName = agency?.name
    }

    if (user.accountId) {
      const account = await findAccountById(user.accountId.toString())
      accountName = account?.name
    }

    // Set session cookie
    const res = NextResponse.json({
      ok: true,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        agencyName,
        accountName,
      }
    })

    res.cookies.set('emp_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    })

    return res

  } catch (err: any) {
    console.error('OTP verification error:', err)
    return NextResponse.json(
      { error: err?.message || 'Server error' },
      { status: 500 }
    )
  }
}
