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
  RefreshCw,
  Activity,
  AlertTriangle,
  TrendingUp,
  Calculator,
  Target
} from 'lucide-react'
import Link from 'next/link'

interface PendingAsyncByAmount {
  amount: number
  count: number
  currency: string
  percentage: string
  percentageNum: number
}

interface ThresholdData {
  threshold: number
  currentlyMeets: boolean
  neededApproved: number
  currentApproved: number
  additionalNeeded: number
}

interface AnalysisData {
  pendingAsync: {
    total: number
    byAmount: PendingAsyncByAmount[]
  }
  chargebackCalculator: {
    currentStats: {
      chargebacks: number
      approved: number
      total: number
      chargebackRate: string
      chargebackRateNum: number
    }
    thresholds: ThresholdData[]
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c']

export default function PendingAsyncAnalysisPage() {
  const [data, setData] = useState<AnalysisData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/emp/analytics/pending-async-analysis')
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to fetch data')
      setData(result)
    } catch (error: any) {
      console.error('Error loading data:', error)
      toast.error('Failed to load pending async analysis')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amountMinor: number, currency: string) => {
    const major = amountMinor / 100
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(major)
  }

  // Highlight 1.99 EUR (199 cents)
  const highlight199 = data?.pendingAsync.byAmount.find(item => item.amount === 199)
  const pending199Percentage = highlight199?.percentageNum || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pending Async & Chargeback Analysis</h1>
          <p className="text-muted-foreground">
            Breakdown of pending_async transactions by amount and chargeback ratio calculator
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/emp/analytics">
            <Button variant="outline">
              Back to Analytics
            </Button>
          </Link>
          <Button onClick={loadData} disabled={isLoading} className="gap-2" variant="outline">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading…' : 'Refresh'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[400px] flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !data ? (
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pending Async</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.pendingAsync.total.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Awaiting bank confirmation</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">1.99 EUR Pending</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {highlight199?.count || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {pending199Percentage.toFixed(1)}% of pending async
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current CB Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  data.chargebackCalculator.currentStats.chargebackRateNum >= 25
                    ? 'text-red-600'
                    : data.chargebackCalculator.currentStats.chargebackRateNum >= 15
                    ? 'text-yellow-600'
                    : 'text-green-600'
                }`}>
                  {data.chargebackCalculator.currentStats.chargebackRate}
                </div>
                <p className="text-xs text-muted-foreground">Chargeback ratio</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chargebacks</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {data.chargebackCalculator.currentStats.chargebacks.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  vs {data.chargebackCalculator.currentStats.approved.toLocaleString()} approved
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Async by Amount - Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Pending Async Transactions by Amount
                </CardTitle>
                <CardDescription>
                  Distribution of pending_async transactions across different amounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.pendingAsync.byAmount.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No pending async transactions found
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={data.pendingAsync.byAmount}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, payload }) => {
                          const radius = innerRadius + (outerRadius - innerRadius) * 0.5
                          const x = cx + radius * Math.cos(-midAngle * Math.PI / 180)
                          const y = cy + radius * Math.sin(-midAngle * Math.PI / 180)

                          return (
                            <text
                              x={x}
                              y={y}
                              fill="white"
                              textAnchor={x > cx ? 'start' : 'end'}
                              dominantBaseline="central"
                              fontSize={12}
                              fontWeight={payload.amount === 199 ? 'bold' : 'normal'}
                            >
                              {`${(percent * 100).toFixed(1)}%`}
                            </text>
                          )
                        }}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {data.pendingAsync.byAmount.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.amount === 199 ? '#0088FE' : COLORS[index % COLORS.length]}
                            stroke={entry.amount === 199 ? '#fff' : 'none'}
                            strokeWidth={entry.amount === 199 ? 2 : 0}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="rounded-md border bg-background p-3 text-sm shadow-lg">
                                <div className="font-semibold mb-1">
                                  {formatCurrency(data.amount, data.currency)}
                                  {data.amount === 199 && ' ⭐'}
                                </div>
                                <div>Count: {data.count}</div>
                                <div className="text-primary">Percentage: {data.percentage}</div>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Legend
                        formatter={(value, entry: any) => {
                          const amount = entry.payload.amount
                          const currency = entry.payload.currency
                          const isHighlight = amount === 199
                          return `${formatCurrency(amount, currency)}${isHighlight ? ' ⭐' : ''}`
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Pending Async by Amount - Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Pending Async Count by Amount
                </CardTitle>
                <CardDescription>
                  Breakdown showing 1.99 EUR highlighted
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.pendingAsync.byAmount.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No pending async transactions found
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data.pendingAsync.byAmount}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="amount"
                        tickFormatter={(value) => formatCurrency(value, 'EUR')}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="rounded-md border bg-background p-3 text-sm shadow-lg">
                                <div className="font-semibold mb-1">
                                  {formatCurrency(data.amount, data.currency)}
                                  {data.amount === 199 && ' ⭐'}
                                </div>
                                <div>Count: {data.count}</div>
                                <div className="text-primary">Percentage: {data.percentage}</div>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="count"
                        fill="#8884d8"
                        name="Pending Count"
                        shape={(props: any) => {
                          const { fill, x, y, width, height, payload } = props
                          const barFill = payload.amount === 199 ? '#0088FE' : '#8884d8'
                          return <rect x={x} y={y} width={width} height={height} fill={barFill} />
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Pending Async Breakdown by Amount
              </CardTitle>
              <CardDescription>Detailed view of all pending_async transaction amounts</CardDescription>
            </CardHeader>
            <CardContent>
              {data.pendingAsync.byAmount.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No pending async transactions found
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr className="border-b">
                        <th className="py-3 px-4 text-left text-sm font-medium">Amount</th>
                        <th className="py-3 px-4 text-right text-sm font-medium">Count</th>
                        <th className="py-3 px-4 text-right text-sm font-medium">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.pendingAsync.byAmount.map((item, idx) => {
                        const is199 = item.amount === 199
                        return (
                          <tr
                            key={idx}
                            className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${
                              is199 ? 'bg-blue-50 dark:bg-blue-950' : ''
                            }`}
                          >
                            <td className="py-3 px-4 text-sm font-medium">
                              {formatCurrency(item.amount, item.currency)}
                              {is199 && ' ⭐'}
                            </td>
                            <td className="py-3 px-4 text-sm text-right font-semibold">
                              {item.count.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-sm text-right">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                is199
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                              }`}>
                                {item.percentage}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot className="bg-muted/50 font-semibold">
                      <tr className="border-t-2">
                        <td className="py-3 px-4 text-sm">Total</td>
                        <td className="py-3 px-4 text-sm text-right">{data.pendingAsync.total.toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm text-right">100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chargeback Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Chargeback Ratio Calculator
              </CardTitle>
              <CardDescription>
                Calculate how many approved transactions are needed to stay below target chargeback ratios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Stats Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Current Approved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {data.chargebackCalculator.currentStats.approved.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Chargebacks</p>
                  <p className="text-2xl font-bold text-red-600">
                    {data.chargebackCalculator.currentStats.chargebacks.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current CB Rate</p>
                  <p className={`text-2xl font-bold ${
                    data.chargebackCalculator.currentStats.chargebackRateNum >= 25
                      ? 'text-red-600'
                      : data.chargebackCalculator.currentStats.chargebackRateNum >= 15
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`}>
                    {data.chargebackCalculator.currentStats.chargebackRate}
                  </p>
                </div>
              </div>

              {/* Threshold Calculations */}
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="border-b">
                      <th className="py-3 px-4 text-left text-sm font-medium">Target CB Rate</th>
                      <th className="py-3 px-4 text-center text-sm font-medium">Currently Meets</th>
                      <th className="py-3 px-4 text-right text-sm font-medium">Approved Needed</th>
                      <th className="py-3 px-4 text-right text-sm font-medium">Additional Needed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.chargebackCalculator.thresholds.map((threshold, idx) => {
                      const isTarget = threshold.threshold === 25
                      return (
                        <tr
                          key={idx}
                          className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${
                            isTarget ? 'bg-yellow-50 dark:bg-yellow-950' : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-sm font-medium">
                            &lt; {threshold.threshold}%
                            {isTarget && ' 🎯'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {threshold.currentlyMeets ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                ✓ Yes
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                ✗ No
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-right font-semibold">
                            {threshold.neededApproved.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-right">
                            {threshold.additionalNeeded > 0 ? (
                              <span className="text-red-600 font-semibold">
                                +{threshold.additionalNeeded.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-green-600 font-semibold">
                                ✓ Met
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Formula Explanation */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Calculation Formula
                    </p>
                    <p className="text-blue-800 dark:text-blue-200">
                      Chargeback Rate = Chargebacks / (Approved + Chargebacks) × 100%
                    </p>
                    <p className="text-blue-700 dark:text-blue-300 mt-2">
                      To stay below 25%: You need at least <strong>3× more approved transactions than chargebacks</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
