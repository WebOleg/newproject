import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const fromEmail = process.env.EMAIL_FROM || 'MeLinux <no-reply@example.com>'
const appUrl = process.env.APP_URL || 'http://localhost:3000'

export async function sendOTPEmail(to: string, name: string, code: string): Promise<void> {
  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: 'Your Login Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
              <h2 style="color: #2c3e50; margin-top: 0;">Hi ${name},</h2>
              <p style="font-size: 16px; margin-bottom: 20px;">Your verification code for logging into the EMP Portal is:</p>

              <div style="background-color: #fff; border: 2px solid #3498db; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2c3e50; font-family: 'Courier New', monospace;">
                  ${code}
                </div>
              </div>

              <p style="font-size: 14px; color: #666; margin-bottom: 10px;">This code will expire in <strong>5 minutes</strong>.</p>
              <p style="font-size: 14px; color: #666; margin-bottom: 20px;">If you didn't request this code, please ignore this email.</p>
            </div>

            <div style="font-size: 12px; color: #999; text-align: center; padding-top: 20px; border-top: 1px solid #eee;">
              <p>This is an automated message from the MeLinux EMP Portal. Please do not reply to this email.</p>
            </div>
          </body>
        </html>
      `,
      text: `Hi ${name},\n\nYour verification code for logging into the EMP Portal is: ${code}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this code, please ignore this email.`,
    })
  } catch (error) {
    console.error('Failed to send OTP email:', error)
    throw new Error('Failed to send verification code')
  }
}

export async function sendInvitationEmail(to: string, name: string, setupUrl: string): Promise<void> {
  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: 'Welcome to MeLinux EMP Portal - Set Up Your Account',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
              <h2 style="color: #2c3e50; margin-top: 0;">Welcome to MeLinux EMP Portal!</h2>
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>
              <p style="font-size: 16px; margin-bottom: 20px;">You've been invited to join the MeLinux EMP Portal. To get started, you'll need to set up your password.</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${setupUrl}" style="display: inline-block; background-color: #3498db; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">
                  Set Up Your Password
                </a>
              </div>

              <p style="font-size: 14px; color: #666; margin-bottom: 10px;">Or copy and paste this link into your browser:</p>
              <p style="font-size: 12px; color: #3498db; word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 5px;">
                ${setupUrl}
              </p>

              <p style="font-size: 14px; color: #666; margin-top: 20px;">This link will expire in <strong>24 hours</strong>.</p>
              <p style="font-size: 14px; color: #666;">If you didn't expect this invitation, please contact your administrator.</p>
            </div>

            <div style="font-size: 12px; color: #999; text-align: center; padding-top: 20px; border-top: 1px solid #eee;">
              <p>This is an automated message from the MeLinux EMP Portal. Please do not reply to this email.</p>
            </div>
          </body>
        </html>
      `,
      text: `Welcome to MeLinux EMP Portal!\n\nHi ${name},\n\nYou've been invited to join the MeLinux EMP Portal. To get started, you'll need to set up your password.\n\nClick here to set up your password:\n${setupUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't expect this invitation, please contact your administrator.`,
    })
  } catch (error) {
    console.error('Failed to send invitation email:', error)
    throw new Error('Failed to send invitation email')
  }
}

export async function sendBackupCodesEmail(to: string, name: string, codes: string[]): Promise<void> {
  try {
    const codesList = codes.map(code => `<li style="font-family: 'Courier New', monospace; font-size: 16px; padding: 5px; background-color: #f0f0f0; margin: 5px 0; border-radius: 3px;">${code}</li>`).join('')

    await resend.emails.send({
      from: fromEmail,
      to,
      subject: 'Your MeLinux EMP Portal Backup Codes',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
              <h2 style="color: #2c3e50; margin-top: 0;">Your Backup Codes</h2>
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>
              <p style="font-size: 16px; margin-bottom: 20px;">You've successfully enabled two-factor authentication on your MeLinux EMP Portal account.</p>
              <p style="font-size: 16px; margin-bottom: 20px;">Here are your backup codes. Keep them in a safe place - you can use them to log in if you lose access to your email.</p>

              <div style="background-color: #fff; border: 2px solid #e74c3c; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <h3 style="color: #e74c3c; margin-top: 0; font-size: 18px;">⚠️ Important Security Information</h3>
                <ul style="list-style: none; padding: 0; margin: 20px 0;">
                  ${codesList}
                </ul>
                <p style="font-size: 14px; color: #666; margin-top: 20px; margin-bottom: 0;">
                  <strong>Note:</strong> Each backup code can only be used once. Store these codes securely.
                </p>
              </div>

              <p style="font-size: 14px; color: #666; margin-top: 20px;">If you didn't enable two-factor authentication, please contact your administrator immediately.</p>
            </div>

            <div style="font-size: 12px; color: #999; text-align: center; padding-top: 20px; border-top: 1px solid #eee;">
              <p>This is an automated message from the MeLinux EMP Portal. Please do not reply to this email.</p>
            </div>
          </body>
        </html>
      `,
      text: `Your Backup Codes\n\nHi ${name},\n\nYou've successfully enabled two-factor authentication on your MeLinux EMP Portal account.\n\nHere are your backup codes:\n\n${codes.join('\n')}\n\nKeep them in a safe place - you can use them to log in if you lose access to your email.\n\nNote: Each backup code can only be used once. Store these codes securely.\n\nIf you didn't enable two-factor authentication, please contact your administrator immediately.`,
    })
  } catch (error) {
    console.error('Failed to send backup codes email:', error)
    throw new Error('Failed to send backup codes email')
  }
}
