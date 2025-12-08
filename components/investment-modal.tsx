"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { DollarSign } from "lucide-react"
import type { Franchise } from "@/lib/data"

interface InvestmentModalProps {
  franchise: Franchise
  onClose: () => void
}

export function InvestmentModal({ franchise, onClose }: InvestmentModalProps) {
  const parseInvestmentBreakdown = () => {
    const dbBreakdown = (franchise as any).investment_breakdown
    const legacyBreakdown = franchise.investmentBreakdown

    // Check if database format exists (array with categories)
    if (Array.isArray(dbBreakdown) && dbBreakdown.length > 0) {
      const firstItem = dbBreakdown[0]
      if (firstItem.categories && Array.isArray(firstItem.categories)) {
        return firstItem.categories.map((cat: any) => ({
          label: cat.name || "Unknown",
          min: cat.low || 0,
          max: cat.high || 0,
        }))
      }
    }

    // Check if it's an object (old format)
    if (
      dbBreakdown &&
      typeof dbBreakdown === "object" &&
      !Array.isArray(dbBreakdown) &&
      Object.keys(dbBreakdown).length > 0
    ) {
      return Object.entries(dbBreakdown).map(([key, value]) => ({
        label: key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()),
        min: typeof value === "number" ? value : 0,
        max: typeof value === "number" ? value : 0,
      }))
    }

    // Check legacy format
    if (legacyBreakdown && typeof legacyBreakdown === "object" && Object.keys(legacyBreakdown).length > 0) {
      return Object.entries(legacyBreakdown).map(([key, value]) => ({
        label: key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()),
        min: typeof value === "number" ? value : 0,
        max: typeof value === "number" ? value : 0,
      }))
    }

    return null
  }

  const items = parseInvestmentBreakdown()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-cta" />
            Investment Breakdown
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4 bg-cta/5 border-cta/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Investment Range</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(franchise.investmentMin || (franchise as any).initial_investment_low || 0)} -{" "}
                  {formatCurrency(franchise.investmentMax || (franchise as any).initial_investment_high || 0)}
                </p>
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            <h3 className="font-semibold">Detailed Breakdown</h3>
            {items && items.length > 0 ? (
              items.map((item, idx) => (
                <Card key={idx} className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-muted-foreground">
                      {item.min === item.max
                        ? formatCurrency(item.min)
                        : `${formatCurrency(item.min)} - ${formatCurrency(item.max)}`}
                    </span>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">
                  Detailed investment breakdown is not available for this franchise. Please refer to Item 7 of the FDD
                  for complete investment details.
                </p>
              </Card>
            )}
          </div>

          <Card className="p-4 bg-amber-50 border-amber-200">
            <p className="text-sm text-amber-900">
              <span className="font-semibold">Note:</span> These figures are estimates based on Item 7 of the FDD.
              Actual costs may vary based on location, market conditions, and individual circumstances.
            </p>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
