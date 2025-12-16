import { ObjectId } from 'mongodb'
import { getCollection } from './users'
import { OTPCode } from '../types/auth'
import { sendOTPEmail } from '../services/email'
import bcrypt from 'bcryptjs'
import { withDbErrorHandling } from '../db'

const OTP_COLLECTION = 'otpCodes'
const BCRYPT_SALT_ROUNDS = 12
const OTP_EXPIRY_MINUTES = 5
const MAX_OTP_ATTEMPTS = 3
const RATE_LIMIT_WINDOW_MINUTES = 15
const MAX_OTP_REQUESTS = 5

/**
 * Generate a 6-digit OTP code
 */
function generateOTPCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  return code
}

/**
 * Check rate limit for OTP requests
 */
async function checkRateLimit(userId: string): Promise<boolean> {
  const col = await getCollection<OTPCode>(OTP_COLLECTION)
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000)

  const recentOTPs = await col.countDocuments({
    userId: new ObjectId(userId),
    createdAt: { $gte: windowStart }
  })

  return recentOTPs < MAX_OTP_REQUESTS
}

/**
 * Create and send OTP code
 */
export async function createOTP(
  userId: string,
  userName: string,
  userEmail: string,
  purpose: 'login' | 'recovery' = 'login',
  userAgent?: string,
  ip?: string
): Promise<{ success: boolean; error?: string }> {
  return withDbErrorHandling(async () => {
    // Check rate limit
    const withinLimit = await checkRateLimit(userId)
    if (!withinLimit) {
      return {
        success: false,
        error: 'Too many OTP requests. Please try again in 15 minutes.'
      }
    }

    // Invalidate any existing OTPs for this user
    const col = await getCollection<OTPCode>(OTP_COLLECTION)
    await col.deleteMany({ userId: new ObjectId(userId), purpose })

    // Generate and hash OTP
    const code = generateOTPCode()
    const hashedCode = await bcrypt.hash(code, BCRYPT_SALT_ROUNDS)

    // Create OTP record
    const otp: OTPCode = {
      userId: new ObjectId(userId),
      code: hashedCode,
      purpose,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      attempts: 0,
      createdAt: new Date(),
      userAgent,
      ip
    }

    await col.insertOne(otp)

    // Send OTP email
    try {
      await sendOTPEmail(userEmail, userName, code)
      return { success: true }
    } catch (error) {
      console.error('Failed to send OTP email:', error)
      // Delete the OTP if email fails
      await col.deleteOne({ _id: otp._id })
      return {
        success: false,
        error: 'Failed to send verification code. Please try again.'
      }
    }
  }, 'createOTP')
}

/**
 * Verify OTP code
 */
export async function verifyOTP(
  userId: string,
  code: string
): Promise<{ valid: boolean; error?: string; attemptsRemaining?: number }> {
  return withDbErrorHandling(async () => {
    const col = await getCollection<OTPCode>(OTP_COLLECTION)

    // Find active OTP
    const otp = await col.findOne({
      userId: new ObjectId(userId),
      purpose: 'login',
      expiresAt: { $gt: new Date() }
    })

    if (!otp) {
      return {
        valid: false,
        error: 'Verification code expired or not found. Please request a new code.'
      }
    }

    // Check if max attempts reached
    if (otp.attempts >= MAX_OTP_ATTEMPTS) {
      await col.deleteOne({ _id: otp._id })
      return {
        valid: false,
        error: 'Too many invalid attempts. Please request a new code.'
      }
    }

    // Verify code
    const isValid = await bcrypt.compare(code, otp.code)

    if (isValid) {
      // Delete OTP after successful verification
      await col.deleteOne({ _id: otp._id })
      return { valid: true }
    } else {
      // Increment attempts
      await col.updateOne(
        { _id: otp._id },
        { $inc: { attempts: 1 } }
      )

      const attemptsRemaining = MAX_OTP_ATTEMPTS - (otp.attempts + 1)

      if (attemptsRemaining <= 0) {
        await col.deleteOne({ _id: otp._id })
        return {
          valid: false,
          error: 'Too many invalid attempts. Please request a new code.'
        }
      }

      return {
        valid: false,
        error: `Invalid verification code. ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining.`,
        attemptsRemaining
      }
    }
  }, 'verifyOTP')
}

/**
 * Clean up expired OTPs
 */
export async function cleanExpiredOTPs(): Promise<number> {
  return withDbErrorHandling(async () => {
    const col = await getCollection<OTPCode>(OTP_COLLECTION)
    const result = await col.deleteMany({ expiresAt: { $lt: new Date() } })
    return result.deletedCount
  }, 'cleanExpiredOTPs')
}

/**
 * Invalidate all OTPs for a user (useful when password is changed, etc.)
 */
export async function invalidateUserOTPs(userId: string): Promise<boolean> {
  return withDbErrorHandling(async () => {
    const col = await getCollection<OTPCode>(OTP_COLLECTION)
    const result = await col.deleteMany({ userId: new ObjectId(userId) })
    return result.deletedCount > 0
  }, 'invalidateUserOTPs')
}
