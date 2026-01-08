"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { FDDViewer } from "@/components/fdd-viewer"
import { AuthGateModal } from "@/components/auth-gate-modal"
import { InvestmentModal } from "@/components/investment-modal"
import { RevenueModal } from "@/components/revenue-modal"
import { LocationModal } from "@/components/location-modal"
import { createBrowserClient } from "@/lib/supabase/client"
import type { Note, FDDEngagement, Franchise } from "@/lib/data"
import type { WhiteLabelSettings } from "@/lib/types/database"

export default function FDDPage() {
  const params = useParams()
  const router = useRouter()
  const franchiseSlug = params.slug as string
  const [notes, setNotes] = useState<Note[]>([])
  const [engagement, setEngagement] = useState<FDDEngagement | undefined>()
  const [franchise, setFranchise] = useState<Franchise | null>(null)
  const [franchiseLoading, setFranchiseLoading] = useState(true)
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [isFranchisorViewing, setIsFranchisorViewing] = useState(false)
  const [whiteLabelSettings, setWhiteLabelSettings] = useState<WhiteLabelSettings | null>(null)

  const isAuthDisabled = true

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFranchise = async () => {
      try {
        console.log("[v0] Fetching franchise with slug:", franchiseSlug)
        const response = await fetch("/api/franchises/public")

        if (!response.ok) {
          console.error("[v0] API response not OK:", response.status)
          setFranchiseLoading(false)
          return
        }

        const data = await response.json()
        const franchises = data.franchises || []
        console.log("[v0] Received franchises:", franchises.length)

        const foundFranchise = franchises.find((f: any) => f.slug === franchiseSlug)
        console.log("[v0] Found franchise:", foundFranchise ? foundFranchise.name : "not found")
        if (foundFranchise) {
          console.log("[v0] Logo URL from API:", foundFranchise.logo_url)
          console.log("[v0] Cover Image URL from API:", foundFranchise.cover_image_url)
        }

        const parseJSON = (value: any) => {
          if (typeof value === "string") {
            try {
              return JSON.parse(value)
            } catch (e) {
              console.error("[v0] Failed to parse JSON:", e)
              return value
            }
          }
          return value
        }

        const transformBreakdown = (breakdown: any) => {
          if (!breakdown) return undefined

          const transformed: any = {}

          const transformMetrics = (metrics: any[]) => {
            if (!Array.isArray(metrics)) return []
            return metrics.map((m: any) => ({
              metric: m.metric_name || m.metric,
              score: Math.max(0, m.score || 0),
              max: m.max_score || m.max,
              rating: m.rating,
              explanation: m.explanation,
            }))
          }

          if (breakdown.financial_transparency) {
            transformed.financialDisclosure = {
              total_score: breakdown.financial_transparency.total_score,
              max_score: breakdown.financial_transparency.max_score,
              metrics: transformMetrics(breakdown.financial_transparency.metrics || []),
            }
          }

          if (breakdown.system_strength) {
            transformed.systemStability = {
              total_score: breakdown.system_strength.total_score,
              max_score: breakdown.system_strength.max_score,
              metrics: transformMetrics(breakdown.system_strength.metrics || []),
            }
          }

          if (breakdown.franchisee_support) {
            transformed.supportQuality = {
              total_score: breakdown.franchisee_support.total_score,
              max_score: breakdown.franchisee_support.max_score,
              metrics: transformMetrics(breakdown.franchisee_support.metrics || []),
            }
          }

          if (breakdown.business_foundation) {
            transformed.growthTrajectory = {
              total_score: breakdown.business_foundation.total_score,
              max_score: breakdown.business_foundation.max_score,
              metrics: transformMetrics(breakdown.business_foundation.metrics || []),
            }
          }

          return transformed
        }

        if (foundFranchise) {
          console.log("[v0] Analytical summary:", foundFranchise.analytical_summary ? "exists" : "missing")

          const scoreBreakdown = parseJSON(foundFranchise.franchise_score_breakdown)

          let systemStabilityScore = 0
          let supportQualityScore = 0
          let growthTrajectoryScore = 0
          let financialDisclosureScore = 0

          if (scoreBreakdown?.system_strength) {
            systemStabilityScore = scoreBreakdown.system_strength.total_score || 0
          }

          if (scoreBreakdown?.franchisee_support) {
            supportQualityScore = scoreBreakdown.franchisee_support.total_score || 0
          }

          if (scoreBreakdown?.business_foundation) {
            growthTrajectoryScore = scoreBreakdown.business_foundation.total_score || 0
          }

          if (scoreBreakdown?.financial_transparency) {
            financialDisclosureScore = scoreBreakdown.financial_transparency.total_score || 0
          }

          const overallScore =
            systemStabilityScore + supportQualityScore + growthTrajectoryScore + financialDisclosureScore

          console.log("[v0] Score breakdown:", {
            systemStability: systemStabilityScore,
            supportQuality: supportQualityScore,
            growthTrajectory: growthTrajectoryScore,
            financialDisclosure: financialDisclosureScore,
            overall: overallScore,
            percentage: Math.round((overallScore / 600) * 100),
          })

          const mappedFranchise: Franchise = {
            id: foundFranchise.id,
            slug: foundFranchise.slug,
            name: foundFranchise.name,
            logoUrl: foundFranchise.logo_url,
            coverImageUrl: foundFranchise.cover_image_url || getCoverImageFallback(foundFranchise.slug),
            industry: foundFranchise.industry || "Business Services",
            description: foundFranchise.brand_description || foundFranchise.description || "",
            hasItem19: foundFranchise.has_item19 || false,
            investmentMin: foundFranchise.initial_investment_low || foundFranchise.total_investment_min || 0,
            investmentMax: foundFranchise.initial_investment_high || foundFranchise.total_investment_max || 0,
            roiTimeframe: foundFranchise.roi_timeframe || "Unknown",
            avgRevenue:
              foundFranchise.avg_revenue || foundFranchise.item19_revenue_median || foundFranchise.average_revenue,
            totalUnits: foundFranchise.total_units,
            status: foundFranchise.status || "Established",
            analyticalSummary: foundFranchise.analytical_summary,
            investmentBreakdown: parseJSON(foundFranchise.investment_breakdown),
            revenueData: parseJSON(foundFranchise.revenue_data),
            opportunities: parseJSON(foundFranchise.opportunities) || [],
            concerns: parseJSON(foundFranchise.concerns) || [],
            investment_breakdown: parseJSON(foundFranchise.investment_breakdown),
            franchised_units: foundFranchise.franchised_units,
            company_owned_units: foundFranchise.company_owned_units,
            state_distribution: parseJSON(foundFranchise.state_distribution),
            has_item19: foundFranchise.has_item19,
            item19_revenue_low: foundFranchise.item19_revenue_low,
            item19_revenue_high: foundFranchise.item19_revenue_high,
            item19_revenue_median: foundFranchise.item19_revenue_median,
            item19_revenue_average: foundFranchise.item19_revenue_average,
            item19_sample_size: foundFranchise.item19_sample_size,
            item19_time_period: foundFranchise.item19_time_period,
            revenue_data: parseJSON(foundFranchise.revenue_data),
            analytical_summary: foundFranchise.analytical_summary,
            initial_investment_low: foundFranchise.initial_investment_low,
            initial_investment_high: foundFranchise.initial_investment_high,
            franchise_fee: foundFranchise.franchise_fee,
            total_units: foundFranchise.total_units,
            franchise_score: foundFranchise.franchise_score,
            fddPdfUrl: foundFranchise.fdds?.pdf_url || foundFranchise.fdds?.[0]?.pdf_url,
            fdds: foundFranchise.fdds,
            franchiseScore: foundFranchise.franchise_score
              ? {
                  overall: overallScore,
                  maxScore: 600,
                  systemStability: {
                    score: systemStabilityScore,
                    max: 150,
                  },
                  supportQuality: {
                    score: supportQualityScore,
                    max: 150,
                  },
                  growthTrajectory: {
                    score: growthTrajectoryScore,
                    max: 150,
                  },
                  financialDisclosure: {
                    score: financialDisclosureScore,
                    max: 150,
                  },
                  riskLevel: foundFranchise.risk_level || getRiskLevel(overallScore),
                  industryPercentile: foundFranchise.industry_percentile || calculatePercentile(overallScore),
                  breakdown: transformBreakdown(parseJSON(foundFranchise.franchise_score_breakdown)),
                }
              : undefined,
            fdd_pdf_url: foundFranchise.fdd_pdf_url,
          }

          setFranchise(mappedFranchise)
          
          // Fetch white-label settings for this franchise
          const supabase = createBrowserClient()
          const { data: whiteLabelData } = await supabase
            .from("white_label_settings")
            .select("*")
            .eq("franchise_id", foundFranchise.id)
            .single()
          
          if (whiteLabelData) {
            console.log("[v0] White-label settings loaded for FDDAdvisor:", {
              franchise_id: whiteLabelData.franchise_id,
              resources_video_url: whiteLabelData.resources_video_url,
              resources_video_title: whiteLabelData.resources_video_title,
            })
            setWhiteLabelSettings(whiteLabelData)
          } else {
            console.log("[v0] No white-label settings found for franchise:", foundFranchise.id)
          }
        } else {
          setFranchise(null)
        }
      } catch (error) {
        console.error("[v0] Error fetching franchise:", error)
        setFranchise(null)
      } finally {
        setFranchiseLoading(false)
      }
    }

    fetchFranchise()
  }, [franchiseSlug])

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createBrowserClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // Check if user is a franchisor viewing their own franchise (regardless of auth disabled)
      if (session) {
        try {
          const { data: franchisorProfile } = await supabase
            .from("franchisor_profiles")
            .select("id, franchises(slug)")
            .eq("user_id", session.user.id)
            .single()

          if (franchisorProfile?.franchises) {
            const franchiseSlugs = Array.isArray(franchisorProfile.franchises)
              ? franchisorProfile.franchises.map((f: any) => f.slug)
              : [franchisorProfile.franchises.slug]
            
            if (franchiseSlugs.includes(franchiseSlug)) {
              console.log("[v0] Franchisor viewing their own franchise")
              setIsFranchisorViewing(true)
            }
          }
        } catch (franchisorError) {
          // Not a franchisor or no profile - that's fine
          console.log("[v0] User is not a franchisor or has no profile")
        }
      }

      if (isAuthDisabled) {
        console.log("[v0] Auth disabled for FDDAdvisor preview/testing")
        setIsAuthenticated(true)
        setIsLoading(false)
        return
      }

      try {
        if (!session) {
          setIsAuthenticated(false)
          setIsLoading(false)
          return
        }

        setIsAuthenticated(true)
      } catch (error) {
        console.error("[v0] Auth check error:", error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [franchiseSlug, router, isAuthDisabled])

  const handleAddNote = (franchiseId: string, title: string, content: string) => {
    const newNote: Note = {
      id: Date.now().toString(),
      franchiseId,
      title,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setNotes((prev) => [...prev, newNote])
  }

  const handleUpdateNote = (noteId: string, title: string, content: string) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId ? { ...note, title, content, updatedAt: new Date().toISOString() } : note,
      ),
    )
  }

  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== noteId))
  }

  const handleUpdateEngagement = (engagement: FDDEngagement) => {
    setEngagement(engagement)
  }

  const handleOpenModal = (type: string, franchiseId?: string) => {
    console.log("[v0] Opening modal:", type, franchiseId)
    setActiveModal(type)
  }

  const handleCloseModal = () => {
    setActiveModal(null)
  }

  const handleNavigate = (view: string) => {
    console.log("[v0] Navigating to:", view)
    if (view === "buyer-dashboard" || view === "franchisor-dashboard") {
      router.push("/dashboard")
    } else if (view === "admin") {
      router.push("/admin")
    } else if (view === "discover") {
      router.push("/discover")
    }
  }

  if (isLoading || franchiseLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated && !isAuthDisabled) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          currentView="fdd-viewer"
          onViewChange={() => {}}
          onBack={() => router.back()}
          onNavigate={handleNavigate}
        />
        <AuthGateModal
          isOpen={true}
          onClose={() => router.push("/discover")}
          returnUrl={`/fdd/${franchiseSlug}`}
          feature="fdd-viewer"
        />
      </div>
    )
  }

  if (!franchise) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          currentView="fdd-viewer"
          onViewChange={() => {}}
          onBack={() => router.back()}
          onNavigate={handleNavigate}
          hideSearch={true}
        />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-muted-foreground">Franchise not found</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        currentView="fdd-viewer"
        onViewChange={() => {}}
        onBack={() => router.back()}
        onNavigate={handleNavigate}
        hideSearch={true}
      />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <FDDViewer
          franchiseId={franchise.id}
          franchise={franchise}
          mode={isFranchisorViewing ? "hub-franchisor" : "advisor"}
          whiteLabelSettings={whiteLabelSettings || undefined}
          onOpenModal={handleOpenModal}
          notes={notes}
          onAddNote={handleAddNote}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={handleDeleteNote}
          engagement={engagement}
          onUpdateEngagement={handleUpdateEngagement}
        />
      </main>

      {activeModal === "investment" && franchise && (
        <InvestmentModal franchise={franchise} onClose={handleCloseModal} />
      )}

      {activeModal === "revenue" && franchise && <RevenueModal franchise={franchise} onClose={handleCloseModal} />}

      {activeModal === "location" && franchise && <LocationModal franchise={franchise} onClose={handleCloseModal} />}
    </div>
  )
}

function getRiskLevel(score: number): string {
  if (score >= 450) return "LOW"
  if (score >= 350) return "MODERATE"
  return "HIGH"
}

function calculatePercentile(score: number): number {
  return Math.round((score / 600) * 100)
}

function getCoverImageFallback(slug: string): string | undefined {
  const coverImages: Record<string, string> = {
    drybar: "/images/design-mode/Drybar-FDD-%282025%29%28Cover-Page%29_1.png",
    "radiant-waxing": "/images/radiant-waxing-cover.png",
    "amazing-lash-studio": "/images/amazing-lash-cover.png",
    "elements-massage": "/images/elements-massage-cover.png",
    "fitness-together": "/images/fitness-together-cover.png",
  }
  return coverImages[slug]
}
