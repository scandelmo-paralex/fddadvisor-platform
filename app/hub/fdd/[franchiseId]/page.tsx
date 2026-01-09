"use client"

// Build timestamp: 2025-12-08T23:50:00Z

import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from 'next/navigation'
import { createBrowserClient } from "@/lib/supabase/client"
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { WhiteLabelSettings } from "@/lib/types/database"
import { InvestmentModal } from "@/components/investment-modal"
import { RevenueModal } from "@/components/revenue-modal"
import { FDDViewer } from "@/components/fdd-viewer"
import { FDDViewerTour, useFDDViewerTour } from "@/components/product-tour"
import type { Franchise } from "@/lib/data"
import { toast } from "sonner"

// Note type matching FDDViewer expectations
interface Note {
  id: string
  pageNumber: number
  content: string
  createdAt: string
  updatedAt?: string
}

const isUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export default function WhiteLabelFDDPage() {
  const params = useParams()
  const router = useRouter()
  const franchiseId = params.franchiseId as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [franchise, setFranchise] = useState<Franchise | null>(null)
  const [whiteLabelSettings, setWhiteLabelSettings] = useState<WhiteLabelSettings | null>(null)
  const [hasAccess, setHasAccess] = useState(false)
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [fddId, setFddId] = useState<string | null>(null)

  // Product tour controls
  const { startTour, forceShow, onTourComplete } = useFDDViewerTour()

  // Fetch notes for this FDD
  const fetchNotes = useCallback(async (fddIdToFetch: string) => {
    try {
      const response = await fetch(`/api/notes?fdd_id=${fddIdToFetch}`)
      if (!response.ok) {
        console.error("[v0] Failed to fetch notes:", response.status)
        return
      }
      const data = await response.json()
      // Transform API response to match Note interface
      const transformedNotes: Note[] = (data.notes || []).map((note: any) => ({
        id: note.id,
        pageNumber: note.pageNumber || 1,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      }))
      setNotes(transformedNotes)
      console.log("[v0] Fetched notes:", transformedNotes.length)
    } catch (err) {
      console.error("[v0] Error fetching notes:", err)
    }
  }, [])

  // Add a new note - accepts object from fdd-viewer.tsx
  const handleAddNote = useCallback(async (noteData: { content: string; pageNumber: number; franchiseId?: string }) => {
    console.log("[v0] handleAddNote called with:", noteData)
    console.log("[v0] Current fddId:", fddId)
    
    if (!fddId) {
      console.error("[v0] handleAddNote - fddId is null!")
      toast.error("Cannot save note - FDD not loaded")
      return
    }

    const { content, pageNumber } = noteData
    console.log("[v0] Creating note - content:", content, "pageNumber:", pageNumber)
    
    // If content is empty, this is just initializing the UI - don't save yet
    if (!content || content.trim() === "") {
      // Create a temporary note for UI editing
      const tempNote: Note = {
        id: `temp-${Date.now()}`,
        pageNumber: pageNumber || 1,
        content: "",
        createdAt: new Date().toISOString(),
      }
      console.log("[v0] Creating temp note:", tempNote)
      setNotes(prev => {
        console.log("[v0] Previous notes count:", prev.length)
        return [tempNote, ...prev]
      })
      console.log("[v0] Temporary note created for editing")
      return
    }
    
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fddId,
          pageNumber,
          content,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save note")
      }

      const data = await response.json()
      const newNote: Note = {
        id: data.note.id,
        pageNumber: data.note.pageNumber || pageNumber,
        content: data.note.content,
        createdAt: data.note.createdAt,
        updatedAt: data.note.updatedAt,
      }

      setNotes(prev => [newNote, ...prev])
      toast.success("Note saved")
      console.log("[v0] Note added:", newNote.id)
    } catch (err: any) {
      console.error("[v0] Error adding note:", err)
      toast.error(err.message || "Failed to save note")
    }
  }, [fddId])

  // Update an existing note - signature matches fdd-viewer.tsx: (noteId, title, content)
  const handleUpdateNote = useCallback(async (noteId: string, _title: string, content: string) => {
    // Handle temp notes - replace with real saved note
    if (noteId.startsWith('temp-')) {
      // This is a temp note being saved for the first time
      if (!fddId) {
        toast.error("Cannot save note - FDD not loaded")
        return
      }
      
      try {
        const response = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fddId,
            pageNumber: notes.find(n => n.id === noteId)?.pageNumber || 1,
            content,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to save note")
        }

        const data = await response.json()
        const newNote: Note = {
          id: data.note.id,
          pageNumber: data.note.pageNumber || 1,
          content: data.note.content,
          createdAt: data.note.createdAt,
          updatedAt: data.note.updatedAt,
        }

        // Replace temp note with real note
        setNotes(prev => prev.map(note => 
          note.id === noteId ? newNote : note
        ))
        toast.success("Note saved")
        console.log("[v0] Temp note saved as:", newNote.id)
        return
      } catch (err: any) {
        console.error("[v0] Error saving temp note:", err)
        toast.error(err.message || "Failed to save note")
        return
      }
    }
    
    // Regular update for existing notes
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update note")
      }

      const data = await response.json()
      setNotes(prev => prev.map(note => 
        note.id === noteId 
          ? { ...note, content: data.note.content, updatedAt: data.note.updatedAt }
          : note
      ))
      toast.success("Note updated")
      console.log("[v0] Note updated:", noteId)
    } catch (err: any) {
      console.error("[v0] Error updating note:", err)
      toast.error(err.message || "Failed to update note")
    }
  }, [fddId, notes])

  // Delete a note
  const handleDeleteNote = useCallback(async (noteId: string) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete note")
      }

      setNotes(prev => prev.filter(note => note.id !== noteId))
      toast.success("Note deleted")
      console.log("[v0] Note deleted:", noteId)
    } catch (err: any) {
      console.error("[v0] Error deleting note:", err)
      toast.error(err.message || "Failed to delete note")
    }
  }, [])

  useEffect(() => {
    loadFDDData()
  }, [franchiseId])

  const loadFDDData = async () => {
    try {
      const supabase = createBrowserClient()

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        router.push("/login")
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from("buyer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()

      console.log("[v0] Profile lookup:", { userId: user.id, profile, profileError })

      if (profileError || !profile) {
        setError("Profile not found")
        setLoading(false)
        return
      }

      const isUUIDFormat = isUUID(franchiseId)

      const { data: franchiseData, error: franchiseError } = await supabase
        .from("franchises")
        .select(`
          id, name, slug, industry, description, logo_url, cover_image_url,
          initial_investment_low, initial_investment_high, total_investment_min, total_investment_max,
          franchise_fee, has_item19,
          total_units, average_revenue, item19_revenue_median,
          roi_timeframe, analytical_summary, opportunities, concerns,
          franchise_score_breakdown, revenue_data, investment_breakdown,
          state_distribution, franchised_units, company_owned_units,
          item19_revenue_low, item19_revenue_high,
          item19_sample_size, franchise_score,
          risk_level, industry_percentile, status,
          fdds!franchise_id(id, pdf_url)
        `)
        .eq("id", franchiseId)
        .single()

      console.log("[v0] Franchise lookup:", { franchiseId, franchiseData, franchiseError })

      if (franchiseError || !franchiseData) {
        console.error("[v0] Franchise query error:", franchiseError)
        setError("Franchise not found")
        setLoading(false)
        return
      }

      const actualFranchiseId = franchiseData.id

      // Extract FDD ID for notes and AI chat
      const extractedFddId = Array.isArray(franchiseData.fdds) 
        ? franchiseData.fdds[0]?.id 
        : franchiseData.fdds?.id
      
      if (extractedFddId) {
        setFddId(extractedFddId)
        console.log("[v0] FDD ID set:", extractedFddId)
        // Fetch notes for this FDD
        fetchNotes(extractedFddId)
      }

      const { data: access, error: accessError } = await supabase
        .from("lead_fdd_access")
        .select("id, consent_given_at, receipt_signed_at")
        .eq("buyer_id", profile.id)
        .eq("franchise_id", actualFranchiseId)
        .single()

      console.log("[v0] Access lookup:", {
        buyerId: profile.id,
        franchiseId: actualFranchiseId,
        access,
        accessError,
      })

      if (accessError || !access || !access.consent_given_at || !access.receipt_signed_at) {
        console.log("[v0] ACCESS DENIED - Compliance not completed, redirecting to My FDDs")
        router.push("/hub/my-fdds")
        return
      }

      console.log("[v0] ACCESS GRANTED - Both compliance steps completed")
      setHasAccess(true)

      await fetch("/api/hub/fdd-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ franchise_id: actualFranchiseId }),
      })

      const parseJSON = (value: any) => {
        if (typeof value === "string") {
          // If it's a URL, return it immediately without trying to parse
          if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("blob:")) {
            console.log("[v0] Skipping JSON parse for URL:", value.substring(0, 50))
            return value
          }
          // Only try to parse non-URL strings
          try {
            return JSON.parse(value)
          } catch (e) {
            console.warn("[v0] Failed to parse JSON, returning original value:", value.substring(0, 50))
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

      const scoreBreakdown = parseJSON(franchiseData.franchise_score_breakdown)

      const systemStabilityScore = scoreBreakdown?.system_strength?.total_score || 0
      const supportQualityScore = scoreBreakdown?.franchisee_support?.total_score || 0
      const growthTrajectoryScore = scoreBreakdown?.business_foundation?.total_score || 0
      const financialDisclosureScore = scoreBreakdown?.financial_transparency?.total_score || 0

      const overallScore = systemStabilityScore + supportQualityScore + growthTrajectoryScore + financialDisclosureScore

      const transformedFranchise: Franchise = {
        id: franchiseData.id,
        name: franchiseData.name,
        slug: franchiseData.slug || franchiseData.name.toLowerCase().replace(/\s+/g, "-"),
        industry: franchiseData.industry,
        description: franchiseData.description || "",
        logoUrl: franchiseData.logo_url,
        investmentMin: franchiseData.initial_investment_low || franchiseData.total_investment_min || 0,
        investmentMax: franchiseData.initial_investment_high || franchiseData.total_investment_max || 0,
        franchiseFee: franchiseData.franchise_fee,
        hasItem19: franchiseData.has_item19 || false,
        fddPdfUrl: Array.isArray(franchiseData.fdds) ? franchiseData.fdds[0]?.pdf_url : franchiseData.fdds?.pdf_url,
        fdds: franchiseData.fdds,
        totalUnits: franchiseData.total_units || 0,
        avgRevenue:
          franchiseData.item19_revenue_median || franchiseData.average_revenue || 0,
        roiTimeframe: franchiseData.roi_timeframe || "2-3 years",
        analyticalSummary: franchiseData.analytical_summary || "",
        opportunities: parseJSON(franchiseData.opportunities) || [],
        concerns: parseJSON(franchiseData.concerns) || [],
        franchiseScore: {
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
          riskLevel:
            franchiseData.risk_level || (overallScore >= 450 ? "LOW" : overallScore >= 350 ? "MODERATE" : "HIGH"),
          industryPercentile: franchiseData.industry_percentile || Math.round((overallScore / 600) * 100),
          breakdown: transformBreakdown(scoreBreakdown),
        },
        revenueData: parseJSON(franchiseData.revenue_data),
        investmentBreakdown: parseJSON(franchiseData.investment_breakdown),
        stateDistribution: parseJSON(franchiseData.state_distribution),
        investment_breakdown: parseJSON(franchiseData.investment_breakdown),
        franchised_units: franchiseData.franchised_units,
        company_owned_units: franchiseData.company_owned_units,
        state_distribution: parseJSON(franchiseData.state_distribution),
        has_item19: franchiseData.has_item19,
        item19_revenue_low: franchiseData.item19_revenue_low,
        item19_revenue_high: franchiseData.item19_revenue_high,
        item19_revenue_median: franchiseData.item19_revenue_median,
        item19_sample_size: franchiseData.item19_sample_size,
        revenue_data: parseJSON(franchiseData.revenue_data),
        analytical_summary: franchiseData.analytical_summary,
        initial_investment_low: franchiseData.initial_investment_low,
        initial_investment_high: franchiseData.initial_investment_high,
        franchise_fee: franchiseData.franchise_fee,
        total_units: franchiseData.total_units,
        franchise_score: franchiseData.franchise_score,
        status: franchiseData.status || "Established",
        coverImageUrl: franchiseData.cover_image_url || "",
      }

      console.log("[v0] Transformed franchise - excluding analysis_url field")
      setFranchise(transformedFranchise)

      const { data: whiteLabelData } = await supabase
        .from("white_label_settings")
        .select("*")
        .eq("franchise_id", franchiseData.id)
        .single()

      if (whiteLabelData) {
        setWhiteLabelSettings(whiteLabelData)
      }

      setLoading(false)
    } catch (err) {
      console.error("[v0] Error loading FDD:", err)
      setError("An error occurred")
      setLoading(false)
    }
  }

  const handleOpenModal = (type: string, franchiseId?: string) => {
    console.log("[v0] Opening modal:", type, franchiseId)
    setActiveModal(type)
  }

  const handleCloseModal = () => {
    setActiveModal(null)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !hasAccess || !franchise) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>{error || "You don't have access to this FDD"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/hub/my-fdds")} className="w-full">
              Back to My FDDs
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {whiteLabelSettings && (
        <div
          className="border-b py-4 px-6"
          style={{
            backgroundColor: whiteLabelSettings.primary_color + "10",
            borderColor: whiteLabelSettings.primary_color + "30",
          }}
        >
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              {whiteLabelSettings.logo_url && (
                <img
                  src={whiteLabelSettings.logo_url || "/placeholder.svg"}
                  alt={franchise.name}
                  className="h-12 w-auto object-contain"
                />
              )}
              <div>
                <h1 className="text-xl font-bold" style={{ color: whiteLabelSettings.primary_color }}>
                  {whiteLabelSettings.header_text || `${franchise.name} Franchise Disclosure Document`}
                </h1>
                {whiteLabelSettings.contact_name && (
                  <p className="text-sm text-muted-foreground">
                    Contact: {whiteLabelSettings.contact_name}
                    {whiteLabelSettings.contact_email && ` • ${whiteLabelSettings.contact_email}`}
                    {whiteLabelSettings.contact_phone && ` • ${whiteLabelSettings.contact_phone}`}
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={() => router.push("/hub/my-fdds")}
              variant="outline"
              style={{
                borderColor: whiteLabelSettings.primary_color,
                color: whiteLabelSettings.primary_color,
              }}
            >
              Back to My FDDs
            </Button>
          </div>
        </div>
      )}

      <FDDViewer
        franchiseId={franchise.id}
        franchise={franchise}
        mode="hub-lead"
        whiteLabelSettings={whiteLabelSettings || undefined}
        onOpenModal={handleOpenModal}
        notes={notes}
        onAddNote={handleAddNote}
        onUpdateNote={handleUpdateNote}
        onDeleteNote={handleDeleteNote}
        onUpdateEngagement={() => {}}
        showCoverOverlay={true}
        onStartTour={startTour}
      />

      {/* Product tour - auto-starts for first-time users */}
      <FDDViewerTour 
        franchiseName={franchise.name} 
        forceShow={forceShow}
        onComplete={onTourComplete}
        onSkip={onTourComplete}
      />



      {activeModal === "investment" && franchise && (
        <InvestmentModal franchise={franchise} onClose={handleCloseModal} />
      )}

      {activeModal === "revenue" && franchise && <RevenueModal franchise={franchise} onClose={handleCloseModal} />}
    </div>
  )
}
