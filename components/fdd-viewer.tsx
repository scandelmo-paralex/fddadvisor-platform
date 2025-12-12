"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  Clock,
  MessageSquare,
  FileCheck,
  List,
  FileText,
  DollarSign,
  TrendingUp,
  Building2,
  StickyNote,
  Plus,
  X,
  Pencil,
  Info,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { franchises, franchisePreApprovals, type Note, type FDDEngagement } from "@/lib/data"
import { ResizableDivider } from "@/components/resizable-divider"
import { ConnectFranchisorModal } from "@/components/connect-franchisor-modal"
import { ConnectLenderModal } from "@/components/connect-lender-modal"
import { FDDAIChat } from "@/components/fdd-ai-chat"
import { Item19Modal } from "@/components/item19-modal"
import { LocationsModal } from "@/components/locations-modal"
import { InvestmentModal } from "@/components/investment-modal"
import { RevenueModal } from "@/components/revenue-modal"
import type { WhiteLabelSettings } from "@/lib/types/database"
import { FDDCoverOverlay } from "@/components/fdd-cover-overlay"
import { useSearchParams } from "next/navigation"
import { FranchiseScoreConsentModal } from "@/components/franchisescore-consent-modal"
import { FranchiseScoreDisclaimerModal } from "@/components/franchisescore-disclaimer-modal"
import { FranchiseScore } from "@/components/franchise-score" // Import the new FranchiseScore component

const pdfModules: {
  Document: any
  Page: any
  pdfjs: any
} | null = null

const pdfViewerStyles = `
  .react-pdf__Page {
    position: relative !important;
  }

  .react-pdf__Page__textContent {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    overflow: hidden !important;
    color: transparent !important;
    pointer-events: auto !important;
  }

  .react-pdf__Page__canvas {
    display: block !important;
  }
`

interface FDDViewerProps {
  franchiseId?: string
  franchise?: any // Made franchise prop optional and direct
  mode?: "advisor" | "hub-lead" | "hub-franchisor" // Added mode prop for white-label support
  whiteLabelSettings?: WhiteLabelSettings // Added white-label settings prop
  onOpenModal?: (type: string, franchiseId?: string) => void
  notes?: Note[]
  onAddNote?: (note: Omit<Note, "id" | "createdAt" | "updatedAt"> & { franchiseId?: string }) => void
  onUpdateNote?: (noteId: string, title: string, content: string) => void
  onDeleteNote?: (noteId: string) => void
  engagement?: FDDEngagement
  onUpdateEngagement?: (engagement: FDDEngagement) => void
  isUploadedLead?: boolean
  showCoverOverlay?: boolean // Changed default from true to false to prevent dark overlay
}

const getStateUnitCounts = (franchiseId: string, totalUnits: number): Record<string, number> => {
  // Daisy state breakdown from FDD analysis (12 total units across 5 states)
  if (franchiseId === "7") {
    return {
      all: 12,
      CA: 3, // Costa Mesa location mentioned
      FL: 2, // Sarasota location mentioned
      CT: 1, // Norwalk location mentioned
      TX: 3,
      NY: 3,
    }
  }

  // Blo Blow Dry Bar state breakdown from FDD analysis
  if (franchiseId === "6") {
    return {
      all: 100,
      TX: 29,
      FL: 13,
      CA: 7,
      NY: 5,
    }
  }

  // The UPS Store
  if (franchiseId === "3") {
    return {
      all: 5400,
      CA: 650,
      TX: 480,
      FL: 420,
      NY: 380,
    }
  }

  // Default: use total units for all, estimate state distribution
  return {
    all: totalUnits,
    CA: Math.round(totalUnits * 0.12),
    TX: Math.round(totalUnits * 0.09),
    FL: Math.round(totalUnits * 0.08),
    NY: Math.round(totalUnits * 0.07),
  }
}

