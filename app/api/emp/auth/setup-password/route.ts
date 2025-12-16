import { NextResponse } from 'next/server'
import { getCollection, hashPassword } from '@/lib/db/users'
import { User } from '@/lib/types/auth'

/**
 * GET - Validate password setup token
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required', valid: false },
        { status: 400 }
      )
    }

    // Find user with this token
    const usersCol = await getCollection<User>('users')
    const user = await usersCol.findOne({
      passwordSetupToken: token,
      passwordSetupTokenExpiry: { $gt: new Date() }, // Not expired
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token', valid: false },
        { status: 404 }
      )
    }

    return NextResponse.json({
      valid: true,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      }
    })

  } catch (err: any) {
    console.error('Token validation error:', err)
    return NextResponse.json(
      { error: err?.message || 'Server error', valid: false },
      { status: 500 }
    )
  }
}

/**
 * POST - Set password for invited user
 */
export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 12) {
      return NextResponse.json(
        { error: 'Password must be at least 12 characters long' },
        { status: 400 }
      )
    }

    // Find user with this token
    const usersCol = await getCollection<User>('users')
    const user = await usersCol.findOne({
      passwordSetupToken: token,
      passwordSetupTokenExpiry: { $gt: new Date() }, // Not expired
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 404 }
      )
    }

    // Hash password and update user
    const passwordHash = await hashPassword(password)

    await usersCol.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordHash,
          status: 'active',
          updatedAt: new Date()
        },
        $unset: {
          passwordSetupToken: '',
          passwordSetupTokenExpiry: ''
        }
      }
    )

    return NextResponse.json({
      ok: true,
      message: 'Password set successfully'
    })

  } catch (err: any) {
    console.error('Password setup error:', err)
    return NextResponse.json(
      { error: err?.message || 'Server error' },
      { status: 500 }
    )
  }
}
