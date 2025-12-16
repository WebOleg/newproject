import { NextResponse } from 'next/server'
import { createOTP } from '@/lib/db/otp'
import { findUserById } from '@/lib/db/users'

export async function POST(req: Request) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get user
    const user = await findUserById(userId)

    if (!user || user.status !== 'active') {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 404 }
      )
    }

    // Generate and send new OTP
    const userAgent = req.headers.get('user-agent') || undefined
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined

    const result = await createOTP(
      userId,
      user.name,
      user.email,
      'login',
      userAgent,
      ip
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send verification code' },
        { status: 429 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: 'Verification code sent successfully'
    })

  } catch (err: any) {
    console.error('OTP resend error:', err)
    return NextResponse.json(
      { error: err?.message || 'Server error' },
      { status: 500 }
    )
  }
}
