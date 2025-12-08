"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save, Check, AlertTriangle, X, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Document, Page, pdfjs } from "react-pdf"

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface ItemMapping {
  mapping_type: "item" | "exhibit" | "quick_link"
  item_number?: number
  label: string
  page_number: number | null
  status: "confirmed" | "needs_review" | "missing"
}

interface FDDItemMappingAdminProps {
  fdd: {
    id: string
    pdf_url: string
    franchises: {
      id: string
      name: string
      slug: string
    }
  }
}

const STANDARD_ITEMS = [
  "Item 1: The Franchisor and Any Parents, Predecessors, and Affiliates",
  "Item 2: Business Experience",
  "Item 3: Litigation",
  "Item 4: Bankruptcy",
  "Item 5: Initial Fees",
  "Item 6: Other Fees",
  "Item 7: Estimated Initial Investment",
  "Item 8: Restrictions on Sources of Products and Services",
  "Item 9: Franchisee's Obligations",
  "Item 10: Financing",
  "Item 11: Franchisor's Assistance, Advertising, Computer Systems, and Training",
  "Item 12: Territory",
  "Item 13: Trademarks",
  "Item 14: Patents, Copyrights, and Proprietary Information",
  "Item 15: Obligation to Participate in the Actual Operation of the Franchise Business",
  "Item 16: Restrictions on What the Franchisee May Sell",
  "Item 17: Renewal, Termination, Transfer, and Dispute Resolution",
  "Item 18: Public Figures",
  "Item 19: Financial Performance Representations",
  "Item 20: Outlets and Franchisee Information",
  "Item 21: Financial Statements",
  "Item 22: Contracts",
  "Item 23: Receipts",
]

const DRYBAR_EXHIBITS = [
  "State Addenda and Agreement Riders",
  "Franchise Agreement and Exhibits",
  "Area Development Agreement and Exhibits",
  "List of Franchisees",
  "Franchises Sold But Not Yet Opened",
  "Franchises Sold But Not Yet Opened",
  "Financial Statements",
  "State Agencies and Agents for Service of Process",
  "Agreement and Conditional Consent to Transfer (including Sample Release of Claims)",
  "Form of Renewal Addendum (including Sample Release of Claims)",
  "Operations Manual Table of Contents",
  "State Effective Date",
  "Receipts",
]

