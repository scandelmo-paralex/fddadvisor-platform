"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, TrendingUp, Mail, BarChart3, CheckCircle2, ShieldCheck, ShieldAlert } from "lucide-react"
import type { Lead } from "@/lib/data"

interface PipelineViewProps {
  leads: Lead[]
  onOpenModal: (type: string, leadId?: string) => void
  onStageChange: (leadId: string, newStage: Lead["stage"]) => void
}

const stages = [
  { id: "inquiry" as const, label: "Inquiry", color: "bg-slate-500" },
  { id: "qualified" as const, label: "Qualified", color: "bg-blue-500" },
  { id: "disclosed" as const, label: "Disclosed", color: "bg-purple-500" },
  { id: "negotiating" as const, label: "Negotiating", color: "bg-amber-500" },
  { id: "closing" as const, label: "Closing", color: "bg-emerald-500" },
  { id: "closed" as const, label: "Closed", color: "bg-green-600" },
]

export function PipelineView({ leads, onOpenModal, onStageChange }: PipelineViewProps) {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)

  const getLeadsByStage = (stageId: Lead["stage"]) => {
    return leads.filter((lead) => lead.stage === stageId)
  }

  const getTotalValue = (stageLeads: Lead[]) => {
    // Estimate $50K average franchise fee per lead
    return stageLeads.length * 50000
  }

  const getConversionRate = (currentStage: Lead["stage"]) => {
    const currentIndex = stages.findIndex((s) => s.id === currentStage)
    if (currentIndex === 0) return null

    const previousStage = stages[currentIndex - 1]
    const previousCount = getLeadsByStage(previousStage.id).length
    const currentCount = getLeadsByStage(currentStage).length

    if (previousCount === 0) return null
    return Math.round((currentCount / previousCount) * 100)
  }

  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (stageId: Lead["stage"]) => {
    if (draggedLead && draggedLead.stage !== stageId) {
      onStageChange(draggedLead.id, stageId)
    }
    setDraggedLead(null)
  }

  const firstRowStages = stages.slice(0, 3)
  const secondRowStages = stages.slice(3, 6)

  const renderStageColumn = (stage: (typeof stages)[0]) => {
    const stageLeads = getLeadsByStage(stage.id)
    const conversionRate = getConversionRate(stage.id)

    return (
      <div key={stage.id} className="space-y-2.5" onDragOver={handleDragOver} onDrop={() => handleDrop(stage.id)}>
        <Card className="p-3 border-border/50 bg-muted/30">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                <h3 className="font-semibold text-sm">{stage.label}</h3>
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
              draggable
              onDragStart={() => handleDragStart(lead)}
              className="p-3 border-border/50 cursor-move hover:shadow-lg transition-all hover:border-cta/50 hover:scale-[1.02] bg-card"
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
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{lead.location}</span>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-xs font-semibold px-2 py-0.5 flex-shrink-0 ${
                      lead.qualityScore >= 85
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : lead.qualityScore >= 70
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          : "bg-slate-500/10 text-slate-600 border-slate-500/20"
                    }`}
                  >
                    {lead.qualityScore}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{lead.daysInStage}d in stage</span>
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

                {lead.stage === "disclosed" && lead.disclosureExpiresDate && (
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
                    onClick={() => onOpenModal("lead-intelligence", lead.id)}
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    Intel
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs gap-1.5 bg-transparent"
                    onClick={() => {
                      /* Handle contact */
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

      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">{firstRowStages.map(renderStageColumn)}</div>
        <div className="grid grid-cols-3 gap-4">{secondRowStages.map(renderStageColumn)}</div>
      </div>
    </div>
  )
}
