"use client"

import { useEffect, useState } from 'react'

interface ClientDateProps {
  date: string | Date
  format?: 'full' | 'date'
  className?: string
}

export function ClientDate({ date, format = 'full', className }: ClientDateProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a placeholder during SSR to avoid hydration mismatch
    return <span className={className}>Loading...</span>
  }

  const dateObj = new Date(date)
  const formatted = format === 'full' ? dateObj.toLocaleString() : dateObj.toLocaleDateString()

  return <span className={className}>{formatted}</span>
}
