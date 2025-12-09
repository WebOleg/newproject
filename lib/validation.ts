const INVALID_CHAR_PATTERN = /[\uFFFD\u00EF\u00BF\u00BD]/
const INVALID_NAME_PATTERN = /[0-9*#@$%^&+=\[\]{}|\\<>]/

export function validateAmount(amount: number | string | undefined): { valid: boolean; error?: string } {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (num === undefined || num === null || isNaN(num as number)) {
    return { valid: false, error: 'Amount is missing or invalid' }
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
    return { valid: false, error: 'Name contains invalid characters (numbers or symbols)' }
  }
  
  return { valid: true }
}

export function validateRequiredFields(row: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  const requiredFields = [
    { key: 'address', label: 'Address' },
    { key: 'postalCode', label: 'Postal Code' },
    { key: 'city', label: 'City' },
    { key: 'country', label: 'Country' },
  ]
  
  for (const field of requiredFields) {
    const value = row[field.key] || row[field.label] || row[field.key.toLowerCase()]
    if (!value || value.trim() === '') {
      errors.push(`${field.label} is required`)
    }
  }
  
  return { valid: errors.length === 0, errors }
}

export function validateRow(row: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  const amountResult = validateAmount(row.amount || row.Amount)
  if (!amountResult.valid && amountResult.error) {
    errors.push(amountResult.error)
  }
  
  const firstName = row.firstName || row.first_name || row['First Name'] || ''
  const lastName = row.lastName || row.last_name || row['Last Name'] || row.Name || ''
  const fullName = `${firstName} ${lastName}`.trim()
  
  const nameResult = validateName(fullName)
  if (!nameResult.valid && nameResult.error) {
    errors.push(nameResult.error)
  }
  
  const fieldsResult = validateRequiredFields(row)
  errors.push(...fieldsResult.errors)
  
  return { valid: errors.length === 0, errors }
}

export function validateRows(rows: any[]): { 
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
