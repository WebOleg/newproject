/**
 * Field Aliases Configuration
 * Maps logical field names to possible column names in CSV files
 */

export const FIELD_ALIASES: Record<string, string[]> = {
  // Address fields
  address: [
    'Address', 'address',
    'Street', 'street',
    'Street Address', 'street_address', 'streetAddress',
  ],
  
  streetNumber: [
    'Street Number', 'street_number', 'streetNumber',
    'House Number', 'house_number', 'houseNumber',
    'Number', 'number', 'No', 'no',
  ],
  
  floor: [
    'Floor', 'floor',
    'Level', 'level',
  ],
  
  door: [
    'Door', 'door',
  ],
  
  apartment: [
    'Apartment', 'apartment', 'Apratment',
    'Apt', 'apt',
    'Unit', 'unit',
    'Flat', 'flat',
  ],
  
  // Location fields
  postalCode: [
    'Postal Code', 'postal_code', 'postalCode',
    'Postcode', 'postcode',
    'ZIP', 'zip', 'Zip',
    'ZIP Code', 'zip_code', 'zipCode',
  ],
  
  city: [
    'City', 'city',
    'Town', 'town',
    'Locality', 'locality',
  ],
  
  country: [
    'Country', 'country',
    'Province', 'province',
    'State', 'state',
    'Region', 'region',
  ],
  
  // Personal fields - Full Name
  name: [
    'Name', 'name',
    'Full Name', 'full_name', 'fullName',
    'Customer Name', 'customer_name', 'customerName',
    'Debtor Name', 'debtor_name', 'debtorName',
    'Client Name', 'client_name', 'clientName',
  ],
  
  // Personal fields - Split Name
  firstName: [
    'First Name', 'first_name', 'firstName',
    'Given Name', 'given_name', 'givenName',
    'Forename', 'forename',
  ],
  
  lastName: [
    'Last Name', 'last_name', 'lastName',
    'Surname', 'surname',
    'Family Name', 'family_name', 'familyName',
  ],
  
  // Financial fields
  amount: [
    'Amount', 'amount',
    'Sum', 'sum',
    'Total', 'total',
    'Value', 'value',
    'Debt', 'debt',
    'Balance', 'balance',
  ],
  
  currency: [
    'Currency', 'currency',
    'Cur', 'cur',
  ],
  
  // Bank fields
  iban: [
    'IBAN', 'iban', 'Iban',
    'Account', 'account',
    'Bank Account', 'bank_account', 'bankAccount',
  ],
  
  bank: [
    'Bank', 'bank',
    'Bank Name', 'bank_name', 'bankName',
  ],
  
  bic: [
    'BIC', 'bic', 'Bic',
    'SWIFT', 'swift', 'Swift',
    'BIC/SWIFT', 'bic_swift',
  ],
  
  // Contact fields
  email: [
    'Email', 'email',
    'E-mail', 'e-mail',
    'Email Address', 'email_address', 'emailAddress',
  ],
  
  phone: [
    'Phone', 'phone',
    'Phone 1', 'phone_1', 'phone1',
    'Telephone', 'telephone',
    'Mobile', 'mobile',
    'Primary Phone', 'primary_phone', 'primaryPhone',
  ],
}

/**
 * Get field value from row using aliases
 */
export function getFieldValue(row: Record<string, any>, fieldName: string): string | undefined {
  const aliases = FIELD_ALIASES[fieldName] || [fieldName]
  
  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== null && String(row[alias]).trim() !== '') {
      return String(row[alias]).trim()
    }
  }
  
  return undefined
}

/**
 * Extract country code from IBAN (first 2 characters)
 */
export function getCountryFromIBAN(iban: string | undefined): string | undefined {
  if (!iban || iban.length < 2) return undefined
  const code = iban.substring(0, 2).toUpperCase()
  // Validate it's letters only
  if (/^[A-Z]{2}$/.test(code)) {
    return code
  }
  return undefined
}

/**
 * Get country - from column or fallback to IBAN
 */
export function getCountry(row: Record<string, any>): string | undefined {
  // First try country column
  const country = getFieldValue(row, 'country')
  if (country) return country
  
  // Fallback: extract from IBAN
  const iban = getFieldValue(row, 'iban')
  return getCountryFromIBAN(iban)
}

/**
 * Get full address by combining address parts
 */
export function getFullAddress(row: Record<string, any>): string {
  const street = getFieldValue(row, 'address')
  const streetNumber = getFieldValue(row, 'streetNumber')
  const floor = getFieldValue(row, 'floor')
  const door = getFieldValue(row, 'door')
  const apartment = getFieldValue(row, 'apartment')
  
  if (street) {
    const parts = [street]
    if (streetNumber) parts.push(streetNumber)
    if (floor) parts.push(`Fl.${floor}`)
    if (door) parts.push(`Dr.${door}`)
    if (apartment) parts.push(`Apt.${apartment}`)
    return parts.join(' ')
  }
  
  return ''
}

/**
 * Get full name - handles both single Name field and split First/Last Name
 */
export function getFullName(row: Record<string, any>): string {
  const fullName = getFieldValue(row, 'name')
  if (fullName) return fullName
  
  const firstName = getFieldValue(row, 'firstName')
  const lastName = getFieldValue(row, 'lastName')
  
  const parts = [firstName, lastName].filter(Boolean)
  return parts.join(' ')
}
