"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, Clock, TrendingUp, Mail, BarChart3, CheckCircle2, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react"
import { ContactLeadModal } from "@/components/contact-lead-modal"
import type { Lead } from "@/lib/data"
import type { PipelineStage } from "@/lib/types/database"
import { SalesEligibilityInline } from "@/components/sales-eligibility-badge"
import { useToast } from "@/hooks/use-toast"

interface PipelineViewProps {
  leads: Lead[]
  onOpenModal: (type: string, leadId?: string) => void
  onStageChange: (leadId: string, newStage: Lead["stage"]) => void
  onLeadStageUpdate?: (leadId: string, stageId: string, invitationId?: string) => Promise<void>
  pipelineLeadValue?: number // Configurable value per lead
}

// Fallback stages if API fails or hasn't loaded yet
const fallbackStages: PipelineStage[] = [
  { id: "inquiry", franchisor_id: "", name: "Inquiry", description: null, color: "#64748B", position: 0, is_default: true, is_closed_won: false, is_closed_lost: false, created_at: "", updated_at: "" },
  { id: "qualified", franchisor_id: "", name: "Qualified", description: null, color: "#3B82F6", position: 1, is_default: false, is_closed_won: false, is_closed_lost: false, created_at: "", updated_at: "" },
  { id: "disclosed", franchisor_id: "", name: "Disclosed", description: null, color: "#8B5CF6", position: 2, is_default: false, is_closed_won: false, is_closed_lost: false, created_at: "", updated_at: "" },
  { id: "negotiating", franchisor_id: "", name: "Negotiating", description: null, color: "#F59E0B", position: 3, is_default: false, is_closed_won: false, is_closed_lost: false, created_at: "", updated_at: "" },
  { id: "closing", franchisor_id: "", name: "Closing", description: null, color: "#10B981", position: 4, is_default: false, is_closed_won: false, is_closed_lost: false, created_at: "", updated_at: "" },
  { id: "closed", franchisor_id: "", name: "Closed", description: null, color: "#22C55E", position: 5, is_default: false, is_closed_won: true, is_closed_lost: false, created_at: "", updated_at: "" },
]

