import { config } from 'dotenv'
import { createUser } from '../lib/db/users'

// Load environment variables
config()

async function createAdminUser() {
  console.log('Creating admin user...\n')

  try {
    const user = await createUser({
      email: 'tether_az@proton.me',
      password: 'password',
      name: 'Tether Admin',
      role: 'superOwner',
    })

    console.log('✓ Admin user created successfully!')
    console.log(`  Email: ${user.email}`)
    console.log(`  Name: ${user.name}`)
    console.log(`  Role: ${user.role}`)
    console.log(`  ID: ${user._id}`)
    console.log('\nYou can now log in with:')
    console.log(`  Email: tether_az@proton.me`)
    console.log(`  Password: password`)
    console.log('\nNote: On first login, you will be prompted to set up 2FA.')

  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('✗ User already exists with this email address')
      console.log('  If you need to reset the password, please use a password reset feature')
    } else {
      console.error('✗ Failed to create user:', error.message)
    }
    process.exit(1)
  }
}

// Run the script
createAdminUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
