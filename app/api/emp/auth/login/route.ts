import { NextResponse } from 'next/server'
import { validateUserCredentials } from '@/lib/db/users'
import { createOTP } from '@/lib/db/otp'
import { generateBackupCodes, hashBackupCodes } from '@/lib/auth/backup-codes'
import { getCollection } from '@/lib/db/users'
import { User } from '@/lib/types/auth'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Step 1: Validate credentials
    const user = await validateUserCredentials(email, password)

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const userId = user._id!.toString()

    // Step 2: Check if user needs 2FA setup
    if (user.twoFactorSetupRequired) {
      // Generate backup codes for first-time setup
      const backupCodes = generateBackupCodes(10)
      const hashedCodes = await hashBackupCodes(backupCodes)

      // Store hashed backup codes in database
      const usersCol = await getCollection<User>('users')
      await usersCol.updateOne(
        { _id: user._id },
        {
          $set: {
            twoFactorBackupCodes: hashedCodes,
            updatedAt: new Date()
          }
        }
      )

      return NextResponse.json({
        status: 'setup_required',
        userId,
        userName: user.name,
        backupCodes, // Send unhashed codes to user
      })
    }

    // Step 3: Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Generate and send OTP
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
        status: 'otp_required',
        userId,
        userName: user.name,
      })
    }

    // Step 4: Legacy users without 2FA fields - auto-initialize and trigger setup
    // This handles existing users who don't have 2FA enabled yet
    const usersCol = await getCollection<User>('users')
    await usersCol.updateOne(
      { _id: user._id },
      {
        $set: {
          twoFactorEnabled: false,
          twoFactorSetupRequired: true,
          twoFactorBackupCodes: [],
          updatedAt: new Date()
        }
      }
    )

    // Generate backup codes for setup
    const backupCodes = generateBackupCodes(10)
    const hashedCodes = await hashBackupCodes(backupCodes)

    // Store hashed backup codes
    await usersCol.updateOne(
      { _id: user._id },
      {
        $set: {
          twoFactorBackupCodes: hashedCodes,
          updatedAt: new Date()
        }
      }
    )

    return NextResponse.json({
      status: 'setup_required',
      userId,
      userName: user.name,
      backupCodes, // Send unhashed codes to user
    })

  } catch (err: any) {
    console.error('Login error:', err)
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}


