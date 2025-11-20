"use client"

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { TableClient } from '@/components/emp/table-client'
import { Button } from '@/components/ui/button'
import { BatchSyncButton } from '@/components/emp/batch-sync-button'
import { FilterChargebacksButton } from '@/components/emp/filter-chargebacks-button'
import { ManualVoidDialog } from '@/components/emp/manual-void-dialog'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText, Calendar, Hash, CheckCircle2, XCircle, RefreshCw, CheckCircle, RotateCcw, Ban } from 'lucide-react'
import Link from 'next/link'

interface UploadDetailClientProps {
  id: string
  filename: string
  recordCount: number
  createdAt: string
  approvedCount: number
  errorCount: number
  headers: string[]
  records: Record<string, string>[]
  rows: any[]
  reconciliationReport?: any
  lastReconciledAt?: string
}

export function UploadDetailClient({
  id,
  filename,
  recordCount,
  createdAt,
  approvedCount,
  errorCount,
  headers,
  records,
  rows,
  reconciliationReport,
  lastReconciledAt,
}: UploadDetailClientProps) {
  const router = useRouter()
  const [isResetting, setIsResetting] = useState(false)
  const [isVoiding, setIsVoiding] = useState(false)
  
  const handleRefresh = () => {
    router.refresh()
  }

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset this upload? This will clear all submission history and allow resubmission with new transaction IDs.')) {
      return
    }

    setIsResetting(true)
    try {
      const res = await fetch(`/api/emp/uploads/reset/${id}`, {
        method: 'POST',
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset upload')
      }

      router.refresh()
    } catch (err: any) {
      console.error('Reset error:', err)
      alert(`Failed to reset: ${err.message}`)
    } finally {
      setIsResetting(false)
    }
  }

  const handleVoidApproved = async () => {
    if (!confirm(`⚠️ WARNING: This will void ALL ${approvedCount} approved transactions in this upload!\n\nThis action:\n- Cancels transactions before they're finalized\n- Only works on the same day as the original transaction\n- Cannot be undone\n\nAre you sure you want to continue?`)) {
      return
    }

    setIsVoiding(true)
    try {
      const res = await fetch(`/api/emp/uploads/void-approved/${id}`, {
        method: 'POST',
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to void transactions')
      }

      alert(`✅ Void completed:\n${data.voidedCount} voided\n${data.failedCount} failed`)
      router.refresh()
    } catch (err: any) {
      console.error('Void error:', err)
      alert(`❌ Void failed: ${err.message}`)
    } finally {
      setIsVoiding(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">{filename}</h2>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Hash className="h-4 w-4" />
                  <span>{recordCount} records</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{approvedCount} approved</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span>{errorCount} errors</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {approvedCount > 0 && (
                <Button
                  onClick={handleVoidApproved}
                  variant="outline"
                  className="gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                  disabled={isVoiding}
                >
                  <Ban className="h-4 w-4" />
                  {isVoiding ? 'Voiding...' : `Void ${approvedCount} Approved`}
                </Button>
              )}
              <ManualVoidDialog />
              <Button
                onClick={handleReset}
                variant="outline"
                className="gap-2"
                disabled={isResetting}
              >
                <RotateCcw className="h-4 w-4" />
                {isResetting ? 'Resetting...' : 'Reset'}
              </Button>
              <FilterChargebacksButton
                uploadId={id}
                recordCount={recordCount}
                onComplete={handleRefresh}
              />
              <form action={`/api/emp/reconcile/${id}`} method="POST">
                <Button type="submit" variant="outline" className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Reconcile
                </Button>
              </form>
              <BatchSyncButton 
                uploadId={id} 
                totalRecords={recordCount} 
                onComplete={handleRefresh}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {reconciliationReport && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Reconciliation Report</h3>
                {lastReconciledAt && (
                  <span className="text-sm text-muted-foreground">
                    Last reconciled: {new Date(lastReconciledAt).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-5 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{reconciliationReport.total}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-green-600 dark:text-green-400">Approved</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{reconciliationReport.approved}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{reconciliationReport.pending}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-red-600 dark:text-red-400">Errors</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{reconciliationReport.error}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Not Submitted</p>
                  <p className="text-2xl font-bold">{reconciliationReport.notSubmitted}</p>
                </div>
              </div>
              {reconciliationReport.missingInEmp?.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    ⚠️ {reconciliationReport.missingInEmp.length} transaction(s) were submitted but not found in EMP
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Transaction Records</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                <span className="text-muted-foreground">Synced (Approved)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                <span className="text-muted-foreground">Error</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-sm"></div>
                <span className="text-muted-foreground">Not Synced</span>
              </div>
            </div>
          </div>
          <TableClient
            title=""
            subtitle=""
            headers={headers}
            records={records}
            rowStatuses={rows.map((r: any) => r?.status || 'pending')}
            rowErrors={rows.map((r: any) => r?.empError || r?.emp?.technicalMessage || r?.emp?.message)}
            uploadId={id}
            onRowEdited={handleRefresh}
          />
        </CardContent>
      </Card>

      <Button asChild variant="ghost" className="gap-2">
        <Link href="/emp">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </Button>
    </div>
  )
}

