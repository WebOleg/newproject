"use client"
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { validateRows, normalizeIban } from '@/lib/validation'
import { getFieldValue } from '@/lib/field-aliases'

interface BatchSyncButtonProps {
  uploadId: string
  totalRecords: number
  rows?: any[]
  rowStatuses?: string[]
  onComplete?: () => void
}

export function BatchSyncButton({ uploadId, totalRecords, rows = [], rowStatuses = [], onComplete }: BatchSyncButtonProps) {
  const [syncing, setSyncing] = useState(false)
  const beforeUnloadRef = useRef<(() => void) | null>(null)

  const clearBeforeUnload = () => {
    if (beforeUnloadRef.current) {
      beforeUnloadRef.current()
      beforeUnloadRef.current = null
    }
  }

  const setBeforeUnload = () => {
    if (beforeUnloadRef.current) return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
      return ''
    }
    window.addEventListener('beforeunload', handler)
    beforeUnloadRef.current = () => {
      window.removeEventListener('beforeunload', handler)
    }
  }

  const submitBulk = async () => {
    // Check for blacklisted records
    const blacklistedIndexes = rowStatuses
      .map((s, i) => s === 'blacklisted' ? i + 1 : null)
      .filter(Boolean)
    
    if (blacklistedIndexes.length > 0) {
      toast.error(`Cannot sync: ${blacklistedIndexes.length} blacklisted record(s). Remove row(s) ${blacklistedIndexes.slice(0, 3).join(', ')}${blacklistedIndexes.length > 3 ? '...' : ''} first.`, { duration: 5000 })
      return
    }

    // Check for validation errors (includes duplicate IBAN check within file)
    if (rows.length > 0) {
      const validation = validateRows(rows)
      if (!validation.valid) {
        const firstError = validation.invalidRows[0]
        toast.error(`Row ${firstError.index + 1}: ${firstError.errors[0]}`, { duration: 5000 })
        return
      }
    }

    // Check for IBANs already processed (older than 7 days)
    if (rows.length > 0) {
      try {
        const ibans = rows
          .map(row => normalizeIban(getFieldValue(row, 'iban')))
          .filter(Boolean)

        if (ibans.length > 0) {
          const response = await fetch('/api/emp/validate-ibans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ibans })
          })

          if (response.ok) {
            const { duplicates } = await response.json()
            
            if (duplicates && duplicates.length > 0) {
              const firstDup = duplicates[0]
              const maskedIban = firstDup.iban.slice(0, 4) + '****' + firstDup.iban.slice(-4)
              toast.error(
                `Cannot sync: ${duplicates.length} IBAN(s) already processed. ${maskedIban} was processed ${firstDup.daysAgo} days ago.`,
                { duration: 7000 }
              )
              return
            }
          }
        }
      } catch (err) {
        console.error('[BatchSync] IBAN validation check failed:', err)
        // Continue with sync if check fails - don't block
      }
    }

    setSyncing(true)
    
    try {
      toast.info(`Submitting ${totalRecords} transactions...`)
      setBeforeUnload()
      
      const res = await fetch(`/api/emp/submit-batch/${uploadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data?.error || 'Bulk submission failed')
      }

      const successCount = data.approved || 0
      const summaryErrorCount = data.errors || 0
      const runtime = data.runtime ? `${Math.round(data.runtime / 1000)}s` : ''
      
      if (summaryErrorCount > 0) {
        toast.warning(
          `Done: ${successCount} approved, ${summaryErrorCount} failed`,
          { duration: 5000 }
        )
      } else {
        toast.success(
          `Done! ${successCount} transactions submitted`,
          { duration: 5000 }
        )
      }

      if (onComplete) onComplete()
    } catch (err: any) {
      toast.error(err?.message || 'Submission failed')
    } finally {
      setSyncing(false)
      clearBeforeUnload()
    }
  }

  return (
    <Button
      onClick={submitBulk}
      disabled={syncing}
      size="lg"
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
      {syncing ? 'Syncing...' : 'Sync All to Gateway'}
    </Button>
  )
}
