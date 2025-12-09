/**
 * CSV Row Validation
 * Flexible validation supporting multiple column naming conventions
 */
import { getFieldValue, getFullAddress, getFullName, getCountry } from './field-aliases'

// Invalid characters in names (numbers, special symbols)
const INVALID_NAME_PATTERN = /[0-9*#@$%^&+=\[\]{}|\\<>]/

// Placeholder values that indicate missing/invalid data
const PLACEHOLDER_VALUES = [
  'unknown',
  'unknown street',
  'n/a',
  'na',
  'none',
  'null',
  '-',
  '.',
]

const INVALID_ZIP_CODES = [
  '00000',
  '0000',
  '000000',
  '99999',
]

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return false
  return PLACEHOLDER_VALUES.includes(value.toLowerCase().trim())
}

function isInvalidZip(zip: string | undefined): boolean {
  if (!zip) return false
  return INVALID_ZIP_CODES.includes(zip.trim())
}

/**
 * Check for common encoding issues (mojibake)
 * Uses whitelist approach - only allow valid name characters
 */
function hasEncodingIssue(value: string | undefined): boolean {
  if (!value) return false
  
  // Allowed characters in names:
  // - Letters (including accented: áéíóúñüöäàèìòù etc.)
  // - Spaces, hyphens, apostrophes
  // - Dots (for initials like "J. Smith")
  
  // Check for common mojibake patterns (broken UTF-8)
  const mojibakePatterns = [
    /Ã[^\s]/,          // Ã followed by anything (Ã±, Ã', Ã¡, etc.)
    /Â[^\s]/,          // Â followed by anything
    /Ã‚/,              // Common pattern
    /Ã„/,              // Common pattern
    /Ã'/,              // Ñ broken
    /Ã±/,              // ñ broken
    /Ã©/,              // é broken
    /Ã¡/,              // á broken
    /Ã­/,              // í broken
    /Ã³/,              // ó broken
    /Ãº/,              // ú broken
    /â€/,              // Quote marks broken
    /Ã¼/,              // ü broken
    /Ã¶/,              // ö broken
    /Ã¤/,              // ä broken
    /[\uFFFD]/,        // Replacement character
    /ï¿½/,             // Common mojibake
    /Ëœ/,              // Tilde broken
    /â€™/,             // Apostrophe broken
    /â€"/,             // Dash broken
  ]
  
  return mojibakePatterns.some(pattern => pattern.test(value))
}

export function validateAmount(amount: string | undefined): { valid: boolean; error?: string } {
  if (!amount) {
    return { valid: false, error: 'Amount is required' }
  }
  
  const num = parseFloat(amount)
  
  if (isNaN(num)) {
    return { valid: false, error: 'Amount is not a valid number' }
  }
  
  if (num <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' }
  }
  
  return { valid: true }
}

export function validateName(name: string | undefined): { valid: boolean; error?: string } {
  if (!name || name.trim() === '') {
    return { valid: false, error: 'Name is required' }
  }
  
  if (isPlaceholder(name)) {
    return { valid: false, error: 'Name contains placeholder value' }
  }
  
  if (hasEncodingIssue(name)) {
    return { valid: false, error: 'Name contains encoding issues (broken characters)' }
  }
  
  if (INVALID_NAME_PATTERN.test(name)) {
    return { valid: false, error: 'Name contains numbers or symbols' }
  }
  
  return { valid: true }
}

export function validateRequiredFields(row: Record<string, any>): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Address
  const address = getFullAddress(row)
  if (!address) {
    errors.push('Address is required')
  } else if (isPlaceholder(address)) {
    errors.push('Address contains placeholder value (unknown)')
  }
  
  // Postal Code
  const postalCode = getFieldValue(row, 'postalCode')
  if (!postalCode) {
    errors.push('Postal Code is required')
  } else if (isInvalidZip(postalCode)) {
    errors.push('Postal Code is invalid (00000)')
  } else if (isPlaceholder(postalCode)) {
    errors.push('Postal Code contains placeholder value')
  }
  
  // City
  const city = getFieldValue(row, 'city')
  if (!city) {
    errors.push('City is required')
  } else if (isPlaceholder(city)) {
    errors.push('City contains placeholder value')
  }
  
  // Country - from column or IBAN fallback
  const country = getCountry(row)
  if (!country) {
    errors.push('Country is required (not found in columns or IBAN)')
  }
  
  return { valid: errors.length === 0, errors }
}

export function validateRow(row: Record<string, any>): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Validate amount
  const amount = getFieldValue(row, 'amount')
  const amountResult = validateAmount(amount)
  if (!amountResult.valid && amountResult.error) {
    errors.push(amountResult.error)
  }
  
  // Validate name
  const name = getFullName(row)
  const nameResult = validateName(name)
  if (!nameResult.valid && nameResult.error) {
    errors.push(nameResult.error)
  }
  
  // Validate required fields
  const fieldsResult = validateRequiredFields(row)
  errors.push(...fieldsResult.errors)
  
  return { valid: errors.length === 0, errors }
}

export function validateRows(rows: Record<string, any>[]): { 
  valid: boolean
  invalidRows: { index: number; errors: string[] }[]
  summary: string
} {
  const invalidRows: { index: number; errors: string[] }[] = []
  
  rows.forEach((row, index) => {
    const result = validateRow(row)
    if (!result.valid) {
      invalidRows.push({ index, errors: result.errors })
    }
  })
  
  const valid = invalidRows.length === 0
  const summary = valid 
    ? 'All rows valid'
    : `${invalidRows.length} row(s) have validation errors`
  
  return { valid, invalidRows, summary }
}