export function FDDItemMappingAdmin({ fdd }: FDDItemMappingAdminProps) {
  const router = useRouter()
  const franchiseSlug = fdd.franchises.slug || fdd.franchises.name.toLowerCase().replace(/\s+/g, "-")
  const [itemMappings, setItemMappings] = useState<ItemMapping[]>([])
  const [exhibitMappings, setExhibitMappings] = useState<ItemMapping[]>([])
  const [quickLinkMappings, setQuickLinkMappings] = useState<ItemMapping[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [editingLabel, setEditingLabel] = useState<string | null>(null)
  const [editLabelValue, setEditLabelValue] = useState("")
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [previewPage, setPreviewPage] = useState<number>(1)
  const [activeTab, setActiveTab] = useState("items")
  const pdfContainerRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<{ [key: number]: HTMLDivElement }>({})
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved" | "error">("saved")
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchMappings()
    loadPDF()
  }, [])

  const loadPDF = async () => {
    try {
      const response = await fetch(fdd.pdf_url)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      setPdfBlobUrl(blobUrl)
    } catch (error) {
      console.error("[v0] Error loading PDF:", error)
    }
  }

  const fetchMappings = async () => {
    try {
      console.log("[v0] Fetching mappings for franchise:", franchiseSlug)
      const response = await fetch(`/api/fdd/item-mappings?franchise_slug=${franchiseSlug}`)
      const data = await response.json()
      console.log("[v0] Fetched mappings response:", { ok: response.ok, count: data.mappings?.length })

      if (data.mappings && data.mappings.length > 0) {
        const items = data.mappings.filter((m: any) => m.mapping_type === "item")
        const exhibits = data.mappings.filter((m: any) => m.mapping_type === "exhibit")
        const quickLinks = data.mappings.filter((m: any) => m.mapping_type === "quick_link")

        console.log("[v0] Loaded mappings:", {
          items: items.length,
          exhibits: exhibits.length,
          quickLinks: quickLinks.length,
        })

        setItemMappings(items.length > 0 ? items : initializeItems())
        setExhibitMappings(exhibits)
        setQuickLinkMappings(quickLinks.length > 0 ? quickLinks : initializeQuickLinks())
      } else {
        console.log("[v0] No mappings found, initializing defaults")
        setItemMappings(initializeItems())
        setExhibitMappings([])
        setQuickLinkMappings(initializeQuickLinks())
      }
    } catch (error) {
      console.error("[v0] Error fetching mappings:", error)
      setItemMappings(initializeItems())
      setExhibitMappings([])
      setQuickLinkMappings(initializeQuickLinks())
    } finally {
      setLoading(false)
    }
  }

  const initializeItems = (): ItemMapping[] => {
    return STANDARD_ITEMS.map((label, i) => ({
      mapping_type: "item" as const,
      item_number: i + 1,
      label,
      page_number: null,
      status: "missing" as const,
    }))
  }

  const initializeQuickLinks = (): ItemMapping[] => {
    return [
      { mapping_type: "quick_link" as const, label: "Cover", page_number: 1, status: "confirmed" as const },
      {
        mapping_type: "quick_link" as const,
        label: "Table of Contents",
        page_number: null,
        status: "missing" as const,
      },
      {
        mapping_type: "quick_link" as const,
        label: "Item 19 - Financial Performance",
        page_number: null,
        status: "missing" as const,
      },
      { mapping_type: "quick_link" as const, label: "Financials", page_number: null, status: "missing" as const },
      { mapping_type: "quick_link" as const, label: "Exhibits", page_number: null, status: "missing" as const },
    ]
  }

  const handleEdit = (id: string, currentPage: number | null) => {
    setEditingId(id)
    setEditValue(currentPage?.toString() || "")
  }

  const handleSaveEdit = async (id: string, mappingType: "item" | "exhibit" | "quick_link") => {
    const pageNumber = Number.parseInt(editValue)
    if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > numPages) {
      alert(`Please enter a valid page number between 1 and ${numPages}`)
      return
    }

    const updateMapping = (m: ItemMapping) => {
      const mappingId = m.mapping_type === "item" ? `item-${m.item_number}` : `${m.mapping_type}-${m.label}`
      return mappingId === id ? { ...m, page_number: pageNumber, status: "needs_review" as const } : m
    }

    if (mappingType === "item") {
      setItemMappings((prev) => prev.map(updateMapping))
    } else if (mappingType === "exhibit") {
      setExhibitMappings((prev) => prev.map(updateMapping))
    } else {
      setQuickLinkMappings((prev) => prev.map(updateMapping))
    }

    setEditingId(null)
    setEditValue("")
    scrollToPage(pageNumber)
    setSaveStatus("unsaved")
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditValue("")
  }

  const handleConfirm = (id: string, mappingType: "item" | "exhibit" | "quick_link") => {
    const updateMapping = (m: ItemMapping) => {
      const mappingId = m.mapping_type === "item" ? `item-${m.item_number}` : `${m.mapping_type}-${m.label}`
      return mappingId === id ? { ...m, status: "confirmed" as const } : m
    }

    if (mappingType === "item") {
      setItemMappings((prev) => prev.map(updateMapping))
    } else if (mappingType === "exhibit") {
      setExhibitMappings((prev) => prev.map(updateMapping))
    } else {
      setQuickLinkMappings((prev) => prev.map(updateMapping))
    }
  }

  const handleAddExhibit = () => {
    const newExhibit: ItemMapping = {
      mapping_type: "exhibit",
      label: "New Exhibit",
      page_number: null,
      status: "missing",
    }
    setExhibitMappings((prev) => [...prev, newExhibit])
  }

  const handleDeleteExhibit = (label: string) => {
    setExhibitMappings((prev) => prev.filter((m) => m.label !== label))
  }

  const handleUpdateExhibitLabel = (oldLabel: string, newLabel: string) => {
    setExhibitMappings((prev) => prev.map((m) => (m.label === oldLabel ? { ...m, label: newLabel } : m)))
  }

  const handleSaveAll = async () => {
    setSaving(true)
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current)
    }
    setSaveStatus("saving")

    try {
      const hasEmptyExhibitLabels = exhibitMappings.some(
        (m) => !m.label || m.label.trim() === "" || m.label === "New Exhibit",
      )
      if (hasEmptyExhibitLabels) {
        alert("Please provide names for all exhibits before saving")
        setSaving(false)
        setSaveStatus("unsaved")
        return
      }

      const allMappings = [
        ...itemMappings.map((m) => ({
          mapping_type: m.mapping_type,
          item_number: m.item_number,
          label: m.label,
          page_number: m.page_number || 1,
        })),
        ...exhibitMappings.map((m) => ({
          mapping_type: m.mapping_type,
          label: m.label,
          page_number: m.page_number || 1,
        })),
        ...quickLinkMappings.map((m) => ({
          mapping_type: m.mapping_type,
          label: m.label,
          page_number: m.page_number || 1,
        })),
      ]

      console.log("[v0] === ADMIN TOOL SAVE OPERATION ===")
      console.log("[v0] Franchise slug:", franchiseSlug)
      console.log("[v0] Total mappings to save:", allMappings.length)
      console.log("[v0] Items:", itemMappings.length)
      console.log("[v0] Exhibits:", exhibitMappings.length)
      console.log("[v0] Quick Links:", quickLinkMappings.length)
      console.log("[v0] Sample mapping:", allMappings[0])

      const response = await fetch("/api/fdd/item-mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          franchise_slug: franchiseSlug,
          mappings: allMappings,
        }),
      })

      const responseData = await response.json()
      console.log("[v0] Save response:", { ok: response.ok, status: response.status, data: responseData })

      if (response.ok) {
        setSaveStatus("saved")
        setLastSaved(new Date())
        console.log("[v0] ✅ Mappings saved successfully to database!")
        alert("Mappings saved successfully!")
        await fetchMappings()
      } else {
        console.error("[v0] ❌ Save failed:", responseData)
        setSaveStatus("error")
        alert(`Failed to save mappings: ${responseData.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("[v0] ❌ Error saving mappings:", error)
      setSaveStatus("error")
      alert(`Failed to save mappings: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setSaving(false)
    }
  }

  const handleLoadDrybarExhibits = () => {
    const drybarExhibits: ItemMapping[] = DRYBAR_EXHIBITS.map((label) => ({
      mapping_type: "exhibit",
      label,
      page_number: null,
      status: "missing",
    }))
    setExhibitMappings(drybarExhibits)
  }

  const getStatusBadge = (status: ItemMapping["status"]) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <Check className="h-3 w-3 mr-1" />
            Confirmed
          </Badge>
        )
      case "needs_review":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Needs Review
          </Badge>
        )
      case "missing":
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            <X className="h-3 w-3 mr-1" />
            Missing
          </Badge>
        )
    }
  }

  const getRowClassName = (status: ItemMapping["status"]) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/5"
      case "needs_review":
        return "bg-yellow-500/5"
      case "missing":
        return "bg-red-500/5"
    }
  }

  const renderMappingRow = (mapping: ItemMapping, id: string) => {
    const isExhibit = mapping.mapping_type === "exhibit"
    const displayLabel = mapping.mapping_type === "item" ? `Item ${mapping.item_number}` : mapping.label
    const isEditingThisLabel = editingLabel === id

    return (
      <div
        key={id}
        className={`flex items-center justify-between p-3 rounded-lg border ${getRowClassName(mapping.status)}`}
      >
        <div className="flex items-center gap-4 flex-1">
          {isExhibit && isEditingThisLabel ? (
            <Input
              value={editLabelValue}
              onChange={(e) => setEditLabelValue(e.target.value)}
              className="min-w-[200px]"
              placeholder="Exhibit name"
              onBlur={() => {
                if (editLabelValue.trim()) {
                  handleUpdateExhibitLabel(mapping.label, editLabelValue.trim())
                }
                setEditingLabel(null)
                setEditLabelValue("")
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && editLabelValue.trim()) {
                  handleUpdateExhibitLabel(mapping.label, editLabelValue.trim())
                  setEditingLabel(null)
                  setEditLabelValue("")
                } else if (e.key === "Escape") {
                  setEditingLabel(null)
                  setEditLabelValue("")
                }
              }}
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-2 min-w-[200px]">
              {isExhibit ? (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log("[v0] Editing exhibit:", { id, label: mapping.label })
                    setEditingLabel(id)
                    setEditLabelValue(mapping.label)
                  }}
                  className="font-medium text-left cursor-pointer hover:text-primary hover:underline"
                  title="Click to edit exhibit name"
                >
                  {displayLabel}
                </button>
              ) : (
                <span className="font-medium">{displayLabel}</span>
              )}
              {isExhibit && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setEditingLabel(id)
                    setEditLabelValue(mapping.label)
                  }}
                  className="text-muted-foreground hover:text-primary p-1"
                  title="Edit exhibit name"
                  type="button"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </button>
              )}
            </div>
          )}
          {editingId === id ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-24"
                placeholder="Page"
                min={1}
                max={numPages}
              />
              <Button size="sm" onClick={() => handleSaveEdit(id, mapping.mapping_type)}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <span className="text-sm text-muted-foreground">Page: {mapping.page_number || "Not set"}</span>
              <Button size="sm" variant="outline" onClick={() => handleEdit(id, mapping.page_number)}>
                Edit
              </Button>
              {mapping.page_number && (
                <Button size="sm" variant="outline" onClick={() => scrollToPage(mapping.page_number!)}>
                  Preview
                </Button>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(mapping.status)}
          {mapping.status === "needs_review" && (
            <Button size="sm" variant="ghost" onClick={() => handleConfirm(id, mapping.mapping_type)}>
              <Check className="h-4 w-4" />
            </Button>
          )}
          {mapping.mapping_type === "exhibit" && (
            <Button size="sm" variant="ghost" onClick={() => handleDeleteExhibit(mapping.label)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  const scrollToPage = (pageNumber: number) => {
    const pageElement = pageRefs.current[pageNumber]
    if (pageElement && pdfContainerRef.current) {
      pageElement.scrollIntoView({ behavior: "smooth", block: "start" })
    }
    setPreviewPage(pageNumber)
  }

  useEffect(() => {
    // Skip autosave if still loading initial data
    if (loading) return

    // Clear existing timer
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current)
    }

    // Mark as unsaved
    setSaveStatus("unsaved")

    // Set new timer for autosave after 2 seconds of inactivity
    autosaveTimerRef.current = setTimeout(() => {
      handleAutosave()
    }, 2000)

    // Cleanup timer on unmount
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }
    }
  }, [itemMappings, exhibitMappings, quickLinkMappings])

  const handleAutosave = async () => {
    // Don't autosave if already saving
    if (saving) return

    // Don't autosave if there are empty exhibit labels
    const hasEmptyExhibitLabels = exhibitMappings.some(
      (m) => !m.label || m.label.trim() === "" || m.label === "New Exhibit",
    )
    if (hasEmptyExhibitLabels) {
      console.log("[v0] Skipping autosave: exhibits need names")
      return
    }

    setSaveStatus("saving")
    setSaving(true)

    try {
      const allMappings = [
        ...itemMappings.map((m) => ({
          mapping_type: m.mapping_type,
          item_number: m.item_number,
          label: m.label,
          page_number: m.page_number || 1,
        })),
        ...exhibitMappings.map((m) => ({
          mapping_type: m.mapping_type,
          label: m.label,
          page_number: m.page_number || 1,
        })),
        ...quickLinkMappings.map((m) => ({
          mapping_type: m.mapping_type,
          label: m.label,
          page_number: m.page_number || 1,
        })),
      ]

      console.log("[v0] Autosaving mappings:", { franchise_slug: franchiseSlug, count: allMappings.length })

      const response = await fetch("/api/fdd/item-mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          franchise_slug: franchiseSlug,
          mappings: allMappings,
        }),
      })

      if (response.ok) {
        setSaveStatus("saved")
        setLastSaved(new Date())
        console.log("[v0] Autosave successful")
      } else {
        const responseData = await response.json()
        console.error("[v0] Autosave failed:", responseData)
        setSaveStatus("error")
      }
    } catch (error) {
      console.error("[v0] Autosave error:", error)
      setSaveStatus("error")
    } finally {
      setSaving(false)
    }
  }

  const getLastSavedText = () => {
    if (!lastSaved) return ""
    const now = new Date()
    const diffMs = now.getTime() - lastSaved.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)

    if (diffSecs < 10) return "just now"
    if (diffSecs < 60) return `${diffSecs}s ago`
    if (diffMins < 60) return `${diffMins}m ago`
    return lastSaved.toLocaleTimeString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading mappings...</p>
      </div>
    )
  }

  const allMappings = [...itemMappings, ...exhibitMappings, ...quickLinkMappings]
  const confirmedCount = allMappings.filter((m) => m.status === "confirmed").length
  const needsReviewCount = allMappings.filter((m) => m.status === "needs_review").length
  const missingCount = allMappings.filter((m) => m.status === "missing").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">FDD Page Mappings</h1>
            <p className="text-sm text-muted-foreground">{fdd.franchises.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            {saveStatus === "saving" && (
              <span className="text-blue-600 flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-green-600 flex items-center gap-2">
                <Check className="h-4 w-4" />
                Saved {getLastSavedText()}
              </span>
            )}
            {saveStatus === "unsaved" && (
              <span className="text-yellow-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Unsaved changes
              </span>
            )}
            {saveStatus === "error" && (
              <span className="text-red-600 flex items-center gap-2">
                <X className="h-4 w-4" />
                Save failed
              </span>
            )}
          </div>
          {/* </CHANGE> */}
          <Button onClick={handleSaveAll} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Confirmed</p>
              <p className="text-2xl font-bold">{confirmedCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <div>
              <p className="text-sm text-muted-foreground">Needs Review</p>
              <p className="text-2xl font-bold">{needsReviewCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <X className="h-4 w-4 text-red-600" />
            <div>
              <p className="text-sm text-muted-foreground">Missing</p>
              <p className="text-2xl font-bold">{missingCount}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Mappings Tabs */}
        <Card className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="items">Items (23)</TabsTrigger>
              <TabsTrigger value="exhibits">Exhibits ({exhibitMappings.length})</TabsTrigger>
              <TabsTrigger value="quick-links">Quick Links ({quickLinkMappings.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="items" className="space-y-2 max-h-[600px] overflow-y-auto mt-4">
              {itemMappings.map((mapping) => renderMappingRow(mapping, `item-${mapping.item_number}`))}
            </TabsContent>

            <TabsContent value="exhibits" className="space-y-2 max-h-[600px] overflow-y-auto mt-4">
              <div className="flex gap-2 mb-4">
                <Button onClick={handleAddExhibit} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Exhibit
                </Button>
                {fdd.franchises.slug === "drybar" && exhibitMappings.length === 0 && (
                  <Button onClick={handleLoadDrybarExhibits} size="sm" variant="outline">
                    Load Drybar Exhibits
                  </Button>
                )}
              </div>
              {exhibitMappings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No exhibits added yet. Click "Add Exhibit" or "Load Drybar Exhibits" to get started.
                </p>
              ) : (
                exhibitMappings.map((mapping) => renderMappingRow(mapping, `exhibit-${mapping.label}`))
              )}
            </TabsContent>

            <TabsContent value="quick-links" className="space-y-2 max-h-[600px] overflow-y-auto mt-4">
              {quickLinkMappings.map((mapping) => renderMappingRow(mapping, `quick_link-${mapping.label}`))}
            </TabsContent>
          </Tabs>
        </Card>

        {/* PDF Preview */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">PDF Preview</h2>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => scrollToPage(Math.max(1, previewPage - 1))}
                disabled={previewPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {previewPage} of {numPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => scrollToPage(Math.min(numPages, previewPage + 1))}
                disabled={previewPage >= numPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div
            ref={pdfContainerRef}
            className="border rounded-lg overflow-y-auto bg-muted/50 max-h-[600px]"
            onScroll={(e) => {
              const container = e.currentTarget
              const scrollTop = container.scrollTop
              const pageHeight = container.scrollHeight / numPages
              const currentPage = Math.floor(scrollTop / pageHeight) + 1
              if (currentPage !== previewPage && currentPage >= 1 && currentPage <= numPages) {
                setPreviewPage(currentPage)
              }
            }}
          >
            {pdfBlobUrl && (
              <Document
                file={pdfBlobUrl}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                loading={<div className="p-8 text-center text-muted-foreground">Loading PDF...</div>}
              >
                {Array.from({ length: numPages }, (_, index) => index + 1).map((pageNumber) => (
                  <div
                    key={pageNumber}
                    ref={(el) => {
                      if (el) pageRefs.current[pageNumber] = el
                    }}
                    className="mb-2"
                  >
                    <Page pageNumber={pageNumber} width={400} renderTextLayer={false} renderAnnotationLayer={false} />
                  </div>
                ))}
              </Document>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
