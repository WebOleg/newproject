"use client"

import { usePathname } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'

export function SiteChrome() {
  return null
}

export function SiteFooter() {
  const pathname = usePathname()
  const hide = pathname?.startsWith('/emp')
  if (hide) return null
  return <Footer />
}


