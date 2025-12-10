"use client"

import { X, Info, CheckCircle2, Clock, Radio, User, Linkedin, AlertTriangle, TrendingUp, Target, MessageSquare, RefreshCw } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { franchises, leads, investmentBreakdown, unitDistribution } from "@/lib/data"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface ModalProps {
  type: string
  isOpen: boolean
  onClose: () => void
  leadId?: string
  franchiseId?: string
}

function getQualityScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-500"
  if (score >= 61) return "text-amber-500"
  return "text-red-500"
}

function getQualityScoreLabel(score: number): string {
  if (score >= 80) return "Excellent"
  if (score >= 61) return "Good"
  return "Fair"
}

function getLeadTemperature(score: number): { label: string; color: string; bgColor: string } {
  if (score >= 85) return { label: "🔥 HOT LEAD", color: "text-red-600", bgColor: "bg-red-100" }
  if (score >= 70) return { label: "WARM LEAD", color: "text-amber-600", bgColor: "bg-amber-100" }
  return { label: "COLD LEAD", color: "text-blue-600", bgColor: "bg-blue-100" }
}

const getEngagementTierConfig = (tier: string | undefined) => {
  switch (tier) {
    case "none":
      return {
        label: "Awaiting First Session",
        color: "text-gray-600",
        bgColor: "bg-gray-100",
        borderColor: "border-gray-300",
        icon: "⏳",
        description: "FDD sent but not yet accessed",
      }
    case "minimal":
      return {
        label: "Early Stage",
        color: "text-amber-700",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        icon: "🌱",
        description: "Less than 5 minutes of engagement",
      }
    case "partial":
      return {
        label: "Exploring",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        icon: "🔍",
        description: "5-15 minutes of engagement",
      }
    case "meaningful":
      return {
        label: "Engaged",
        color: "text-emerald-700",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        icon: "📊",
        description: "15-45 minutes of deep engagement",
      }
    case "high":
      return {
        label: "Highly Engaged",
        color: "text-purple-700",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
        icon: "🔥",
        description: "45+ minutes of deep engagement",
      }
    default:
      return {
        label: "Unknown",
        color: "text-gray-600",
        bgColor: "bg-gray-100",
        borderColor: "border-gray-300",
        icon: "❓",
        description: "Engagement data unavailable",
      }
  }
}

// Financial Fit Badge Configuration
function getFinancialFitConfig(status: string | undefined) {
  switch (status) {
    case "qualified":
      return {
        label: "✅ FINANCIALLY QUALIFIED",
        color: "text-emerald-700",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-300",
        icon: "✅",
      }
    case "borderline":
      return {
        label: "⚠️ BORDERLINE FINANCIAL FIT",
        color: "text-amber-700",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-300",
        icon: "⚠️",
      }
    case "not_qualified":
      return {
        label: "❌ DOES NOT MEET REQUIREMENTS",
        color: "text-red-700",
        bgColor: "bg-red-50",
        borderColor: "border-red-300",
        icon: "❌",
      }
    default:
      return {
        label: "❓ FINANCIAL STATUS UNKNOWN",
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-300",
        icon: "❓",
      }
  }
}

// Candidate Fit Rating Configuration
function getCandidateFitConfig(rating: string | undefined) {
  switch (rating) {
    case "Excellent":
      return { color: "text-emerald-600", bgColor: "bg-emerald-100" }
    case "Good":
      return { color: "text-blue-600", bgColor: "bg-blue-100" }
    case "Fair":
      return { color: "text-amber-600", bgColor: "bg-amber-100" }
    case "Poor":
      return { color: "text-red-600", bgColor: "bg-red-100" }
    case "Not Qualified":
      return { color: "text-red-700", bgColor: "bg-red-200" }
    default:
      return { color: "text-gray-600", bgColor: "bg-gray-100" }
  }
}

// Criteria Score Badge
function getCriteriaScoreConfig(score: string | undefined) {
  switch (score) {
    case "Strong Match":
      return { label: "Strong Match", color: "text-emerald-700", bgColor: "bg-emerald-100", icon: "✓" }
    case "Partial Match":
      return { label: "Partial Match", color: "text-amber-700", bgColor: "bg-amber-100", icon: "~" }
    case "Weak Match":
      return { label: "Weak Match", color: "text-red-700", bgColor: "bg-red-100", icon: "✗" }
    default:
      return { label: "Unknown", color: "text-gray-600", bgColor: "bg-gray-100", icon: "?" }
  }
}

