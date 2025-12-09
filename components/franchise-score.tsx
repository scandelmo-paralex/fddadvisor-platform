"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { TrendingUp, Shield, Users, FileText, ChevronDown, ChevronUp, Info } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"

interface FranchiseScoreProps {
  score: {
    overall: number
    maxScore: number
    systemStability: { score: number; max: number }
    supportQuality: { score: number; max: number }
    growthTrajectory: { score: number; max: number }
    financialDisclosure: { score: number; max: number }
    riskLevel: "LOW" | "MODERATE" | "HIGH"
    industryPercentile: number
    breakdown?: {
      systemStability: {
        metrics: Array<{ metric: string; score: number; max: number; rating: string; explanation: string }>
      }
      supportQuality: {
        metrics: Array<{ metric: string; score: number; max: number; rating: string; explanation: string }>
      }
      growthTrajectory: {
        metrics: Array<{ metric: string; score: number; max: number; rating: string; explanation: string }>
      }
      financialDisclosure: {
        metrics: Array<{ metric: string; score: number; max: number; rating: string; explanation: string }>
      }
    }
  }
  fddYear?: number | string
}

export function FranchiseScore({ score, fddYear }: FranchiseScoreProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  useEffect(() => {
    console.log("[v0] FranchiseScore component received score data:", score)
  }, [score])

  const percentage = Math.round((score.overall / score.maxScore) * 100)

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "LOW":
        return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
      case "MODERATE":
        return "bg-amber-100 text-amber-700 hover:bg-amber-100"
      case "HIGH":
        return "bg-red-100 text-red-700 hover:bg-red-100"
      default:
        return ""
    }
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "Excellent":
        return "text-emerald-600"
      case "Good":
        return "text-blue-600"
      case "Fair":
        return "text-amber-600"
      case "Poor":
        return "text-red-600"
      default:
        return "text-muted-foreground"
    }
  }

  const renderDots = (current: number, max: number) => {
    const filled = Math.round((current / max) * 5)
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < filled ? "text-slate-700 dark:text-slate-300" : "text-muted-foreground/30"}>
            ●
          </span>
        ))}
      </div>
    )
  }

  const categories = [
    {
      name: "Financial Transparency",
      key: "financialDisclosure",
      icon: FileText,
      score: score.financialDisclosure.score,
      max: score.financialDisclosure.max,
    },
    {
      name: "System Strength",
      key: "systemStability",
      icon: Shield,
      score: score.systemStability.score,
      max: score.systemStability.max,
    },
    {
      name: "Franchisee Support",
      key: "supportQuality",
      icon: Users,
      score: score.supportQuality.score,
      max: score.supportQuality.max,
    },
    {
      name: "Business Foundation",
      key: "growthTrajectory",
      icon: TrendingUp,
      score: score.growthTrajectory.score,
      max: score.growthTrajectory.max,
    },
  ]

  return (
    <Card className="p-6 border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 shadow-sm">
      <TooltipProvider>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400">FranchiseScore™</h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="inline-flex items-center justify-center">
                      <Info className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs bg-white text-slate-900 border-slate-200">
                    <p>
                      FranchiseScore is an independent analysis performed against FDD Items 1 and 23 (excluding any
                      exhibits)
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-slate-900 dark:text-slate-100">{score.overall}</span>
                <span className="text-2xl font-semibold text-slate-500 dark:text-slate-400">/ {score.maxScore}</span>
                <span className="text-lg font-medium text-slate-600 dark:text-slate-400">({percentage}%)</span>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {score.industryPercentile}% overall score
                </span>
              </div>
              {fddYear && (
                <p className="text-xs text-muted-foreground mt-2">
                  FDD Year: {fddYear}
                </p>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-slate-700">
            {categories.map((category) => {
              const Icon = category.icon
              const categoryPercentage = Math.round((category.score / category.max) * 100)
              const isExpanded = expandedCategory === category.key
              const hasBreakdown = score.breakdown && score.breakdown[category.key as keyof typeof score.breakdown]

              return (
                <div
                  key={category.name}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 transition-all hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm"
                >
                  <button
                    onClick={() => hasBreakdown && setExpandedCategory(isExpanded ? null : category.key)}
                    className={`flex items-center justify-between w-full p-4 text-left transition-colors ${
                      hasBreakdown ? "hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer" : "cursor-default"
                    } rounded-lg`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="rounded-lg p-2 bg-slate-100 dark:bg-slate-700">
                        <Icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {category.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold font-mono text-slate-700 dark:text-slate-300">
                        {category.score}/{category.max}
                      </span>
                      {renderDots(category.score, category.max)}
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        {categoryPercentage}%
                      </span>
                      {hasBreakdown &&
                        (isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-slate-400 ml-1" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-400 ml-1" />
                        ))}
                    </div>
                  </button>

                  {isExpanded && hasBreakdown && (
                    <div className="px-4 pb-4 space-y-3 border-t border-slate-200 dark:border-slate-700 pt-3">
                      {score.breakdown![category.key as keyof typeof score.breakdown]?.metrics?.length > 0 ? (
                        score.breakdown![category.key as keyof typeof score.breakdown].metrics.map((item, idx) => (
                          <div
                            key={idx}
                            className="pl-8 space-y-1.5 py-2 border-l-2 border-slate-200 dark:border-slate-700"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{item.metric}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-mono text-muted-foreground">
                                  {item.score}/{item.max}
                                </span>
                                <span className={`text-sm font-semibold ${getRatingColor(item.rating)}`}>
                                  {item.rating}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{item.explanation}</p>
                          </div>
                        ))
                      ) : (
                        <div className="pl-8 text-sm text-muted-foreground">No breakdown data available</div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </TooltipProvider>
    </Card>
  )
}
