"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  ShieldAlert,
  Activity,
  TrendingDown
} from 'lucide-react'
import Link from 'next/link'

interface BankAnalysisItem {
  bank: string
  countryCode: string
  md01Count: number
  approvedCount: number
  totalTransactions: number
  md01Percentage: number
  approvedPercentage: number
}

interface MD01AnalysisData {
  bankAnalysis: BankAnalysisItem[]
  summary: {
    totalMd01: number
    totalApproved: number
    totalTransactions: number
    overallMd01Rate: string
    numberOfBanks: number
  }
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6']

export default function MD01AnalysisPage() {
  const [data, setData] = useState<MD01AnalysisData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/emp/analytics/md01-by-bank`)
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to fetch MD01 analysis')
      setData(result)
    } catch (error: any) {
      console.error('MD01 analysis error:', error)
      toast.error('Failed to load MD01 analysis')
    } finally {
      setIsLoading(false)
    }
  }

  async function refreshData() {
    setIsRefreshing(true)
    try {
      await loadData()
      toast.success('Data refreshed')
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No data available</p>
      </div>
    )
  }

  // Prepare chart data
  const chartData = data.bankAnalysis.map((item, index) => ({
    ...item,
    name: item.bank,
    fill: COLORS[index % COLORS.length]
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/emp/analytics">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Analytics
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-destructive" />
            MD01 Chargeback Analysis by Bank
          </h1>
          <p className="text-muted-foreground">Missing or Invalid Mandate chargebacks grouped by bank</p>
        </div>
        <Button onClick={refreshData} disabled={isRefreshing} className="gap-2" variant="outline">
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total MD01s</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{data.summary.totalMd01.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Missing/Invalid Mandate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Txs</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.summary.totalApproved.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">To affected banks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Txs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalTransactions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Approved + MD01</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MD01 Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.overallMd01Rate}%</div>
            <p className="text-xs text-muted-foreground">Overall rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banks</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.numberOfBanks}</div>
            <p className="text-xs text-muted-foreground">With MD01s</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MD01 Count by Bank */}
        <Card>
          <CardHeader>
            <CardTitle>MD01 Chargebacks by Bank</CardTitle>
            <CardDescription>Number of MD01 chargebacks per bank</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={120}
                  interval={0}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as BankAnalysisItem
                      return (
                        <div className="rounded-md border bg-background p-3 text-sm shadow-lg">
                          <div className="font-semibold mb-1">{data.bank}</div>
                          <div className="text-destructive font-medium">MD01: {data.md01Count}</div>
                          <div className="text-green-600">Approved: {data.approvedCount}</div>
                          <div className="text-muted-foreground">Total: {data.totalTransactions}</div>
                          <div className="mt-1 pt-1 border-t">
                            <div className="text-destructive text-xs">MD01 Rate: {data.md01Percentage.toFixed(2)}%</div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend />
                <Bar dataKey="md01Count" name="MD01 Count" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* MD01 Percentage Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>MD01 Rate by Bank</CardTitle>
            <CardDescription>Percentage of transactions that are MD01 chargebacks</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={120}
                  interval={0}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as BankAnalysisItem
                      return (
                        <div className="rounded-md border bg-background p-3 text-sm shadow-lg">
                          <div className="font-semibold mb-1">{data.bank}</div>
                          <div className="text-destructive font-medium">MD01 Rate: {data.md01Percentage.toFixed(2)}%</div>
                          <div className="text-green-600">Approved Rate: {data.approvedPercentage.toFixed(2)}%</div>
                          <div className="mt-1 pt-1 border-t text-muted-foreground">
                            <div>MD01: {data.md01Count} / {data.totalTransactions}</div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend />
                <Bar dataKey="md01Percentage" name="MD01 Rate %" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Approved vs MD01 Stacked */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Approved Transactions vs MD01 Chargebacks by Bank</CardTitle>
            <CardDescription>Distribution of approved and MD01 chargebacks for each bank</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={500}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  interval={0}
                  tick={{ fontSize: 10 }}
                />
                <YAxis />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as BankAnalysisItem
                      return (
                        <div className="rounded-md border bg-background p-3 text-sm shadow-lg">
                          <div className="font-semibold mb-2">{data.bank}</div>
                          <div className="space-y-1">
                            <div className="text-green-600 font-medium">
                              Approved: {data.approvedCount} ({data.approvedPercentage.toFixed(2)}%)
                            </div>
                            <div className="text-destructive font-medium">
                              MD01: {data.md01Count} ({data.md01Percentage.toFixed(2)}%)
                            </div>
                            <div className="pt-1 border-t text-muted-foreground">
                              Total: {data.totalTransactions}
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend />
                <Bar dataKey="approvedCount" fill="#22c55e" name="Approved" stackId="a" />
                <Bar dataKey="md01Count" fill="#ef4444" name="MD01" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart - MD01 Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>MD01 Distribution by Bank</CardTitle>
            <CardDescription>Share of MD01 chargebacks per bank</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={chartData.slice(0, 8)} // Show top 8 banks
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.bank}: ${entry.md01Count}`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="md01Count"
                >
                  {chartData.slice(0, 8).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as BankAnalysisItem
                      const percentage = (data.md01Count / data.summary.totalMd01) * 100
                      return (
                        <div className="rounded-md border bg-background p-3 text-sm shadow-lg">
                          <div className="font-semibold mb-1">{data.bank}</div>
                          <div className="text-destructive font-medium">MD01: {data.md01Count}</div>
                          <div className="text-muted-foreground text-xs">
                            {percentage.toFixed(1)}% of all MD01s
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bank Percentages Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Approved Transaction Distribution</CardTitle>
            <CardDescription>Share of approved transactions per bank</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={chartData.slice(0, 8)} // Show top 8 banks
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.bank}: ${entry.approvedCount}`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="approvedCount"
                >
                  {chartData.slice(0, 8).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as BankAnalysisItem
                      const percentage = (data.approvedCount / data.summary.totalApproved) * 100
                      return (
                        <div className="rounded-md border bg-background p-3 text-sm shadow-lg">
                          <div className="font-semibold mb-1">{data.bank}</div>
                          <div className="text-green-600 font-medium">Approved: {data.approvedCount}</div>
                          <div className="text-muted-foreground text-xs">
                            {percentage.toFixed(1)}% of all approved
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Bank Analysis</CardTitle>
          <CardDescription>Complete breakdown of MD01 chargebacks and approved transactions by bank</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="py-3 px-4 text-left text-sm font-medium">Bank Code</th>
                  <th className="py-3 px-4 text-left text-sm font-medium">Country</th>
                  <th className="py-3 px-4 text-right text-sm font-medium">MD01 Count</th>
                  <th className="py-3 px-4 text-right text-sm font-medium">Approved Count</th>
                  <th className="py-3 px-4 text-right text-sm font-medium">Total Txs</th>
                  <th className="py-3 px-4 text-right text-sm font-medium">MD01 %</th>
                  <th className="py-3 px-4 text-right text-sm font-medium">Approved %</th>
                </tr>
              </thead>
              <tbody>
                {data.bankAnalysis.map((item, idx) => (
                  <tr key={idx} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-3 px-4 text-sm font-mono font-medium">{item.bank}</td>
                    <td className="py-3 px-4 text-sm">{item.countryCode}</td>
                    <td className="py-3 px-4 text-sm text-right text-destructive font-medium">
                      {item.md01Count.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-green-600 font-medium">
                      {item.approvedCount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-medium">
                      {item.totalTransactions.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        item.md01Percentage > 50
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : item.md01Percentage > 25
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {item.md01Percentage.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        item.approvedPercentage > 75
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : item.approvedPercentage > 50
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}>
                        {item.approvedPercentage.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/30 border-t-2">
                <tr>
                  <td className="py-3 px-4 text-sm font-bold" colSpan={2}>TOTAL</td>
                  <td className="py-3 px-4 text-sm text-right font-bold text-destructive">
                    {data.summary.totalMd01.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-bold text-green-600">
                    {data.summary.totalApproved.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-bold">
                    {data.summary.totalTransactions.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-bold">
                    {data.summary.overallMd01Rate}%
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-bold">
                    {(100 - parseFloat(data.summary.overallMd01Rate)).toFixed(2)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
