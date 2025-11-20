'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Download, RefreshCw, AlertCircle, FileDown, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { exportChargebackExtractionPDF } from '@/lib/pdf-export'

interface ChargebackExtraction {
  filename: string
  uploadDate: string
  totalTransactions: number
  chargebacks: Array<{
    transactionId: string
    originalTransactionUniqueId: string
    amount: number
    postDate: string
    reasonCode: string
    reasonDescription: string
    customerName?: string
    iban?: string
  }>
  previousChargebacks?: Array<any>
}

interface ApiResponse {
  success: boolean
  batches: ChargebackExtraction[]
  totalBatches: number
  totalChargebacks: number
  error?: string
}

export default function ChargebackExtractionPage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/emp/analytics/chargeback-extraction?t=${Date.now()}`, {
        cache: 'no-store',
      })
      const json = await response.json()
      setData(json)
      
      if (json.success) {
        toast.success('Chargeback extraction completed')
      }
    } catch (error) {
      console.error('Error loading chargeback extraction:', error)
      toast.error('Failed to load chargeback extraction')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleExportPDF = () => {
    if (!data || !data.batches) {
      toast.error('No data available to export')
      return
    }

    try {
      exportChargebackExtractionPDF({
        dateRange: 'All cached data',
        batches: data.batches,
      })
      
      toast.success('PDF report generated successfully')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF report')
    }
  }

  const handleDownloadCSV = async (filename: string, type: 'chargebacks' | 'clean') => {
    try {
      const typeLabel = type === 'chargebacks' ? 'chargebacks' : 'clean transactions'
      toast.info(`Generating ${typeLabel} CSV...`)
      
      const response = await fetch(
        `/api/emp/analytics/chargeback-extraction/csv?filename=${encodeURIComponent(filename)}&type=${type}`
      )
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to generate ${typeLabel} CSV`)
      }

      // Create download link
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const suffix = type === 'chargebacks' ? '_chargebacks' : '_clean'
      a.download = `${filename}${suffix}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success(`${typeLabel} CSV downloaded successfully`)
    } catch (error: any) {
      console.error('Error downloading CSV:', error)
      toast.error(error.message || 'Failed to download CSV')
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link href="/emp/analytics">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Chargeback Extraction</h1>
                <p className="text-muted-foreground">
                  Extract chargebacks by file for client correction and reconciliation
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportPDF} disabled={loading || !data} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button onClick={loadData} disabled={loading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Purpose of this report
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  This extraction groups chargebacks by their original upload file. Use this to:
                </p>
                <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1 ml-4">
                  <li>Download CSV with <strong>chargebacks only</strong> to send to clients for correction</li>
                  <li>Download CSV with <strong>clean transactions only</strong> (without chargebacks) for re-submission</li>
                  <li>Identify which uploaded files had chargebacks</li>
                  <li>Track chargeback patterns per file/batch</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {data && !data.error && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Files with CBs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalBatches}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Chargebacks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{data.totalChargebacks}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Amount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  €{(data.batches.reduce((sum, b) => sum + b.chargebacks.reduce((s, cb) => s + cb.amount, 0), 0) / 100).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {loading && !data ? (
          <Card>
            <CardContent className="p-12 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Extracting chargebacks...</p>
            </CardContent>
          </Card>
        ) : data?.error ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
              <p className="text-red-600">{data.error}</p>
            </CardContent>
          </Card>
        ) : data?.batches && data.batches.length > 0 ? (
          <div className="space-y-4">
            {data.batches.map((batch, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{batch.filename}</CardTitle>
                      <CardDescription>
                        Uploaded: {new Date(batch.uploadDate).toLocaleDateString()} | 
                        Total Transactions: {batch.totalTransactions.toLocaleString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 items-start">
                      <Button
                        onClick={() => handleDownloadCSV(batch.filename, 'chargebacks')}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <FileDown className="h-4 w-4" />
                        Chargebacks Only
                      </Button>
                      <Button
                        onClick={() => handleDownloadCSV(batch.filename, 'clean')}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Clean Only
                      </Button>
                      <Badge variant="destructive">
                        {batch.chargebacks.length} CBs
                      </Badge>
                      {batch.previousChargebacks && (
                        <Badge variant="outline">
                          {batch.previousChargebacks.length} Previous
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : data ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No batches found with chargebacks in cache.</p>
              <p className="text-sm text-muted-foreground mt-2">Make sure to sync chargebacks first from the Analytics page.</p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}

