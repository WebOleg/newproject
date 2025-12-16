import bcrypt from 'bcryptjs'

const BCRYPT_SALT_ROUNDS = 12

// Characters to use in backup codes (excluding ambiguous characters like 0, O, I, 1)
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const DIGITS = '23456789'

/**
 * Generate a single backup code in format XXXX-XXXX
 */
function generateSingleCode(): string {
  let code = ''

  // First 4 characters (letters)
  for (let i = 0; i < 4; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length))
  }

  code += '-'

  // Last 4 characters (digits)
  for (let i = 0; i < 4; i++) {
    code += DIGITS.charAt(Math.floor(Math.random() * DIGITS.length))
  }

  return code
}

/**
 * Generate multiple backup codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []
  const codeSet = new Set<string>()

  // Generate unique codes
  while (codeSet.size < count) {
    const code = generateSingleCode()
    if (!codeSet.has(code)) {
      codeSet.add(code)
      codes.push(code)
    }
  }

  return codes
}

/**
 * Hash backup codes for storage
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  const hashedCodes = await Promise.all(
    codes.map(code => bcrypt.hash(code.toUpperCase(), BCRYPT_SALT_ROUNDS))
  )
  return hashedCodes
}

/**
 * Verify a backup code against hashed codes
 * Returns the index of the matched code, or -1 if not found
 */
export async function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): Promise<number> {
  const normalizedCode = code.toUpperCase().trim()

  for (let i = 0; i < hashedCodes.length; i++) {
    const isMatch = await bcrypt.compare(normalizedCode, hashedCodes[i])
    if (isMatch) {
      return i
    }
  }

  return -1
}

/**
 * Format codes for display (ensure proper formatting)
 */
export function formatBackupCode(code: string): string {
  // Remove any existing hyphens and spaces
  const cleaned = code.replace(/[-\s]/g, '').toUpperCase()

  // Add hyphen after 4th character
  if (cleaned.length >= 4) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}`
  }

  return cleaned
}
