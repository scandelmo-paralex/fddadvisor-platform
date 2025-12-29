"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Info } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { useState } from "react"

interface FranchiseScoreBreakdownProps {
  franchise: any
}

export function FranchiseScoreBreakdown({ franchise }: FranchiseScoreBreakdownProps) {
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null)

  const scoreBreakdown = franchise.franchise_score_breakdown || franchise.franchiseScoreBreakdown || {}

  const metrics = [
    {
      key: "financial_transparency",
      label: "Financial Transparency",
      maxScore: 150,
      score: scoreBreakdown.financial_transparency?.total_score || 0,
      description: "Evaluates Item 19 quality, investment clarity, and fee structure transparency",
      rating: "Good",
      subMetrics: scoreBreakdown.financial_transparency?.metrics || [],
    },
    {
      key: "system_strength",
      label: "System Strength",
      maxScore: 150,
      score: scoreBreakdown.system_strength?.total_score || 0,
      description: "Measures system growth pattern, franchisor longevity, and clean record",
      rating: "Good",
      subMetrics: scoreBreakdown.system_strength?.metrics || [],
    },
    {
      key: "franchisee_support",
      label: "Franchisee Support",
      maxScore: 150,
      score: scoreBreakdown.franchisee_support?.total_score || 0,
      description: "Evaluates training program quality, operational support, and territory protection",
      rating: "Good",
      subMetrics: scoreBreakdown.franchisee_support?.metrics || [],
    },
    {
      key: "business_foundation",
      label: "Business Foundation",
      maxScore: 150,
      score: scoreBreakdown.business_foundation?.total_score || 0,
      description:
        "Analyzes management experience, Item 19 performance indicators, and franchisee satisfaction signals",
      rating: "Good",
      subMetrics: scoreBreakdown.business_foundation?.metrics || [],
    },
  ]

  const totalScore = franchise.franchise_score || franchise.franchiseScore || 0
  const maxTotalScore = 600
  const percentile = franchise.industry_percentile || franchise.industryPercentile || 0

  const getRatingColor = (rating: string) => {
    switch (rating) {
      // New rating labels (Strong/Good/Fair/Limited)
      case "Strong":
        return "bg-emerald-100 text-emerald-700"
      case "Limited":
        return "bg-red-100 text-red-700"
      // Legacy labels (kept for backward compatibility during transition)
      case "Excellent":
        return "bg-emerald-100 text-emerald-700"
      case "Good":
        return "bg-blue-100 text-blue-700"
      case "Fair":
        return "bg-amber-100 text-amber-700"
      case "Poor":
        return "bg-red-100 text-red-700"
      // Not Available / Unknown
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getProgressColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 70) return "bg-emerald-500"
    if (percentage >= 40) return "bg-amber-500"
    return "bg-red-500"
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">FranchiseScore™</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="inline-flex items-center justify-center">
                    <Info className="h-4 w-4 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs bg-white text-slate-900 border-slate-200">
                  <p>
                    FranchiseScore is an independent analysis performed against FDD Items 1 and 23 (excluding any
                    exhibits)
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-cta">
              {totalScore}
              <span className="text-xl text-muted-foreground">/{maxTotalScore}</span>
            </p>
            <p className="text-sm text-muted-foreground">({Math.round((totalScore / maxTotalScore) * 100)}%)</p>
          </div>
        </div>
        {percentile > 0 && (
          <p className="text-sm text-muted-foreground">
            {percentile}th percentile in {franchise.industry || "industry"}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {metrics.map((metric) => {
          const percentage = (metric.score / metric.maxScore) * 100
          const isExpanded = expandedMetric === metric.key

          return (
            <div key={metric.key} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
              <button onClick={() => setExpandedMetric(isExpanded ? null : metric.key)} className="w-full text-left">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-medium text-sm">{metric.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">
                      {metric.score}/{metric.maxScore}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getProgressColor(metric.score, metric.maxScore)}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </button>

              {isExpanded && metric.subMetrics.length > 0 && (
                <div className="mt-3 pt-3 border-t space-y-3">
                  {metric.subMetrics.map((subMetric: any, idx: number) => (
                    <div key={idx} className="pl-4 border-l-2 border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{subMetric.metric_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">
                            {subMetric.score}/{subMetric.max_score}
                          </span>
                          <Badge className={`text-xs px-2 py-0 ${getRatingColor(subMetric.rating)}`}>
                            {subMetric.rating}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{subMetric.explanation}</p>
                    </div>
                  ))}
                </div>
              )}

              {isExpanded && metric.subMetrics.length === 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-muted-foreground">{metric.description}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-6 pt-6 border-t">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold">About FranchiseScore™:</span> Our proprietary scoring system evaluates
          franchises across 4 key dimensions based on FDD disclosures. Scores are calculated using objective metrics
          including financial transparency, system strength, franchisee support, and business foundation. Higher scores
          indicate stronger franchise systems with better track records.
        </p>
      </div>
    </Card>
  )
}
