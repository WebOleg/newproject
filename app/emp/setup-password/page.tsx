"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

export default function SetupPassword() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [isValidating, setIsValidating] = useState(true)
  const [isValid, setIsValid] = useState(false)
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; role: string } | null>(null)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [setupComplete, setSetupComplete] = useState(false)

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setIsValidating(false)
        setIsValid(false)
        return
      }

      try {
        const res = await fetch(`/api/emp/auth/setup-password?token=${token}`)
        const data = await res.json()

        if (res.ok && data.valid) {
          setIsValid(true)
          setUserInfo(data.user)
        } else {
          setIsValid(false)
          toast.error(data.error || 'Invalid or expired link')
        }
      } catch (error) {
        setIsValid(false)
        toast.error('Failed to validate link')
      } finally {
        setIsValidating(false)
      }
    }

    validateToken()
  }, [token])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (password.length < 12) {
      toast.error('Password must be at least 12 characters long')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/emp/auth/setup-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data?.error || 'Failed to set password')

      setSetupComplete(true)
      toast.success('Password set successfully!')

      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = '/emp/login'
      }, 2000)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to set password')
    } finally {
      setIsLoading(false)
    }
  }

  if (isValidating) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!token || !isValid) {
    return (
      <div className="max-w-md mx-auto mt-16 px-4">
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-destructive" />
              <CardTitle>Invalid Link</CardTitle>
            </div>
            <CardDescription>
              This password setup link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Password setup links expire after 24 hours. Please contact your administrator to request a new invitation.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => (window.location.href = '/emp/login')}
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (setupComplete) {
    return (
      <div className="max-w-md mx-auto mt-16 px-4">
        <Card className="border-green-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <CardTitle>Password Set Successfully!</CardTitle>
            </div>
            <CardDescription>
              Your password has been configured. Redirecting to login...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Set Up Your Password</CardTitle>
          <CardDescription>
            Welcome to MeLinux EMP Portal! Create a secure password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {userInfo && (
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-1">
              <div className="text-sm">
                <span className="text-muted-foreground">Name:</span>{' '}
                <span className="font-medium">{userInfo.name}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Email:</span>{' '}
                <span className="font-medium">{userInfo.email}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Role:</span>{' '}
                <span className="font-medium capitalize">{userInfo.role}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 12 characters long
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-medium">
                Confirm Password
              </label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-3">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                After setting your password, you'll be able to log in with two-factor authentication (2FA) enabled for enhanced security.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !password || !confirmPassword}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting password...
                </>
              ) : (
                'Set Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
