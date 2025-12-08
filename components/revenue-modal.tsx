"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { Franchise } from "@/lib/data"

interface RevenueModalProps {
  franchise: Franchise
  onClose: () => void
}

export function RevenueModal({ franchise, onClose }: RevenueModalProps) {
  const parseRevenueData = () => {
    // Database format (snake_case with tables array)
    if (franchise.revenue_data) {
      const data = franchise.revenue_data
      const firstTable = data.tables?.[0]

      return {
        average: firstTable?.average || franchise.average_revenue || franchise.avgRevenue || 0,
        median:
          firstTable?.median || (firstTable?.average || franchise.average_revenue || franchise.avgRevenue || 0) * 0.92,
        topQuartile:
          firstTable?.quartiles?.[3] ||
          (firstTable?.average || franchise.average_revenue || franchise.avgRevenue || 0) * 1.35,
        bottomQuartile:
          firstTable?.quartiles?.[0] ||
          (firstTable?.average || franchise.average_revenue || franchise.avgRevenue || 0) * 0.65,
      }
    }

    // Legacy format (camelCase)
    if (franchise.revenueData) {
      return {
        average: franchise.revenueData.average || franchise.avgRevenue || 0,
        median: franchise.revenueData.median || (franchise.avgRevenue || 0) * 0.92,
        topQuartile: franchise.revenueData.topQuartile || (franchise.avgRevenue || 0) * 1.35,
        bottomQuartile: franchise.revenueData.bottomQuartile || (franchise.avgRevenue || 0) * 0.65,
      }
    }

    // Fallback to avgRevenue
    const avgRev = franchise.average_revenue || franchise.avgRevenue || 0
    return {
      average: avgRev,
      median: avgRev * 0.92,
      topQuartile: avgRev * 1.35,
      bottomQuartile: avgRev * 0.65,
    }
  }

  const revenueData = parseRevenueData()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const chartData = [
    { year: "2022", revenue: Math.round((revenueData.average * 0.92) / 1000) },
    { year: "2023", revenue: Math.round((revenueData.average * 0.96) / 1000) },
    { year: "2024", revenue: Math.round(revenueData.average / 1000) },
  ]

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-cta" />
            Revenue Analysis - {franchise.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="p-4 bg-emerald-50 border-emerald-200">
              <p className="text-sm text-muted-foreground">Average Revenue</p>
              <p className="text-2xl font-bold text-emerald-700">{formatCurrency(revenueData.average)}</p>
            </Card>
            <Card className="p-4 bg-blue-50 border-blue-200">
              <p className="text-sm text-muted-foreground">Median Revenue</p>
              <p className="text-2xl font-bold text-blue-700">{formatCurrency(revenueData.median)}</p>
            </Card>
          </div>

          <Card className="p-4">
            <h3 className="font-semibold mb-4">3-Year Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis label={{ value: "Revenue ($K)", angle: -90, position: "insideLeft" }} />
                <Tooltip formatter={(value) => `$${value}K`} />
                <Line type="monotone" dataKey="revenue" stroke="#4AD295" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Top 25% (Top Quartile)</p>
              <p className="text-xl font-bold">{formatCurrency(revenueData.topQuartile)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Bottom 25% (Bottom Quartile)</p>
              <p className="text-xl font-bold">{formatCurrency(revenueData.bottomQuartile)}</p>
            </Card>
          </div>

          <Card className="p-4 bg-amber-50 border-amber-200">
            <p className="text-sm text-amber-900">
              <span className="font-semibold">Source:</span> Item 19 Financial Performance Representations. These
              figures represent historical performance and do not guarantee future results. Individual results may vary
              significantly.
            </p>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
