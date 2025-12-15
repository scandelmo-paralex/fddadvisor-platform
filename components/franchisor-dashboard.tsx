"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import {
  MapPin,
  Mail,
  BarChart3,
  TrendingUp,
  Eye,
  FileText,
  Users,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  LayoutGrid,
  TableIcon,
  UserPlus,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Download,
  Clock,
  FileSignature,
  Loader2,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { leads as initialLeads, stats } from "@/lib/data"
import { PipelineView } from "@/components/pipeline-view"
import { ReceiptViewerModal } from "@/components/receipt-viewer-modal"
import type { Lead } from "@/lib/data"
import { SharedAccessManager } from "@/components/shared-access-manager" // DEPRECATED - moved to Company Settings
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" // Import Select components
import { Textarea } from "@/components/ui/textarea" // Import Textarea
import { Input } from "@/components/ui/input" // Added Input component
import { FDDItemMappingEditor } from "@/components/fdd-item-mapping-editor"

interface FranchisorDashboardProps {
  onOpenModal: (type: string, leadId?: string) => void
  onNavigateToProfile: () => void // Added navigation to profile
}

export function FranchisorDashboard({ onOpenModal, onNavigateToProfile }: FranchisorDashboardProps) {
  console.log("[v0] FranchisorDashboard: Component rendering")
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [includeFDD, setIncludeFDD] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [view, setView] = useState<"table" | "pipeline">("table")
  const [leads, setLeads] = useState(initialLeads)
  const [showAddLeadModal, setShowAddLeadModal] = useState(false)
  const [newLead, setNewLead] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    brand: "",
    franchiseId: "",
    source: "Website" as Lead["source"],
    timeline: "3-6 months",
    notes: "",
    location: "", // Added location
  })
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedReceiptLead, setSelectedReceiptLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(false) // Added loading state
  const [error, setError] = useState("") // Added error state
  const [showItemMappingModal, setShowItemMappingModal] = useState(false)

  const [franchises, setFranchises] = useState<Array<{ id: string; name: string }>>([])

  // Track if current user is a team member (recruiter can't access profile)
  const [userRole, setUserRole] = useState<"owner" | "admin" | "recruiter" | null>(null)

  // Fetch current user's role
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Check if franchisor owner
        const { data: franchisorProfile } = await supabase
          .from("franchisor_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single()

        if (franchisorProfile) {
          setUserRole("owner")
          return
        }

        // Check if team member
        const { data: teamMember } = await supabase
          .from("franchisor_team_members")
          .select("role")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .single()

        if (teamMember) {
          setUserRole(teamMember.role as "admin" | "recruiter")
        }
      } catch (error) {
        console.error("[FranchisorDashboard] Error fetching user role:", error)
      }
    }

    fetchUserRole()
  }, [])

  // For error toasts
  const [showErrorToast, setShowErrorToast] = useState(false)
  const setErrorMessage = (message: string) => {
    setError(message)
    setShowErrorToast(true)
  }

  useEffect(() => {
    console.log("[v0] FranchisorDashboard: useEffect triggered for leads fetch")
    const fetchLeads = async () => {
      try {
        console.log("[v0] FranchisorDashboard: Fetching leads from /api/hub/leads...")
        const response = await fetch("/api/hub/leads")

        if (!response.ok) {
          console.error("[v0] FranchisorDashboard: Failed to fetch leads:", response.status, response.statusText)
          const errorText = await response.text()
          console.error("[v0] FranchisorDashboard: Error response:", errorText)
          // Still set mock leads so the dashboard shows something
          setLeads(initialLeads)
          return
        }

        const realLeads = await response.json()
        console.log("[v0] FranchisorDashboard: Received leads from API:", realLeads.length)
        console.log("[v0] FranchisorDashboard: First lead:", realLeads[0])

        // Use only real leads from API (no mock data for production)
        setLeads(realLeads)
      } catch (error) {
        console.error("[v0] FranchisorDashboard: Error fetching leads:", error)
        // Still set mock leads so the dashboard shows something
        setLeads(initialLeads)
      }
    }

    fetchLeads()
  }, [])

  useEffect(() => {
    const fetchFranchises = async () => {
      try {
        console.log("[v0] FranchisorDashboard: Fetching franchises...")
        const response = await fetch("/api/franchises")
        if (!response.ok) {
          throw new Error("Failed to fetch franchises")
        }
        const data = await response.json()
        console.log("[v0] FranchisorDashboard: Received franchises:", data.length)
        setFranchises(data)
      } catch (error) {
        console.error("[v0] FranchisorDashboard: Error fetching franchises:", error)
      }
    }

    fetchFranchises()
  }, [])

  useEffect(() => {
    if (showAddLeadModal && !newLead.notes) {
      const firstName = newLead.firstName || "[First Name]"
      const defaultMessage = `Hi ${firstName}, great chatting with you. As mentioned, please find your invite to our FDD for your review and information. As you will see, you will be able to download it as well review along side our FranchiseScore, an independent rating and reporting service we are using to make your review more convenient and to get your questions answers more immediately while giving us an opportunity to support you better in answering your questions and understanding your concerns.`

      setNewLead((prev) => ({ ...prev, notes: defaultMessage }))
    }
  }, [showAddLeadModal, newLead.firstName])

  useEffect(() => {
    if (showAddLeadModal && newLead.notes && newLead.firstName) {
      const firstName = newLead.firstName
      if (newLead.notes.includes("Hi ") && newLead.notes.includes("great chatting with you")) {
        const updatedMessage = newLead.notes.replace(/Hi [^,]+,/, `Hi ${firstName},`)
        if (updatedMessage !== newLead.notes) {
          setNewLead((prev) => ({ ...prev, notes: updatedMessage }))
        }
      }
    }
  }, [newLead.firstName, showAddLeadModal])

  // const [showFDDUploadModal, setShowFDDUploadModal] = useState(false)
  // const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  // const [uploadedPageMapping, setUploadedPageMapping] = useState<{ [key: string]: number[] } | undefined>()
  // const [showUrlsModal, setShowUrlsModal] = useState(false)

  const metrics = [
    {
      label: "FDD Views",
      value: stats.fddViews,
      key: "views",
      icon: Eye,
      trend: "+12%",
      trendUp: true,
    },
    {
      label: "Item 19 Views",
      value: stats.item19Views,
      key: "item19",
      icon: FileText,
      trend: "+8%",
      trendUp: true,
    },
    {
      label: "Qualified Leads",
      value: stats.qualifiedLeads,
      key: "qualified",
      icon: Users,
      trend: "+15%",
      trendUp: true,
    },
    {
      label: "High Intent",
      value: stats.highIntent,
      key: "high-intent",
      icon: Zap,
      trend: "+23%",
      trendUp: true,
    },
    {
      label: "New Leads (7d)",
      value: stats.newLeads,
      key: "new",
      icon: TrendingUp,
      trend: "+5",
      trendUp: true,
    },
  ]

  const [sourceFilter, setSourceFilter] = useState<Lead["source"] | "All">("All")
  const [verificationFilter, setVerificationFilter] = useState<"All" | "verified" | "unverified">("All")
  const [qualityFilter, setQualityFilter] = useState<"All" | "high" | "medium" | "low">("All")

  const filteredLeads = leads.filter((lead) => {
    // Apply metric filter
    if (activeFilter) {
      if (activeFilter === "high-intent" && lead.intent !== "High") return false
      if (activeFilter === "new" && !lead.isNew) return false
    }

    // Apply source filter
    if (sourceFilter !== "All" && lead.source !== sourceFilter) return false

    if (verificationFilter !== "All" && lead.verificationStatus !== verificationFilter) return false

    if (qualityFilter !== "All") {
      if (qualityFilter === "high" && lead.qualityScore < 80) return false
      if (qualityFilter === "medium" && (lead.qualityScore < 60 || lead.qualityScore >= 80)) return false
      if (qualityFilter === "low" && lead.qualityScore >= 60) return false
    }

    return true
  })

  console.log("[v0] Total leads in state:", leads.length)
  console.log("[v0] Filtered leads:", filteredLeads.length)
  console.log(
    "[v0] Lead names in filteredLeads:",
    filteredLeads.map((l) => l.name),
  )
  // </CHANGE>

  const exportToCSV = () => {
    const baseUrl = window.location.origin

    // CSV headers
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Brand",
      "City",
      "State",
      "Timeline",
      "Source",
      "Verification Status",
      "Quality Score",
      "Intent",
      "FDD Sent Date",
      "DisclosureExpires",
      "Stage",
      "Days in Stage",
      "Intelligence Report Link",
      "Notes",
    ]

    // Convert filtered leads to CSV rows
    const rows = filteredLeads.map((lead) => [
      lead.name,
      lead.email,
      lead.phone || "",
      lead.brand || "",
      lead.city,
      lead.state,
      lead.timeline,
      lead.source || "FDDAdvisor",
      lead.verificationStatus === "verified" ? "Verified" : "Unverified",
      lead.qualityScore.toString(),
      lead.intent,
      lead.fddSendDate || "",
      lead.disclosureExpiresDate || "",
      lead.stage,
      lead.daysInStage.toString(),
      `${baseUrl}/intelligence/${lead.id}`,
      lead.notes || "",
    ])

    // Combine headers and rows
    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", `fddadvisor-leads-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Show success message
    setSuccessMessage(`Exported ${filteredLeads.length} leads to CSV`)
    setShowSuccessToast(true)
    setTimeout(() => setShowSuccessToast(false), 3000)

    console.log("[v0] Exported", filteredLeads.length, "leads to CSV")
  }

  const isDisclosureExpired = (expiresDate?: string) => {
    if (!expiresDate) return false
    const expires = new Date(expiresDate)
    const today = new Date()
    return today > expires
  }

  const hasSignedItem23 = (lead: Lead) => {
    // Check if Item 23 receipt has been signed
    return lead.item23SignedAt != null  // Using != to check for both null and undefined
  }

  const handleSendFDD = (lead: Lead) => {
    setSelectedLead(lead)
    setIncludeFDD(!lead.fddSendDate) // Auto-check FDD if not sent yet
    setShowEmailModal(true)
  }

  const sendEmail = () => {
    if (!selectedLead) return

    const subject = includeFDD ? "Your Franchise Disclosure Document" : `Following up on your franchise inquiry`
    const body = includeFDD
      ? `Hi ${selectedLead.name.split(" ")[0]},\n\nAttached is the Franchise Disclosure Document (FDD) for your review.\n\nPlease note: Per FTC regulations, you must wait 14 days after receiving this FDD before signing any franchise agreement.\n\nBest regards,\nYour Franchise Team`
      : `Hi ${selectedLead.name.split(" ")[0]},\n\nI wanted to follow up on your interest in our franchise opportunity.\n\nBest regards,\nYour Franchise Team`

    console.log("[v0] FDD sent to:", selectedLead.name, "on", new Date().toLocaleDateString())

    setSuccessMessage(
      includeFDD
        ? `FDD sent to ${selectedLead.name}. 14-day disclosure period started.`
        : `Email sent to ${selectedLead.name}`,
    )
    setShowSuccessToast(true)
    setShowEmailModal(false)

    setTimeout(() => setShowSuccessToast(false), 3000)
  }

  const handleStageChange = (leadId: string, newStage: Lead["stage"]) => {
    setLeads((prevLeads) =>
      prevLeads.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              stage: newStage,
              daysInStage: 0, // Reset days in stage when moved
            }
          : lead,
      ),
    )
    setSuccessMessage(`Lead moved to ${newStage} stage`)
    setShowSuccessToast(true)
    setTimeout(() => setShowSuccessToast(false), 2000)
  }

  const handleAddLead = async () => {
    try {
      setLoading(true)

      if (!newLead.franchiseId) {
        throw new Error("Please select a franchise")
      }

      console.log("[v0] Sending invitation with data:", {
        franchise_id: newLead.franchiseId,
        lead_email: newLead.email,
        firstName: newLead.firstName,
        lastName: newLead.lastName,
      })

      // Call invitation API
      const response = await fetch("/api/hub/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          franchise_id: newLead.franchiseId,
          lead_email: newLead.email,
          firstName: newLead.firstName,
          lastName: newLead.lastName,
          lead_phone: newLead.phone,
          invitation_message: newLead.notes,
          source: newLead.source,
          city: newLead.city,
          state: newLead.state,
          timeline: newLead.timeline,
          target_location: newLead.location, // Optional territory/area for store
        }),
      })

      const responseText = await response.text()

      if (!response.ok) {
        let errorMessage = "Failed to send invitation"
        try {
          const error = JSON.parse(responseText)
          errorMessage = error.error || errorMessage
        } catch (e) {
          // Response is not JSON, use text directly
          console.error("[v0] Non-JSON error response:", responseText)
          errorMessage = responseText || errorMessage
        }
        throw new Error(errorMessage)
      }

      // Parse success response
      let invitation, invitation_link
      try {
        const data = JSON.parse(responseText)
        invitation = data.invitation
        invitation_link = data.invitation_link
      } catch (e) {
        console.error("[v0] Failed to parse success response:", e)
        throw new Error("Invalid response from server")
      }

      console.log("[v0] Invitation created:", invitation.id)
      console.log("[v0] Invitation link:", invitation_link)

      // Add lead to local state for immediate UI update
      const fullName = `${newLead.firstName} ${newLead.lastName}`.trim()
      const lead: Lead = {
        id: invitation.id,
        name: fullName,
        email: newLead.email,
        phone: newLead.phone,
        brand: newLead.brand || undefined,
        location: `${newLead.city}, ${newLead.state}`,
        city: newLead.city,
        state: newLead.state,
        timeline: newLead.timeline,
        intent: "Medium",
        isNew: true,
        qualityScore: 0,
        stage: "inquiry",
        daysInStage: 0,
        source: newLead.source,
        invitationStatus: "Sent",
        invitationSentDate: new Date().toLocaleDateString(),
        verificationStatus: "unverified",
        notes: newLead.notes,
        demographics: {
          age: "Unknown",
          experience: "Unknown",
          capital: "Unknown",
          location: `${newLead.city}, ${newLead.state}`,
        },
        engagement: [
          {
            date: "Just now",
            action: "Invitation sent to view FDD",
          },
        ],
      }

      setLeads([lead, ...leads])
      setSuccessMessage(
        `Invitation sent to ${fullName}. They will receive an email to create an account and view the FDD.`,
      )
      setShowSuccessToast(true)
      setShowAddLeadModal(false)

      setNewLead({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        city: "",
        state: "",
        brand: "",
        franchiseId: "",
        source: "Website",
        timeline: "3-6 months",
        notes: "",
        location: "", // Reset location
      })

      setTimeout(() => setShowSuccessToast(false), 5000)
    } catch (error) {
      console.error("[v0] Invitation error:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to send invitation")
      setShowErrorToast(true)
      setTimeout(() => setShowErrorToast(false), 5000)
    } finally {
      setLoading(false)
    }
  }

  const isPlatformLead = (source?: Lead["source"]) => {
    return source === "FDDAdvisor" || source === "Internal"
  }

  const handleViewReceipt = (lead: Lead) => {
    setSelectedReceiptLead(lead)
    setShowReceiptModal(true)
  }

  // Removed handleFDDUploadComplete function
  // const handleFDDUploadComplete = (urls: string[], pageMapping?: { [key: string]: number[] }) => {
  //   console.log("[v0] FDD pages uploaded successfully:", urls.length, "pages")
  //   console.log("[v0] Page mapping:", pageMapping)
  //   setUploadedUrls(urls)
  //   setUploadedPageMapping(pageMapping)
  //   setShowUrlsModal(true)
  // }

  // Removed copyUrlsToClipboard function
  // const copyUrlsToClipboard = () => {
  //   const urlsText = `fddPageUrls: [\n  ${uploadedUrls.map((url) => `"${url}"`).join(",\n  ")}\n]`
  //   navigator.clipboard.writeText(urlsText)
  //   setSuccessMessage("URLs copied to clipboard!")
  //   setShowSuccessToast(true)
  //   setTimeout(() => setShowSuccessToast(false), 2000)
  // }

  return (
    <div className="space-y-8 pb-12 max-w-[1600px] mx-auto">
      {" "}
      {/* Added max-width for large screens */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          {" "}
          {/* Adjusted spacing */}
          <h2 className="text-lg font-semibold text-blue-600">Wellbiz Brands</h2>{" "}
          {/* Added subtle blue accent to company name */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Lead Dashboard</h1>{" "}
            {/* Increased font size */}
            <p className="text-sm text-muted-foreground mt-1">Track and manage your franchise leads</p>
          </div>
        </div>
        <div className="flex gap-3">
          {" "}
          {/* Increased gap */}
          <Button
            variant="default"
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            onClick={() => {
              // Future: Navigate to reports/analytics page
              console.log("[v0] Reports button clicked - feature coming soon")
            }}
          >
            <BarChart3 className="h-4 w-4" />
            Reports
          </Button>
          <div className="flex gap-1 mr-2 bg-muted/50 p-1 rounded-lg border border-border/50">
            {" "}
            {/* Improved toggle style */}
            <Button
              variant={view === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("table")}
              className={`gap-2 h-8 transition-all ${view === "table" ? "bg-background shadow-sm text-primary" : "hover:bg-background/50"}`} // Added text-primary for active state
            >
              <TableIcon className="h-4 w-4" />
              Table
            </Button>
            <Button
              variant={view === "pipeline" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("pipeline")}
              className={`gap-2 h-8 transition-all ${view === "pipeline" ? "bg-background shadow-sm text-primary" : "hover:bg-background/50"}`} // Added text-primary for active state
            >
              <LayoutGrid className="h-4 w-4" />
              Pipeline
            </Button>
          </div>
          <Button
            onClick={() => setShowAddLeadModal(true)}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm" // Switched to bg-primary
          >
            <UserPlus className="h-4 w-4" />
            Add Lead
          </Button>
          {/* Only show Profile button for owners and admins */}
          {(userRole === "owner" || userRole === "admin") && (
            <Button
              onClick={onNavigateToProfile}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            >
              {" "}
              {/* Switched to bg-primary */}
              <ArrowRight className="h-4 w-4" />
              Profile
            </Button>
          )}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {" "}
        {/* Improved grid responsiveness */}
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card
              key={metric.key}
              className={`p-5 border transition-all duration-200 hover:shadow-md cursor-pointer ${
                activeFilter === metric.key
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`} // Added subtle background colors to metric cards
              onClick={() => setActiveFilter(activeFilter === metric.key ? null : metric.key)}
            >
              <div className="flex items-start justify-between">
                {" "}
                {/* Removed margin-bottom */}
                <div className="space-y-1">
                  {" "}
                  {/* Adjusted spacing */}
                  <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>{" "}
                  {/* Improved typography */}
                  <div className="flex items-baseline gap-2">
                    {" "}
                    {/* Added gap */}
                    <p className="text-2xl font-bold text-foreground">{metric.value}</p>{" "}
                    {/* Changed font size, removed tracking-tight */}
                    <span className={`text-xs font-medium ${metric.trendUp ? "text-green-600" : "text-red-600"}`}>
                      {metric.trend}
                    </span>
                  </div>
                </div>
                <div className={`p-2 rounded-lg ${activeFilter === metric.key ? "bg-blue-100" : "bg-gray-100"}`}>
                  <Icon className={`h-5 w-5 ${activeFilter === metric.key ? "text-blue-600" : "text-gray-600"}`} />{" "}
                  {/* Dynamic icon colors */}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
      {view === "pipeline" ? (
        <PipelineView leads={filteredLeads} onOpenModal={onOpenModal} onStageChange={handleStageChange} />
      ) : (
        <div className="space-y-6">
          {" "}
          {/* Increased spacing */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {" "}
            {/* Responsive layout */}
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              {activeFilter || sourceFilter !== "All" || verificationFilter !== "All" || qualityFilter !== "All"
                ? "Filtered Leads"
                : "All Leads"}
              <Badge variant="secondary" className="ml-2 bg-muted text-muted-foreground">
                {filteredLeads.length}
              </Badge>{" "}
              {/* Added count badge */}
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              {" "}
              {/* Improved wrapping */}
              <Button
                onClick={exportToCSV}
                variant="outline"
                size="sm"
                className="h-9 bg-background border-border/60 hover:bg-muted/50" // Refined button style
                disabled={filteredLeads.length === 0}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-border/50">
                {" "}
                {/* Grouped filters visually */}
                <div className="px-2 text-muted-foreground">
                  <Filter className="h-4 w-4" />
                </div>
                <div className="h-4 w-px bg-border/50 mx-1" /> {/* Added separator */}
                <select
                  className="h-8 px-2 text-sm bg-transparent border-none focus:ring-0 text-foreground font-medium cursor-pointer hover:text-cta transition-colors" // Styled select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value as Lead["source"] | "All")}
                >
                  <option value="All">Source: All</option>
                  <option value="FDDAdvisor">FDDAdvisor</option>
                  <option value="Internal">Internal</option>
                  <option value="Website">Website</option>
                  <option value="Broker">Broker</option>
                  <option value="Referral">Referral</option>
                  <option value="Trade Show">Trade Show</option>
                  <option value="Direct Inquiry">Direct Inquiry</option>
                  <option value="Other">Other</option>
                </select>
                {/* HIDDEN FOR DEMO - Status filter
                <div className="h-4 w-px bg-border/50 mx-1" />
                <select
                  className="h-8 px-2 text-sm bg-transparent border-none focus:ring-0 text-foreground font-medium cursor-pointer hover:text-cta transition-colors"
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value as "All" | "verified" | "unverified")}
                >
                  <option value="All">Status: All</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
                */}
                <div className="h-4 w-px bg-border/50 mx-1" />
                <select
                  className="h-8 px-2 text-sm bg-transparent border-none focus:ring-0 text-foreground font-medium cursor-pointer hover:text-cta transition-colors"
                  value={qualityFilter}
                  onChange={(e) => setQualityFilter(e.target.value as "All" | "high" | "medium" | "low")}
                >
                  <option value="All">Quality: All</option>
                  <option value="high">High (80+)</option>
                  <option value="medium">Medium (60-79)</option>
                  <option value="low">Low (&lt;60)</option>
                </select>
              </div>
              {(activeFilter || sourceFilter !== "All" || verificationFilter !== "All" || qualityFilter !== "All") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActiveFilter(null)
                    setSourceFilter("All")
                    setVerificationFilter("All")
                    setQualityFilter("All")
                  }}
                  className="text-muted-foreground hover:text-foreground h-9 px-2"
                >
                  <X className="h-4 w-4 mr-1" /> {/* Changed icon */}
                  Clear
                </Button>
              )}
            </div>
          </div>
          <Card className="border border-border/60 shadow-sm overflow-hidden rounded-xl">
            {" "}
            {/* Enhanced card styling */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border/60 bg-muted/40">
                  {" "}
                  {/* Subtle header background */}
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[200px]">
                      {" "}
                      {/* Increased padding */}
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[140px]">
                      Brand
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[120px]">
                      Source
                    </th>
                    {/* HIDDEN FOR DEMO - Verification column
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[120px]">
                      Verification
                    </th>
                    */}
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[140px]">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[120px]">
                      Timeline
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[140px]">
                      FDD Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[100px]">
                      Intent
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[130px] sticky right-0 bg-muted/40 border-l border-border/60">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {" "}
                  {/* Added dividers */}
                  {filteredLeads.map((lead) => {
                    const getBrandColor = (brand: string) => {
                      const brandLower = brand?.toLowerCase() || ""
                      if (brandLower.includes("drybar")) return "text-amber-600 dark:text-amber-500"
                      if (brandLower.includes("radiant")) return "text-purple-600 dark:text-purple-500"
                      if (brandLower.includes("elements")) return "text-emerald-600 dark:text-emerald-500"
                      if (brandLower.includes("amazing lash")) return "text-pink-600 dark:text-pink-500"
                      if (brandLower.includes("fitness together")) return "text-blue-600 dark:text-blue-500"
                      return "text-foreground/80"
                    }

                    return (
                      <tr key={lead.id} className="group transition-colors hover:bg-muted/30">
                        {" "}
                        {/* Smoother hover effect */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-foreground">{lead.name}</span>
                              {lead.isNew && (
                                <span className="flex h-2 w-2 rounded-full bg-cta ring-2 ring-background" /> // Minimal new indicator
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">{lead.email}</span> {/* Added email */}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-semibold ${getBrandColor(lead.brand)}`}>
                            {lead.brand || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant="secondary"
                            className={`text-xs px-2 py-0.5 font-medium border ${
                              isPlatformLead(lead.source)
                                ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                                : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700"
                            }`} // Refined badge colors
                          >
                            {lead.source || "FDDAdvisor"}
                          </Badge>
                        </td>
                        {/* HIDDEN FOR DEMO - Verification cell
                        <td className="px-6 py-4">
                          {lead.verificationStatus === "verified" ? (
                            <div className="flex items-center gap-1.5 text-emerald-600">
                              <ShieldCheck className="h-4 w-4" />
                              <span className="text-xs font-medium">Verified</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-muted-foreground/60">
                              <ShieldAlert className="h-4 w-4" />
                              <span className="text-xs">Unverified</span>
                            </div>
                          )}
                        </td>
                        */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0 opacity-70" />
                            <span className="truncate">
                              {lead.city && lead.state ? `${lead.city}, ${lead.state}` : "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-foreground/80">{lead.timeline.replace(" months", " mo")}</span>
                        </td>
                        <td className="px-6 py-4">
                          {lead.fddSendDate ? (
                            <div className="flex flex-col gap-1">
                              {hasSignedItem23(lead) ? (
                                <Badge
                                  className="w-fit bg-emerald-500/15 text-emerald-700 border-emerald-200 hover:bg-emerald-500/25 px-2 py-0.5 gap-1 cursor-pointer transition-colors"
                                  onClick={() => handleViewReceipt(lead)}
                                >
                                  <FileSignature className="h-3 w-3" />
                                  Signed
                                </Badge>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="w-fit gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-600 border-amber-500/20"
                                >
                                  <Clock className="h-3 w-3" />
                                  Sent
                                </Badge>
                              )}
                              <span className="text-[10px] text-muted-foreground">
                                {lead.item23SignedAt
                                  ? new Date(lead.item23SignedAt).toLocaleDateString()
                                  : lead.fddSendDate}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/50 italic">Not sent</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant="secondary"
                            className={`text-xs px-2.5 py-0.5 font-medium border ${
                              lead.email === "spcandelmo@gmail.com" || lead.intent === "High"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : lead.intent === "Medium"
                                  ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                  : "bg-gray-500/10 text-gray-600 border-gray-500/20"
                            }`}
                          >
                            {lead.email === "spcandelmo@gmail.com" ? "High" : lead.intent}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 sticky right-0 bg-background group-hover:bg-muted/30 border-l border-border/40 transition-colors">
                          <div className="flex gap-1.5 justify-end">
                            <Button
                              size="sm"
                              variant={lead.fddSendDate ? "outline" : "default"}
                              className={
                                lead.fddSendDate
                                  ? "h-8 w-8 p-0"
                                  : "gap-1.5 bg-cta hover:bg-cta/90 text-cta-foreground h-8 px-3 text-xs shadow-sm"
                              }
                              onClick={() => handleSendFDD(lead)}
                            >
                              {lead.fddSendDate ? (
                                <Mail className="h-4 w-4" />
                              ) : (
                                <>
                                  <FileCheck className="h-3.5 w-3.5" />
                                  Send FDD
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                onOpenModal("lead-intelligence", lead.id)
                              }}
                              className="h-8 w-8 p-0 border border-border/50 hover:bg-background hover:border-border"
                            >
                              <BarChart3 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
      {showEmailModal && selectedLead && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {selectedLead.fddSendDate ? "Contact Lead" : "Send FDD Disclosure"}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setShowEmailModal(false)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">To:</label>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedLead.name}</span>
                  <span className="text-muted-foreground">({selectedLead.email})</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Subject:</label>
                <input
                  type="text"
                  className="w-full p-3 bg-muted/50 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-cta"
                  value={includeFDD ? "Your Franchise Disclosure Document" : "Following up on your franchise inquiry"}
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message:</label>
                <textarea
                  className="w-full p-3 bg-muted/50 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-cta min-h-[200px]"
                  value={
                    includeFDD
                      ? `Hi ${selectedLead.name.split(" ")[0]},\n\nAttached is the Franchise Disclosure Document (FDD) for your review.\n\nPlease note: Per FTC regulations, you must wait 14 days after receiving this FDD before any franchise agreement can be signed. The disclosure expiration date will be tracked automatically.\n\nBest regards,\nYour Franchise Team`
                      : `Hi ${selectedLead.name.split(" ")[0]},\n\nI wanted to follow up on your interest in our franchise opportunity.\n\nBest regards,\nYour Franchise Team`
                  }
                  readOnly
                />
              </div>

              {!selectedLead.fddSendDate && (
                <div className="flex items-center gap-2 p-4 bg-cta/10 border border-cta/20 rounded-lg">
                  <input
                    type="checkbox"
                    id="include-fdd"
                    checked={includeFDD}
                    onChange={(e) => setIncludeFDD(e.target.checked)}
                    className="h-4 w-4 rounded border-cta text-cta focus:ring-cta"
                  />
                  <label htmlFor="include-fdd" className="text-sm font-medium cursor-pointer">
                    Include FDD Disclosure (starts 14-day waiting period)
                  </label>
                </div>
              )}

              {includeFDD && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-amber-600">FTC Compliance Notice</p>
                      <p className="text-sm text-muted-foreground">
                        Sending the FDD starts a mandatory 14-day waiting period before any franchise agreement can be
                        signed. The disclosure expiration date will be tracked automatically.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowEmailModal(false)}>
                Cancel
              </Button>
              <Button onClick={sendEmail} className="bg-cta hover:bg-cta/90 text-cta-foreground gap-2">
                <Mail className="h-4 w-4" />
                Send Email
              </Button>
            </div>
          </Card>
        </div>
      )}
      {showAddLeadModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-0 overflow-hidden bg-card shadow-2xl border-border">
            {" "}
            {/* Improved modal styling */}
            <div className="p-6 border-b border-border/50 bg-muted/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Send FDD Invitation</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Invite a lead to view your FDD in a personalized, white-labeled experience
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAddLeadModal(false)}
                  className="h-8 w-8 rounded-full hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Select Franchise <span className="text-destructive">*</span>
                </label>
                <Select
                  value={newLead.franchiseId}
                  onValueChange={(value) => setNewLead({ ...newLead, franchiseId: value })}
                >
                  <SelectTrigger className="w-full h-11 bg-background">
                    <SelectValue placeholder="Choose which franchise FDD to send" />
                  </SelectTrigger>
                  <SelectContent>
                    {franchises.length === 0 ? (
                      <SelectItem value="loading" disabled>
                        Loading franchises...
                      </SelectItem>
                    ) : (
                      franchises.map((franchise) => (
                        <SelectItem key={franchise.id} value={franchise.id}>
                          {franchise.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    First Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="text"
                    className="h-11 bg-background"
                    placeholder="John"
                    value={newLead.firstName}
                    onChange={(e) => setNewLead({ ...newLead, firstName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Last Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="text"
                    className="h-11 bg-background"
                    placeholder="Smith"
                    value={newLead.lastName}
                    onChange={(e) => setNewLead({ ...newLead, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Email <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="email"
                    className="h-11 bg-background"
                    placeholder="john@email.com"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Phone <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="tel"
                    className="h-11 bg-background"
                    placeholder="(555) 123-4567"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Lead Source <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={newLead.source}
                    onValueChange={(value) => setNewLead({ ...newLead, source: value as Lead["source"] })}
                  >
                    <SelectTrigger className="h-11 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Internal">Internal</SelectItem>
                      <SelectItem value="Website">Website</SelectItem>
                      <SelectItem value="Broker">Broker</SelectItem>
                      <SelectItem value="Referral">Referral</SelectItem>
                      <SelectItem value="Trade Show">Trade Show</SelectItem>
                      <SelectItem value="Direct Inquiry">Direct Inquiry</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Timeline <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={newLead.timeline}
                    onValueChange={(value) => setNewLead({ ...newLead, timeline: value })}
                  >
                    <SelectTrigger className="h-11 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-3 months">1-3 months</SelectItem>
                      <SelectItem value="3-6 months">3-6 months</SelectItem>
                      <SelectItem value="6-12 months">6-12 months</SelectItem>
                      <SelectItem value="12+ months">12+ months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    City <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="text"
                    className="h-11 bg-background"
                    placeholder="Austin"
                    value={newLead.city}
                    onChange={(e) => setNewLead({ ...newLead, city: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    State <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="text"
                    className="h-11 bg-background"
                    placeholder="TX"
                    maxLength={2}
                    value={newLead.state}
                    onChange={(e) => setNewLead({ ...newLead, state: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Location (optional)</label>
                <Input
                  type="text"
                  className="h-11 bg-background"
                  placeholder="e.g., Downtown Austin, TX or Remote"
                  value={newLead.location}
                  onChange={(e) => setNewLead({ ...newLead, location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Personal Message (Optional)</label>
                <Textarea
                  className="min-h-[100px] bg-background resize-none"
                  placeholder="Add a personal message that will be included in the invitation email..."
                  value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                />
              </div>

              <div className="p-4 bg-cta/5 border border-cta/10 rounded-lg space-y-2">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-cta/10 rounded-full">
                    <Mail className="h-4 w-4 text-cta" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">What happens next?</p>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Lead receives email with personalized invitation link</li>
                      <li>They create an account (or log in if existing user)</li>
                      <li>FDD Viewer opens with your custom branding</li>
                      <li>You receive real-time engagement tracking</li>
                    </ul>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-border/50 bg-muted/10 flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowAddLeadModal(false)}
                disabled={loading}
                className="h-11 px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddLead}
                className="bg-cta hover:bg-cta/90 text-cta-foreground gap-2 h-11 px-6 shadow-sm"
                disabled={
                  loading ||
                  !newLead.firstName ||
                  !newLead.lastName ||
                  !newLead.email ||
                  !newLead.phone ||
                  !newLead.franchiseId ||
                  !newLead.city ||
                  !newLead.state
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Send Invitation
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
      {showSuccessToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
          <Card className="p-4 bg-emerald-500/10 border-emerald-500/20 shadow-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <p className="font-medium text-emerald-600">{successMessage}</p>
            </div>
          </Card>
        </div>
      )}
      {showErrorToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
          <Card className="p-4 bg-destructive/10 border-destructive/20 shadow-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="font-medium text-destructive">{error}</p>
            </div>
          </Card>
        </div>
      )}
      {showReceiptModal && selectedReceiptLead && (
        <ReceiptViewerModal
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false)
            setSelectedReceiptLead(null)
          }}
          leadName={selectedReceiptLead.name}
          signedDate={selectedReceiptLead.item23SignedAt || selectedReceiptLead.fddSendDate || ""}
          franchisorCopyUrl={selectedReceiptLead.item23FranchisorCopyUrl || "/placeholder-receipt.pdf"}
          completeCopyUrl={selectedReceiptLead.item23CompleteCopyUrl || "/placeholder-receipt.pdf"}
          viewerType="franchisor"
        />
      )}
      {/* Removed FDD upload modal rendering - FDD processing is backend-only */}
      {/* {showFDDUploadModal && (
        <FDDUploadModal
          open={showFDDUploadModal}
          onOpenChange={setShowFDDUploadModal}
          franchiseId="7" // Default to Daisy, or make this dynamic based on selected franchise
          franchiseName="Blo Blow Dry Bar" // Default to Daisy, or make this dynamic
          onUploadComplete={handleFDDUploadComplete}
        />
      )} */}
      {/* Removed FDD URLs display modal rendering - FDD processing is backend-only */}
      {/* {showUrlsModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">FDD Pages Uploaded Successfully!</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {uploadedUrls.length} pages uploaded to Vercel Blob storage
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowUrlsModal(false)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Copy the URLs below and update your franchise data in{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">lib/data.ts</code>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Blob Storage URLs ({uploadedUrls.length} pages)</Label>
                  <Button onClick={copyUrlsToClipboard} size="sm" variant="outline" className="gap-2 bg-transparent">
                    <Download className="h-4 w-4" />
                    Copy URLs
                  </Button>
                </div>
                <div className="max-h-[400px] overflow-y-auto rounded-md border p-4 bg-muted/50">
                  <pre className="text-xs font-mono">
                    <code>
                      {`fddPageUrls: [
  ${uploadedUrls.map((url) => `"${url}"`).join(",\n  ")}
]`}
                    </code>
                  </pre>
                </div>
              </div>

              {uploadedPageMapping && (
                <div className="space-y-2">
                  <Label>Page Mapping (for intelligent page selection)</Label>
                  <div className="rounded-md border p-4 bg-muted/50">
                    <pre className="text-xs font-mono">
                      <code>{`fddPageMapping: ${JSON.stringify(uploadedPageMapping, null, 2)}`}</code>
                    </pre>
                  </div>
                </div>
              )}

              <div className="p-4 bg-cta/10 border border-cta/20 rounded-lg space-y-2">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-cta mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-cta">Next Steps:</p>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Copy the URLs above using the "Copy URLs" button</li>
                      <li>
                        Open <code className="text-xs bg-muted px-1 py-0.5 rounded">lib/data.ts</code>
                      </li>
                      <li>Find the Daisy franchise object (or your franchise)</li>
                      <li>
                        Replace the <code className="text-xs bg-muted px-1 py-0.5 rounded">fddPageUrls</code> array with
                        the copied URLs
                      </li>
                      <li>Save the file and refresh the page</li>
                      <li>The PDF viewer will now display the uploaded images instead of text</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setShowUrlsModal(false)} className="bg-cta hover:bg-cta/90 text-cta-foreground">
                Got it!
              </Button>
            </DialogFooter>
          </Card>
        </div>
      )} */}
      {/* Team Management moved to Company Settings */}
      {/* Added Item Mapping editor modal */}
      {showItemMappingModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">FDD Item Page Mappings</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure which page each FDD Item appears on for accurate navigation
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowItemMappingModal(false)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <FDDItemMappingEditor
              franchiseSlug="blo-blow-dry-bar"
              franchiseName="Blo Blow Dry Bar"
              onClose={() => setShowItemMappingModal(false)}
            />
          </Card>
        </div>
      )}
      {/* HIDDEN FOR DEMO - Quick action cards (redundant with filters)
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6 border-border/50 bg-gradient-to-br from-cta/5 to-transparent">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-cta/10 p-2">
                <Zap className="h-5 w-5 text-cta" />
              </div>
              <div>
                <h3 className="font-semibold">High Intent Leads</h3>
                <p className="text-sm text-muted-foreground">
                  {leads.filter((l) => l.intent === "High").length} leads ready to engage
                </p>
              </div>
            </div>
            <Button
              onClick={() => setActiveFilter("high-intent")}
              className="w-full bg-cta hover:bg-cta/90 text-cta-foreground gap-2"
            >
              View Leads
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <Card className="p-6 border-border/50">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <TrendingUp className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">New This Week</h3>
                <p className="text-sm text-muted-foreground">
                  {leads.filter((l) => l.isNew).length} fresh leads to review
                </p>
              </div>
            </div>
            <Button onClick={() => setActiveFilter("new")} variant="outline" className="w-full gap-2">
              View Leads
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <Card className="p-6 border-border/50">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <BarChart3 className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Analytics</h3>
                <p className="text-sm text-muted-foreground">View detailed performance</p>
              </div>
            </div>
            <Button variant="outline" className="w-full gap-2 bg-transparent">
              View Reports
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
      */}
    </div>
  )
}
