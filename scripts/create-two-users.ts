import { config } from 'dotenv'
import { createUser } from '../lib/db/users'
import crypto from 'crypto'

// Load environment variables
config()

// Generate a secure random password
function generatePassword(length: number = 16): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*'
  let password = ''
  const randomBytes = crypto.randomBytes(length)

  for (let i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length]
  }

  return password
}

async function createTwoUsers() {
  console.log('Creating 2 new users with random passwords...\n')

  const users = [
    {
      email: 'd3h9fn08@anonaddy.com',
      name: 'D3H User',
      role: 'accountAdmin' as const,
    },
    {
      email: 'proboy2@pm.me',
      name: 'Pro Boy',
      role: 'accountViewer' as const,
    },
  ]

  const credentials: Array<{ email: string; password: string; name: string; role: string }> = []

  for (const userData of users) {
    try {
      // Generate random password
      const password = generatePassword(16)

      const user = await createUser({
        ...userData,
        password,
      })

      credentials.push({
        email: user.email,
        password,
        name: user.name,
        role: user.role,
      })

      console.log(`✓ User created: ${user.email}`)
      console.log(`  Name: ${user.name}`)
      console.log(`  Role: ${user.role}`)
      console.log(`  ID: ${user._id}`)
      console.log(`  Password: ${password}`)
      console.log('')

    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log(`✗ User ${userData.email} already exists`)
        console.log('')
      } else {
        console.error(`✗ Failed to create ${userData.email}:`, error.message)
        console.log('')
      }
    }
  }

  if (credentials.length > 0) {
    console.log('\n' + '='.repeat(60))
    console.log('CREDENTIALS SUMMARY - SAVE THESE SECURELY')
    console.log('='.repeat(60))

    credentials.forEach(cred => {
      console.log(`\n${cred.name} (${cred.role}):`)
      console.log(`  Email:    ${cred.email}`)
      console.log(`  Password: ${cred.password}`)
    })

    console.log('\n' + '='.repeat(60))
    console.log('\nNote: On first login, users will be prompted to set up 2FA.')
  }
}

// Run the script
createTwoUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
