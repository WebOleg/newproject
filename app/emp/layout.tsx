import type { ReactNode } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { EmpHeader } from '@/components/emp/emp-header'
import { headers } from 'next/headers'

export default async function EmpLayout({ children }: { children: ReactNode }) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  
  // Hide header and padding on return URL pages
  const isReturnPage = ['/emp/success', '/emp/failure', '/emp/pending', '/emp/cancel'].includes(pathname)
  
  if (isReturnPage) {
    return (
      <>
        {children}
        <Toaster richColors position="top-right" />
      </>
    )
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      <EmpHeader />
      <main className="w-full max-w-7xl px-4 py-6">
        {children}
      </main>
      <Toaster richColors position="top-right" />
    </div>
  )
}


