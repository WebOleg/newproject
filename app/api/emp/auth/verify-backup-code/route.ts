import { NextResponse } from 'next/server'
import { verifyBackupCode } from '@/lib/auth/backup-codes'
import { findUserById, createSession, findAgencyById, findAccountById, getCollection } from '@/lib/db/users'
import { User } from '@/lib/types/auth'

export async function POST(req: Request) {
  try {
    const { userId, code } = await req.json()

    if (!userId || !code) {
      return NextResponse.json(
        { error: 'User ID and backup code are required' },
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

    // Verify backup code
    const backupCodes = user.twoFactorBackupCodes || []
    const matchIndex = await verifyBackupCode(code, backupCodes)

    if (matchIndex === -1) {
      return NextResponse.json(
        { error: 'Invalid backup code' },
        { status: 401 }
      )
    }

    // Remove used backup code (single-use)
    const updatedCodes = backupCodes.filter((_, index) => index !== matchIndex)

    const usersCol = await getCollection<User>('users')
    await usersCol.updateOne(
      { _id: user._id },
      {
        $set: {
          twoFactorBackupCodes: updatedCodes,
          updatedAt: new Date()
        }
      }
    )

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
      },
      backupCodesRemaining: updatedCodes.length,
      warning: updatedCodes.length <= 3
        ? 'You have few backup codes remaining. Consider generating new ones.'
        : undefined
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
    console.error('Backup code verification error:', err)
    return NextResponse.json(
      { error: err?.message || 'Server error' },
      { status: 500 }
    )
  }
}