export function Modal({ type, isOpen, onClose, leadId, franchiseId }: ModalProps) {
  const [liveLeadData, setLiveLeadData] = useState<any>(null)
  const [isLive, setIsLive] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [updatedFields, setUpdatedFields] = useState<Set<string>>(new Set())
  const [engagementData, setEngagementData] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (!isOpen || type !== "lead-intelligence" || !leadId) return

    const supabase = createClient()
    console.log("[v0] Setting up real-time subscription for lead:", leadId)

    const fetchLeadData = async () => {
      try {
        console.log("[v0] Fetching lead data from /api/leads?lead_id=" + leadId)
        const response = await fetch(`/api/leads?lead_id=${leadId}`)
        console.log("[v0] Response status:", response.status)
        if (response.ok) {
          const data = await response.json()
          console.log("[v0] Received lead data:", data)
          const leadData = Array.isArray(data) ? data[0] : data
          setLiveLeadData(leadData)
          console.log("[v0] Set live lead data:", leadData)
        } else {
          console.error("[v0] Failed to fetch lead data, status:", response.status)
        }
      } catch (error) {
        console.error("[v0] Error fetching lead data:", error)
      }
    }

    const fetchEngagementData = async () => {
      try {
        const response = await fetch(`/api/leads/engagement?lead_id=${leadId}`)
        if (response.ok) {
          const data = await response.json()
          setEngagementData(data)
          console.log("[v0] Fetched engagement data:", data)
        }
      } catch (error) {
        console.error("[v0] Error fetching engagement data:", error)
      }
    }

    fetchLeadData()
    fetchEngagementData()

    const leadsChannel = supabase
      .channel(`lead-${leadId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leads",
          filter: `id=eq.${leadId}`,
        },
        (payload) => {
          console.log("[v0] Lead updated:", payload)
          setLiveLeadData(payload.new)
          setLastUpdate(new Date())
          setIsLive(true)

          if (payload.old && payload.new) {
            const changed = new Set<string>()
            Object.keys(payload.new).forEach((key) => {
              if (payload.old[key] !== payload.new[key]) {
                changed.add(key)
              }
            })
            setUpdatedFields(changed)

            setTimeout(() => setUpdatedFields(new Set()), 3000)
          }
        },
      )
      .subscribe((status) => {
        console.log("[v0] Subscription status:", status)
        if (status === "SUBSCRIBED") {
          setIsLive(true)
        }
      })

    const engagementChannel = supabase
      .channel(`engagement-${leadId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fdd_engagements",
          filter: `lead_id=eq.${leadId}`,
        },
        (payload) => {
          console.log("[v0] Engagement updated:", payload)
          setLastUpdate(new Date())
          setIsLive(true)

          fetchEngagementData()

          setUpdatedFields(new Set(["engagement"]))
          setTimeout(() => setUpdatedFields(new Set()), 3000)
        },
      )
      .subscribe()

    return () => {
      console.log("[v0] Cleaning up real-time subscriptions")
      supabase.removeChannel(leadsChannel)
      supabase.removeChannel(engagementChannel)
      setIsLive(false)
      setLiveLeadData(null)
      setEngagementData(null)
      setLastUpdate(null)
      setUpdatedFields(new Set())
    }
  }, [isOpen, type, leadId])

  // Manual refresh function
  const handleRefresh = async () => {
    if (!leadId) return
    setIsRefreshing(true)
    try {
      // Fetch fresh lead data
      const leadResponse = await fetch(`/api/leads?lead_id=${leadId}`)
      if (leadResponse.ok) {
        const data = await leadResponse.json()
        const leadData = Array.isArray(data) ? data[0] : data
        setLiveLeadData(leadData)
      }
      // Fetch fresh engagement data
      const engagementResponse = await fetch(`/api/leads/engagement?lead_id=${leadId}`)
      if (engagementResponse.ok) {
        const data = await engagementResponse.json()
        setEngagementData(data)
      }
      setLastUpdate(new Date())
    } catch (error) {
      console.error("[v0] Error refreshing data:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  if (!isOpen) return null

  const lead = liveLeadData || (leadId ? leads.find((l) => l.id === leadId) : null)
  const franchise = franchiseId ? franchises.find((f) => f.id === franchiseId) : null

  const displayLead = lead
    ? {
        ...lead,
        totalTimeSpent:
          engagementData?.totalTimeSpent && engagementData.totalTimeSpent !== "0m"
            ? engagementData.totalTimeSpent
            : lead.totalTimeSpent,
        accessedDate: engagementData?.accessedDate || lead.accessedDate,
        fddFocusAreas:
          engagementData?.fddFocusAreas && engagementData.fddFocusAreas.length > 0
            ? engagementData.fddFocusAreas
            : lead.fddFocusAreas,
        questionsAsked:
          engagementData?.questionsAsked && engagementData.questionsAsked.length > 0
            ? engagementData.questionsAsked
            : lead.questionsAsked,
        aiInsights: lead.aiInsights || engagementData?.aiInsights || null,
      }
    : null

  console.log("[v0] Modal rendering - leadId:", leadId, "liveLeadData:", liveLeadData, "displayLead:", displayLead)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">
              {type === "analyzed" && "FDDs Analyzed"}
              {type === "saved" && "Saved Franchises"}
              {type === "questions" && "AI Questions History"}
              {type === "investment" && "Investment Breakdown"}
              {type === "revenue" && "Revenue Details"}
              {type === "units" && "Unit Distribution"}
              {type === "lead-intelligence" && "Lead Intelligence"}
            </h2>
            {type === "lead-intelligence" && isLive && (
              <Badge className="bg-emerald-500 text-white hover:bg-emerald-500 flex items-center gap-1.5 animate-pulse">
                <Radio className="h-3 w-3" />
                Live
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            {type === "lead-intelligence" && lastUpdate && (
              <span className="text-xs text-muted-foreground">Updated {lastUpdate.toLocaleTimeString()}</span>
            )}
            {type === "lead-intelligence" && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          {type === "analyzed" && (
            <div className="space-y-3">
              {franchises.slice(0, 7).map((franchise) => (
                <div key={franchise.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">{franchise.name}</p>
                    <p className="text-sm text-muted-foreground">{franchise.industry}</p>
                  </div>
                  <Badge>Analyzed</Badge>
                </div>
              ))}
            </div>
          )}

          {type === "saved" && (
            <div className="space-y-3">
              {franchises.slice(0, 3).map((franchise) => (
                <div key={franchise.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">{franchise.name}</p>
                    <p className="text-sm text-muted-foreground">{franchise.industry}</p>
                  </div>
                  <Badge className="bg-accent text-white">Saved</Badge>
                </div>
              ))}
            </div>
          )}

          {type === "questions" && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <p className="font-medium">What are the typical profit margins for Subway?</p>
                <p className="mt-2 text-sm text-muted-foreground">Asked 2 hours ago</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="font-medium">How much territory protection do I get?</p>
                <p className="mt-2 text-sm text-muted-foreground">Asked 1 day ago</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="font-medium">What is the average time to break even?</p>
                <p className="mt-2 text-sm text-muted-foreground">Asked 3 days ago</p>
              </div>
            </div>
          )}

          {type === "investment" && (
            <div className="space-y-4">
              {franchise?.investmentBreakdown ? (
                <>
                  <div className="grid gap-3">
                    {Object.entries(franchise.investmentBreakdown).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between rounded-lg border p-4">
                        <span className="font-medium capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                        <span className="text-lg font-bold">${value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg bg-accent/10 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">Total Investment</span>
                      <span className="text-2xl font-bold text-foreground">
                        $
                        {Object.values(franchise.investmentBreakdown)
                          .reduce((a, b) => a + b, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid gap-3">
                    {Object.entries(investmentBreakdown).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between rounded-lg border p-4">
                        <span className="font-medium capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                        <span className="text-lg font-bold">${value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg bg-accent/10 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">Total Investment</span>
                      <span className="text-2xl font-bold text-foreground">
                        $
                        {Object.values(investmentBreakdown)
                          .reduce((a, b) => a + b, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {type === "revenue" && (
            <div className="space-y-4">
              {franchise?.revenueData?.average ? (
                <>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Average Annual Revenue</p>
                    <p className="text-3xl font-bold">${franchise.revenueData.average.toLocaleString()}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Top 25% (Top Quartile)</p>
                      <p className="text-xl font-bold">${franchise.revenueData.topQuartile.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Median Revenue</p>
                      <p className="text-xl font-bold">${franchise.revenueData.median.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border p-4 sm:col-span-2">
                      <p className="text-sm text-muted-foreground">Bottom 25% (Bottom Quartile)</p>
                      <p className="text-xl font-bold">${franchise.revenueData.bottomQuartile.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                    <p className="text-sm text-blue-900 font-medium mb-1">3-Year Revenue Trend</p>
                    <p className="text-xs text-blue-700">
                      These figures represent historical performance and do not guarantee future results. Individual
                      results may vary significantly.
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground italic">
                    Source: Item 19 Financial Performance Representations. These figures represent historical
                    performance and do not guarantee future results. Individual results may vary significantly.
                  </p>
                </>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
                  <div className="mb-3">
                    <span className="text-4xl">📊</span>
                  </div>
                  <h3 className="font-semibold text-amber-900 mb-2">No Revenue Data Available</h3>
                  <p className="text-sm text-amber-800 mb-4">
                    This franchise has not provided Item 19 Financial Performance Representations in their FDD. This
                    means they have chosen not to disclose revenue or earnings information.
                  </p>
                  <div className="text-left bg-white rounded-lg p-4 space-y-2">
                    <p className="text-xs font-semibold text-amber-900">What this means:</p>
                    <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                      <li>You'll need to request financial information directly from the franchisor</li>
                      <li>Consider speaking with existing franchisees about their performance</li>
                      <li>Review Item 20 for outlet opening/closing data as an indicator of system health</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {type === "units" && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Total Units</p>
                  <p className="text-2xl font-bold">{unitDistribution.total.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">US Units</p>
                  <p className="text-2xl font-bold">{unitDistribution.us.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">International</p>
                  <p className="text-2xl font-bold">{unitDistribution.international.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Net Growth 2023</p>
                  <p className="text-2xl font-bold text-accent">
                    +{unitDistribution.growth2023 - unitDistribution.closures2023}
                  </p>
                </div>
              </div>
            </div>
          )}

          {type === "lead-intelligence" && displayLead && (
            <div className="space-y-6">
              <div
                className={`flex items-start justify-between gap-4 pb-4 border-b ${updatedFields.has("name") || updatedFields.has("qualityScore") ? "animate-pulse bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-4 -m-4 mb-0" : ""}`}
              >
                <div>
                  <h3 className="text-2xl font-bold mb-1">{displayLead.name}</h3>
                  {displayLead.accessedDate && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Accessed FDD: {displayLead.accessedDate}</span>
                      {displayLead.totalTimeSpent && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            Time spent: {displayLead.totalTimeSpent}
                          </span>
                        </>
                      )}
                      {engagementData?.engagementCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-xs">
                            {engagementData.engagementCount} session{engagementData.engagementCount !== 1 ? "s" : ""}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                  {!displayLead.accessedDate && engagementData?.invitationSentAt && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <span>FDD Sent: {new Date(engagementData.invitationSentAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="text-amber-600 font-medium">Awaiting first access</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    className={`${getLeadTemperature(displayLead.qualityScore).bgColor} ${getLeadTemperature(displayLead.qualityScore).color} hover:${getLeadTemperature(displayLead.qualityScore).bgColor} font-bold px-3 py-1`}
                  >
                    {getLeadTemperature(displayLead.qualityScore).label}
                  </Badge>
                  {engagementData?.engagementTier && (
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getEngagementTierConfig(engagementData.engagementTier).bgColor} ${getEngagementTierConfig(engagementData.engagementTier).color} border ${getEngagementTierConfig(engagementData.engagementTier).borderColor}`}
                    >
                      <span>{getEngagementTierConfig(engagementData.engagementTier).icon}</span>
                      <span>{getEngagementTierConfig(engagementData.engagementTier).label}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <p className="text-sm text-muted-foreground">Quality Score</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs p-4" side="right">
                        <div className="space-y-2">
                          <p className="font-semibold">How Quality Score is Calculated:</p>
                          <ul className="text-sm space-y-1 list-disc list-inside">
                            <li>
                              <strong>Engagement (40%):</strong> FDD downloads, Item 19 views, time on platform
                            </li>
                            <li>
                              <strong>Financial Readiness (30%):</strong> Available capital vs. investment requirements
                            </li>
                            <li>
                              <strong>Timeline (15%):</strong> Urgency and commitment level
                            </li>
                            <li>
                              <strong>Experience (15%):</strong> Relevant industry background
                            </li>
                          </ul>
                          <div className="mt-3 pt-2 border-t text-xs">
                            <p>
                              <strong>80-100:</strong> Excellent - High conversion probability
                            </p>
                            <p>
                              <strong>61-79:</strong> Good - Qualified lead, needs nurturing
                            </p>
                            <p>
                              <strong>0-60:</strong> Fair - Early stage, requires education
                            </p>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <p className={`text-6xl font-bold ${getQualityScoreColor(displayLead.qualityScore)}`}>
                    {displayLead.qualityScore}
                  </p>
                  <Badge
                    className={`text-sm ${
                      displayLead.qualityScore >= 80
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                        : displayLead.qualityScore >= 61
                          ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                          : "bg-red-100 text-red-700 hover:bg-red-100"
                    }`}
                  >
                    {getQualityScoreLabel(displayLead.qualityScore)}
                  </Badge>
                </div>
              </div>

              {engagementData?.buyerQualification && (
                <div className="mt-6">
                  <h3 className="mb-3 font-bold flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Buyer Qualification (Self-Reported)
                  </h3>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {/* FICO Score */}
                    <div className="rounded-lg border p-4 bg-muted/20">
                      <p className="text-sm text-muted-foreground mb-1">FICO Score</p>
                      <p className="text-lg font-bold">{engagementData.buyerQualification.ficoScoreRange || "—"}</p>
                    </div>

                    {/* Liquid Assets */}
                    <div className="rounded-lg border p-4 bg-muted/20">
                      <p className="text-sm text-muted-foreground mb-1">Liquid Assets</p>
                      <p className="text-lg font-bold">{engagementData.buyerQualification.liquidAssetsRange || "—"}</p>
                    </div>

                    {/* Net Worth */}
                    <div className="rounded-lg border p-4 bg-muted/20">
                      <p className="text-sm text-muted-foreground mb-1">Net Worth</p>
                      <p className="text-lg font-bold">{engagementData.buyerQualification.netWorthRange || "—"}</p>
                    </div>

                    {/* Funding Plan */}
                    <div className="rounded-lg border p-4 bg-muted/20">
                      <p className="text-sm text-muted-foreground mb-1">Funding Plan</p>
                      <p className="text-lg font-bold">{engagementData.buyerQualification.fundingPlans ? (Array.isArray(engagementData.buyerQualification.fundingPlans) ? engagementData.buyerQualification.fundingPlans.join(", ") : engagementData.buyerQualification.fundingPlans) : "—"}</p>
                    </div>
                  </div>

                  {/* Business Experience & Background */}
                  <div className="grid gap-3 sm:grid-cols-2 mt-3">
                    {/* Business Experience */}
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground mb-2">Business Experience</p>
                      <div className="space-y-1">
                        {engagementData.buyerQualification.yearsOfExperience !== undefined && (
                          <p className="text-sm">
                            <span className="font-medium">
                              {engagementData.buyerQualification.yearsOfExperience}
                            </span>{" "}
                            years experience
                          </p>
                        )}
                        {engagementData.buyerQualification.managementExperience && (
                          <div className="flex items-center gap-1 text-sm text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Management experience
                          </div>
                        )}
                        {engagementData.buyerQualification.hasOwnedBusiness && (
                          <div className="flex items-center gap-1 text-sm text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Previous business owner
                          </div>
                        )}
                        {engagementData.buyerQualification.industryExperience && engagementData.buyerQualification.industryExperience.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            Industries: {Array.isArray(engagementData.buyerQualification.industryExperience) ? engagementData.buyerQualification.industryExperience.join(", ") : engagementData.buyerQualification.industryExperience}
                          </p>
                        )}
                        {engagementData.buyerQualification.relevantSkills && engagementData.buyerQualification.relevantSkills.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            Skills: {Array.isArray(engagementData.buyerQualification.relevantSkills) ? engagementData.buyerQualification.relevantSkills.join(", ") : engagementData.buyerQualification.relevantSkills}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Background Attestation */}
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground mb-2">Background Attestation</p>
                      <div className="space-y-1">
                        <div
                          className={`flex items-center gap-1 text-sm ${engagementData.buyerQualification.noFelonyAttestation ? "text-emerald-600" : "text-muted-foreground"}`}
                        >
                          {engagementData.buyerQualification.noFelonyAttestation ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <span className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
                          )}
                          No felony convictions
                        </div>
                        <div
                          className={`flex items-center gap-1 text-sm ${engagementData.buyerQualification.noBankruptcyAttestation ? "text-emerald-600" : "text-muted-foreground"}`}
                        >
                          {engagementData.buyerQualification.noBankruptcyAttestation ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <span className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
                          )}
                          No bankruptcies (7 years)
                        </div>
                      </div>
                      {engagementData.buyerQualification.linkedInUrl && (
                        <a
                          href={engagementData.buyerQualification.linkedInUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 flex items-center gap-1.5 text-sm text-primary hover:underline"
                        >
                          <Linkedin className="h-4 w-4" />
                          View LinkedIn Profile
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Profile Completion Status */}
                  {engagementData.buyerQualification.profileCompletedAt && (
                    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <span className="text-sm text-emerald-700 font-medium">
                        Profile completed on{" "}
                        {new Date(engagementData.buyerQualification.profileCompletedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {displayLead.financialQualification && (
                <div>
                  <h3 className="mb-3 font-bold">Financial Qualification</h3>

                  {displayLead.verificationStatus !== "verified" && (
                    <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-white">!</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-amber-900 mb-1">Verification Incomplete</p>
                          <p className="text-sm text-amber-800">
                            This lead has engaged with your FDD but hasn't completed financial verification yet.
                            Encourage them to complete verification to become fully qualified.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-muted-foreground">Credit Score</p>
                        {displayLead.financialQualification.creditScoreVerified && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        )}
                      </div>
                      {displayLead.financialQualification.creditScoreVerified ? (
                        <p className="text-2xl font-bold">{displayLead.financialQualification.creditScore}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Not verified yet</p>
                      )}
                    </div>

                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-muted-foreground">Background Check</p>
                        {displayLead.financialQualification.backgroundCheckVerified && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          className={
                            displayLead.financialQualification.backgroundCheck === "Clear"
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                              : displayLead.financialQualification.backgroundCheck === "Pending"
                                ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-100"
                          }
                        >
                          {displayLead.financialQualification.backgroundCheck}
                        </Badge>
                        {displayLead.financialQualification.backgroundCheck === "Clear" && (
                          <span className="text-emerald-600">✓</span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border p-4 sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-muted-foreground">Pre-Approval Status</p>
                        {displayLead.financialQualification.preApproval.verified && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          className={
                            displayLead.financialQualification.preApproval.status === "Approved"
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                              : displayLead.financialQualification.preApproval.status === "Pending"
                                ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-100"
                          }
                        >
                          {displayLead.financialQualification.preApproval.status}
                        </Badge>
                        {displayLead.financialQualification.preApproval.amount && (
                          <p className="text-lg font-bold">
                            ${displayLead.financialQualification.preApproval.amount.toLocaleString()} at{" "}
                            {displayLead.financialQualification.preApproval.interestRate}%
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground mb-1">Liquid Capital</p>
                      {displayLead.financialQualification.liquidCapital.range ? (
                        <>
                          <p className="text-2xl font-bold mb-1">
                            {displayLead.financialQualification.liquidCapital.range}
                          </p>
                          <p className="text-xs text-muted-foreground italic">
                            {displayLead.financialQualification.liquidCapital.source}
                          </p>
                        </>
                      ) : displayLead.financialQualification.liquidCapital.source === "Verified" ? (
                        <>
                          <p className="text-2xl font-bold mb-1">
                            ${displayLead.financialQualification.liquidCapital.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {displayLead.financialQualification.liquidCapital.source}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-2xl font-bold mb-1">
                            ${displayLead.financialQualification.liquidCapital.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground italic">
                            {displayLead.financialQualification.liquidCapital.source}
                          </p>
                        </>
                      )}
                    </div>

                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground mb-1">Net Worth</p>
                      {displayLead.financialQualification.netWorth.range ? (
                        <>
                          <p className="text-2xl font-bold mb-1">
                            {displayLead.financialQualification.netWorth.range}
                          </p>
                          <p className="text-xs text-muted-foreground italic">
                            {displayLead.financialQualification.netWorth.source}
                          </p>
                        </>
                      ) : displayLead.financialQualification.netWorth.source === "Verified" ? (
                        <>
                          <p className="text-2xl font-bold mb-1">
                            ${displayLead.financialQualification.netWorth.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {displayLead.financialQualification.netWorth.source}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-2xl font-bold mb-1">
                            ${displayLead.financialQualification.netWorth.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground italic">
                            {displayLead.financialQualification.netWorth.source}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {displayLead.fddFocusAreas && displayLead.fddFocusAreas.length > 0 && (
                <div>
                  <h3 className="mb-3 font-bold">FDD Focus Areas</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Items and sections the lead spent the most time reviewing
                  </p>
                  <div className="space-y-2">
                    {displayLead.fddFocusAreas.map((area, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex-1">
                          <p className="font-medium">{area.item}</p>
                          <p className="text-sm text-muted-foreground">Time spent: {area.timeSpent}</p>
                        </div>
                        <Badge
                          className={
                            area.interest === "High"
                              ? "bg-cta/10 text-cta hover:bg-cta/10"
                              : "bg-muted text-muted-foreground hover:bg-muted"
                          }
                        >
                          {area.interest} Interest
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI-POWERED SALES INTELLIGENCE */}
              {displayLead.aiInsights &&
                displayLead.aiInsights.summary &&
                displayLead.aiInsights.summary !== "No engagement data available yet." && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <Target className="h-5 w-5 text-purple-600" />
                        AI-Powered Sales Intelligence
                      </h3>
                    </div>

                    {/* FINANCIAL QUALIFICATION BADGE - Most prominent */}
                    {displayLead.aiInsights.candidateFit?.financialFit && (
                      <div className={`rounded-lg border-2 p-4 ${getFinancialFitConfig(displayLead.aiInsights.candidateFit.financialFit.status || displayLead.aiInsights.candidateFit.financialFit.preCalculated?.overallFit).bgColor} ${getFinancialFitConfig(displayLead.aiInsights.candidateFit.financialFit.status || displayLead.aiInsights.candidateFit.financialFit.preCalculated?.overallFit).borderColor}`}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className={`font-bold text-lg ${getFinancialFitConfig(displayLead.aiInsights.candidateFit.financialFit.status || displayLead.aiInsights.candidateFit.financialFit.preCalculated?.overallFit).color}`}>
                            {getFinancialFitConfig(displayLead.aiInsights.candidateFit.financialFit.status || displayLead.aiInsights.candidateFit.financialFit.preCalculated?.overallFit).label}
                          </h4>
                          {displayLead.aiInsights.candidateFit.financialFit.score !== undefined && (
                            <Badge className={`${getFinancialFitConfig(displayLead.aiInsights.candidateFit.financialFit.status || displayLead.aiInsights.candidateFit.financialFit.preCalculated?.overallFit).bgColor} ${getFinancialFitConfig(displayLead.aiInsights.candidateFit.financialFit.status || displayLead.aiInsights.candidateFit.financialFit.preCalculated?.overallFit).color} border-0`}>
                              Score: {displayLead.aiInsights.candidateFit.financialFit.score}/100
                            </Badge>
                          )}
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {(displayLead.aiInsights.candidateFit.financialFit.liquidCapitalAssessment || displayLead.aiInsights.candidateFit.financialFit.preCalculated?.liquidCapitalAssessment) && (
                            <div className="text-sm">
                              <span className="font-medium">Liquid Capital: </span>
                              <span>{displayLead.aiInsights.candidateFit.financialFit.liquidCapitalAssessment || displayLead.aiInsights.candidateFit.financialFit.preCalculated?.liquidCapitalAssessment}</span>
                            </div>
                          )}
                          {(displayLead.aiInsights.candidateFit.financialFit.netWorthAssessment || displayLead.aiInsights.candidateFit.financialFit.preCalculated?.netWorthAssessment) && (
                            <div className="text-sm">
                              <span className="font-medium">Net Worth: </span>
                              <span>{displayLead.aiInsights.candidateFit.financialFit.netWorthAssessment || displayLead.aiInsights.candidateFit.financialFit.preCalculated?.netWorthAssessment}</span>
                            </div>
                          )}
                        </div>
                        {displayLead.aiInsights.candidateFit.financialFit.fundingPlanNotes && (
                          <p className="text-sm mt-2 text-gray-700">
                            <span className="font-medium">Funding: </span>
                            {displayLead.aiInsights.candidateFit.financialFit.fundingPlanNotes}
                          </p>
                        )}
                        {displayLead.aiInsights.candidateFit.financialFit.recommendation && (
                          <p className="text-sm mt-2 font-medium">
                            → {displayLead.aiInsights.candidateFit.financialFit.recommendation}
                          </p>
                        )}
                      </div>
                    )}

                    {/* AI Summary */}
                    <div className="rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 p-5">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-white">AI</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-purple-900 mb-1">Executive Summary</h4>
                          <p className="text-sm text-purple-800 leading-relaxed">{displayLead.aiInsights.summary}</p>
                        </div>
                      </div>
                    </div>

                    {/* CANDIDATE FIT SCORE CARD */}
                    {displayLead.aiInsights.candidateFit && displayLead.aiInsights.candidateFit.overallScore !== undefined && (
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                            Candidate Fit Assessment
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold">{displayLead.aiInsights.candidateFit.overallScore}</span>
                            <span className="text-gray-500">/100</span>
                            <Badge className={`${getCandidateFitConfig(displayLead.aiInsights.candidateFit.overallRating).bgColor} ${getCandidateFitConfig(displayLead.aiInsights.candidateFit.overallRating).color} border-0`}>
                              {displayLead.aiInsights.candidateFit.overallRating}
                            </Badge>
                          </div>
                        </div>

                        {/* Criteria Scores */}
                        {displayLead.aiInsights.candidateFit.criteriaScores && displayLead.aiInsights.candidateFit.criteriaScores.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium text-gray-600 mb-2">Scoring Against Ideal Candidate Criteria:</h5>
                            {displayLead.aiInsights.candidateFit.criteriaScores.map((criteria: any, idx: number) => (
                              <div key={idx} className="flex items-start justify-between p-2 rounded bg-gray-50">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{criteria.criterion}</span>
                                    <span className="text-xs text-gray-500">({criteria.weight}%)</span>
                                  </div>
                                  {criteria.evidence && criteria.evidence.length > 0 && (
                                    <p className="text-xs text-emerald-700 mt-0.5">✓ {criteria.evidence.join(", ")}</p>
                                  )}
                                  {criteria.gaps && criteria.gaps.length > 0 && (
                                    <p className="text-xs text-amber-600 mt-0.5">Gap: {criteria.gaps.join(", ")}</p>
                                  )}
                                </div>
                                <Badge className={`${getCriteriaScoreConfig(criteria.score).bgColor} ${getCriteriaScoreConfig(criteria.score).color} border-0 text-xs`}>
                                  {getCriteriaScoreConfig(criteria.score).icon} {criteria.score}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Experience & Engagement Fit */}
                        <div className="grid gap-3 sm:grid-cols-2 mt-4">
                          {displayLead.aiInsights.candidateFit.experienceFit && (
                            <div className="p-3 rounded bg-blue-50">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-blue-900">Experience Fit</span>
                                <span className="text-sm font-bold text-blue-700">{displayLead.aiInsights.candidateFit.experienceFit.score}/100</span>
                              </div>
                              <p className="text-xs text-blue-800">{displayLead.aiInsights.candidateFit.experienceFit.assessment}</p>
                            </div>
                          )}
                          {displayLead.aiInsights.candidateFit.engagementFit && (
                            <div className="p-3 rounded bg-purple-50">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-purple-900">Engagement Fit</span>
                                <span className="text-sm font-bold text-purple-700">{displayLead.aiInsights.candidateFit.engagementFit.score}/100</span>
                              </div>
                              <p className="text-xs text-purple-800">{displayLead.aiInsights.candidateFit.engagementFit.assessment}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* SALES STRATEGY */}
                    {displayLead.aiInsights.salesStrategy && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-emerald-900 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Sales Strategy
                          </h4>
                          <Badge className="bg-emerald-100 text-emerald-800 border-0">
                            {displayLead.aiInsights.salesStrategy.recommendedApproach} Approach
                          </Badge>
                        </div>
                        {displayLead.aiInsights.salesStrategy.approachRationale && (
                          <p className="text-sm text-emerald-800 mb-3 italic">
                            {displayLead.aiInsights.salesStrategy.approachRationale}
                          </p>
                        )}

                        {/* Talking Points */}
                        {displayLead.aiInsights.salesStrategy.talkingPoints && displayLead.aiInsights.salesStrategy.talkingPoints.length > 0 && (
                          <div className="mb-3">
                            <h5 className="text-sm font-medium text-emerald-900 mb-2">💬 Talking Points:</h5>
                            <ul className="space-y-1">
                              {displayLead.aiInsights.salesStrategy.talkingPoints.map((point: string, idx: number) => (
                                <li key={idx} className="text-sm flex items-start gap-2">
                                  <span className="text-emerald-600 mt-0.5">→</span>
                                  <span className="text-emerald-900">{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Conversation Starters */}
                        {displayLead.aiInsights.salesStrategy.conversationStarters && displayLead.aiInsights.salesStrategy.conversationStarters.length > 0 && (
                          <div className="mb-3">
                            <h5 className="text-sm font-medium text-emerald-900 mb-2">🎯 Conversation Starters:</h5>
                            <ul className="space-y-1">
                              {displayLead.aiInsights.salesStrategy.conversationStarters.map((starter: string, idx: number) => (
                                <li key={idx} className="text-sm text-emerald-800 bg-white/50 rounded p-2">
                                  "{starter}"
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Questions to Ask */}
                        {displayLead.aiInsights.salesStrategy.questionsToAsk && displayLead.aiInsights.salesStrategy.questionsToAsk.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-emerald-900 mb-2">❓ Questions to Ask:</h5>
                            <ul className="space-y-1">
                              {displayLead.aiInsights.salesStrategy.questionsToAsk.map((question: string, idx: number) => (
                                <li key={idx} className="text-sm flex items-start gap-2">
                                  <span className="text-emerald-600 mt-0.5">{idx + 1}.</span>
                                  <span className="text-emerald-900">{question}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ANTICIPATED OBJECTIONS */}
                    {displayLead.aiInsights.salesStrategy?.anticipatedObjections && displayLead.aiInsights.salesStrategy.anticipatedObjections.length > 0 && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-amber-900">
                          <AlertTriangle className="h-4 w-4" />
                          Anticipated Objections & Responses
                        </h4>
                        <div className="space-y-3">
                          {displayLead.aiInsights.salesStrategy.anticipatedObjections.map((item: any, idx: number) => (
                            <div key={idx} className="bg-white/60 rounded p-3">
                              <p className="text-sm font-medium text-amber-900 mb-1">
                                🤔 "{item.objection}"
                              </p>
                              <p className="text-sm text-amber-800 pl-4 border-l-2 border-amber-300">
                                ↳ {item.response}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* NEXT ACTIONS */}
                    {displayLead.aiInsights.nextActions && (
                      <div className="rounded-lg border p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          ⚡ Next Actions
                        </h4>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {displayLead.aiInsights.nextActions.immediate && displayLead.aiInsights.nextActions.immediate.length > 0 && (
                            <div className="p-3 rounded bg-red-50">
                              <h5 className="text-sm font-medium text-red-900 mb-2">🔥 Immediate (Today)</h5>
                              <ul className="space-y-1">
                                {displayLead.aiInsights.nextActions.immediate.map((action: string, idx: number) => (
                                  <li key={idx} className="text-sm text-red-800 flex items-start gap-1">
                                    <span>•</span> {action}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {displayLead.aiInsights.nextActions.thisWeek && displayLead.aiInsights.nextActions.thisWeek.length > 0 && (
                            <div className="p-3 rounded bg-blue-50">
                              <h5 className="text-sm font-medium text-blue-900 mb-2">📅 This Week</h5>
                              <ul className="space-y-1">
                                {displayLead.aiInsights.nextActions.thisWeek.map((action: string, idx: number) => (
                                  <li key={idx} className="text-sm text-blue-800 flex items-start gap-1">
                                    <span>•</span> {action}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        {displayLead.aiInsights.nextActions.greenLights && displayLead.aiInsights.nextActions.greenLights.length > 0 && (
                          <div className="mt-3 p-2 bg-emerald-50 rounded">
                            <span className="text-xs font-medium text-emerald-800">✅ Green Lights: </span>
                            <span className="text-xs text-emerald-700">{displayLead.aiInsights.nextActions.greenLights.join(" | ")}</span>
                          </div>
                        )}
                        {displayLead.aiInsights.nextActions.redFlags && displayLead.aiInsights.nextActions.redFlags.length > 0 && (
                          <div className="mt-2 p-2 bg-red-50 rounded">
                            <span className="text-xs font-medium text-red-800">🚩 Watch For: </span>
                            <span className="text-xs text-red-700">{displayLead.aiInsights.nextActions.redFlags.join(" | ")}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* KEY FINDINGS (Legacy fallback) */}
                    {displayLead.aiInsights.keyFindings && displayLead.aiInsights.keyFindings.length > 0 && !displayLead.aiInsights.candidateFit && (
                      <div className="rounded-lg border p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <span className="text-blue-600">🔍</span> Key Findings
                        </h4>
                        <ul className="space-y-2">
                          {displayLead.aiInsights.keyFindings.map((finding: string, idx: number) => (
                            <li key={idx} className="text-sm flex items-start gap-2 bg-blue-50 rounded p-2">
                              <span className="text-blue-600 mt-0.5 font-bold">•</span>
                              <span className="text-blue-900">{finding}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* RECOMMENDATIONS (Legacy fallback) */}
                    {displayLead.aiInsights.recommendations && displayLead.aiInsights.recommendations.length > 0 && !displayLead.aiInsights.salesStrategy && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-emerald-900">
                          <span className="text-emerald-600">💡</span> Recommended Sales Approach
                        </h4>
                        <ul className="space-y-2">
                          {displayLead.aiInsights.recommendations.map((rec: string, idx: number) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <span className="text-emerald-600 mt-0.5">→</span>
                              <span className="text-emerald-900">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* NEXT STEPS (Legacy fallback) */}
                    {displayLead.aiInsights.nextSteps && displayLead.aiInsights.nextSteps.length > 0 && !displayLead.aiInsights.nextActions && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-amber-900">
                          <span className="text-amber-600">⚡</span> Recommended Next Steps
                        </h4>
                        <ol className="space-y-2">
                          {displayLead.aiInsights.nextSteps.map((step: string, idx: number) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <span className="text-amber-600 mt-0.5 min-w-[20px]">{idx + 1}.</span>
                              <span className="text-amber-900">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )}

              {displayLead.questionsAsked && displayLead.questionsAsked.length > 0 && (
                <div>
                  <h3 className="mb-3 font-bold">Questions Asked ({displayLead.questionsAsked.length})</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Topics and concerns the lead has expressed through their FDD review
                  </p>
                  <div className="space-y-2">
                    {displayLead.questionsAsked.map((question, idx) => (
                      <div key={idx} className="flex items-start gap-3 rounded-lg border p-3 bg-accent/5">
                        <div className="h-6 w-6 rounded-full bg-cta/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-cta">Q</span>
                        </div>
                        <p className="text-sm flex-1">{question}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {displayLead.salesRecommendations && (
                <div>
                  <h3 className="mb-3 font-bold">Sales Approach Recommendations</h3>
                  <div className="space-y-4">
                    <div className="rounded-lg bg-cta/5 border border-cta/20 p-4">
                      <h4 className="font-semibold text-cta mb-2">Recommended Approach</h4>
                      <p className="text-sm">{displayLead.salesRecommendations.approach}</p>
                    </div>

                    <div className="rounded-lg border p-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <span className="text-emerald-600">✓</span> Key Talking Points
                      </h4>
                      <ul className="space-y-2">
                        {displayLead.salesRecommendations.talkingPoints.map((point, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-emerald-600 mt-0.5">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-lg border p-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <span className="text-amber-600">⚠</span> Potential Concerns
                      </h4>
                      <ul className="space-y-2">
                        {displayLead.salesRecommendations.concerns.map((concern, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{concern}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-lg border p-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <span className="text-cta">→</span> Next Steps
                      </h4>
                      <ul className="space-y-2">
                        {displayLead.salesRecommendations.nextSteps.map((step, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-cta mt-0.5">{idx + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div
                className={`rounded-lg p-4 ${displayLead.verificationStatus === "verified" ? "bg-blue-50" : "bg-amber-50"}`}
              >
                <h3
                  className={`mb-2 font-bold ${displayLead.verificationStatus === "verified" ? "text-blue-900" : "text-amber-900"}`}
                >
                  AI Recommendation
                </h3>
                <p
                  className={`text-sm ${displayLead.verificationStatus === "verified" ? "text-blue-800" : "text-amber-800"}`}
                >
                  {displayLead.verificationStatus === "verified" ? (
                    <>
                      High-quality lead with strong financial backing and verified credentials. Recommend immediate
                      follow-up with territory availability information and next steps for franchise agreement.
                    </>
                  ) : (
                    <>
                      Engaged lead showing strong interest (viewed FDD for {displayLead.totalTimeSpent}). Recommend
                      reaching out to encourage completion of financial verification. Once verified, this lead has high
                      conversion potential based on engagement patterns.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
