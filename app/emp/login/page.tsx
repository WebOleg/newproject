"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Download, Copy, Check } from 'lucide-react'
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp'

type LoginState = 'password' | 'otp' | 'backup_code_entry' | 'setup_backup_codes'

export default function EmpLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  // 2FA state
  const [loginState, setLoginState] = useState<LoginState>('password')
  const [userId, setUserId] = useState('')
  const [userName, setUserName] = useState('')
  const [otp, setOtp] = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [backupCodesSaved, setBackupCodesSaved] = useState(false)
  const [copiedCodes, setCopiedCodes] = useState(false)

  // Resend OTP state
  const [canResendOtp, setCanResendOtp] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(60)

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/emp/auth/session')
        if (res.ok) {
          const data = await res.json()
          if (data.authenticated) {
            window.location.href = '/emp'
            return
          }
        }
      } catch {
      } finally {
        setIsChecking(false)
      }
    }
    checkSession()
  }, [])

  // Resend OTP countdown timer
  useEffect(() => {
    if (loginState === 'otp' && !canResendOtp) {
      const timer = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            setCanResendOtp(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [loginState, canResendOtp])

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await fetch('/api/emp/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) throw new Error(data?.error || 'Login failed')

      // Handle different response states
      if (data.status === 'setup_required') {
        // First-time 2FA setup - show backup codes
        setUserId(data.userId)
        setUserName(data.userName)
        setBackupCodes(data.backupCodes)
        setLoginState('setup_backup_codes')
      } else if (data.status === 'otp_required') {
        // 2FA enabled - show OTP input
        setUserId(data.userId)
        setUserName(data.userName)
        setLoginState('otp')
        setCanResendOtp(false)
        setResendCountdown(60)
        toast.success('Verification code sent to your email')
      } else if (data.ok) {
        // Direct login (legacy)
        toast.success(`Welcome, ${data.user?.name || 'User'}!`)
        window.location.href = '/emp'
      }
    } catch (err: any) {
      toast.error(err?.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleOtpSubmit(code: string) {
    if (code.length !== 6) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/emp/auth/verify-otp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId, code }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) throw new Error(data?.error || 'Invalid verification code')

      toast.success(`Welcome, ${data.user?.name || 'User'}!`)
      window.location.href = '/emp'
    } catch (err: any) {
      toast.error(err?.message || 'Invalid verification code')
      setOtp('')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleBackupCodeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!backupCode.trim()) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/emp/auth/verify-backup-code', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId, code: backupCode }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) throw new Error(data?.error || 'Invalid backup code')

      if (data.warning) {
        toast.warning(data.warning)
      }

      toast.success(`Welcome, ${data.user?.name || 'User'}!`)
      window.location.href = '/emp'
    } catch (err: any) {
      toast.error(err?.message || 'Invalid backup code')
      setBackupCode('')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResendOtp() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/emp/auth/resend-otp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) throw new Error(data?.error || 'Failed to resend code')

      toast.success('New verification code sent to your email')
      setCanResendOtp(false)
      setResendCountdown(60)
      setOtp('')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to resend code')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleBackupCodesAcknowledged() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/emp/auth/setup-2fa', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId, backupCodesAcknowledged: true }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) throw new Error(data?.error || 'Failed to complete setup')

      toast.success('Two-factor authentication enabled successfully!')
      // Redirect to login to try the new 2FA flow
      window.location.reload()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to complete setup')
    } finally {
      setIsLoading(false)
    }
  }

  function downloadBackupCodes() {
    const content = backupCodes.join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'backup-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  function copyBackupCodes() {
    navigator.clipboard.writeText(backupCodes.join('\n'))
    setCopiedCodes(true)
    toast.success('Backup codes copied to clipboard')
    setTimeout(() => setCopiedCodes(false), 2000)
  }

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto mt-16 px-4">
      <Card>
        <CardHeader>
          <CardTitle>EMP Portal Login</CardTitle>
          <CardDescription>
            {loginState === 'password' && 'Sign in to access your dashboard'}
            {loginState === 'otp' && 'Enter the verification code sent to your email'}
            {loginState === 'backup_code_entry' && 'Enter one of your backup codes'}
            {loginState === 'setup_backup_codes' && 'Save your backup codes'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loginState === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !email || !password}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          )}

          {loginState === 'otp' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Verification Code</label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(value) => {
                        setOtp(value)
                        if (value.length === 6) {
                          handleOtpSubmit(value)
                        }
                      }}
                      disabled={isLoading}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Enter the 6-digit code sent to your email
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleResendOtp}
                    disabled={!canResendOtp || isLoading}
                  >
                    {canResendOtp ? 'Resend Code' : `Resend in ${resendCountdown}s`}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setLoginState('backup_code_entry')}
                    disabled={isLoading}
                  >
                    Use backup code instead
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-xs"
                    onClick={() => {
                      setLoginState('password')
                      setOtp('')
                      setUserId('')
                    }}
                  >
                    Back to login
                  </Button>
                </div>
              </div>
            </div>
          )}

          {loginState === 'backup_code_entry' && (
            <form onSubmit={handleBackupCodeSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="backup-code" className="text-sm font-medium">Backup Code</label>
                <Input
                  id="backup-code"
                  type="text"
                  placeholder="XXXX-XXXX"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                  autoFocus
                  className="font-mono text-center text-lg tracking-wider"
                />
                <p className="text-xs text-muted-foreground">
                  Enter one of your backup codes (format: XXXX-XXXX)
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !backupCode.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Backup Code'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setLoginState('otp')
                    setBackupCode('')
                  }}
                  disabled={isLoading}
                >
                  Back to verification code
                </Button>
              </div>
            </form>
          )}

          {loginState === 'setup_backup_codes' && (
            <div className="space-y-6">
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  Important: Save Your Backup Codes
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  These codes can be used to access your account if you lose access to your email.
                  Each code can only be used once. Store them in a safe place.
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {backupCodes.map((code, index) => (
                      <div
                        key={index}
                        className="bg-white dark:bg-slate-950 px-3 py-2 rounded border border-slate-200 dark:border-slate-700 text-center"
                      >
                        {code}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={downloadBackupCodes}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={copyBackupCodes}
                  >
                    {copiedCodes ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy All
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="backup-codes-saved"
                    checked={backupCodesSaved}
                    onChange={(e) => setBackupCodesSaved(e.target.checked)}
                    className="mt-1"
                  />
                  <label htmlFor="backup-codes-saved" className="text-sm text-muted-foreground cursor-pointer">
                    I have saved these backup codes in a secure location
                  </label>
                </div>

                <Button
                  type="button"
                  className="w-full"
                  onClick={handleBackupCodesAcknowledged}
                  disabled={!backupCodesSaved || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Completing setup...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