export function FDDViewer({
  franchiseId: propFranchiseId,
  franchise: propFranchise,
  mode = "advisor", // Default to advisor mode
  whiteLabelSettings, // White-label settings
  onOpenModal,
  notes: propNotes = [], // Made optional with default
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  engagement,
  onUpdateEngagement,
  isUploadedLead = false,
  showCoverOverlay: initialShowCoverOverlay = true, // Renamed prop to initial value
}: FDDViewerProps) {
  const searchParams = useSearchParams()

  const franchise = propFranchise || franchises.find((f) => f.id === propFranchiseId)
  const franchiseId = franchise?.id || propFranchiseId || ""
  const [expandedOpportunity, setExpandedOpportunity] = useState<number | null>(null)
  const [expandedConcern, setExpandedConcern] = useState<number | null>(null)
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false) // Added state for collapsible AI summary
  const [isDisclaimerExpanded, setIsDisclaimerExpanded] = useState(false)
  const [isPdfVisible, setIsPdfVisible] = useState(true)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [showLenderModal, setShowLenderModal] = useState(false)
  const [showItem19Modal, setShowItem19Modal] = useState(false) // Added state for Item 19 modal
  const [showLocationsModal, setShowLocationsModal] = useState(false) // Added state for locations modal
  // Add states for Investment and Revenue modals
  const [showInvestmentModal, setShowInvestmentModal] = useState(false)
  const [showRevenueModal, setShowRevenueModal] = useState(false)
  const [isSaved, setIsSaved] = useState(true) // Default to true since we're showing saved franchises
  const [targetItem, setTargetItem] = useState<number | undefined>(undefined) // Added state to track which FDD item to navigate to
  const [showCoverOverlay, setShowCoverOverlay] = useState(initialShowCoverOverlay) // Added local state for cover overlay

  const [activeTab, setActiveTab] = useState<"document" | "franchisescore">("document")

  const [franchiseScoreConsent, setFranchiseScoreConsent] = useState<boolean | null>(null)
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false)
  const [consentLoading, setConsentLoading] = useState(false)
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null) // Track PDF module load errors

  const [isToolbarExpanded, setIsToolbarExpanded] = useState(true)
  const [isQuickLinksExpanded, setIsQuickLinksExpanded] = useState(false)
  const [isEngagementExpanded, setIsEngagementExpanded] = useState(false)

  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null) // Added state for PDF blob URL to bypass CORS

  const [pageInput, setPageInput] = useState<string>("")

  const [isPageVisible, setIsPageVisible] = useState(true)
  const [isUserActive, setIsUserActive] = useState(true)
  const lastActivityRef = useRef<number>(Date.now())
  const IDLE_TIMEOUT = 120000 // 2 minutes of inactivity

  const shouldSaveOnEventRef = useRef(false)

  const [localEngagement, setLocalEngagement] = useState<FDDEngagement>(
    engagement || {
      franchiseId,
      questionsAsked: [],
      sectionsViewed: [],
      timeSpent: 0,
      notesCreated: 0,
      startTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      viewedItems: [],
      downloaded: false,
      downloadedAt: undefined,
      milestones: {}, // Initialize milestones
    },
  )

  const [sessionId] = useState(() => {
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("fdd_session_id")
      if (!id) {
        id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem("fdd_session_id", id)
      }
      return id
    }
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  })

  const [lastSavedEngagement, setLastSavedEngagement] = useState<string>("")
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const engagementRef = useRef(localEngagement)

  const [selectedItem, setSelectedItem] = useState("")
  const [fddItems, setFddItems] = useState<Array<{ itemNumber: number; pageNumber: number; label: string }>>([])
  const [itemsLoading, setItemsLoading] = useState(false)

  const [selectedExhibit, setSelectedExhibit] = useState("")
  const [fddExhibits, setFddExhibits] = useState<Array<{ name: string; pageNumber: number }>>([])
  const [exhibitsLoading, setExhibitsLoading] = useState(false)

  const [fddQuickLinks, setFddQuickLinks] = useState<Array<{ name: string; pageNumber: number }>>([])
  const [quickLinksLoading, setQuickLinksLoading] = useState(false)

  // State for thumbnail visibility range
  const [visibleThumbnailRange, setVisibleThumbnailRange] = useState({ start: 0, end: 30 })
  const thumbnailContainerRef = useRef<HTMLDivElement>(null)

  // State for inline note editing
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState<string>("")
  const [previousNotesCount, setPreviousNotesCount] = useState<number>(0)

  // Auto-open editing for newly created notes
  useEffect(() => {
    if (propNotes.length > previousNotesCount) {
      // A new note was added - find the newest one (with empty content)
      const newNote = propNotes.find(n => !n.content || n.content === "")
      if (newNote && !editingNoteId) {
        setEditingNoteId(newNote.id)
        setEditingContent("")
      }
    }
    setPreviousNotesCount(propNotes.length)
  }, [propNotes, propNotes.length, previousNotesCount, editingNoteId])

  const [isMounted, setIsMounted] = useState(false)
  const [pdfComponents, setPdfComponents] = useState<{
    Document: any
    Page: any
    pdfjs: any
  } | null>(null)

  // Define showConnectButtons here
  const showConnectButtons = mode === "advisor" || mode === "hub-lead"

  const triggerEventSave = useCallback(() => {
    // Debounce: only save if not already saving recently
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveEngagementToDatabase(engagementRef.current)
    }, 2000) // Wait 2 seconds after last event before saving
  }, [])

  // Track when user views a specific item (for Item 7, Item 19, etc.)
  const trackItemView = useCallback(
    (itemNumber: number) => {
      setLocalEngagement((prev) => {
        const itemKey = `item${itemNumber}`
        if (prev.viewedItems?.includes(itemKey)) return prev

        const newViewedItems = [...(prev.viewedItems || []), itemKey]
        const isItem7 = itemNumber === 7
        const isItem19 = itemNumber === 19

        return {
          ...prev,
          viewedItems: newViewedItems,
          lastActivity: new Date().toISOString(),
          milestones: {
            ...prev.milestones,
            viewedItem7: prev.milestones?.viewedItem7 || isItem7,
            viewedItem19: prev.milestones?.viewedItem19 || isItem19,
          },
        }
      })
      triggerEventSave()
    },
    [triggerEventSave],
  )

  // Track when user asks a question
  const trackQuestionAsked = useCallback(
    (question: string) => {
      setLocalEngagement((prev) => ({
        ...prev,
        questionsAsked: [...(prev.questionsAsked || []), question],
        lastActivity: new Date().toISOString(),
        milestones: {
          ...prev.milestones,
          askedQuestions: true,
        },
      }))
      triggerEventSave()
    },
    [triggerEventSave],
  )

  // Track when user downloads FDD
  const trackDownload = useCallback(() => {
    setLocalEngagement((prev) => ({
      ...prev,
      downloaded: true,
      downloadedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    }))
    saveEngagementToDatabase(engagementRef.current)
  }, [])

  // Fetch item mappings from database
  useEffect(() => {
    const fetchItemMappings = async () => {
      if (!franchise?.slug) {
        console.log("[v0] Skipping item mappings fetch - no franchise slug. Franchise object:", franchise)
        return
      }

      console.log("[v0] === FETCHING ITEM MAPPINGS ===")
      console.log("[v0] Franchise slug:", franchise.slug)
      console.log("[v0] Franchise name:", franchise.name)
      console.log("[v0] Full franchise object keys:", Object.keys(franchise))

      setItemsLoading(true)
      try {
        const apiUrl = `/api/fdd/item-mappings?franchise_slug=${franchise.slug}`
        console.log("[v0] Calling API:", apiUrl)

        const response = await fetch(apiUrl)
        console.log("[v0] API response status:", response.status)

        if (!response.ok) {
          const errorText = await response.text()
          console.error("[v0] API error response:", errorText)
          throw new Error(`Failed to fetch: ${response.status} ${errorText}`)
        }

        const data = await response.json()
        console.log("[v0] API response data:", {
          itemsCount: data.items?.length || 0,
          mappingsCount: data.mappings?.length || 0,
          debug: data.debug,
          sampleItem: data.items?.[0],
          sampleMapping: data.mappings?.[0],
        })

        if (data.debug) {
          console.warn("[v0] DEBUG INFO FROM API:", data.debug)
        }

        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          console.log("[v0] ✓ Setting fddItems with", data.items.length, "items")
          setFddItems(data.items)
        } else {
          console.warn("[v0] ✗ No items found in API response")
          setFddItems([])
        }

        if (data.mappings && Array.isArray(data.mappings)) {
          const exhibits = data.mappings
            .filter((m: any) => m.mapping_type === "exhibit")
            .map((m: any) => ({
              name: m.label,
              pageNumber: m.page_number,
            }))
            .sort((a: any, b: any) => a.pageNumber - b.pageNumber) // Sort by page number

          console.log("[v0] ✓ Setting fddExhibits with", exhibits.length, "exhibits")
          setFddExhibits(exhibits)

          const quickLinks = data.mappings
            .filter((m: any) => m.mapping_type === "quick_link")
            .map((m: any) => ({
              name: m.label,
              pageNumber: m.page_number,
            }))

          console.log("[v0] ✓ Setting fddQuickLinks with", quickLinks.length, "quick links")
          setFddQuickLinks(quickLinks)
        }
      } catch (error) {
        console.error("[v0] Error fetching item mappings:", error)
        setFddItems([])
        setFddExhibits([])
        setFddQuickLinks([])
      } finally {
        setItemsLoading(false)
        console.log("[v0] === FETCH COMPLETE ===")
      }
    }

    fetchItemMappings()
  }, [franchise]) // Fixed lint error - using franchise instead of franchise?.slug

  // Removed duplicate useEffects for exhibits and quick links as they are now fetched in the main item mappings useEffect above

  useEffect(() => {
    if (franchise?.fddPdfUrl) {
      setPdfLoading(true)
      setPdfError(null)
    }
  }, [franchise?.fddPdfUrl])

  useEffect(() => {
    engagementRef.current = localEngagement
  }, [localEngagement])

  useEffect(() => {
    const timeInterval = setInterval(() => {
      // Only track time if page is visible AND user is active
      if (isPageVisible && isUserActive) {
        setLocalEngagement((prev) => ({
          ...prev,
          timeSpent: prev.timeSpent + 1,
          lastActivity: new Date().toISOString(),
          milestones: {
            ...prev.milestones,
            viewedFDD: true,
            spentSignificantTime: prev.timeSpent + 1 >= 900,
          },
        }))
      }
    }, 1000)

    const saveInterval = setInterval(() => {
      const currentEngagement = engagementRef.current
      saveEngagementToDatabase(currentEngagement)
    }, 60000)

    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveEngagementToDatabase(engagementRef.current)
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable save on page unload
      if (franchise) {
        const data = JSON.stringify({
          franchiseId: franchise.id,
          franchiseSlug: franchise.slug,
          timeSpent: engagementRef.current.timeSpent,
          questionsAsked: engagementRef.current.questionsAsked || [],
          sectionsViewed: engagementRef.current.sectionsViewed || [],
          viewedItems: engagementRef.current.viewedItems || [],
          notesCreated: engagementRef.current.notesCreated || 0,
          downloaded: engagementRef.current.downloaded || false,
          downloadedAt: engagementRef.current.downloadedAt,
          lastActivity: new Date().toISOString(),
          sessionId: sessionId,
          viewedFDD: engagementRef.current.milestones?.viewedFDD || false,
          askedQuestions: engagementRef.current.milestones?.askedQuestions || false,
          viewedItem19: engagementRef.current.milestones?.viewedItem19 || false,
          viewedItem7: engagementRef.current.milestones?.viewedItem7 || false,
          createdNotes: engagementRef.current.milestones?.createdNotes || false,
          spentSignificantTime: engagementRef.current.milestones?.spentSignificantTime || false,
        })
        navigator.sendBeacon("/api/fdd/engagement", data)
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      clearInterval(timeInterval)
      clearInterval(saveInterval)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [isPageVisible, isUserActive, franchise, sessionId])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      // Save immediately on unmount using ref
      saveEngagementToDatabase(engagementRef.current)
    }
  }, [])

  useEffect(() => {
    if (!pageNumber || fddItems.length === 0) return

    const currentItem = fddItems.find((item, index) => {
      const nextItem = fddItems[index + 1]
      return pageNumber >= item.pageNumber && (!nextItem || pageNumber < nextItem.pageNumber)
    })

    if (currentItem) {
      // Use trackItemView for tracking item views
      trackItemView(currentItem.itemNumber)
    }
  }, [pageNumber, fddItems, trackItemView])

  useEffect(() => {
    if (franchise) {
      console.log("[v0] Franchise data:", {
        name: franchise.name,
        investment_breakdown: franchise.investment_breakdown,
        franchised_units: franchise.franchised_units,
        company_owned_units: franchise.company_owned_units,
        state_distribution: franchise.state_distribution,
        analytical_summary: franchise.analytical_summary,
      })
      console.log("[v0] FDD Viewer - Cover Image URL:", {
        coverImageUrl: franchise.coverImageUrl,
        cover_image_url: franchise.cover_image_url,
        logoUrl: franchise.logoUrl,
      })
      console.log("[v0] FDD Viewer - Franchise Score Data:", {
        franchiseScore: franchise.franchiseScore,
        franchise_score: franchise.franchise_score,
        franchise_score_breakdown: franchise.franchise_score_breakdown,
        franchiseScoreBreakdown: franchise.franchiseScoreBreakdown,
      })
    }
  }, [franchise])

  useEffect(() => {
    const fetchPdfAsBlob = async () => {
      if (!franchise?.fddPdfUrl) {
        console.log("[v0] No PDF URL found for franchise")
        return
      }

      console.log("[v0] Fetching PDF as blob from:", franchise.fddPdfUrl)
      setPdfLoading(true)
      setPdfError(null)

      try {
        let pdfUrl = franchise.fddPdfUrl

        // If it's a relative URL, make it absolute
        if (pdfUrl.startsWith("/")) {
          pdfUrl = `${window.location.origin}${pdfUrl}`
          console.log("[v0] Converted relative URL to absolute:", pdfUrl)
        }

        const response = await fetch(pdfUrl, {
          mode: "cors",
          credentials: "omit",
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const contentType = response.headers.get("content-type")
        console.log("[v0] PDF content type:", contentType)

        if (!contentType?.includes("pdf") && !contentType?.includes("octet-stream")) {
          console.warn("[v0] Unexpected content type:", contentType)
        }

        const blob = await response.blob()
        console.log("[v0] PDF blob size:", blob.size, "bytes")

        if (blob.size === 0) {
          throw new Error("PDF file is empty")
        }

        const blobUrl = URL.createObjectURL(blob)
        setPdfBlobUrl(blobUrl)
        console.log("[v0] PDF blob URL created successfully")
      } catch (error) {
        console.error("[v0] Error fetching PDF as blob:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to load PDF"
        setPdfError(errorMessage)
        setPdfLoading(false)

        if (franchise.fddPdfUrl && !franchise.fddPdfUrl.startsWith("/")) {
          console.log("[v0] Attempting to use direct PDF URL as fallback")
          setPdfBlobUrl(franchise.fddPdfUrl)
        }
      }
    }

    fetchPdfAsBlob()

    // Cleanup blob URL on unmount
    return () => {
      if (pdfBlobUrl && pdfBlobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(pdfBlobUrl)
      }
    }
  }, [franchise?.fddPdfUrl])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return // Don't interfere with input fields
      }

      switch (e.key) {
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault()
          setPageNumber((prev) => Math.max(1, prev - 1))
          break
        case "ArrowRight":
        case "PageDown":
          e.preventDefault()
          setPageNumber((prev) => Math.min(numPages, prev + 1))
          break
        case "Home":
          e.preventDefault()
          setPageNumber(1)
          break
        case "End":
          e.preventDefault()
          setPageNumber(numPages)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [numPages])

  useEffect(() => {
    if (typeof window !== "undefined" && !pdfComponents) {
      import("react-pdf")
        .then((reactPdf) => {
          const { Document, Page, pdfjs } = reactPdf

          // Set worker source
          pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

          setPdfComponents({ Document, Page, pdfjs })
          setPdfLoadError(null)
          console.log("[v0] PDF modules loaded successfully")
        })
        .catch((error) => {
          console.error("Error loading PDF modules:", error)
          setPdfLoadError(error.message || "Failed to load PDF viewer")
        })
    }
  }, [])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const fetchConsentStatus = async () => {
      if (!franchise?.slug) return

      try {
        const response = await fetch(`/api/buyer/consent/franchisescore?fdd_id=${franchise.slug}`)
        if (response.ok) {
          const data = await response.json()
          setFranchiseScoreConsent(data.consented)
        }
      } catch (error) {
        console.error("Error fetching consent status:", error)
        setFranchiseScoreConsent(false)
      }
    }
    fetchConsentStatus()
  }, [franchise?.slug])

  useEffect(() => {
    // Handle page visibility changes
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden
      setIsPageVisible(isVisible)
      console.log("[v0] Page visibility changed:", isVisible ? "visible" : "hidden")
    }

    // Handle user activity for idle detection
    const handleUserActivity = () => {
      lastActivityRef.current = Date.now()
      if (!isUserActive) {
        setIsUserActive(true)
        console.log("[v0] User became active")
      }
    }

    // Check for idle timeout every 10 seconds
    const idleCheckInterval = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current
      const shouldBeActive = timeSinceLastActivity < IDLE_TIMEOUT

      if (shouldBeActive !== isUserActive) {
        setIsUserActive(shouldBeActive)
        console.log("[v0] User activity status changed:", shouldBeActive ? "active" : "idle")
      }
    }, 10000)

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange)
    document.addEventListener("mousemove", handleUserActivity)
    document.addEventListener("mousedown", handleUserActivity)
    document.addEventListener("keydown", handleUserActivity)
    document.addEventListener("scroll", handleUserActivity, true)
    document.addEventListener("touchstart", handleUserActivity)

    // Initialize visibility state
    setIsPageVisible(!document.hidden)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      document.removeEventListener("mousemove", handleUserActivity)
      document.removeEventListener("mousedown", handleUserActivity)
      document.removeEventListener("keydown", handleUserActivity)
      document.removeEventListener("scroll", handleUserActivity, true)
      document.removeEventListener("touchstart", handleUserActivity)
      clearInterval(idleCheckInterval)
    }
  }, [isUserActive])

  const handleThumbnailScroll = () => {
    if (!thumbnailContainerRef.current) return

    const scrollTop = thumbnailContainerRef.current.scrollTop
    const thumbnailHeight = 140 // Height of each thumbnail item
    const buffer = 10

    const start = Math.max(0, Math.floor(scrollTop / thumbnailHeight) - buffer)
    const end = Math.min(numPages, start + 30 + buffer * 2)

    setVisibleThumbnailRange({ start, end })
  }

  const saveEngagementToDatabase = async (engagementData: FDDEngagement) => {
    if (!franchise) return

    // Engagement tracking now works for hub leads, advisor mode, and franchisor views

    try {
      const response = await fetch("/api/fdd/engagement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          franchiseId: franchise.id,
          franchiseSlug: franchise.slug,
          timeSpent: engagementData.timeSpent,
          questionsAsked: engagementData.questionsAsked || [],
          sectionsViewed: engagementData.sectionsViewed || [],
          viewedItems: engagementData.viewedItems || [],
          notesCreated: engagementData.notesCreated || 0,
          downloaded: engagementData.downloaded || false,
          downloadedAt: engagementData.downloadedAt,
          lastActivity: engagementData.lastActivity || new Date().toISOString(),
          sessionId: sessionId,
          // Milestones
          viewedFDD: engagementData.milestones?.viewedFDD || false,
          askedQuestions: engagementData.milestones?.askedQuestions || false,
          viewedItem19: engagementData.milestones?.viewedItem19 || false,
          viewedItem7: engagementData.milestones?.viewedItem7 || false,
          createdNotes: engagementData.milestones?.createdNotes || false,
          spentSignificantTime: engagementData.milestones?.spentSignificantTime || false,
        }),
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Expected JSON but got:", contentType)
        const text = await response.text()
        console.error("Response body (first 200 chars):", text.substring(0, 200))
        return
      }

      if (!response.ok) {
        const error = await response.json()
        console.error("Error saving engagement:", error)
      } else {
        const result = await response.json()
        setLastSavedEngagement(JSON.stringify(engagementData))
      }
    } catch (error) {
      console.error("Error saving engagement to database:", error)
    }
  }

  const debouncedSaveEngagement = (engagementData: FDDEngagement) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      const currentEngagementString = JSON.stringify(engagementData)
      // Only save if engagement has changed
      if (currentEngagementString !== lastSavedEngagement) {
        saveEngagementToDatabase(engagementData)
      }
    }, 5000) // Save after 5 seconds of inactivity
  }

  const handleQuestionAsked = (question: string) => {
    setLocalEngagement((prev) => {
      const updated = {
        ...prev,
        questionsAsked: [...prev.questionsAsked, question],
        lastActivity: new Date().toISOString(),
        milestones: {
          ...prev.milestones,
          askedQuestions: true,
        },
      }

      if (onUpdateEngagement) {
        setTimeout(() => onUpdateEngagement(updated), 0)
      }

      saveEngagementToDatabase(updated)
      return updated
    })
  }

  const handleSectionViewed = (section: string) => {
    setLocalEngagement((prev) => {
      if (prev.sectionsViewed.includes(section)) return prev

      const updated = {
        ...prev,
        sectionsViewed: [...prev.sectionsViewed, section],
        lastActivity: new Date().toISOString(),
        milestones: {
          ...prev.milestones,
          viewedItem19: section === "Item 19" || prev.milestones?.viewedItem19,
          viewedItem7: section === "Item 7" || prev.milestones?.viewedItem7,
        },
      }

      if (onUpdateEngagement) {
        setTimeout(() => onUpdateEngagement(updated), 0)
      }

      saveEngagementToDatabase(updated)
      return updated
    })
  }

  const handleReviewItem19 = () => {
    setLocalEngagement((prev) => {
      const updated = {
        ...prev,
        sectionsViewed: [...new Set([...prev.sectionsViewed, "Item 19"])],
        lastActivity: new Date().toISOString(),
        milestones: {
          ...prev.milestones,
          viewedItem19: true,
        },
      }

      if (onUpdateEngagement) {
        setTimeout(() => onUpdateEngagement(updated), 0)
      }

      saveEngagementToDatabase(updated)
      return updated
    })

    setShowItem19Modal(true)
  }

  const handleNavigateToItem = (item: number) => {
    console.log("[v0] FDD Viewer: Navigating to Item", item)
    setTargetItem(item)
    setIsPdfVisible(true)
  }

  const handleUploadComplete = (urls: string[], pageMapping?: { [key: string]: number[] }) => {
    console.log("[v0] FDD pages uploaded successfully:", urls.length, "pages")
    console.log("[v0] Page mapping:", pageMapping)
    // In a real implementation, you would update the franchise data in your database
    // For now, we'll just log the success
    alert(`Successfully uploaded ${urls.length} FDD pages! The franchise data should be updated in your database.`)
  }

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setPdfLoading(false)
    setPdfError(null)
    console.log("[v0] PDF loaded successfully with", numPages, "pages")
    setVisibleThumbnailRange({ start: 0, end: Math.min(numPages, 30) }) // Initialize visible range

    setLocalEngagement((prev) => {
      const updated = {
        ...prev,
        milestones: {
          ...prev.milestones,
          viewedFDD: true,
        },
        lastActivity: new Date().toISOString(),
      }

      if (onUpdateEngagement) {
        setTimeout(() => onUpdateEngagement(updated), 0)
      }

      saveEngagementToDatabase(updated)
      return updated
    })
  }

  const onDocumentLoadError = (error: Error) => {
    console.error("Error loading PDF:", error)
    setPdfError(error.message)
    setPdfLoading(false)
  }

  const handleItemSelect = (value: string) => {
    setSelectedItem(value)
    console.log("[v0] FDD Viewer: Selected Item", value)

    const selectedItemData = fddItems.find((item) => item.itemNumber.toString() === value)
    if (selectedItemData) {
      console.log("[v0] Navigating to page", selectedItemData.pageNumber, "for Item", selectedItemData.itemNumber)
      setPageNumber(selectedItemData.pageNumber)

      setLocalEngagement((prev) => {
        const updated = {
          ...prev,
          sectionsViewed: [...new Set([...prev.sectionsViewed, `Item ${selectedItemData.itemNumber}`])],
          lastActivity: new Date().toISOString(),
          milestones: {
            ...prev.milestones,
            viewedItem19: selectedItemData.itemNumber === 19 || prev.milestones?.viewedItem19,
            viewedItem7: selectedItemData.itemNumber === 7 || prev.milestones?.viewedItem7,
          },
        }

        if (onUpdateEngagement) {
          setTimeout(() => onUpdateEngagement(updated), 0)
        }

        saveEngagementToDatabase(updated)
        return updated
      })
    }
  }

  const handleExhibitSelect = (value: string) => {
    setSelectedExhibit(value)
    console.log("[v0] FDD Viewer: Selected Exhibit", value)

    const selectedExhibitData = fddExhibits.find((exhibit) => exhibit.name === value)
    if (selectedExhibitData) {
      console.log("[v0] Navigating to page", selectedExhibitData.pageNumber, "for", selectedExhibitData.name)
      setPageNumber(selectedExhibitData.pageNumber)

      setLocalEngagement((prev) => {
        const updated = {
          ...prev,
          sectionsViewed: [...new Set([...prev.sectionsViewed, selectedExhibitData.name])],
          lastActivity: new Date().toISOString(),
        }

        if (onUpdateEngagement) {
          setTimeout(() => onUpdateEngagement(updated), 0)
        }

        saveEngagementToDatabase(updated)
        return updated
      })
    }
  }

  const handlePageJump = (e: React.FormEvent) => {
    e.preventDefault()
    const pageNum = Number.parseInt(pageInput)
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= numPages) {
      setPageNumber(pageNum)
      setPageInput("")
    }
  }

  const handleBookmarkClick = (page: number) => {
    setPageNumber(page)
  }

  // Refactored handleDownload to handleDownloadPDF
  const handleDownloadPDF = async () => {
    if (!franchise?.fddPdfUrl) return

    try {
      console.log("[v0] Downloading PDF from:", franchise.fddPdfUrl)

      // Use trackDownload to update engagement state
      trackDownload()

      // Fetch the PDF as a blob
      const response = await fetch(franchise.fddPdfUrl)
      if (!response.ok) throw new Error("Failed to fetch PDF")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      // Create a temporary link and trigger download
      const link = document.createElement("a")
      link.href = url
      link.download = `${franchise.slug}-FDD-2025.pdf`
      document.body.appendChild(link)
      link.click()

      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      console.log("[v0] PDF downloaded successfully")
    } catch (error) {
      console.error("Error downloading PDF:", error)
      // Fallback: open in new tab
      window.open(franchise.fddPdfUrl, "_blank")
    }
  }

  const hasReviewedItem19 =
    localEngagement.sectionsViewed.includes("Item 19") ||
    localEngagement.viewedItems?.some((item) => item.includes("19")) ||
    false
  const hasAskedQuestions = localEngagement.questionsAsked.length >= 3
  const hasSpentEnoughTime = localEngagement.timeSpent >= 600 // 10 minutes
  const viewedItemsCount = localEngagement.viewedItems?.filter((item) => item.startsWith("item")).length || 0

  const revenueData = franchise?.revenueData
    ? [
        { year: "2022", revenue: Math.round((franchise.revenueData.average * 0.92) / 1000) },
        { year: "2023", revenue: Math.round((franchise.revenueData.average * 0.96) / 1000) },
        { year: "2024", revenue: Math.round(franchise.revenueData.average / 1000) },
      ]
    : franchise?.avgRevenue
      ? [
          { year: "2022", revenue: Math.round((franchise.avgRevenue * 0.92) / 1000) },
          { year: "2023", revenue: Math.round((franchise.avgRevenue * 0.96) / 1000) },
          { year: "2024", revenue: Math.round(franchise.avgRevenue / 1000) },
        ]
      : null

  if (!franchise) return null

  const preApproval = franchisePreApprovals.find((p) => p.franchiseId === franchiseId)

  const leftPanel = (
    <div className="h-full flex flex-col px-6 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: pdfViewerStyles }} />

      {!franchise?.fddPdfUrl ? (
        <Card className="flex h-full items-center justify-center p-8">
          <p className="text-muted-foreground">No FDD document available</p>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                disabled={pageNumber <= 1}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <form onSubmit={handlePageJump} className="flex items-center">
                <input
                  type="number"
                  min="1"
                  max={numPages}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  placeholder="#"
                  className="w-14 px-2 py-1.5 text-sm text-center border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </form>
              <Button
                onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                disabled={pageNumber >= numPages}
                variant="outline"
                size="sm"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              {numPages > 0 && (
                <span className="text-sm text-muted-foreground ml-2">
                  Page {pageNumber} of {numPages}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Progress indicator */}
              {numPages > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${(pageNumber / numPages) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{Math.round((pageNumber / numPages) * 100)}%</span>
                </div>
              )}
              <Button onClick={handleDownloadPDF} variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 flex justify-center min-h-0">
            {pdfLoadError ? (
              <Card className="flex h-full w-full items-center justify-center p-8">
                <div className="text-center space-y-4">
                  <p className="text-lg font-semibold text-muted-foreground">PDF Viewer Error</p>
                  <p className="text-sm text-red-500">{pdfLoadError}</p>
                  <a
                    href={franchise.fddPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Open PDF in new tab
                  </a>
                </div>
              </Card>
            ) : isMounted && pdfComponents ? (
              <pdfComponents.Document
                file={pdfBlobUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <Card className="flex h-64 w-full items-center justify-center p-8">
                    <div className="text-center space-y-4">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                      <p className="text-muted-foreground">Loading PDF...</p>
                    </div>
                  </Card>
                }
                error={
                  <Card className="flex h-full w-full items-center justify-center p-8">
                    <div className="text-center space-y-4">
                      <p className="text-lg font-semibold text-muted-foreground">Unable to load PDF</p>
                      {pdfError && <p className="text-sm text-red-500">{pdfError}</p>}
                      <a
                        href={franchise.fddPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        Open PDF in new tab
                      </a>
                    </div>
                  </Card>
                }
                className="w-full"
              >
                <div className="relative">
                  <pdfComponents.Page
                    pageNumber={pageNumber}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    width={Math.min(window.innerWidth * 0.5, 750)}
                    className="shadow-lg"
                  />
                  {showCoverOverlay && pageNumber === 1 && (franchise.coverImageUrl || franchise.cover_image_url) && (
                    <FDDCoverOverlay
                      coverImageUrl={franchise.coverImageUrl || franchise.cover_image_url}
                      franchiseName={franchise.name}
                      onDismiss={() => setShowCoverOverlay(false)}
                      width={Math.min(window.innerWidth * 0.5, 750)}
                    />
                  )}
                </div>
              </pdfComponents.Document>
            ) : (
              <Card className="flex h-64 w-full items-center justify-center p-8">
                <div className="text-center space-y-4">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-muted-foreground">Loading PDF viewer...</p>
                </div>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  )

  const franchiseScoreTab = (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-900/30">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header with logo and Disclaimer link */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {franchise.logoUrl ? (
              <img
                src={franchise.logoUrl || "/placeholder.svg"}
                alt={`${franchise.name} logo`}
                className="h-16 w-14 object-contain rounded-lg border border-border/50 bg-white dark:bg-slate-900 p-2 shadow-sm"
              />
            ) : (
              <div className="h-16 w-14 rounded-lg border-2 border-dashed border-border/50 bg-muted/30 flex items-center justify-center">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{franchise.name}</h1>
              {franchise.industry && <p className="text-sm text-muted-foreground">{franchise.industry}</p>}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDisclaimerModal(true)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            <Info className="h-4 w-4 mr-1.5" />
            Disclaimer
          </Button>
        </div>

        {franchise.franchiseScore?.overall || franchise.franchise_score ? (
          <FranchiseScore
            fddYear={franchise.fdd_year || franchise.fddYear || 2025}
            score={
              // If franchiseScore is already a properly structured object, use it directly
              typeof franchise.franchiseScore === "object" && franchise.franchiseScore?.overall
                ? {
                    ...franchise.franchiseScore,
                    // Ensure breakdown is populated from franchise_score_breakdown if missing
                    breakdown: franchise.franchiseScore.breakdown || {
                      systemStability: {
                        metrics:
                          franchise.franchise_score_breakdown?.system_strength?.metrics ||
                          franchise.franchiseScoreBreakdown?.system_strength?.metrics ||
                          [],
                      },
                      supportQuality: {
                        metrics:
                          franchise.franchise_score_breakdown?.franchisee_support?.metrics ||
                          franchise.franchiseScoreBreakdown?.franchisee_support?.metrics ||
                          [],
                      },
                      growthTrajectory: {
                        metrics:
                          franchise.franchise_score_breakdown?.business_foundation?.metrics ||
                          franchise.franchiseScoreBreakdown?.business_foundation?.metrics ||
                          [],
                      },
                      financialDisclosure: {
                        metrics:
                          franchise.franchise_score_breakdown?.financial_transparency?.metrics ||
                          franchise.franchiseScoreBreakdown?.financial_transparency?.metrics ||
                          [],
                      },
                    },
                  }
                : // Otherwise construct from individual fields
                  {
                    overall: franchise.franchise_score || 0,
                    maxScore: 600,
                    systemStability: {
                      score:
                        franchise.franchise_score_breakdown?.system_strength?.total_score ||
                        franchise.franchiseScoreBreakdown?.system_strength?.total_score ||
                        0,
                      max: 150,
                    },
                    supportQuality: {
                      score:
                        franchise.franchise_score_breakdown?.franchisee_support?.total_score ||
                        franchise.franchiseScoreBreakdown?.franchisee_support?.total_score ||
                        0,
                      max: 150,
                    },
                    growthTrajectory: {
                      score:
                        franchise.franchise_score_breakdown?.business_foundation?.total_score ||
                        franchise.franchiseScoreBreakdown?.business_foundation?.total_score ||
                        0,
                      max: 150,
                    },
                    financialDisclosure: {
                      score:
                        franchise.franchise_score_breakdown?.financial_transparency?.total_score ||
                        franchise.franchiseScoreBreakdown?.financial_transparency?.total_score ||
                        0,
                      max: 150,
                    },
                    riskLevel: "LOW" as const,
                    industryPercentile: Math.round(((franchise.franchise_score || 0) / 600) * 100),
                    breakdown: {
                      systemStability: {
                        metrics:
                          franchise.franchise_score_breakdown?.system_strength?.metrics ||
                          franchise.franchiseScoreBreakdown?.system_strength?.metrics ||
                          [],
                      },
                      supportQuality: {
                        metrics:
                          franchise.franchise_score_breakdown?.franchisee_support?.metrics ||
                          franchise.franchiseScoreBreakdown?.franchisee_support?.metrics ||
                          [],
                      },
                      growthTrajectory: {
                        metrics:
                          franchise.franchise_score_breakdown?.business_foundation?.metrics ||
                          franchise.franchiseScoreBreakdown?.business_foundation?.metrics ||
                          [],
                      },
                      financialDisclosure: {
                        metrics:
                          franchise.franchise_score_breakdown?.financial_transparency?.metrics ||
                          franchise.franchiseScoreBreakdown?.financial_transparency?.metrics ||
                          [],
                      },
                    },
                  }
            }
          />
        ) : (
          <Card className="p-8 text-center border-slate-200 dark:border-slate-700">
            <p className="text-muted-foreground">FranchiseScore™ analysis not available for this franchise.</p>
          </Card>
        )}

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Initial Investment Card */}
          <Card
            className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setShowInvestmentModal(true)}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-lg p-2 bg-slate-100 dark:bg-slate-800">
                <DollarSign className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Initial Investment
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              ${((franchise.investmentMin || franchise.investment_min || 0) / 1000).toFixed(0)}K
            </p>
            <p className="text-sm text-muted-foreground">
              - ${((franchise.investmentMax || franchise.investment_max || 0) / 1000).toFixed(0)}K
            </p>
            {(franchise.franchiseFee || franchise.franchise_fee) && (
              <p className="text-xs text-muted-foreground mt-2">
                Franchise Fee: ${((franchise.franchiseFee || franchise.franchise_fee) / 1000).toFixed(0)}K
              </p>
            )}
          </Card>

          {/* Avg Revenue Card */}
          <Card
            className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setShowRevenueModal(true)}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-lg p-2 bg-slate-100 dark:bg-slate-800">
                <TrendingUp className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Avg. Revenue
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              ${((franchise.avgRevenue || franchise.avg_revenue || 0) / 1000).toFixed(0)}K
            </p>
            {(franchise.revenueData?.range || franchise.revenue_data?.range) && (
              <p className="text-sm text-muted-foreground">
                Range: {franchise.revenueData?.range || franchise.revenue_data?.range}
              </p>
            )}
          </Card>

          {/* Franchise Units Card */}
          <Card
            className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setShowLocationsModal(true)}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-lg p-2 bg-slate-100 dark:bg-slate-800">
                <Building2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Franchise Units
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {franchise.franchised_units || franchise.franchisedUnits || 0}
            </p>
            <p className="text-xs text-muted-foreground">Click to view locations</p>
          </Card>
        </div>

        {/* Item 19 Card */}
        <Card
          className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowItem19Modal(true)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-blue-100 dark:bg-blue-900/30">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Item 19: Financial Performance Representation
                </h3>
                <p className="text-sm text-muted-foreground">Review detailed earnings data and financial metrics</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Review Item 19
            </Button>
          </div>
        </Card>

        {/* Analysis Summary */}
        {(franchise.analytical_summary || franchise.analyticalSummary) && (
          <Card className="p-4 bg-slate-100/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-3">Analysis Summary</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {franchise.analytical_summary || franchise.analyticalSummary}
            </p>
          </Card>
        )}

        {/* Strengths */}
        {franchise.opportunities && franchise.opportunities.length > 0 && (
          <Card className="p-4 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xl">⭐</span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Strengths</h2>
            </div>
            <div className="space-y-3">
              {franchise.opportunities.map((opp: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {idx + 1}. {opp.title}
                    </span>
                    {opp.impact && (
                      <Badge className="bg-slate-700 dark:bg-slate-600 text-white text-xs px-2 py-0.5">
                        {opp.impact}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{opp.description}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Considerations */}
        {franchise.concerns && franchise.concerns.length > 0 && (
          <Card className="p-4 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xl">🔍</span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Considerations</h2>
            </div>
            <div className="space-y-3">
              {franchise.concerns.map((concern: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {idx + 1}. {concern.title}
                    </span>
                    {concern.impact && (
                      <Badge className="bg-slate-700 dark:bg-slate-600 text-white text-xs px-2 py-0.5">
                        {concern.impact}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{concern.description}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Legal Disclaimer */}
        <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="rounded-lg bg-amber-200 dark:bg-amber-900/50 p-2">
              <span className="text-lg">⚖️</span>
            </div>
            <span className="font-bold text-sm text-amber-900 dark:text-amber-100 uppercase tracking-wide">
              Legal Disclaimer
            </span>
          </div>
          <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed">
            <span className="font-bold">DISCLAIMER:</span> FRANCHISESCORE AND ITS RELATED ANALYSIS IS AN INDEPENDENT
            SERVICE OF PARALEX, INC. {franchise.name.toUpperCase()}, ITS AFFILIATES, DIRECTORS, MANAGERS, OFFICERS,
            EMPLOYEES AND AGENTS HAVE NOT VERIFIED THE ACCURACY OF THIS ANALYSIS AND CANNOT GUARANTEE ITS RESULTS AND
            THIS IS BEING PROVIDED AS A CONVENIENCE IN READING AND UNDERSTANDING OF THE APPLICABLE FRANCHISE DISCLOSURE
            DOCUMENT. FRANCHISESCORE AND ITS RELATED ANALYSIS AND SUMMARIES SHALL NOT BE REPLACE, MODIFY OR AMEND THE
            APPLICABLE FRANCHISE DISCLOSURE DOCUMENT IN ANY MANNER WHATSOEVER, AND THE FRANCHISE DISCLOSURE DOCUMENT AND
            ITS CONTENT SHALL BE THE SOLE SOURCE OF THE FRANCHISOR'S DISCLOSURE TO ITS PROSPECTIVE BUYERS. THIS SHALL
            NOT CONSTITUTE AN OFFER OF INVESTMENT, AND IS BEING PROVIDED FOR INFORMATION PURPOSES ONLY AND NOT IN ANY
            WAY AS FINANCIAL, INVESTMENT OR LEGAL ADVICE.
          </p>
        </Card>
      </div>
    </div>
  )

  const rightPanel = (
    <div className={`flex h-full flex-col ${isPdfVisible ? "" : ""}`}>
      <div className={`space-y-4 ${isPdfVisible ? "p-4 pr-6" : "py-6"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* PDF Toggle Slider */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsPdfVisible(!isPdfVisible)}
              className="h-9 w-9 rounded-full border-2 hover:bg-accent transition-all"
              title={isPdfVisible ? "Hide PDF Viewer" : "Show PDF Viewer"}
            >
              {isPdfVisible ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>

            {/* Franchise Logo */}
            <div className="flex items-center gap-3">
              {franchise.logoUrl ? (
                <img
                  src={franchise.logoUrl || "/placeholder.svg"}
                  alt={`${franchise.name} logo`}
                  className="h-14 w-auto max-w-[140px] object-contain rounded-lg border border-border/50 bg-white dark:bg-slate-900 p-2 shadow-sm"
                  onError={(e) => {
                    console.error("[v0] Logo failed to load:", franchise.logoUrl)
                    e.currentTarget.style.display = "none"
                  }}
                  onLoad={() => {
                    console.log("[v0] Logo loaded successfully:", franchise.logoUrl)
                  }}
                />
              ) : (
                <div className="h-14 w-14 rounded-lg border-2 border-dashed border-border/50 bg-muted/30 flex items-center justify-center">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold tracking-tight leading-tight">{franchise.name}</h1>
                {franchise.industry && <p className="text-sm text-muted-foreground mt-0.5">{franchise.industry}</p>}
              </div>
            </div>
          </div>
        </div>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold text-sm mb-3">FDD Navigation</h3>
          <div className="space-y-3">
            {/* Items Dropdown */}
            <div className="relative">
              <List className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <select
                value={selectedItem}
                onChange={(e) => handleItemSelect(e.target.value)}
                disabled={itemsLoading || fddItems.length === 0}
                className="w-full pl-8 pr-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
              >
                <option value="">
                  {itemsLoading
                    ? "Loading..."
                    : fddItems.length > 0
                      ? `Select Item (${fddItems.length})`
                      : "Items 1-23"}
                </option>
                {fddItems.map((item) => (
                  <option key={item.itemNumber} value={item.itemNumber.toString()}>
                    {item.label} {localEngagement.viewedItems?.includes(`item${item.itemNumber}`) ? "✓" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Exhibits Dropdown */}
            <div className="relative">
              <FileText className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <select
                value={selectedExhibit}
                onChange={(e) => handleExhibitSelect(e.target.value)}
                disabled={exhibitsLoading || fddExhibits.length === 0}
                className="w-full pl-8 pr-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
              >
                <option value="">
                  {exhibitsLoading
                    ? "Loading..."
                    : fddExhibits.length > 0
                      ? `Select Exhibit (${fddExhibits.length})`
                      : "Exhibits"}
                </option>
                {fddExhibits.map((exhibit, idx) => (
                  <option key={idx} value={exhibit.name}>
                    {exhibit.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Quick Navigation */}
        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold text-sm mb-3">Quick Navigation</h3>
          <div className="flex flex-wrap gap-2">
            {fddQuickLinks.map((link, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => {
                  setPageNumber(link.pageNumber)
                  setIsPdfVisible(true)
                }}
                className="text-xs"
              >
                {link.name}
              </Button>
            ))}
          </div>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setIsEngagementExpanded(!isEngagementExpanded)}
            className="w-full flex items-center justify-between"
          >
            <h3 className="font-semibold text-sm">Engagement Progress</h3>
            {isEngagementExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {isEngagementExpanded && (
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Time spent:</span>
                </div>
                <span className="font-semibold">{formatTime(localEngagement.timeSpent)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span>Questions:</span>
                </div>
                <span className="font-semibold">{localEngagement.questionsAsked.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-muted-foreground" />
                  <span>Item 19:</span>
                </div>
                <span className="font-semibold">{hasReviewedItem19 ? "✓" : "✗"}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4 text-muted-foreground" />
                  <span>Items viewed:</span>
                </div>
                <span className="font-semibold">{viewedItemsCount}/23</span>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* My Notes - takes remaining space */}
      {onAddNote && onUpdateNote && onDeleteNote && (
        <div
          className={`min-h-[450px] max-h-[600px] overflow-hidden ${isPdfVisible ? "px-4 pb-4" : "mx-auto w-full max-w-5xl px-4 pb-4"}`}
        >
          <Card className="h-full flex flex-col p-4 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">My Notes</h3>
                <span className="text-xs text-muted-foreground">{propNotes.length}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log("[v0] Add Note button clicked")
                  console.log("[v0] onAddNote function exists:", !!onAddNote)
                  console.log("[v0] Current pageNumber:", pageNumber)
                  if (onAddNote) {
                    onAddNote({ content: "", pageNumber })
                  } else {
                    console.error("[v0] onAddNote is undefined!")
                  }
                }}
                className="text-xs h-7"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Note
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {propNotes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <StickyNote className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No notes yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Add notes to track your thoughts and questions</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {propNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30"
                    >
                      {editingNoteId === note.id ? (
                        // Editing mode
                        <div className="space-y-2">
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            rows={3}
                            autoFocus
                            placeholder="Enter your note..."
                          />
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                setEditingNoteId(null)
                                setEditingContent("")
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                if (editingContent.trim()) {
                                  onUpdateNote(note.id, note.title || "", editingContent.trim())
                                }
                                setEditingNoteId(null)
                                setEditingContent("")
                              }}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Display mode
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <p 
                              className="text-sm flex-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded p-1 -m-1 transition-colors"
                              onClick={() => {
                                setEditingNoteId(note.id)
                                setEditingContent(note.content)
                              }}
                              title="Click to edit"
                            >
                              {note.content || <span className="text-muted-foreground italic">Click to add content...</span>}
                            </p>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-muted-foreground hover:text-foreground" 
                                onClick={() => {
                                  setEditingNoteId(note.id)
                                  setEditingContent(note.content)
                                }}
                                title="Edit note"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-muted-foreground hover:text-destructive" 
                                onClick={() => onDeleteNote(note.id)}
                                title="Delete note"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          {note.pageNumber && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Page {note.pageNumber}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )

  const fddId = Array.isArray(franchise?.fdds) ? franchise.fdds[0]?.id : franchise?.fdds?.id

  const markItem19Viewed = () => {
    setLocalEngagement((prev) => {
      const updated = {
        ...prev,
        sectionsViewed: [...new Set([...prev.sectionsViewed, "Item 19"])],
        lastActivity: new Date().toISOString(),
        milestones: {
          ...prev.milestones,
          viewedItem19: true,
        },
      }
      saveEngagementToDatabase(updated)
      return updated
    })
  }

  const handleTabClick = (tab: "document" | "franchisescore") => {
    if (tab === "franchisescore") {
      // Franchisors can access FranchiseScore directly without consent
      if (mode === "hub-franchisor") {
        setActiveTab(tab)
        return
      }
      if (franchiseScoreConsent === null) {
        // Still loading consent status
        return
      }
      if (!franchiseScoreConsent) {
        setShowConsentModal(true)
        return
      }
    }
    setActiveTab(tab)
  }

  const handleConsentComplete = () => {
    setFranchiseScoreConsent(true)
    setShowConsentModal(false)
    setActiveTab("franchisescore")
  }

  return (
    <div className="flex flex-col h-full relative bg-background">
      {/* Tab Navigation */}
      <div className="border-b bg-white dark:bg-slate-900 px-6">
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleTabClick("document")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "document"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            FDD Document
          </button>
          <button
            onClick={() => handleTabClick("franchisescore")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "franchisescore"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            FranchiseScore™
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "document" ? (
          // Document tab - show PDF viewer with analysis sidebar
          isPdfVisible ? (
            <ResizableDivider leftPanel={leftPanel} rightPanel={rightPanel} defaultLeftWidth={55} />
          ) : (
            <div className="h-full overflow-y-auto">{rightPanel}</div>
          )
        ) : (
          // FranchiseScore tab - show full score analysis
          franchiseScoreTab
        )}
      </div>

      <FranchiseScoreConsentModal
        open={showConsentModal}
        onAccept={handleConsentComplete}
        onDecline={() => setShowConsentModal(false)}
        fddId={franchise?.slug || ""}
        franchiseName={franchise?.name}
      />

      <FranchiseScoreDisclaimerModal
        open={showDisclaimerModal}
        onClose={() => setShowDisclaimerModal(false)}
        franchiseName={franchise?.name}
      />

      {showConnectButtons && showConnectModal && franchise && (
        <ConnectFranchisorModal
          franchise={franchise}
          engagement={localEngagement}
          onClose={() => setShowConnectModal(false)}
        />
      )}

      {showConnectButtons && showLenderModal && franchise && (
        <ConnectLenderModal
          franchiseId={franchise.id}
          franchiseName={franchise.name}
          preApproval={preApproval}
          onClose={() => setShowLenderModal(false)}
        />
      )}

      {showItem19Modal && franchise && <Item19Modal franchise={franchise} onClose={() => setShowItem19Modal(false)} />}

      {showLocationsModal && franchise && (
        <LocationsModal franchise={franchise} onClose={() => setShowLocationsModal(false)} />
      )}

      {showInvestmentModal && franchise && (
        <InvestmentModal franchise={franchise} onClose={() => setShowInvestmentModal(false)} />
      )}

      {showRevenueModal && franchise && (
        <RevenueModal franchise={franchise} onClose={() => setShowRevenueModal(false)} />
      )}

      <FDDAIChat
        franchise={franchise}
        fddId={fddId}
        onQuestionAsked={handleQuestionAsked}
        questionsAsked={localEngagement.questionsAsked}
        onNavigateToPage={(page) => {
          console.log("[v0] AI Chat: Navigate to page:", page)
          setPageNumber(page)
          setIsPdfVisible(true)
          setActiveTab("document") // Switch to document tab when navigating
        }}
      />
    </div>
  )
}

const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case "Established":
      return "bg-blue-100 text-blue-700 hover:bg-blue-100"
    case "Trending":
      return "bg-purple-100 text-purple-700 hover:bg-purple-100"
    case "New":
      return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
    default:
      return ""
  }
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}
