/**
 * CSV Row Validation
 * Flexible validation supporting multiple column naming conventions
 */
import { getFieldValue, getFullAddress, getFullName, getCountry } from './field-aliases'

// Invalid characters in names (numbers, special symbols, accented characters)
const INVALID_NAME_PATTERN = /[0-9*#@$%^&+=\[\]{}|\\<>àâäçèéêëîïôöùûüÿñÀÂÄÇÈÉÊËÎÏÔÖÙÛÜŸÑ]/

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
 * Normalize IBAN for comparison (uppercase, no spaces)
 */
export function normalizeIban(iban: string | undefined): string {
  if (!iban) return ''
  return iban.toUpperCase().replace(/\s+/g, '')
}

/**
 * Check for common encoding issues (mojibake)
 * Detects broken UTF-8 in any text field
 */
function hasEncodingIssue(value: string | undefined): boolean {
  if (!value) return false
  
  // Check for common mojibake patterns (broken UTF-8)
  const mojibakePatterns = [
    /Ã/,               // Ã anywhere (e.g., García -> GarcÃ)
    /Â/,               // Â anywhere
    /ï¿½/,             // Common replacement (�)
    /â€/,              // Quote marks broken
    /Ëœ/,              // Tilde broken
    /[\uFFFD]/,        // Unicode replacement character
    /Ã‚/,              // Â broken
    /Ã„/,              // Ä broken
    /¿½/,              // Partial replacement
    /Â½/,              // ½ broken
    /Â¿/,              // ¿ broken
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

export function validateRequiredFields(row: Record<string, any>, options?: { skipAddressValidation?: boolean }): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const skipAddress = options?.skipAddressValidation ?? false

  // Address - skip if disabled
  if (!skipAddress) {
    const address = getFullAddress(row)
    if (!address) {
      errors.push('Address is required')
    } else if (isPlaceholder(address)) {
      errors.push('Address contains placeholder value (unknown)')
    } else if (hasEncodingIssue(address)) {
      errors.push('Address contains encoding issues (broken characters)')
    }
  }

  // Postal Code - skip if disabled
  if (!skipAddress) {
    const postalCode = getFieldValue(row, 'postalCode')
    if (!postalCode) {
      errors.push('Postal Code is required')
    } else if (isInvalidZip(postalCode)) {
      errors.push('Postal Code is invalid (00000)')
    } else if (isPlaceholder(postalCode)) {
      errors.push('Postal Code contains placeholder value')
    }
  }

  // City - skip if disabled
  if (!skipAddress) {
    const city = getFieldValue(row, 'city')
    if (!city) {
      errors.push('City is required')
    } else if (isPlaceholder(city)) {
      errors.push('City contains placeholder value')
    } else if (hasEncodingIssue(city)) {
      errors.push('City contains encoding issues (broken characters)')
    }
  }

  // Country - from column or IBAN fallback
  const country = getCountry(row)
  if (!country) {
    errors.push('Country is required (not found in columns or IBAN)')
  }

  return { valid: errors.length === 0, errors }
}

export function validateRow(row: Record<string, any>, options?: { skipAddressValidation?: boolean }): { valid: boolean; errors: string[] } {
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
  const fieldsResult = validateRequiredFields(row, options)
  errors.push(...fieldsResult.errors)

  return { valid: errors.length === 0, errors }
}

/**
 * Find duplicate IBANs within the same file
 * Returns map of normalized IBAN -> array of row indexes where it appears
 */
function findDuplicateIbans(rows: Record<string, any>[]): Map<string, number[]> {
  const ibanOccurrences = new Map<string, number[]>()
  
  rows.forEach((row, index) => {
    const iban = normalizeIban(getFieldValue(row, 'iban'))
    if (iban) {
      const existing = ibanOccurrences.get(iban) || []
      existing.push(index)
      ibanOccurrences.set(iban, existing)
    }
  })
  
  return ibanOccurrences
}

export function validateRows(rows: Record<string, any>[], options?: { skipAddressValidation?: boolean }): {
  valid: boolean
  invalidRows: { index: number; errors: string[] }[]
  summary: string
} {
  const invalidRows: { index: number; errors: string[] }[] = []

  // Step 1: Find duplicate IBANs
  const ibanOccurrences = findDuplicateIbans(rows)
  const duplicateIbanErrors = new Map<number, string>()

  ibanOccurrences.forEach((indexes, iban) => {
    if (indexes.length > 1) {
      // First occurrence is valid, mark others as duplicates
      const firstRowNum = indexes[0] + 1 // 1-based for display
      indexes.slice(1).forEach(idx => {
        duplicateIbanErrors.set(idx, `Duplicate IBAN in file (first seen at row ${firstRowNum})`)
      })
    }
  })

  // Step 2: Validate each row
  rows.forEach((row, index) => {
    const rowErrors: string[] = []

    // Check for duplicate IBAN first
    const duplicateError = duplicateIbanErrors.get(index)
    if (duplicateError) {
      rowErrors.push(duplicateError)
    }

    // Run standard validation
    const result = validateRow(row, options)
    if (!result.valid) {
      rowErrors.push(...result.errors)
    }

    if (rowErrors.length > 0) {
      invalidRows.push({ index, errors: rowErrors })
    }
  })

  const valid = invalidRows.length === 0
  const summary = valid
    ? 'All rows valid'
    : `${invalidRows.length} row(s) have validation errors`

  return { valid, invalidRows, summary }
}
