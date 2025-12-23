"use client"
import { useRef, useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { validateRows, normalizeIban } from '@/lib/validation'
import { getFieldValue } from '@/lib/field-aliases'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface BatchSyncButtonProps {
  uploadId: string
  totalRecords: number
  rows?: any[]
  rowStatuses?: string[]
  onComplete?: () => void
  skipAddressValidation?: boolean
}

export function BatchSyncButton({ uploadId, totalRecords, rows = [], rowStatuses = [], onComplete, skipAddressValidation = false }: BatchSyncButtonProps) {
  const [syncing, setSyncing] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [concurrency, setConcurrency] = useState(20)
  const [chunkSize, setChunkSize] = useState(20)
  const [maxRecords, setMaxRecords] = useState(totalRecords)
  const [filterByAmount, setFilterByAmount] = useState<string>('')
  const [amountLimit, setAmountLimit] = useState<number>(0)
  const beforeUnloadRef = useRef<(() => void) | null>(null)

  // Get unique amounts from rows (only count pending/non-processed records)
  const availableAmounts = useMemo(() => {
    const amounts = new Map<string, number>()
    rows.forEach((row, index) => {
      // Skip approved, blacklisted, and error records
      const status = rowStatuses[index]
      if (status === 'approved' || status === 'blacklisted' || status === 'error') {
        return
      }

      const amount = getFieldValue(row, 'amount')
      if (amount) {
        amounts.set(amount, (amounts.get(amount) || 0) + 1)
      }
    })
    return Array.from(amounts.entries())
      .map(([amount, count]) => ({ amount, count }))
      .sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount))
  }, [rows, rowStatuses])

  // Update maxRecords when totalRecords changes
  useEffect(() => {
    setMaxRecords(totalRecords)
  }, [totalRecords])

  // Update amountLimit when filterByAmount changes
  useEffect(() => {
    if (filterByAmount) {
      const found = availableAmounts.find(a => a.amount === filterByAmount)
      setAmountLimit(found?.count || 0)
    } else {
      setAmountLimit(0)
    }
  }, [filterByAmount, availableAmounts])

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

  const handleConfigAndSync = () => {
    setConfigOpen(true)
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
      const validation = validateRows(rows, { skipAddressValidation })
      if (!validation.valid) {
        const firstError = validation.invalidRows[0]
        toast.error(`Row ${firstError.index + 1}: ${firstError.errors[0]}`, { duration: 5000 })
        return
      }
    }

    // Check for IBANs already processed (older than 30 days)
    if (rows.length > 0) {
      try {
        const ibans = rows
          .map(row => normalizeIban(getFieldValue(row, 'iban')))
          .filter(Boolean)

        if (ibans.length > 0) {
          const response = await fetch('/api/emp/validate-ibans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ibans, currentUploadId: uploadId })
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

    setConfigOpen(false)
    setSyncing(true)

    try {
      const recordsToSync = Math.min(maxRecords, totalRecords)
      const filterMsg = filterByAmount ? ` with amount ${filterByAmount}` : ''
      toast.info(`Submitting ${recordsToSync} transactions${filterMsg} (${concurrency} parallel, chunk size: ${chunkSize})...`)
      setBeforeUnload()

      const res = await fetch(`/api/emp/submit-batch/${uploadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concurrency,
          chunkSize,
          maxRecords: recordsToSync,
          filterByAmount: filterByAmount || undefined,
          amountLimit: amountLimit > 0 ? amountLimit : undefined,
        }),
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
          `Done: ${successCount} approved, ${summaryErrorCount} failed ${runtime}`,
          { duration: 5000 }
        )
      } else {
        toast.success(
          `Done! ${successCount} transactions submitted ${runtime}`,
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
    <>
      <Button
        onClick={handleConfigAndSync}
        disabled={syncing}
        size="lg"
        className="gap-2"
      >
        <Settings className="h-4 w-4" />
        {syncing ? 'Syncing...' : 'Sync All to Gateway'}
      </Button>

      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Sync Configuration</DialogTitle>
            <DialogDescription>
              Configure how many records to sync and the processing parameters. Adjust these settings to optimize performance and control batch processing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="filterAmount">
                Filter by Amount (Optional)
              </Label>
              <Select value={filterByAmount || "all"} onValueChange={(value) => setFilterByAmount(value === "all" ? "" : value)} disabled={syncing}>
                <SelectTrigger id="filterAmount">
                  <SelectValue placeholder="All amounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All amounts</SelectItem>
                  {availableAmounts.map(({ amount, count }) => (
                    <SelectItem key={amount} value={amount}>
                      {amount} ({count} record{count !== 1 ? 's' : ''})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Filter to sync only records with a specific amount
              </p>
            </div>
            {filterByAmount && (
              <div className="space-y-2">
                <Label htmlFor="amountLimit">
                  Number of Records with Amount {filterByAmount}
                </Label>
                <Input
                  id="amountLimit"
                  type="number"
                  min="1"
                  max={availableAmounts.find(a => a.amount === filterByAmount)?.count || 1}
                  value={amountLimit}
                  onChange={(e) => {
                    const maxForAmount = availableAmounts.find(a => a.amount === filterByAmount)?.count || 1
                    setAmountLimit(Math.min(maxForAmount, Math.max(1, parseInt(e.target.value) || 1)))
                  }}
                  disabled={syncing}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum: {availableAmounts.find(a => a.amount === filterByAmount)?.count || 0} records with this amount
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="maxRecords">
                {filterByAmount ? 'Additional Limit (Optional)' : 'Number of Records to Sync'}
              </Label>
              <Input
                id="maxRecords"
                type="number"
                min="1"
                max={totalRecords}
                value={maxRecords}
                onChange={(e) => setMaxRecords(Math.min(totalRecords, Math.max(1, parseInt(e.target.value) || 1)))}
                disabled={syncing || !!filterByAmount}
              />
              <p className="text-xs text-muted-foreground">
                {filterByAmount ? 'Disabled when filtering by amount' : `Maximum: ${totalRecords} records available`}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="concurrency">
                Concurrency (Parallel Requests)
              </Label>
              <Input
                id="concurrency"
                type="number"
                min="1"
                max="50"
                value={concurrency}
                onChange={(e) => setConcurrency(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                disabled={syncing}
              />
              <p className="text-xs text-muted-foreground">
                How many requests to process in parallel (1-50). Higher values = faster but more resource intensive.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="chunkSize">
                Chunk Size
              </Label>
              <Input
                id="chunkSize"
                type="number"
                min="1"
                max="100"
                value={chunkSize}
                onChange={(e) => setChunkSize(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                disabled={syncing}
              />
              <p className="text-xs text-muted-foreground">
                Number of records per processing chunk (1-100). Used for progress tracking.
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-md text-sm space-y-1">
              <p className="font-medium">Summary:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                {filterByAmount ? (
                  <>
                    <li>Filter: Only amount {filterByAmount}</li>
                    <li>{amountLimit} record{amountLimit !== 1 ? 's' : ''} with this amount will be synced</li>
                  </>
                ) : (
                  <li>{maxRecords} record{maxRecords !== 1 ? 's' : ''} will be synced</li>
                )}
                <li>{concurrency} parallel request{concurrency !== 1 ? 's' : ''}</li>
                <li>Processed in chunks of {chunkSize}</li>
                <li>Estimated: ~{Math.ceil((filterByAmount ? amountLimit : maxRecords) / concurrency)} batch{Math.ceil((filterByAmount ? amountLimit : maxRecords) / concurrency) !== 1 ? 'es' : ''}</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfigOpen(false)}
              disabled={syncing}
            >
              Cancel
            </Button>
            <Button
              onClick={submitBulk}
              disabled={syncing}
              className="gap-2"
            >
              {syncing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Start Sync
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
