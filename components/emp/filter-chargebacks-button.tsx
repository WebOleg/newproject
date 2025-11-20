"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Filter, Loader2, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface FilterChargebacksButtonProps {
  uploadId: string
  recordCount: number
  onComplete?: () => void
}

export function FilterChargebacksButton({ 
  uploadId, 
  recordCount,
  onComplete 
}: FilterChargebacksButtonProps) {
  const [isFiltering, setIsFiltering] = useState(false)
  const { toast } = useToast()

  const handleFilter = async () => {
    setIsFiltering(true)
    
    try {
      const res = await fetch(`/api/emp/uploads/filter-chargebacks/${uploadId}`, {
        method: 'POST',
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to filter chargebacks')
      }

      if (data.removedCount === 0) {
        toast({
          title: '✅ No chargebacks found',
          description: data.message || 'All IBANs are clean - no rows removed.',
        })
      } else {
        toast({
          title: '✅ Chargebacks filtered',
          description: `Removed ${data.removedCount} row(s) with chargebacks. ${data.remainingCount} rows remaining.`,
        })
      }

      // Refresh the page to show updated data
      if (onComplete) {
        onComplete()
      }
    } catch (err: any) {
      console.error('Filter chargebacks error:', err)
      toast({
        title: '❌ Filter failed',
        description: err?.message || 'Failed to filter chargebacks',
        variant: 'destructive',
      })
    } finally {
      setIsFiltering(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={isFiltering}>
          {isFiltering ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Filtering...
            </>
          ) : (
            <>
              <Filter className="h-4 w-4" />
              Filter Chargebacks
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Filter Chargebacks from Upload
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 pt-2">
            <p>
              This will check all IBANs in this upload against the chargeback cache and 
              <strong className="text-foreground"> remove any rows</strong> with IBANs that have chargebacks.
            </p>
            <div className="bg-muted p-3 rounded-md text-sm">
              <p className="font-medium text-foreground mb-1">What happens:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Compares all {recordCount} IBANs against chargeback database</li>
                <li>Removes rows with matching IBANs</li>
                <li>Updates the upload with clean data only</li>
                <li>Cannot be undone (but original file is preserved)</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              💡 Tip: Make sure your chargeback cache is up-to-date before filtering.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleFilter} disabled={isFiltering}>
            {isFiltering ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Filtering...
              </>
            ) : (
              'Filter Now'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

