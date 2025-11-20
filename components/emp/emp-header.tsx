"use client"

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { LayoutDashboard, LogOut, Database, ExternalLink, Settings, BarChart3 } from 'lucide-react'

export function EmpHeader() {
  const [isLoading, setIsLoading] = useState(false)

  async function onLogout() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/emp/auth/logout', { method: 'POST' })
      if (!res.ok) throw new Error('Logout failed')
      window.location.href = '/emp/login'
    } catch (e: any) {
      toast.error(e?.message || 'Logout failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="w-full max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <Link href="/emp" className="text-lg font-semibold tracking-tight hover:text-primary transition-colors">
            EMP Portal
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/emp">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/emp/analytics">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/emp/settings">
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <a href="https://emp.staging.merchant.emerchantpay.net/en/payment_transactions" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Transactions
            </a>
          </Button>
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <a href="https://emp.staging.merchant.emerchantpay.net/en/transaction_attempts" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Attempts
            </a>
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onLogout} 
            disabled={isLoading}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            {isLoading ? 'Logging out…' : 'Logout'}
          </Button>
        </div>
      </div>
    </header>
  )
}
