"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Clock, MessageSquare, FileText, CheckCircle2, Circle, TrendingUp, DollarSign, FileCheck } from "lucide-react"
import type { Franchise, FDDEngagement, FranchisePreApproval } from "@/lib/data"

interface FranchiseProgressCardProps {
  franchise: Franchise
  engagement: FDDEngagement
  preApproval?: FranchisePreApproval
  onNavigate: (view: string, franchiseId?: string) => void
  onOpenLenderModal: (franchiseId: string) => void
}

export function FranchiseProgressCard({
  franchise,
  engagement,
  preApproval,
  onNavigate,
  onOpenLenderModal,
}: FranchiseProgressCardProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return "text-green-600"
    if (percentage >= 50) return "text-amber-600"
    return "text-muted-foreground"
  }

  const getProgressBgColor = (percentage: number) => {
    if (percentage >= 75) return "bg-green-600"
    if (percentage >= 50) return "bg-amber-600"
    return "bg-muted-foreground"
  }

  const canConnect = () => {
    // Must have asked at least 3 questions
    const hasAskedQuestions = engagement.questionsAsked.length >= 3
    // Must have viewed Item 19 (financial performance)
    const hasViewedItem19 = engagement.sectionsViewed.includes("Item 19")
    // Must have spent at least 10 minutes
    const hasSpentTime = engagement.timeSpent >= 600 // 10 minutes in seconds

    return hasAskedQuestions && hasViewedItem19 && hasSpentTime
  }

  const getConnectTooltip = () => {
    const missing: string[] = []

    if (engagement.questionsAsked.length < 3) {
      const needed = 3 - engagement.questionsAsked.length
      missing.push(`Ask ${needed} more question${needed > 1 ? "s" : ""} (${engagement.questionsAsked.length}/3)`)
    }

    if (!engagement.sectionsViewed.includes("Item 19")) {
      missing.push("Review Earnings Data (Financial Performance)")
    }

    if (engagement.timeSpent < 600) {
      const minutesNeeded = Math.ceil((600 - engagement.timeSpent) / 60)
      missing.push(`Spend ${minutesNeeded} more minute${minutesNeeded > 1 ? "s" : ""} researching`)
    }

    if (missing.length === 0) return null

    return (
      <div className="space-y-1">
        <p className="font-medium">Complete these to connect:</p>
        <ul className="list-disc list-inside space-y-0.5">
          {missing.map((item, i) => (
            <li key={i} className="text-xs">
              {item}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const getPreApprovalButton = () => {
    if (!preApproval || preApproval.status === "Not Started") {
      return (
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-9 bg-approval/10 text-approval border-approval/30 hover:bg-approval hover:text-approval-foreground"
          onClick={() => onOpenLenderModal(franchise.id)}
        >
          <DollarSign className="mr-1.5 h-3.5 w-3.5" />
          Get Pre-Approved
        </Button>
      )
    }

    if (preApproval.status === "Pending") {
      const pendingCount = preApproval.lenders.filter((l) => l.status === "Pending").length
      return (
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-9 bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
          onClick={() => onOpenLenderModal(franchise.id)}
        >
          Pre-Approval Pending ({pendingCount})
        </Button>
      )
    }

    if (preApproval.status === "Approved") {
      const approvedCount = preApproval.lenders.filter((l) => l.status === "Approved").length
      return (
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-9 bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
          onClick={() => onOpenLenderModal(franchise.id)}
        >
          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
          Pre-Approved ({approvedCount})
        </Button>
      )
    }

    return null
  }

  return (
    <Card
      className="p-6 border-border/50 hover:shadow-lg hover:border-cta/30 transition-all duration-200 group cursor-pointer"
      onClick={() => onNavigate("fdd-viewer", franchise.id)}
    >
      <TooltipProvider>
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate group-hover:text-cta transition-colors">
                {franchise.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{franchise.industry}</p>
            </div>
            {franchise.hasItem19 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="secondary"
                    className="bg-cta/10 text-cta border-cta/20 text-xs flex-shrink-0 cursor-help"
                  >
                    Earnings
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="text-sm">This franchise provides actual earnings data from franchisees</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Research Progress</span>
              <span className={`text-sm font-semibold ${getProgressColor(engagement.completionPercentage)}`}>
                {engagement.completionPercentage}%
              </span>
            </div>
            <Progress
              value={engagement.completionPercentage}
              className="h-2"
              indicatorClassName={getProgressBgColor(engagement.completionPercentage)}
            />
          </div>

          {/* Milestones */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-xs">
              {engagement.milestones.viewedFDD ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/30" />
              )}
              <span className={engagement.milestones.viewedFDD ? "text-foreground" : "text-muted-foreground"}>
                Viewed FDD
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {engagement.sectionsViewed.includes("Item 19") ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/30" />
              )}
              <span
                className={engagement.sectionsViewed.includes("Item 19") ? "text-foreground" : "text-muted-foreground"}
              >
                Viewed Item 19
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {engagement.milestones.viewedItem7 ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/30" />
              )}
              <span className={engagement.milestones.viewedItem7 ? "text-foreground" : "text-muted-foreground"}>
                Viewed Item 7
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {engagement.milestones.askedQuestions ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/30" />
              )}
              <span className={engagement.milestones.askedQuestions ? "text-foreground" : "text-muted-foreground"}>
                Asked Questions
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {engagement.milestones.createdNotes ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/30" />
              )}
              <span className={engagement.milestones.createdNotes ? "text-foreground" : "text-muted-foreground"}>
                Created Notes
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {engagement.milestones.spentSignificantTime ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/30" />
              )}
              <span
                className={engagement.milestones.spentSignificantTime ? "text-foreground" : "text-muted-foreground"}
              >
                15+ Minutes
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="text-sm font-semibold">{formatTime(engagement.timeSpent)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Questions</p>
                <p className="text-sm font-semibold">{engagement.questionsAsked.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="text-sm font-semibold mt-1">{engagement.notesCreated}</p>
              </div>
            </div>
          </div>

          {/* Investment Info */}
          <div className="pt-3 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Investment Range</p>
                <p className="text-sm font-semibold mt-1">
                  ${(franchise.investmentMin / 1000).toFixed(0)}K - ${(franchise.investmentMax / 1000).toFixed(0)}K
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">ROI Timeline</p>
                <p className="text-sm font-semibold mt-1">{franchise.roiTimeframe}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
            {engagement.item23SignedAt && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-9 w-full border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                onClick={() => {
                  // Open receipt viewer modal with buyer's copy
                  window.open(engagement.item23BuyerCopyUrl, "_blank")
                }}
              >
                <FileCheck className="mr-1.5 h-3.5 w-3.5" />
                View My Receipt
              </Button>
            )}

            {!canConnect() ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-cta hover:bg-cta-hover text-cta-foreground transition-all duration-200 text-xs h-9 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled
                  >
                    <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                    Connect
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  {getConnectTooltip()}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                size="sm"
                className="bg-cta hover:bg-cta-hover text-cta-foreground transition-all duration-200 text-xs h-9 w-full"
                onClick={() => onNavigate("fdd-viewer", franchise.id)}
              >
                <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                Connect
              </Button>
            )}
            <div className="w-full">{getPreApprovalButton()}</div>
          </div>
        </div>
      </TooltipProvider>
    </Card>
  )
}
