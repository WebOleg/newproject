'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Ban, Loader2 } from 'lucide-react'

export function ManualVoidDialog() {
  const [open, setOpen] = useState(false)
  const [uniqueId, setUniqueId] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [isVoiding, setIsVoiding] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const handleVoid = async () => {
    if (!uniqueId.trim()) {
      alert('Please enter a unique_id')
      return
    }

    if (!confirm(`⚠️ Are you sure you want to void transaction:\n\nUnique ID: ${uniqueId}\nTransaction ID: ${transactionId || 'N/A'}\n\nThis action cannot be undone!`)) {
      return
    }

    setIsVoiding(true)
    setResult(null)

    try {
      const res = await fetch('/api/emp/void-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          uniqueId: uniqueId.trim(),
          transactionId: transactionId.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (res.ok && data.ok) {
        setResult({ ok: true, message: `✅ Transaction voided successfully!\nVoid Unique ID: ${data.voidUniqueId}` })
        setUniqueId('')
        setTransactionId('')
      } else {
        setResult({ ok: false, message: `❌ Void failed: ${data.error || data.message || 'Unknown error'}` })
      }
    } catch (err: any) {
      console.error('Void error:', err)
      setResult({ ok: false, message: `❌ Error: ${err.message}` })
    } finally {
      setIsVoiding(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/20"
        >
          <Ban className="h-4 w-4" />
          Manual Void
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manual Void Transaction</DialogTitle>
          <DialogDescription>
            Enter the transaction details to void. You can find the unique_id in the transaction response or reconciliation data.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="uniqueId">
              Unique ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="uniqueId"
              placeholder="e.g., 44177a21403427eb96664a6d7e5d5d48"
              value={uniqueId}
              onChange={(e) => setUniqueId(e.target.value)}
              disabled={isVoiding}
            />
            <p className="text-xs text-muted-foreground">
              Required: The unique_id from the original transaction (reference_id for void)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
            <Input
              id="transactionId"
              placeholder="e.g., your-transaction-id-123"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              disabled={isVoiding}
            />
            <p className="text-xs text-muted-foreground">
              Optional: Your original transaction_id for reference
            </p>
          </div>
          {result && (
            <div
              className={`p-3 rounded-md text-sm ${
                result.ok
                  ? 'bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans">{result.message}</pre>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isVoiding}
          >
            Close
          </Button>
          <Button
            onClick={handleVoid}
            disabled={isVoiding || !uniqueId.trim()}
            className="gap-2 bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isVoiding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Voiding...
              </>
            ) : (
              <>
                <Ban className="h-4 w-4" />
                Void Transaction
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}



