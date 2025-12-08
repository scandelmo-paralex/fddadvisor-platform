"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { MapPin } from "lucide-react"
import type { Franchise } from "@/lib/data"

interface LocationModalProps {
  franchise: Franchise
  onClose: () => void
}

export function LocationModal({ franchise, onClose }: LocationModalProps) {
  const stateData = [
    { state: "California", units: Math.round((franchise.totalUnits || 0) * 0.12), available: true },
    { state: "Texas", units: Math.round((franchise.totalUnits || 0) * 0.09), available: true },
    { state: "Florida", units: Math.round((franchise.totalUnits || 0) * 0.08), available: true },
    { state: "New York", units: Math.round((franchise.totalUnits || 0) * 0.07), available: true },
    { state: "Illinois", units: Math.round((franchise.totalUnits || 0) * 0.05), available: false },
  ]

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-cta" />
            Territory & Locations - {franchise.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4 bg-cta/5 border-cta/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Units Nationwide</p>
                <p className="text-2xl font-bold">{franchise.totalUnits?.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            <h3 className="font-semibold">Units by State</h3>
            {stateData.map((item, idx) => (
              <Card key={idx} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{item.state}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{item.units} units</span>
                    {item.available ? (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">Available</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Limited</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-4 bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Territory Protection:</span> Most franchises offer protected territories
              based on population or geographic boundaries. Contact the franchisor for specific territory availability
              in your area.
            </p>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
