import { config } from 'dotenv'
import { getCollection } from '../lib/db/users'
import { User } from '../lib/types/auth'

// Load environment variables
config()


async function enableTwoFactorForExistingUsers() {
  console.log('Starting 2FA migration for existing users...\n')

  try {
    const usersCol = await getCollection<User>('users')

    // Find all active users who don't have 2FA enabled
    const usersToUpdate = await usersCol.find({
      status: 'active',
      $or: [
        { twoFactorEnabled: { $ne: true } },
        { twoFactorEnabled: { $exists: false } }
      ]
    }).toArray()

    console.log(`Found ${usersToUpdate.length} user(s) to update`)

    if (usersToUpdate.length === 0) {
      console.log('No users require 2FA setup. All active users already have 2FA enabled.')
      return
    }

    console.log('\nUsers to be updated:')
    usersToUpdate.forEach(user => {
      console.log(`  - ${user.email} (${user.name}) - Role: ${user.role}`)
    })

    console.log('\nEnabling 2FA setup requirement...')

    // Update all active users without 2FA
    const result = await usersCol.updateMany(
      {
        status: 'active',
        $or: [
          { twoFactorEnabled: { $ne: true } },
          { twoFactorEnabled: { $exists: false } }
        ]
      },
      {
        $set: {
          twoFactorEnabled: false,
          twoFactorSetupRequired: true,
          twoFactorBackupCodes: [],
          updatedAt: new Date()
        }
      }
    )

    console.log(`\n✓ Successfully updated ${result.modifiedCount} user(s)`)
    console.log('\nNext steps:')
    console.log('1. Existing users will be prompted to set up 2FA on their next login')
    console.log('2. They will receive backup codes to save securely')
    console.log('3. After setup, they will receive OTP codes via email for each login')

  } catch (error: any) {
    console.error('✗ Migration failed:', error.message)
    throw error
  }

  console.log('\n2FA migration completed successfully!')
}

// Run the script
enableTwoFactorForExistingUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
