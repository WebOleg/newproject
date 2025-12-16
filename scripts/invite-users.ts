import { createInvitedUser } from '../lib/db/users'
import { sendInvitationEmail } from '../lib/services/email'
import { UserRole } from '../lib/types/auth'

const APP_URL = process.env.APP_URL || 'http://localhost:3000'

const newUsers: Array<{
  email: string
  name: string
  role: UserRole
  agencyId?: string
  accountId?: string
}> = [
  {
    email: 'Thomas_Blake7@proton.me',
    name: 'Thomas Blake',
    role: 'superOwner',
  },
  {
    email: 'tether_az@proton.me',
    name: 'Tether AZ',
    role: 'agencyAdmin',
    // agencyId: 'REPLACE_WITH_ACTUAL_AGENCY_ID', // Uncomment and set if needed
  },
  {
    email: 'd3h9fn08@anonaddy.com',
    name: 'D3H User',
    role: 'accountAdmin',
    // agencyId: 'REPLACE_WITH_ACTUAL_AGENCY_ID', // Uncomment and set if needed
    // accountId: 'REPLACE_WITH_ACTUAL_ACCOUNT_ID', // Uncomment and set if needed
  },
  {
    email: 'proboy2@pm.me',
    name: 'Pro Boy',
    role: 'accountViewer',
    // agencyId: 'REPLACE_WITH_ACTUAL_AGENCY_ID', // Uncomment and set if needed
    // accountId: 'REPLACE_WITH_ACTUAL_ACCOUNT_ID', // Uncomment and set if needed
  },
]

async function inviteUsers() {
  console.log('Starting user invitation process...\n')

  for (const userData of newUsers) {
    try {
      console.log(`Inviting ${userData.email}...`)

      const { user, setupToken } = await createInvitedUser(userData)
      const setupUrl = `${APP_URL}/emp/setup-password?token=${setupToken}`

      await sendInvitationEmail(user.email, user.name, setupUrl)

      console.log(`✓ Invitation sent to ${user.email}`)
      console.log(`  Name: ${user.name}`)
      console.log(`  Role: ${user.role}`)
      console.log(`  Setup URL: ${setupUrl}`)
      console.log('')
    } catch (error: any) {
      console.error(`✗ Failed to invite ${userData.email}:`, error.message)
      console.log('')
    }
  }

  console.log('User invitation process completed!')
}

// Run the script
inviteUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