export function PipelineView({ leads, onOpenModal, onStageChange, onLeadStageUpdate, pipelineLeadValue: propLeadValue }: PipelineViewProps) {
  const [stages, setStages] = useState<PipelineStage[]>(fallbackStages)
  const [stagesLoading, setStagesLoading] = useState(true)
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [pipelineLeadValue, setPipelineLeadValue] = useState(propLeadValue || 50000) // Use prop or default $50K
  const [contactLead, setContactLead] = useState<Lead | null>(null)
  const { toast } = useToast()

  // Update local state when prop changes
  useEffect(() => {
    if (propLeadValue) {
      setPipelineLeadValue(propLeadValue)
    }
  }, [propLeadValue])

  // Fetch stages on mount
  useEffect(() => {
    const fetchStages = async () => {
      try {
        const response = await fetch("/api/pipeline-stages")
        if (response.ok) {
          const data = await response.json()
          if (data && data.length > 0) {
            setStages(data)
          }
        }
      } catch (error) {
        console.error("Error fetching pipeline stages:", error)
        // Keep using fallback stages
      } finally {
        setStagesLoading(false)
      }
    }

    fetchStages()
  }, [])

  // Map leads to stages - handles both old string stage and new stage_id
  const getLeadsByStage = (stageId: string) => {
    // Find the current stage being queried
    const currentStage = stages.find(s => s.id === stageId)
    
    // Determine if this is the default/first stage
    // First check is_default flag, then check if it's the lowest position
    const sortedStages = [...stages].sort((a, b) => a.position - b.position)
    const firstStage = sortedStages[0]
    const isDefaultStage = currentStage?.is_default || (firstStage && firstStage.id === stageId)
    
    return leads.filter((lead) => {
      const leadStageId = (lead as any).stage_id
      
      // Check if lead has stage_id (new system) - exact match
      if (leadStageId) {
        return leadStageId === stageId
      }
      
      // Lead has NO stage_id - put in default/first stage
      if (!leadStageId && isDefaultStage) {
        // But still check if lead.stage matches another stage name (legacy system)
        const matchedByName = stages.find(s => 
          s.name.toLowerCase() === lead.stage?.toLowerCase()
        )
        // If matched to a different stage by name, don't include here
        if (matchedByName && matchedByName.id !== stageId) {
          return false
        }
        // Otherwise include in default stage
        return true
      }
      
      // Fall back to old stage string matching for leads with legacy stage field
      if (currentStage && lead.stage) {
        // Match by name (case-insensitive)
        return lead.stage.toLowerCase() === currentStage.name.toLowerCase()
      }
      
      return false
    })
  }

  const getTotalValue = (stageLeads: Lead[]) => {
    // Use the franchisor's configured pipeline lead value
    return stageLeads.length * pipelineLeadValue
  }

  const getConversionRate = (stageIndex: number) => {
    if (stageIndex === 0) return null

    const previousStage = stages[stageIndex - 1]
    const currentStage = stages[stageIndex]
    
    const previousCount = getLeadsByStage(previousStage.id).length
    const currentCount = getLeadsByStage(currentStage.id).length

    if (previousCount === 0) return null
    return Math.round((currentCount / previousCount) * 100)
  }

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    console.log("[PipelineView] Drag started for lead:", lead.name, lead.id)
    setDraggedLead(lead)
    // Set drag data for debugging
    e.dataTransfer.setData("text/plain", lead.id)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = async (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault()
    console.log("[PipelineView] Drop on stage:", stage.name, stage.id)
    console.log("[PipelineView] Dragged lead:", draggedLead?.name, draggedLead?.id)
    
    if (!draggedLead) {
      console.log("[PipelineView] No dragged lead found!")
      toast({
        title: "Debug",
        description: "No dragged lead found",
        variant: "destructive",
      })
      return
    }
    
    const currentStageId = (draggedLead as any).stage_id || draggedLead.stage
    console.log("[PipelineView] Current stage:", currentStageId, "Target stage:", stage.id)
    
    if (currentStageId === stage.id) {
      console.log("[PipelineView] Same stage, skipping")
      setDraggedLead(null)
      return
    }

    setUpdatingLeadId(draggedLead.id)
    setDebugInfo(`Moving ${draggedLead.name} to ${stage.name}...`)

    try {
      console.log("[PipelineView] onLeadStageUpdate available:", !!onLeadStageUpdate)
      
      // If we have the new API endpoint, use it
      if (onLeadStageUpdate) {
        // Get invitation_id - for accessLeads it's separate, for pendingLeads it equals id
        const invitationId = (draggedLead as any).invitation_id
        console.log("[PipelineView] Calling onLeadStageUpdate with invitation_id:", invitationId)
        await onLeadStageUpdate(draggedLead.id, stage.id, invitationId)
        console.log("[PipelineView] onLeadStageUpdate completed successfully")
        toast({
          title: "Lead moved",
          description: `${draggedLead.name} moved to ${stage.name}`,
        })
        setDebugInfo(null)
      } else {
        console.log("[PipelineView] Using fallback onStageChange")
        // Fall back to old stage change handler
        onStageChange(draggedLead.id, stage.name.toLowerCase() as Lead["stage"])
        toast({
          title: "Lead moved (local only)",
          description: `${draggedLead.name} moved to ${stage.name}`,
        })
      }
    } catch (error: any) {
      console.error("[PipelineView] Error updating lead stage:", error)
      setDebugInfo(`Error: ${error.message}`)
      toast({
        title: "Error",
        description: error.message || "Failed to move lead",
        variant: "destructive",
      })
    } finally {
      setDraggedLead(null)
      setUpdatingLeadId(null)
    }
  }

  // Split stages into rows (3 per row)
  const rows: PipelineStage[][] = []
  for (let i = 0; i < stages.length; i += 3) {
    rows.push(stages.slice(i, i + 3))
  }

  const renderStageColumn = (stage: PipelineStage, stageIndex: number) => {
    const stageLeads = getLeadsByStage(stage.id)
    const conversionRate = getConversionRate(stageIndex)

    return (
      <div 
        key={stage.id} 
        className="space-y-2.5" 
        onDragOver={handleDragOver} 
        onDrop={(e) => handleDrop(e, stage)}
      >
        <Card className="p-3 border-border/50 bg-muted/30">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: stage.color }}
                />
                <h3 className="font-semibold text-sm">{stage.name}</h3>
                {stage.is_closed_won && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                )}
              </div>
              <Badge variant="secondary" className="text-xs font-semibold">
                {stageLeads.length}
              </Badge>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Value:</span>
                <span className="font-semibold">${(getTotalValue(stageLeads) / 1000).toFixed(0)}K</span>
              </div>

              {conversionRate !== null && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-600" />
                    <span className="text-muted-foreground">Conversion:</span>
                  </div>
                  <span className="font-semibold text-emerald-600">{conversionRate}%</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="space-y-2">
          {stageLeads.map((lead) => (
            <Card
              key={lead.id}
              draggable={updatingLeadId !== lead.id}
              onDragStart={(e) => handleDragStart(e, lead)}
              className={`p-3 border-border/50 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all hover:border-cta/50 hover:scale-[1.02] bg-card ${
                updatingLeadId === lead.id ? "opacity-50" : ""
              } ${draggedLead?.id === lead.id ? "opacity-50 ring-2 ring-blue-500" : ""}`}
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm truncate">{lead.name}</h4>
                      {lead.isNew && (
                        <Badge className="bg-cta text-cta-foreground text-[10px] px-1.5 py-0 h-4">New</Badge>
                      )}
                      {lead.verificationStatus === "verified" && (
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                      )}
                      {lead.verificationStatus === "unverified" && (
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                      )}
                      {updatingLeadId === lead.id && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{lead.location || "Unknown"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{lead.daysInStage || 0}d in stage</span>
                    </div>
                    <SalesEligibilityInline receiptSignedAt={lead.item23SignedAt} />
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] px-1.5 py-0 h-4 font-medium ${
                      lead.intent === "High"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    }`}
                  >
                    {lead.intent}
                  </Badge>
                </div>

                {(lead.stage === "disclosed" || stage.name.toLowerCase() === "disclosed" || 
                  stage.name.toLowerCase() === "fdd review") && lead.disclosureExpiresDate && (
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-xs">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <span className="text-muted-foreground">Expires: {lead.disclosureExpiresDate}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs gap-1.5 bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenModal("lead-intelligence", lead.id)
                    }}
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    Intel
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs gap-1.5 bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation()
                      setContactLead(lead)
                    }}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Contact
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {stageLeads.length === 0 && (
            <Card className="border-dashed border-2 border-border/50 bg-muted/20">
              <div className="text-center py-8 px-4">
                <p className="text-sm text-muted-foreground">No leads in this stage</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    )
  }

  if (stagesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60 mt-1" />
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Sales Pipeline</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Drag leads between stages to update their status</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Total Pipeline Value:</span>
          <span className="font-bold text-2xl">${(getTotalValue(leads) / 1000).toFixed(0)}K</span>
        </div>
      </div>

      {/* Debug info display */}
      {debugInfo && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          {debugInfo}
        </div>
      )}

      <div className="space-y-6">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-3 gap-4">
            {row.map((stage, colIndex) => {
              const stageIndex = rowIndex * 3 + colIndex
              return renderStageColumn(stage, stageIndex)
            })}
            {/* Fill empty columns if row is not complete */}
            {row.length < 3 && Array(3 - row.length).fill(null).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
          </div>
        ))}
      </div>

      {/* Contact Lead Modal */}
      {contactLead && (
        <ContactLeadModal
          isOpen={true}
          onClose={() => setContactLead(null)}
          lead={{
            id: contactLead.id,
            name: contactLead.name,
            email: contactLead.email,
          }}
        />
      )}
    </div>
  )
}
