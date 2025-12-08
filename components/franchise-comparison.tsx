"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { X, DollarSign, TrendingUp, Users, Building2, CheckCircle2, AlertCircle } from "lucide-react"
import { franchises } from "@/lib/data"

interface FranchiseComparisonProps {
  franchiseIds: string[]
  onRemove: (id: string) => void
  onClose: () => void
}

export function FranchiseComparison({ franchiseIds, onRemove, onClose }: FranchiseComparisonProps) {
  const selectedFranchises = franchises.filter((f) => franchiseIds.includes(f.id))

  if (selectedFranchises.length === 0) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-y-auto">
      <TooltipProvider>
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Compare Franchises</h1>
              <p className="text-muted-foreground mt-1">Side-by-side comparison of your selected franchises</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Comparison Grid */}
          <div className={`grid gap-6 ${selectedFranchises.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
            {selectedFranchises.map((franchise) => (
              <Card key={franchise.id} className="p-6 relative">
                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 h-8 w-8"
                  onClick={() => onRemove(franchise.id)}
                >
                  <X className="h-4 w-4" />
                </Button>

                {/* Franchise Header */}
                <div className="mb-6 pr-8">
                  <h2 className="text-2xl font-bold mb-2">{franchise.name}</h2>
                  <p className="text-sm text-muted-foreground mb-3">{franchise.industry}</p>
                  {franchise.hasItem19 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 cursor-help">
                          Earnings
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-sm">This franchise provides actual earnings data from franchisees</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {/* Key Metrics */}
                <div className="space-y-4 mb-6">
                  <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Investment Range
                      </span>
                    </div>
                    <p className="text-2xl font-bold">
                      ${(franchise.investmentMin / 1000).toFixed(0)}K - ${(franchise.investmentMax / 1000).toFixed(0)}K
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        ROI Timeframe
                      </span>
                    </div>
                    <p className="text-2xl font-bold">{franchise.roiTimeframe}</p>
                  </div>

                  {franchise.avgRevenue && (
                    <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Avg Revenue
                        </span>
                      </div>
                      <p className="text-2xl font-bold">${(franchise.avgRevenue / 1000).toFixed(0)}K</p>
                    </div>
                  )}

                  {franchise.totalUnits && (
                    <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Total Units
                        </span>
                      </div>
                      <p className="text-2xl font-bold">{franchise.totalUnits?.toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {/* Strengths */}
                {franchise.opportunities && franchise.opportunities.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <h3 className="font-semibold">Strengths</h3>
                    </div>
                    <ul className="space-y-2">
                      {franchise.opportunities.map((opp, index) => (
                        <li key={index} className="text-sm leading-relaxed text-muted-foreground flex gap-2">
                          <span className="text-emerald-500 mt-1">•</span>
                          <span>{opp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Considerations */}
                {franchise.concerns && franchise.concerns.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <h3 className="font-semibold">Considerations</h3>
                    </div>
                    <ul className="space-y-2">
                      {franchise.concerns.map((concern, index) => (
                        <li key={index} className="text-sm leading-relaxed text-muted-foreground flex gap-2">
                          <span className="text-amber-500 mt-1">•</span>
                          <span>{concern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </TooltipProvider>
    </div>
  )
}
