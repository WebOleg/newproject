"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import Link from 'next/link'
import { Upload, Search, RefreshCw, FileEdit, Trash2, Eye, CheckCircle, HelpCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export default function EmpHome() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploads, setUploads] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [isLoadingUploads, setIsLoadingUploads] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setIsLoadingUploads(true)
        const params = new URLSearchParams()
        if (q) params.set('q', q)
        const res = await fetch('/api/emp/uploads' + (params.toString() ? `?${params.toString()}` : ''))
        const data = await res.json()
        if (!cancelled && res.ok) setUploads(data.items || [])
      } catch (err) {
        if (!cancelled) toast.error('Failed to load upload history')
      } finally {
        if (!cancelled) setIsLoadingUploads(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [q])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!file) {
      toast.error('⚠️ Please select a CSV file first')
      return
    }
    
    const form = new FormData()
    form.append('file', file)
    setIsUploading(true)
    toast.info('📤 Uploading and parsing CSV file...')
    
    try {
      const res = await fetch('/api/emp/upload', {
        method: 'POST',
        body: form,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Upload failed')

      const totalRecords = Number(data?.totalRecords ?? data?.count ?? 0)
      const partCount = Number(data?.parts ?? 1)
      const uploadsCreated = Array.isArray(data?.uploads) ? data.uploads : []
      const rangeMessage = partCount > 1 && uploadsCreated.length > 0
        ? ` Split into ${partCount} batches (${uploadsCreated.map((u: any) => `${u.recordCount} rows`).join(', ')}).`
        : ''
      toast.success(`✅ Success! ${totalRecords} transactions loaded from ${file.name}.${rangeMessage}`)
      setFile(null)
      
      // Clear the file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      
      // refresh list
      try {
        const r = await fetch('/api/emp/uploads')
        const j = await r.json()
        if (r.ok) setUploads(j.items || [])
      } catch {}
    } catch (err: any) {
      toast.error(`❌ Upload failed: ${err?.message || 'Unknown error'}`)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Upload CSV File</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">Upload your CSV file containing transaction data. The file should include customer details, amounts, and IBANs.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <HelpCircle className="h-4 w-4" />
                    Help
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>How to use the EMP portal</DialogTitle>
                    <DialogDescription>
                      Quick reference for uploads, syncing and reconciliation.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-semibold">CSV requirements</h4>
                      <ul className="mt-2 space-y-1 list-disc pl-5">
                        <li>Only CSV files are supported (max 50&nbsp;MB per file).</li>
                        <li>We accept up to 50,000 rows per upload. Files with more than 2,500 rows are automatically split into batches of 2,500.</li>
                        <li>Each batch appears as a separate upload (e.g. <em>Part 1/4</em>) in the history table.</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold">Workflow</h4>
                      <ul className="mt-2 space-y-1 list-disc pl-5">
                        <li>After uploading, open the upload to review and edit records before syncing.</li>
                        <li>Use “Submit All to Gateway” to send a batch to Genesis/EMP.</li>
                        <li>Run “Reconcile” to refresh statuses from Genesis.</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold">Mapping &amp; support</h4>
                      <ul className="mt-2 space-y-1 list-disc pl-5">
                        <li>If you receive a CSV in a <strong>new format</strong>, contact Kiril for a mapping review before syncing.</li>
                        <li>Email: <a className="underline" href="mailto:kiriltsanov12@gmail.com">kiriltsanov12@gmail.com</a></li>
                        <li>Telegram: <a className="underline" href="https://t.me/+359888010283" target="_blank" rel="noopener noreferrer">+359&nbsp;888&nbsp;010&nbsp;283</a></li>
                      </ul>
                    </div>
                    <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                      Tip: keep each CSV’s headers consistent. If a column is renamed, let us know so we can update the field mapping and avoid validation errors.
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <CardDescription>Select a CSV file to process SEPA Direct Debit transactions (max 50MB, 50,000 records)</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="flex-1"
                  disabled={isUploading}
                />
                <Button 
                  type="submit" 
                  disabled={!file || isUploading} 
                  className="gap-2 sm:min-w-[120px]"
                  size="lg"
                >
                  <Upload className="h-4 w-4" />
                  {isUploading ? 'Uploading…' : 'Upload File'}
                </Button>
              </div>
              {file && (
                <p className="text-sm text-muted-foreground">
                  Selected: <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upload History</CardTitle>
                <CardDescription>View and manage your uploaded CSV files</CardDescription>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p className="text-sm"><strong>View:</strong> See transaction details</p>
                  <p className="text-sm"><strong>Sync:</strong> Submit to payment gateway</p>
                  <p className="text-sm"><strong>Reconcile:</strong> Check status with gateway</p>
                  <p className="text-sm"><strong>Replace:</strong> Upload new version</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by filename..." 
                  value={q} 
                  onChange={(e) => setQ(e.target.value)} 
                  className="pl-9"
                />
              </div>
            </div>
          <div className="rounded-md border">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="py-3 px-4 text-left text-sm font-medium">Filename</th>
                  <th className="py-3 px-4 text-left text-sm font-medium">Records</th>
                  <th className="py-3 px-4 text-left text-sm font-medium">Approved</th>
                  <th className="py-3 px-4 text-left text-sm font-medium">Errors</th>
                  <th className="py-3 px-4 text-left text-sm font-medium">Uploaded</th>
                  <th className="py-3 px-4 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingUploads ? (
                  <tr>
                    <td className="py-12 text-center text-sm text-muted-foreground" colSpan={6}>
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground/50" />
                        <p>Loading uploads...</p>
                      </div>
                    </td>
                  </tr>
                ) : uploads.map((u) => (
                  <tr key={u._id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-sm">{u.filename}</td>
                    <td className="py-3 px-4 text-sm">{u.recordCount}</td>
                    <td className="py-3 px-4 text-sm text-green-600 dark:text-green-400">{u.approvedCount ?? 0}</td>
                    <td className="py-3 px-4 text-sm text-red-600 dark:text-red-400">{u.errorCount ?? 0}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{new Date(u.createdAt).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/emp/uploads/${u._id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View details</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async (e) => {
                                e.preventDefault()
                                try {
                                  toast.info('Checking status with payment gateway...')
                                  const res = await fetch(`/api/emp/reconcile/${u._id}`, { method: 'POST' })
                                  const j = await res.json()
                                  if (!res.ok) throw new Error(j?.error || 'Failed to check status')
                                  const report = j.report
                                  toast.success(`Status updated: ${report.approved} approved, ${report.error} errors`)
                                  const r = await fetch('/api/emp/uploads' + (q ? `?q=${encodeURIComponent(q)}` : ''))
                                  const jj = await r.json()
                                  if (r.ok) setUploads(jj.items || [])
                                } catch (err: any) {
                                  toast.error(err?.message || 'Failed to check status')
                                }
                              }}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Check status</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <label className="inline-flex items-center justify-center h-8 w-8 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors cursor-pointer">
                              <FileEdit className="h-4 w-4" />
                              <input type="file" accept=".csv,text/csv" className="hidden" onChange={async (e) => {
                                const f = e.target.files?.[0]
                                if (!f) return
                                const fd = new FormData()
                                fd.append('file', f)
                                try {
                                  toast.info('Replacing file...')
                                  const res = await fetch(`/api/emp/uploads/replace/${u._id}`, { method: 'POST', body: fd })
                                  const j = await res.json()
                                  if (!res.ok) throw new Error(j?.error || 'Replace failed')
                                  toast.success('File replaced successfully')
                                  const r = await fetch('/api/emp/uploads' + (q ? `?q=${encodeURIComponent(q)}` : ''))
                                  const jj = await r.json()
                                  if (r.ok) setUploads(jj.items || [])
                                } catch (err: any) {
                                  toast.error(err?.message || 'Replace failed')
                                }
                              }} />
                            </label>
                          </TooltipTrigger>
                          <TooltipContent>Replace with new file</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={async (e) => {
                                e.preventDefault()
                                if (!confirm('Are you sure you want to delete this upload? This action cannot be undone.')) return
                                try {
                                  const res = await fetch(`/api/emp/uploads/delete/${u._id}`, { method: 'DELETE' })
                                  const j = await res.json()
                                  if (!res.ok) throw new Error(j?.error || 'Delete failed')
                                  toast.success('Upload deleted successfully')
                                  setUploads((prev) => prev.filter((x) => x._id !== u._id))
                                } catch (err: any) {
                                  toast.error(err?.message || 'Delete failed')
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete upload</TooltipContent>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoadingUploads && uploads.length === 0 && (
                  <tr>
                    <td className="py-12 text-center" colSpan={6}>
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Upload className="h-12 w-12 text-muted-foreground/30" />
                        <p className="font-medium">No uploads yet</p>
                        <p className="text-sm">Upload a CSV file above to get started</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      </div>
    </TooltipProvider>
  )
}

