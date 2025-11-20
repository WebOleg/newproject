"use client"

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EditRowDialog } from '@/components/emp/edit-row-dialog'
import { RefreshCw, AlertCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

type Props = {
  title: string
  subtitle?: string
  headers: string[]
  records: Record<string, string>[]
  rowStatuses?: Array<'pending' | 'approved' | 'error' | undefined>
  rowErrors?: Array<string | undefined>
  uploadId?: string
  onRowEdited?: () => void
}

export function TableClient({ title, subtitle, headers, records, rowStatuses, rowErrors, uploadId, onRowEdited }: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query) return records.map((r, i) => ({ record: r, originalIndex: i }))
    const q = query.toLowerCase()
    return records
      .map((r, i) => ({ record: r, originalIndex: i }))
      .filter(({ record: row }) => headers.some((h) => (row[h] || '').toLowerCase().includes(q)))
  }, [records, query, headers])

  function exportCsv() {
    const delimiter = ','
    const headerLine = headers.join(delimiter)
    const lines = filtered.map(({ record: row }) => headers.map((h) => csvEscape(row[h] ?? '', delimiter)).join(delimiter))
    const content = [headerLine, ...lines].join('\n')
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/[^a-z0-9_-]+/gi, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  function getRowClassName(status?: 'pending' | 'approved' | 'error'): string {
    if (status === 'approved') {
      return 'bg-green-50/50 dark:bg-green-950/20 border-l-2 border-l-green-500'
    }
    if (status === 'error') {
      return 'bg-red-50/50 dark:bg-red-950/20 border-l-2 border-l-red-500'
    }
    return 'bg-muted/20 border-l-2 border-l-gray-300 dark:border-l-gray-600'
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-56"
          />
          <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
        </div>
      </div>

      <div className="overflow-auto max-h-[70vh] rounded-md border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-muted/60 backdrop-blur supports-[backdrop-filter]:bg-muted/40">
              {headers.map((h, i) => (
                <th
                  key={h}
                  className={
                    "py-2 px-3 text-left border-b font-medium " +
                    (i === 0 ? 'sticky left-0 bg-muted/60 backdrop-blur supports-[backdrop-filter]:bg-muted/40 z-10' : '')
                  }
                >
                  {h}
                </th>
              ))}
              <th className="py-2 px-3 text-right border-b font-medium sticky right-0 bg-muted/60 backdrop-blur supports-[backdrop-filter]:bg-muted/40 z-10">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 2000).map(({ record: row, originalIndex }, i) => {
              const status = rowStatuses?.[originalIndex]
              const errorMsg = rowErrors?.[originalIndex]
              const rowClass = getRowClassName(status)
              
              const handleResubmit = async () => {
                try {
                  toast.info('Re-submitting row...')
                  const res = await fetch(`/api/emp/row/${uploadId}/${originalIndex}`, { method: 'POST' })
                  const data = await res.json()
                  if (!res.ok) throw new Error(data?.error || 'Re-submit failed')
                  toast.success('Row re-submitted successfully')
                  if (onRowEdited) onRowEdited()
                } catch (err: any) {
                  toast.error(err?.message || 'Re-submit failed')
                }
              }

              const handleDelete = async () => {
                if (!confirm('Are you sure you want to delete this row? This action cannot be undone.')) {
                  return
                }
                
                try {
                  toast.info('Deleting row...')
                  const res = await fetch(`/api/emp/uploads/delete-row/${uploadId}/${originalIndex}`, { 
                    method: 'DELETE' 
                  })
                  const data = await res.json()
                  if (!res.ok) throw new Error(data?.error || 'Delete failed')
                  toast.success('Row deleted successfully')
                  if (onRowEdited) onRowEdited()
                } catch (err: any) {
                  toast.error(err?.message || 'Delete failed')
                }
              }
              
              return (
                <>
                  <tr key={i} className={rowClass}>
                    {headers.map((h, j) => (
                      <td
                        key={h}
                        className={
                          "py-1.5 px-3 whitespace-pre-wrap break-words align-top border-b max-w-[28rem] " +
                          (j === 0 ? 'sticky left-0 z-10 ' + (status === 'approved' ? 'bg-green-50/50 dark:bg-green-950/20' : status === 'error' ? 'bg-red-50/50 dark:bg-red-950/20' : 'bg-muted/20') : '')
                        }
                      >
                        {row[h] ?? ''}
                      </td>
                    ))}
                    <td className="py-1.5 px-3 text-right border-b sticky right-0 z-10 bg-white dark:bg-background shadow-[-4px_0_8px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center justify-end gap-1">
                        {uploadId && (
                          <>
                            <EditRowDialog
                              uploadId={uploadId}
                              rowIndex={originalIndex}
                              record={row}
                              headers={headers}
                              onSaved={onRowEdited}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5"
                              onClick={handleResubmit}
                            >
                              <RefreshCw className="h-3 w-3" />
                              Sync
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                              onClick={handleDelete}
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {errorMsg && (
                    <tr key={`${i}-error`}>
                      <td colSpan={headers.length + 1} className="py-2 px-3 bg-red-50 dark:bg-red-950/20 border-b border-l-2 border-l-red-500">
                        <div className="flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span className="font-medium">Error:</span>
                          <span>{errorMsg}</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td className="py-6 text-center text-muted-foreground" colSpan={headers.length || 1}>No results</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {filtered.length > 2000 && (
        <p className="text-xs text-muted-foreground">Showing first 2000 rows</p>
      )}
    </div>
  )
}

function csvEscape(value: string, delimiter: string): string {
  const needsQuotes = value.includes(delimiter) || value.includes('"') || value.includes('\n')
  let v = value.replace(/"/g, '""')
  return needsQuotes ? `"${v}"` : v
}


