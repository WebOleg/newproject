"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function EmpLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [tempToken, setTempToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hasSession = document.cookie.split(';').some((cookie) => cookie.trim().startsWith('emp_session='))
    if (hasSession) {
      window.location.href = '/emp'
    }
  }, [])

  async function handleCredentialsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await fetch('/api/emp/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) throw new Error(data?.error || 'Login failed')

      if (data.step === 'otp_required' && data.tempToken) {
        setTempToken(data.tempToken)
        setStep('otp')
        toast.success('Code sent to your email')
      } else {
        // fallback (no 2FA)
        toast.success('Welcome')
        window.location.href = '/emp'
      }
    } catch (err: any) {
      toast.error(err?.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleOtpSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!tempToken) {
      toast.error('Missing token, please login again')
      setStep('credentials')
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch('/api/emp/auth/verify-otp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: otp, tempToken }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Invalid code')

      toast.success('Welcome')
      window.location.href = '/emp'
    } catch (err: any) {
      toast.error(err?.message || 'Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <Card>
        <CardHeader>
          <CardTitle>EMP Admin Login</CardTitle>
          <CardDescription>
            {step === 'credentials'
              ? 'Sign in to upload and manage CSVs'
              : 'Enter the 6-digit code we sent to your email'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-3">
              <div>
                <label className="text-sm font-medium">Username</label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="text-sm font-medium">Password</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" disabled={isLoading || !username || !password}>
                {isLoading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-3">
              <div>
                <label className="text-sm font-medium">Verification code</label>
                <Input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                />
              </div>
              <Button type="submit" disabled={isLoading || otp.length !== 6}>
                {isLoading ? 'Verifying…' : 'Verify'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setStep('credentials')
                  setOtp('')
                  setTempToken(null)
                }}
              >
                Back to login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
