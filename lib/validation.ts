/**
 * CSV Row Validation
 * Flexible validation supporting multiple column naming conventions
 */

import { getFieldValue, getFullAddress, getFullName, getCountry } from './field-aliases'

const INVALID_CHAR_PATTERN = /[\uFFFD\u00EF\u00BF\u00BD]/
const INVALID_NAME_PATTERN = /[0-9*#@$%^&+=\[\]{}|\\<>]/

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
  
  if (INVALID_CHAR_PATTERN.test(name)) {
    return { valid: false, error: 'Name contains invalid characters (encoding issue)' }
  }
  
  if (INVALID_NAME_PATTERN.test(name)) {
    return { valid: false, error: 'Name contains numbers or symbols' }
  }
  
  return { valid: true }
}

export function validateRequiredFields(row: Record<string, any>): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Address: can be single field or combined from parts
  const address = getFullAddress(row)
  if (!address) {
    errors.push('Address is required')
  }
  
  // Postal Code
  const postalCode = getFieldValue(row, 'postalCode')
  if (!postalCode) {
    errors.push('Postal Code is required')
  }
  
  // City
  const city = getFieldValue(row, 'city')
  if (!city) {
    errors.push('City is required')
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
