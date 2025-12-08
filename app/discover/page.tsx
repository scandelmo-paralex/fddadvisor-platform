"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { DiscoveryTool } from "@/components/discovery-tool"
import { ComparisonBar } from "@/components/comparison-bar"
import { FranchiseComparison } from "@/components/franchise-comparison"

export default function DiscoverPage() {
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([])
  const [showComparison, setShowComparison] = useState(false)

  const handleNavigate = (view: string, franchiseSlug?: string) => {
    if (view === "fdd-viewer" && franchiseSlug) {
      window.location.href = `/fdd/${franchiseSlug}`
    }
  }

  const handleViewChange = (view: string) => {
    if (view === "franchisor-dashboard") {
      window.location.href = "/dashboard"
    } else if (view === "buyer-dashboard") {
      window.location.href = "/hub"
    } else if (view === "discovery") {
      // Already on discovery page
      return
    }
  }

  const handleToggleComparison = (franchiseId: string) => {
    toggleComparison(franchiseId)
  }

  const toggleComparison = (franchiseId: string) => {
    setSelectedForComparison((prev) => {
      if (prev.includes(franchiseId)) {
        return prev.filter((id) => id !== franchiseId)
      } else if (prev.length < 3) {
        return [...prev, franchiseId]
      }
      return prev
    })
  }

  const handleRemoveFromComparison = (franchiseId: string) => {
    setSelectedForComparison((prev) => prev.filter((id) => id !== franchiseId))
  }

  const handleClearComparison = () => {
    setSelectedForComparison([])
  }

  const handleShowComparison = () => {
    setShowComparison(true)
  }

  const handleCloseComparison = () => {
    setShowComparison(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        currentView="discovery"
        onViewChange={handleViewChange}
        onBack={() => (window.location.href = "/")}
        onNavigate={handleNavigate}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Discover Your Perfect Franchise</h1>
          <p className="text-muted-foreground mt-2">
            Browse 400+ franchises or let our AI assistant help you find the best match
          </p>
        </div>

        <DiscoveryTool
          onNavigate={handleNavigate}
          selectedForComparison={selectedForComparison}
          onToggleComparison={handleToggleComparison}
        />
      </main>

      {!showComparison && (
        <ComparisonBar
          selectedIds={selectedForComparison}
          onRemove={handleRemoveFromComparison}
          onCompare={handleShowComparison}
          onClear={handleClearComparison}
        />
      )}

      {showComparison && (
        <FranchiseComparison
          franchiseIds={selectedForComparison}
          onRemove={handleRemoveFromComparison}
          onClose={handleCloseComparison}
        />
      )}
    </div>
  )
}
