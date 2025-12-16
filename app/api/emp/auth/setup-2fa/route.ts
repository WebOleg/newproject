import { NextResponse } from 'next/server'
import { findUserById, getCollection } from '@/lib/db/users'
import { User } from '@/lib/types/auth'
import { sendBackupCodesEmail } from '@/lib/services/email'

export async function POST(req: Request) {
  try {
    const { userId, backupCodesAcknowledged } = await req.json()

    if (!userId || !backupCodesAcknowledged) {
      return NextResponse.json(
        { error: 'User ID and backup codes acknowledgment are required' },
        { status: 400 }
      )
    }

    // Get user
    const user = await findUserById(userId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user to mark 2FA as enabled
    const usersCol = await getCollection<User>('users')
    await usersCol.updateOne(
      { _id: user._id },
      {
        $set: {
          twoFactorEnabled: true,
          twoFactorSetupRequired: false,
          updatedAt: new Date()
        }
      }
    )

    // Optionally send backup codes via email for user's records
    // We'll send them but don't fail if email fails
    if (user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0) {
      try {
        // Note: We can't send the actual codes since they're hashed
        // This is just a notification that 2FA is enabled
        // In production, you might want to store unhashed codes temporarily
        // or send them only during initial display
        // For now, we'll skip sending them via email
      } catch (error) {
        console.error('Failed to send backup codes email:', error)
        // Don't fail the setup if email fails
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'Two-factor authentication enabled successfully'
    })

  } catch (err: any) {
    console.error('2FA setup error:', err)
    return NextResponse.json(
      { error: err?.message || 'Server error' },
      { status: 500 }
    )
  }
}
