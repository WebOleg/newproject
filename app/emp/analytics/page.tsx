"use client"

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  AlertTriangle, 
  RefreshCw, 
  Calendar,
  Activity,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  FileText,
  Download
} from 'lucide-react'
import Link from 'next/link'
import { exportAnalyticsPDF } from '@/lib/pdf-export'

interface Transaction {
  uniqueId: string
  transactionId: string
  transactionDate: string
  type: string
  amount: number
  currency: string
  status: string
  cardScheme: string
  cardPresent: boolean
  cardNumber?: string
  authCode?: string
  arn?: string
  bankAccountNumber?: string
}

interface Chargeback {
  arn: string
  uniqueId: string
  type: string
  postDate: string
  reasonCode: string
  reasonDescription: string
  amount: number
  currency: string
  cardNumber: string
}

interface AnalyticsData {
  transactions: Transaction[]
  chargebacks: Chargeback[]
  loading: boolean
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c']

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    transactions: [],
    chargebacks: [],
    loading: true,
  })

  const [dateRange, setDateRange] = useState({
    startDate: getDefaultStartDate(),
    endDate: getDefaultEndDate(),
  })

  const [transactionFilters, setTransactionFilters] = useState({
    search: '',
    status: 'all',
    type: 'all',
    page: 1,
    perPage: 25,
  })

  const [chargebackFilters, setChargebackFilters] = useState({
    search: '',
    reasonCode: 'all',
    page: 1,
    perPage: 25,
  })

  useEffect(() => {
    loadFromCache()
  }, [])

  async function fetchAnalyticsData(dumpAll = false) {
    setData(prev => ({ ...prev, loading: true }))
    
    try {
      const dumpParam = dumpAll ? '&dump_all=true' : ''
      const [transactionsRes, chargebacksRes] = await Promise.all([
        fetch(`/api/emp/analytics/transactions?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}${dumpParam}`),
        fetch(`/api/emp/analytics/chargebacks?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}${dumpParam}`),
      ])

      const transactionsData = await transactionsRes.json()
      const chargebacksData = await chargebacksRes.json()

      if (!transactionsRes.ok) {
        throw new Error(transactionsData.error || 'Failed to fetch transactions')
      }

      setData({
        transactions: transactionsData.transactions || [],
        chargebacks: chargebacksData.chargebacks || [],
        loading: false,
      })

      toast.success(`Loaded ${transactionsData.transactions?.length || 0} transactions and ${chargebacksData.chargebacks?.length || 0} chargebacks`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch analytics data')
      setData(prev => ({ ...prev, loading: false }))
    }
  }

  async function loadFromCache() {
    setData(prev => ({ ...prev, loading: true }))
    try {
      const [txRes, cbRes] = await Promise.all([
        fetch(`/api/emp/analytics/cache/transactions?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`),
        fetch(`/api/emp/analytics/cache/chargebacks?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`),
      ])
      const tx = await txRes.json()
      const cb = await cbRes.json()
      setData({
        transactions: tx.transactions || [],
        chargebacks: cb.chargebacks || [],
        loading: false,
      })
      toast.success(`Loaded from cache: ${tx.count || 0} tx, ${cb.count || 0} chargebacks`)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load from cache')
      setData(prev => ({ ...prev, loading: false }))
    }
  }

  async function resyncTransactions() {
    try {
      toast.info('Resyncing transactions...')
      const res = await fetch(`/api/emp/analytics/cache/transactions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ start_date: dateRange.startDate, end_date: dateRange.endDate }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Resync failed')
      toast.success(`Transactions resynced: ${j.saved || 0} saved`)
      await loadFromCache()
    } catch (e: any) {
      toast.error(e?.message || 'Resync failed')
    }
  }

  async function resyncChargebacks() {
    try {
      toast.info('Resyncing chargebacks...')
      const res = await fetch(`/api/emp/analytics/cache/chargebacks`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ start_date: dateRange.startDate, end_date: dateRange.endDate }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Resync failed')
      toast.success(`Chargebacks resynced: ${j.saved || 0} saved`)
      await loadFromCache()
    } catch (e: any) {
      toast.error(e?.message || 'Resync failed')
    }
  }

  function handleDateRangeChange(field: 'startDate' | 'endDate', value: string) {
    setDateRange(prev => ({ ...prev, [field]: value }))
  }

  // Filter transactions based on search and filters
  const filteredTransactions = useMemo(() => {
    let filtered = data.transactions

    // Search filter (transaction ID, card number, unique ID)
    if (transactionFilters.search) {
      const searchLower = transactionFilters.search.toLowerCase()
      filtered = filtered.filter(tx => 
        tx.transactionId?.toLowerCase().includes(searchLower) ||
        tx.uniqueId?.toLowerCase().includes(searchLower) ||
        tx.cardNumber?.toLowerCase().includes(searchLower) ||
        tx.bankAccountNumber?.toLowerCase().includes(searchLower)
      )
    }

    // Status filter
    if (transactionFilters.status !== 'all') {
      filtered = filtered.filter(tx => tx.status?.toLowerCase() === transactionFilters.status)
    }

    // Type filter
    if (transactionFilters.type !== 'all') {
      filtered = filtered.filter(tx => tx.type?.toLowerCase() === transactionFilters.type)
    }

    return filtered
  }, [data.transactions, transactionFilters.search, transactionFilters.status, transactionFilters.type])

  // Paginate transactions
  const paginatedTransactions = useMemo(() => {
    const start = (transactionFilters.page - 1) * transactionFilters.perPage
    const end = start + transactionFilters.perPage
    return filteredTransactions.slice(start, end)
  }, [filteredTransactions, transactionFilters.page, transactionFilters.perPage])

  const totalTxPages = Math.ceil(filteredTransactions.length / transactionFilters.perPage)

  // Filter chargebacks based on search and filters
  const filteredChargebacks = useMemo(() => {
    let filtered = data.chargebacks

    // Search filter (ARN, unique ID, card number)
    if (chargebackFilters.search) {
      const searchLower = chargebackFilters.search.toLowerCase()
      filtered = filtered.filter(cb => 
        cb.arn?.toLowerCase().includes(searchLower) ||
        cb.uniqueId?.toLowerCase().includes(searchLower) ||
        cb.cardNumber?.toLowerCase().includes(searchLower)
      )
    }

    // Reason code filter
    if (chargebackFilters.reasonCode !== 'all') {
      filtered = filtered.filter(cb => cb.reasonCode?.toLowerCase() === chargebackFilters.reasonCode)
    }

    return filtered
  }, [data.chargebacks, chargebackFilters.search, chargebackFilters.reasonCode])

  // Paginate chargebacks
  const paginatedChargebacks = useMemo(() => {
    const start = (chargebackFilters.page - 1) * chargebackFilters.perPage
    const end = start + chargebackFilters.perPage
    return filteredChargebacks.slice(start, end)
  }, [filteredChargebacks, chargebackFilters.page, chargebackFilters.perPage])

  const totalCbPages = Math.ceil(filteredChargebacks.length / chargebackFilters.perPage)

  // Get unique statuses and types for filter dropdowns
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(data.transactions.map(tx => tx.status?.toLowerCase()).filter(Boolean))
    return Array.from(statuses).sort()
  }, [data.transactions])

  const uniqueTypes = useMemo(() => {
    const types = new Set(data.transactions.map(tx => tx.type?.toLowerCase()).filter(Boolean))
    return Array.from(types).sort()
  }, [data.transactions])

  const uniqueReasonCodes = useMemo(() => {
    const codes = new Set(data.chargebacks.map(cb => cb.reasonCode?.toLowerCase()).filter(Boolean))
    return Array.from(codes).sort()
  }, [data.chargebacks])

  // Calculate statistics
  const stats = calculateStats(data.transactions, data.chargebacks)

  // PDF export handler
  const handleExportPDF = () => {
    try {
      const totalVolume = data.transactions
        .filter(t => ['approved', 'pending_async'].includes(t.status?.toLowerCase()))
        .reduce((sum, t) => sum + (t.amount || 0), 0) / 100 // Convert to major units
      
      const avgTransaction = stats.totalTransactions > 0 
        ? totalVolume / stats.totalTransactions 
        : 0

      const typeData = stats.transactionsByType.map(t => ({
        name: t.name,
        value: t.value,
        percentage: ((t.value / stats.allTransactionsCount) * 100).toFixed(1) + '%'
      }))

      const statusData = stats.transactionsByStatus.map(s => ({
        name: s.name,
        value: s.value,
        percentage: ((s.value / stats.allTransactionsCount) * 100).toFixed(1) + '%'
      }))

      const schemeData = stats.transactionsByScheme.map(s => ({
        name: s.name,
        value: s.value,
        percentage: ((s.value / stats.totalTransactions) * 100).toFixed(1) + '%'
      }))

      exportAnalyticsPDF({
        dateRange: `${dateRange.startDate} to ${dateRange.endDate}`,
        stats: {
          totalTransactions: stats.totalTransactions,
          totalVolume,
          totalChargebacks: stats.totalChargebacks,
          chargebackRate: stats.chargebackRate,
          averageTransaction: avgTransaction,
        },
        typeData,
        statusData,
        schemeData,
        transactions: filteredTransactions,
        chargebacks: data.chargebacks,
      })
      
      toast.success('PDF report generated successfully')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF report')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Transaction insights and chargeback overview</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button onClick={handleExportPDF} disabled={data.loading} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
          <Link href="/emp/analytics/batch-chargebacks">
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Batch Analysis
            </Button>
          </Link>
          <Link href="/emp/analytics/chargeback-extraction">
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              CB Extraction
            </Button>
          </Link>
          <Button onClick={() => {resyncTransactions(); resyncChargebacks()}} disabled={data.loading} className="gap-2" variant="outline">
            <RefreshCw className={`h-4 w-4 ${data.loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Range Filter
          </CardTitle>
          <CardDescription>Select the date range for analytics data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={loadFromCache} disabled={data.loading}>
                Apply Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Approved + Pending transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVolume}</div>
            <p className="text-xs text-muted-foreground">Transaction volume</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chargebacks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.totalChargebacks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Disputed transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chargeback Rate</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.chargebackRate}</div>
            <p className="text-xs text-muted-foreground">Of total transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Transactions by Type
            </CardTitle>
            <CardDescription>Distribution of transaction types</CardDescription>
          </CardHeader>
          <CardContent>
            {data.loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.transactionsByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.transactionsByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Transaction Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Transaction Status
            </CardTitle>
            <CardDescription>Status distribution overview</CardDescription>
          </CardHeader>
          <CardContent>
            {data.loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.transactionsByStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Card Schemes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Card Schemes
            </CardTitle>
            <CardDescription>Transactions by card network</CardDescription>
          </CardHeader>
          <CardContent>
            {data.loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.transactionsByScheme}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.transactionsByScheme.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Transaction Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Transaction Timeline
            </CardTitle>
            <CardDescription>Daily transaction volume</CardDescription>
          </CardHeader>
          <CardContent>
            {data.loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.transactionTimeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" name="Transactions" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Transactions List
          </CardTitle>
          <CardDescription>All fetched transactions with details</CardDescription>
        </CardHeader>
        <CardContent>
          {data.loading ? (
            <div className="h-[200px] flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : data.transactions.length === 0 ? (
            <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
              <Activity className="h-12 w-12 mb-2 text-muted-foreground/30" />
              <p className="font-medium">No transactions found</p>
              <p className="text-sm">Try adjusting the date range filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                <div className="flex-1 w-full">
                  <Label htmlFor="txSearch" className="text-sm mb-1.5 flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Search Transactions
                  </Label>
                  <Input
                    id="txSearch"
                    type="text"
                    placeholder="Search by ID, card number, or account..."
                    value={transactionFilters.search}
                    onChange={(e) => setTransactionFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                <div className="w-full sm:w-[180px]">
                  <Label htmlFor="txStatus" className="text-sm mb-1.5 flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Status
                  </Label>
                  <Select
                    value={transactionFilters.status}
                    onValueChange={(value) => setTransactionFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger id="txStatus">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {uniqueStatuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-[180px]">
                  <Label htmlFor="txType" className="text-sm mb-1.5">Type</Label>
                  <Select
                    value={transactionFilters.type}
                    onValueChange={(value) => setTransactionFilters(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger id="txType">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {uniqueTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(transactionFilters.search || transactionFilters.status !== 'all' || transactionFilters.type !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTransactionFilters(prev => ({ ...prev, search: '', status: 'all', type: 'all', page: 1 }))}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {((transactionFilters.page - 1) * transactionFilters.perPage) + 1} - {Math.min(transactionFilters.page * transactionFilters.perPage, filteredTransactions.length)} of {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
                  {filteredTransactions.length !== data.transactions.length && ` (filtered from ${data.transactions.length})`}
                </p>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="border-b">
                      <th className="py-3 px-4 text-left text-sm font-medium">Date</th>
                      <th className="py-3 px-4 text-left text-sm font-medium">Transaction ID</th>
                      <th className="py-3 px-4 text-left text-sm font-medium">Type</th>
                      <th className="py-3 px-4 text-left text-sm font-medium">Amount</th>
                      <th className="py-3 px-4 text-left text-sm font-medium">Card</th>
                      <th className="py-3 px-4 text-left text-sm font-medium">Scheme</th>
                      <th className="py-3 px-4 text-left text-sm font-medium">Status</th>
                      <th className="py-3 px-4 text-left text-sm font-medium">Auth Code</th>
                      <th className="py-3 px-4 text-left text-sm font-medium">ARN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTransactions.map((tx, idx) => (
                      <tr key={idx} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 text-sm whitespace-nowrap">
                          {tx.transactionDate ? new Date(tx.transactionDate).toLocaleString() : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm font-mono text-xs max-w-[150px] truncate" title={tx.transactionId}>
                          {tx.transactionId || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {tx.type || 'unknown'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm font-medium">
                          {formatCurrency(tx.amount, tx.currency)}
                        </td>
                        <td className="py-3 px-4 text-sm font-mono text-xs">
                          {tx.cardNumber || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {tx.cardScheme || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            tx.status === 'approved' || tx.status === 'completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : tx.status === 'declined' || tx.status === 'error'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}>
                            {tx.status || 'completed'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm font-mono">
                          {tx.authCode || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm font-mono text-xs max-w-[150px] truncate" title={tx.arn}>
                          {tx.arn || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalTxPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="txPerPage" className="text-sm">Per page:</Label>
                    <Select
                      value={transactionFilters.perPage.toString()}
                      onValueChange={(value) => setTransactionFilters(prev => ({ ...prev, perPage: parseInt(value), page: 1 }))}
                    >
                      <SelectTrigger id="txPerPage" className="w-[80px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTransactionFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={transactionFilters.page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {transactionFilters.page} of {totalTxPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTransactionFilters(prev => ({ ...prev, page: Math.min(totalTxPages, prev.page + 1) }))}
                      disabled={transactionFilters.page === totalTxPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chargebacks Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            Chargeback Overview
            <Button variant="outline" className="gap-2 ml-auto">
            <FileText className="h-4 w-4" />
            Batch Analysis
          </Button>
          </CardTitle>
          <CardDescription>Detailed chargeback analysis with reason codes</CardDescription>

        </CardHeader>
        <CardContent>
          {data.loading ? (
            <div className="h-[200px] flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : data.chargebacks.length === 0 ? (
            <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mb-2 text-green-500" />
              <p className="font-medium">No chargebacks found</p>
              <p className="text-sm">Great news! No chargebacks in the selected period.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Chargebacks by Reason */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Chargebacks by Reason Code</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.chargebacksByReason} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="code" type="category" width={80} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const p: any = payload[0]
                          const d = p.payload
                          return (
                            <div className="rounded-md border bg-background p-2 text-sm">
                              <div className="font-mono">{d.code}</div>
                              <div className="text-muted-foreground max-w-[240px]">{d.description || 'No description'}</div>
                              <div className="mt-1">Count: {d.value}</div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend />
                    <Bar dataKey="value" fill="#ff4444" name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Chargeback Details Table */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Chargeback Details</h3>
                
                {/* Chargeback Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="flex-1 w-full">
                    <Label htmlFor="cbSearch" className="text-sm mb-1.5 flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Search Chargebacks
                    </Label>
                    <Input
                      id="cbSearch"
                      type="text"
                      placeholder="Search by ARN, unique ID, or card..."
                      value={chargebackFilters.search}
                      onChange={(e) => setChargebackFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                    />
                  </div>
                  <div className="w-full sm:w-[200px]">
                    <Label htmlFor="cbReason" className="text-sm mb-1.5 flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Reason Code
                    </Label>
                    <Select
                      value={chargebackFilters.reasonCode}
                      onValueChange={(value) => setChargebackFilters(prev => ({ ...prev, reasonCode: value, page: 1 }))}
                    >
                      <SelectTrigger id="cbReason">
                        <SelectValue placeholder="All Reasons" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Reasons</SelectItem>
                        {uniqueReasonCodes.map(code => (
                          <SelectItem key={code} value={code}>
                            {code.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {(chargebackFilters.search || chargebackFilters.reasonCode !== 'all') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setChargebackFilters({ search: '', reasonCode: 'all', page: 1, perPage: 25 })}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {((chargebackFilters.page - 1) * chargebackFilters.perPage) + 1} - {Math.min(chargebackFilters.page * chargebackFilters.perPage, filteredChargebacks.length)} of {filteredChargebacks.length} chargeback{filteredChargebacks.length !== 1 ? 's' : ''}
                    {filteredChargebacks.length !== data.chargebacks.length && ` (filtered from ${data.chargebacks.length})`}
                  </p>
                </div>

                <div className="rounded-md border">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr className="border-b">
                        <th className="py-3 px-4 text-left text-sm font-medium">Date</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">ARN / Tx ID</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Type</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Amount</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Reason</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedChargebacks.map((cb, idx) => (
                        <tr key={idx} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 text-sm">{cb.postDate}</td>
                          <td className="py-3 px-4 text-sm font-mono text-xs">{cb.arn || cb.uniqueId}</td>
                          <td className="py-3 px-4 text-sm">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              {cb.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-destructive">
                            {formatCurrency(cb.amount, cb.currency)}
                          </td>
                          <td className="py-3 px-4 text-sm font-mono">{cb.reasonCode}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground max-w-xs truncate" title={cb.reasonDescription}>
                            {cb.reasonDescription}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Chargeback Pagination Controls */}
                {totalCbPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="cbPerPage" className="text-sm">Per page:</Label>
                      <Select
                        value={chargebackFilters.perPage.toString()}
                        onValueChange={(value) => setChargebackFilters(prev => ({ ...prev, perPage: parseInt(value), page: 1 }))}
                      >
                        <SelectTrigger id="cbPerPage" className="w-[80px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setChargebackFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                        disabled={chargebackFilters.page === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {chargebackFilters.page} of {totalCbPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setChargebackFilters(prev => ({ ...prev, page: Math.min(totalCbPages, prev.page + 1) }))}
                        disabled={chargebackFilters.page === totalCbPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Helper functions
function getDefaultStartDate(): string {
  const date = new Date()
  //date.setFullYear(date.getFullYear() - 1)
  // last 30 days
  date.setDate(date.getDate() - 30)
  return date.toISOString().split('T')[0]
}

function getDefaultEndDate(): string {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date.toISOString().split('T')[0]
}

function calculateStats(transactions: Transaction[], chargebacks: Chargeback[]) {
  // Use ALL transactions from reconcile (5033) - DON'T filter out anything
  // The reconcile API gives us ALL transaction attempts
  const allTransactions = transactions
  
  // Active/successful transactions = approved + pending_async only (for KPIs)
  const activeTransactions = allTransactions.filter(t => {
    const status = t.status?.toLowerCase()
    return status === 'approved' || status === 'pending_async'
  })
  
  // Group ALL transactions by type (including everything from reconcile)
  const typeGroups = allTransactions.reduce((acc, t) => {
    const type = t.type?.toLowerCase() || 'unknown'
    // Skip chargeback TYPE from reconcile (those are duplicates, we use chargebacks API)
    if (type !== 'chargeback') {
      acc[type] = (acc[type] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  // Add REAL chargebacks from chargebacks API endpoint
  if (chargebacks.length > 0) {
    typeGroups['chargeback'] = chargebacks.length
  }

  const transactionsByType = Object.entries(typeGroups).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))

  // Group ALL transactions by status (including everything from reconcile)
  const statusGroups = allTransactions.reduce((acc, t) => {
    const status = t.status?.toLowerCase() || 'unknown'
    // Skip chargebacked STATUS from reconcile (those are flags, we use chargebacks API)
    if (status !== 'chargebacked') {
      acc[status] = (acc[status] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  // Add REAL chargebacks count from chargebacks API endpoint
  if (chargebacks.length > 0) {
    statusGroups['chargebacked'] = chargebacks.length
  }

  const transactionsByStatus = Object.entries(statusGroups).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))

  // Group transactions by card scheme (default to SEPA Direct Debit if empty)
  const schemeGroups = activeTransactions.reduce((acc, t) => {
    const scheme = t.cardScheme || 'SEPA Direct Debit'
    acc[scheme] = (acc[scheme] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const transactionsByScheme = Object.entries(schemeGroups).map(([name, value]) => ({
    name,
    value,
  }))

  // Transaction timeline
  const timelineGroups = activeTransactions.reduce((acc, t) => {
    const date = t.transactionDate?.split(' ')[0] || 'unknown'
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const transactionTimeline = Object.entries(timelineGroups)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Calculate total volume - use active transactions only
  const totalVolume = activeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
  const currencies = [...new Set(activeTransactions.map(t => t.currency))]
  const volumeFormatted = currencies.length === 1 
    ? formatCurrency(totalVolume, currencies[0])
    : formatCurrency(totalVolume, 'EUR') // Default to EUR if mixed

  // Chargeback rate - use active transactions for denominator
  const chargebackRate = activeTransactions.length > 0 
    ? ((chargebacks.length / activeTransactions.length) * 100).toFixed(2) + '%'
    : '0%'

  // Group chargebacks by reason
  const reasonCodeToCount: Record<string, number> = {}
  const reasonCodeToDesc: Record<string, string> = {}
  for (const cb of chargebacks) {
    const code = cb.reasonCode || 'UNK'
    reasonCodeToCount[code] = (reasonCodeToCount[code] || 0) + 1
    if (!reasonCodeToDesc[code] && cb.reasonDescription) {
      reasonCodeToDesc[code] = cb.reasonDescription
    }
  }
  const chargebacksByReason = Object.entries(reasonCodeToCount)
    .map(([code, value]) => ({ code, value, description: reasonCodeToDesc[code] || '' }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  return {
    totalTransactions: activeTransactions.length,
    totalVolume: volumeFormatted,
    totalChargebacks: chargebacks.length, // Real chargebacks from chargebacks API (435)
    chargebackRate,
    transactionsByType,
    transactionsByStatus,
    transactionsByScheme,
    transactionTimeline,
    chargebacksByReason,
    allTransactionsCount: allTransactions.length, // Total from reconcile (5033)
  }
}

function formatCurrency(amountMinor: number, currency: string): string {
  const major = amountMinor / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'EUR',
  }).format(major)
}

function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * Math.PI / 180)
  const y = cy + radius * Math.sin(-midAngle * Math.PI / 180)

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

