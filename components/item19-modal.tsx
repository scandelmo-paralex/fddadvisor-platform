"use client"

import { TrendingUp, DollarSign, BarChart3 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Item19ModalProps {
  franchise: any
  onClose: () => void
}

export function Item19Modal({ franchise, onClose }: Item19ModalProps) {
  const parseRevenueData = () => {
    const dbRevenueData = franchise.revenue_data
    const legacyRevenueData = franchise.revenueData
    const hasItem19 = franchise.has_item19 || franchise.hasItem19

    if (dbRevenueData && typeof dbRevenueData === "object" && Object.keys(dbRevenueData).length > 0) {
      const parsedData = {
        outletsAnalyzed: dbRevenueData.outlets_analyzed,
        timePeriod: dbRevenueData.time_period,
        tables: dbRevenueData.tables?.map((table: any) => {
          return {
            tableName: table.table_name || table.metric,
            metric: table.metric,
            average: table.average,
            median: table.median,
            high: table.high,
            low: table.low,
            thirdQuartile: table.third_quartile,
            secondQuartile: table.second_quartile,
            bottomQuartile: table.bottom_25_percent,
            percentAchieving: table.percent_achieving,
          }
        }),
      }
      return parsedData
    }

    // Legacy format (camelCase)
    if (legacyRevenueData && typeof legacyRevenueData === "object" && Object.keys(legacyRevenueData).length > 0) {
      return legacyRevenueData
    }

    if (hasItem19 === false && (!dbRevenueData || Object.keys(dbRevenueData).length === 0)) {
      return null
    }

    return null
  }

  const revenueData = parseRevenueData()

  const formatValue = (value: any, metric: string) => {
    if (value === undefined || value === null) return null
    if (typeof value !== "number") return value

    const metricLower = metric?.toLowerCase() || ""

    // Percentage
    if (metricLower.includes("%") || metricLower.includes("conversion")) {
      return `${value}%`
    }

    // Currency (Revenue)
    if (metricLower.includes("revenue")) {
      return value > 1000 ? `$${(value / 1000).toFixed(0)}K` : `$${value}`
    }

    // Visits, Members (No $)
    if (metricLower.includes("visit") || metricLower.includes("member")) {
      return value.toLocaleString()
    }

    // Default fallback
    return value > 1000 ? value.toLocaleString() : value
  }

  const generateNarrative = () => {
    if (!revenueData || !revenueData.tables || revenueData.tables.length === 0) {
      return null
    }

    const table1 = revenueData.tables[0]
    const table2 = revenueData.tables[1]

    const narrativeParts = []

    // Analyze Table 1 (Revenue)
    if (table1 && table1.average) {
      const avgRevenue = table1.average
      const median = table1.median
      const high = table1.high
      const low = table1.low

      const range = high && low ? (((high - low) / avgRevenue) * 100).toFixed(0) : null

      narrativeParts.push(
        `Based on ${revenueData.outletsAnalyzed || "reported"} franchised locations during ${revenueData.timePeriod || "the reporting period"}, ` +
          `the average annual revenue was $${(avgRevenue / 1000).toFixed(0)}K with a median of $${(median / 1000).toFixed(0)}K. `,
      )

      if (high && low) {
        narrativeParts.push(
          `Performance varied significantly, with the highest-performing location generating $${(high / 1000).toFixed(0)}K ` +
            `and the lowest at $${(low / 1000).toFixed(0)}K, representing a ${range}% variance from the average. `,
        )
      }

      if (table1.bottomQuartile && table1.thirdQuartile) {
        narrativeParts.push(
          `The bottom 25% of locations earned $${(table1.bottomQuartile / 1000).toFixed(0)}K or less, ` +
            `while the top 25% achieved $${(table1.thirdQuartile / 1000).toFixed(0)}K or more, ` +
            `indicating substantial performance differences based on location, management, and market factors. `,
        )
      }
    }

    // Analyze Table 2 (Members/Customers)
    if (table2 && table2.average) {
      narrativeParts.push(
        `\n\nIn terms of customer base, locations averaged ${table2.average} ${table2.metric?.toLowerCase() || "members"}, ` +
          `with a median of ${table2.median}. The top-performing location had ${table2.high} ${table2.metric?.toLowerCase() || "members"}, ` +
          `while the lowest had ${table2.low}. This suggests that customer acquisition and retention are key drivers of revenue performance.`,
      )
    }

    return narrativeParts.join("")
  }

  const narrative = generateNarrative()

  if (!revenueData) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-amber-600" />
              Item 19: Financial Performance Representation
            </DialogTitle>
          </DialogHeader>
          <div className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              This franchise does not provide Item 19 financial performance representations in their FDD.
            </p>
            <Card className="p-4 bg-amber-50 border-amber-200 text-left">
              <p className="text-sm text-amber-900">
                <span className="font-semibold">What this means:</span> The franchisor has chosen not to disclose
                financial performance data for existing franchisees. You'll need to conduct your own due diligence by
                speaking with current franchisees during the validation process.
              </p>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-amber-600" />
            Item 19: Financial Performance Representation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Summary Card */}
          <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <DollarSign className="h-5 w-5 text-amber-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2 text-amber-900">Financial Performance Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-amber-700 text-xs mb-1">Outlets Analyzed</p>
                    <p className="font-bold text-xl text-amber-900">{revenueData.outletsAnalyzed || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-amber-700 text-xs mb-1">Time Period</p>
                    <p className="font-semibold text-amber-900">{revenueData.timePeriod || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Narrative Analysis */}
          {narrative && (
            <Card className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-indigo-100 p-2">
                  <span className="text-xl">📊</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-3 text-indigo-900">Performance Analysis</h3>
                  <p className="text-sm text-indigo-800 leading-relaxed whitespace-pre-wrap">{narrative}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Average Revenue Highlight */}
          {franchise.avgRevenue && (
            <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-100 p-2">
                  <TrendingUp className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <p className="text-emerald-700 text-xs mb-1">Average Annual Revenue</p>
                  <p className="font-bold text-2xl text-emerald-900">${(franchise.avgRevenue / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-emerald-700 mt-1">
                    Based on {revenueData.outletsAnalyzed} franchised locations
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Revenue Tables */}
          {revenueData.tables && revenueData.tables.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Detailed Performance Data</h3>
              {revenueData.tables.map((table: any, idx: number) => {
                const title = table.tableName || table.metric || `Table ${idx + 1}`
                const metricSubheader = table.metric && table.metric !== title ? table.metric : null

                return (
                  <Card key={idx} className="p-4">
                    <div className="mb-3">
                      <h4 className="font-bold text-base text-primary flex items-center gap-2">
                        {title}
                        {table.percentAchieving && (
                          <Badge className="bg-blue-100 text-blue-700 text-xs">
                            {table.percentAchieving}% achieved this level
                          </Badge>
                        )}
                      </h4>
                      {metricSubheader && <p className="text-sm text-muted-foreground mt-1">{metricSubheader}</p>}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {table.average !== undefined && table.average !== null && (
                        <div className="p-3 bg-accent/5 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Average</p>
                          <p className="font-bold text-lg">{formatValue(table.average, table.metric)}</p>
                        </div>
                      )}
                      {table.median !== undefined && table.median !== null && (
                        <div className="p-3 bg-accent/5 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Median</p>
                          <p className="font-bold text-lg">{formatValue(table.median, table.metric)}</p>
                        </div>
                      )}
                      {table.high !== undefined && table.high !== null && (
                        <div className="p-3 bg-accent/5 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">High</p>
                          <p className="font-bold text-lg">{formatValue(table.high, table.metric)}</p>
                        </div>
                      )}
                      {table.low !== undefined && table.low !== null && (
                        <div className="p-3 bg-accent/5 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Low</p>
                          <p className="font-bold text-lg">{formatValue(table.low, table.metric)}</p>
                        </div>
                      )}
                    </div>

                    {/* Quartile Breakdown */}
                    {(table.thirdQuartile || table.secondQuartile || table.bottomQuartile) && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Quartile Breakdown</p>
                        <div className="grid grid-cols-3 gap-2">
                          {table.bottomQuartile !== undefined && table.bottomQuartile !== null && (
                            <div className="p-2 bg-muted/50 rounded text-center">
                              <p className="text-xs text-muted-foreground">Bottom 25%</p>
                              <p className="font-semibold text-sm">{formatValue(table.bottomQuartile, table.metric)}</p>
                            </div>
                          )}
                          {table.secondQuartile !== undefined && table.secondQuartile !== null && (
                            <div className="p-2 bg-muted/50 rounded text-center">
                              <p className="text-xs text-muted-foreground">2nd Quartile</p>
                              <p className="font-semibold text-sm">{formatValue(table.secondQuartile, table.metric)}</p>
                            </div>
                          )}
                          {table.thirdQuartile !== undefined && table.thirdQuartile !== null && (
                            <div className="p-2 bg-muted/50 rounded text-center">
                              <p className="text-xs text-muted-foreground">3rd Quartile</p>
                              <p className="font-semibold text-sm">{formatValue(table.thirdQuartile, table.metric)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}

          {/* Important Notes */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex gap-2">
              <span className="text-lg">ℹ️</span>
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Important Disclaimer</h4>
                <p className="text-xs text-blue-800 leading-relaxed">
                  This financial performance representation is based on historical data from existing franchisees. Your
                  individual results may vary significantly based on factors including location, management, market
                  conditions, and competition. These figures should not be considered as a guarantee or projection of
                  your future financial performance. Please review the complete Item 19 disclosure in the FDD and
                  consult with financial advisors before making any investment decisions.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
