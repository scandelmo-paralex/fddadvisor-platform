"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { MapPin } from "lucide-react"
import type { Franchise } from "@/lib/data"

interface LocationsModalProps {
  franchise: Franchise
  onClose: () => void
}

export function LocationsModal({ franchise, onClose }: LocationsModalProps) {
  const franchiseData = franchise as any

  const stateDistribution = franchiseData.state_distribution || franchise.stateDistribution || {}
  const totalUnits = franchiseData.total_units || franchise.totalUnits || 0
  const franchisedUnits = franchiseData.franchised_units || franchise.franchisedUnits || 0
  const companyOwnedUnits = franchiseData.company_owned_units || franchise.companyOwnedUnits || 0

  // Sort states by unit count
  const sortedStates = Object.entries(stateDistribution)
    .sort(([, a]: any, [, b]: any) => b - a)
    .filter(([state]) => state !== "all")

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-cta" />
            Franchise Locations
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 bg-cta/5 border-cta/20">
              <p className="text-sm text-muted-foreground mb-1">Total Units</p>
              <p className="text-3xl font-bold">{totalUnits.toLocaleString()}</p>
            </Card>
            <Card className="p-4 bg-blue-50 border-blue-200">
              <p className="text-sm text-muted-foreground mb-1">Franchised</p>
              <p className="text-3xl font-bold text-blue-700">{franchisedUnits.toLocaleString()}</p>
            </Card>
            <Card className="p-4 bg-purple-50 border-purple-200">
              <p className="text-sm text-muted-foreground mb-1">Company-Owned</p>
              <p className="text-3xl font-bold text-purple-700">{companyOwnedUnits.toLocaleString()}</p>
            </Card>
          </div>

          {/* State-by-State Breakdown */}
          {sortedStates.length > 0 ? (
            <div>
              <h3 className="font-semibold text-lg mb-3">State-by-State Distribution</h3>
              <div className="grid grid-cols-2 gap-3">
                {sortedStates.map(([state, count]: any) => {
                  const percentage = totalUnits > 0 ? ((count / totalUnits) * 100).toFixed(1) : "0.0"
                  return (
                    <Card key={state} className="p-3 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-lg">{state}</p>
                          <p className="text-xs text-muted-foreground">{percentage}% of total</p>
                        </div>
                        <p className="text-2xl font-bold text-cta">{count}</p>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">
                State-by-state distribution data is not available for this franchise.
              </p>
            </Card>
          )}

          {/* Growth Info */}
          {(franchiseData.units_opened_last_year || franchise.unitsOpenedLastYear) && (
            <Card className="p-4 bg-emerald-50 border-emerald-200">
              <h3 className="font-semibold text-emerald-900 mb-2">Recent Growth</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Units Opened (Last Year)</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    +{franchiseData.units_opened_last_year || franchise.unitsOpenedLastYear}
                  </p>
                </div>
                {(franchiseData.units_closed_last_year || franchise.unitsClosedLastYear) !== undefined && (
                  <div>
                    <p className="text-muted-foreground">Units Closed (Last Year)</p>
                    <p className="text-2xl font-bold text-red-700">
                      -{franchiseData.units_closed_last_year || franchise.unitsClosedLastYear}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
