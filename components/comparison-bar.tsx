"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, ArrowRight } from "lucide-react"
import { franchises } from "@/lib/data"

interface ComparisonBarProps {
  selectedIds: string[]
  onRemove: (id: string) => void
  onCompare: () => void
  onClear: () => void
}

export function ComparisonBar({ selectedIds, onRemove, onCompare, onClear }: ComparisonBarProps) {
  if (selectedIds.length === 0) return null

  const selectedFranchises = franchises.filter((f) => selectedIds.includes(f.id))

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-4">
      <Card className="p-4 shadow-2xl border-2 border-primary/20 bg-card/95 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 overflow-x-auto">
            <span className="text-sm font-medium whitespace-nowrap">Compare ({selectedIds.length}/3):</span>
            <div className="flex gap-2">
              {selectedFranchises.map((franchise) => (
                <div
                  key={franchise.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border/50"
                >
                  <span className="text-sm font-medium whitespace-nowrap">{franchise.name}</span>
                  <button
                    onClick={() => onRemove(franchise.id)}
                    className="hover:bg-background rounded p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClear}>
              Clear All
            </Button>
            <Button
              size="sm"
              onClick={onCompare}
              disabled={selectedIds.length < 2}
              className="bg-primary hover:bg-primary/90"
            >
              Compare
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
