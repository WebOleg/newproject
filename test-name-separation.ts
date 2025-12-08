/**
 * Test script for name separation logic
 * Run with: npx tsx test-name-separation.ts
 */

import { mapRecordToSddSale, getDefaultCompanyConfig } from './lib/emp'

console.log('🧪 Testing Name Separation Logic\n')
console.log('='.repeat(60))

// Test cases
const testCases: Array<{
  name: string
  record: Record<string, string>
  expected: { firstName: string; lastName: string }
}> = [
  {
    name: 'Test 1: Full name field with space (John Doe)',
    record: {
      'customername': 'John Doe',
      'iban': 'DE89370400440532013000',
      'betrag': '100.50',
      'vzweck1': 'Test payment'
    },
    expected: { firstName: 'John', lastName: 'Doe' }
  },
  {
    name: 'Test 2: Full name field with comma (Doe, John)',
    record: {
      'name': 'Doe, John',
      'iban': 'DE89370400440532013000',
      'betrag': '100.50',
      'vzweck1': 'Test payment'
    },
    expected: { firstName: 'John', lastName: 'Doe' }
  },
  {
    name: 'Test 3: Full name with multiple words (John Michael Doe)',
    record: {
      'customername': 'John Michael Doe',
      'iban': 'DE89370400440532013000',
      'betrag': '100.50',
      'vzweck1': 'Test payment'
    },
    expected: { firstName: 'John', lastName: 'Michael Doe' }
  },
  {
    name: 'Test 4: Separate firstName and lastName fields',
    record: {
      'customerfirstname': 'Jane',
      'customerlastname': 'Smith',
      'iban': 'DE89370400440532013000',
      'betrag': '75.00',
      'vzweck1': 'Test payment'
    },
    expected: { firstName: 'Jane', lastName: 'Smith' }
  },
  {
    name: 'Test 5: Only lastName field with fullName fallback',
    record: {
      'lastName': 'Johnson',
      'customername': 'Robert Johnson',
      'iban': 'DE89370400440532013000',
      'betrag': '200.00',
      'vzweck1': 'Test payment'
    },
    // NEW BEHAVIOR: Should use split result (both parts) instead of mixing
    expected: { firstName: 'Robert', lastName: 'Johnson' }
  },
  {
    name: 'Test 6: Only firstName field with fullName fallback',
    record: {
      'firstName': 'Alice',
      'customername': 'Alice Williams',
      'iban': 'DE89370400440532013000',
      'betrag': '150.00',
      'vzweck1': 'Test payment'
    },
    // NEW BEHAVIOR: Should use split result (both parts) instead of mixing
    expected: { firstName: 'Alice', lastName: 'Williams' }
  },
  {
    name: 'Test 7: Single word name (Madonna)',
    record: {
      'customername': 'Madonna',
      'iban': 'DE89370400440532013000',
      'betrag': '50.00',
      'vzweck1': 'Test payment'
    },
    expected: { firstName: 'Madonna', lastName: 'Madonna' }
  },
  {
    name: 'Test 8: Name with extra spaces',
    record: {
      'customername': '  John   Doe  ',
      'iban': 'DE89370400440532013000',
      'betrag': '100.00',
      'vzweck1': 'Test payment'
    },
    expected: { firstName: 'John', lastName: 'Doe' }
  }
]

// Run tests
let passed = 0
let failed = 0
const companyConfig = getDefaultCompanyConfig()

testCases.forEach((testCase, index) => {
  console.log(`\n${testCase.name}`)
  console.log('-'.repeat(60))

  try {
    const result = mapRecordToSddSale(testCase.record, index, null, 'test.csv', companyConfig)

    const actualFirstName = result.firstName || ''
    const actualLastName = result.lastName || ''
    const expectedFirstName = testCase.expected.firstName
    const expectedLastName = testCase.expected.lastName

    const firstNameMatch = actualFirstName === expectedFirstName
    const lastNameMatch = actualLastName === expectedLastName

    if (firstNameMatch && lastNameMatch) {
      console.log(`✅ PASS`)
      console.log(`   First Name: "${actualFirstName}" ✓`)
      console.log(`   Last Name: "${actualLastName}" ✓`)
      passed++
    } else {
      console.log(`❌ FAIL`)
      console.log(`   First Name: Expected "${expectedFirstName}", Got "${actualFirstName}" ${firstNameMatch ? '✓' : '✗'}`)
      console.log(`   Last Name: Expected "${expectedLastName}", Got "${actualLastName}" ${lastNameMatch ? '✓' : '✗'}`)
      failed++
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error instanceof Error ? error.message : String(error)}`)
    failed++
  }
})

// Summary
console.log('\n' + '='.repeat(60))
console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`)

if (failed === 0) {
  console.log('✅ All tests passed! Safe to deploy to production.\n')
  process.exit(0)
} else {
  console.log('❌ Some tests failed. Please review before deploying.\n')
  process.exit(1)
}
