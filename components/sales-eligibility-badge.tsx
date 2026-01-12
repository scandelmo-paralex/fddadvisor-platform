"use client"

import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Lock, Clock } from "lucide-react"
import { calculateSalesEligibility, type SalesEligibilityStatus } from "@/lib/compliance-utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SalesEligibilityBadgeProps {
  receiptSignedAt: string | null | undefined
  variant?: "badge" | "inline" | "compact"
  showTooltip?: boolean
}

export function SalesEligibilityBadge({ 
  receiptSignedAt, 
  variant = "badge",
  showTooltip = true 
}: SalesEligibilityBadgeProps) {
  const status = calculateSalesEligibility(receiptSignedAt)
  
  // If receipt not signed yet, show nothing or minimal indicator
  if (status.daysRemaining === -1) {
    if (variant === "compact") {
      return <span className="text-xs text-muted-foreground/50">—</span>
    }
    return null
  }
  
  const content = status.isEligible ? (
    <Badge
      variant="secondary"
      className={`gap-1 ${
        variant === "compact" 
          ? "px-1.5 py-0 h-5 text-[10px]" 
          : "px-2 py-0.5 text-xs"
      } bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20`}
    >
      <CheckCircle2 className={variant === "compact" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      Eligible
    </Badge>
  ) : (
    <Badge
      variant="secondary"
      className={`gap-1 ${
        variant === "compact" 
          ? "px-1.5 py-0 h-5 text-[10px]" 
          : "px-2 py-0.5 text-xs"
      } bg-amber-500/10 text-amber-700 border-amber-200 hover:bg-amber-500/20`}
    >
      <Lock className={variant === "compact" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {status.daysRemaining}d
    </Badge>
  )
  
  if (!showTooltip) {
    return content
  }
  
  const tooltipText = status.isEligible
    ? `Sales eligible since ${status.eligibleDate?.toLocaleDateString()}`
    : `${status.daysRemaining} day${status.daysRemaining !== 1 ? 's' : ''} until sales eligible (${status.eligibleDate?.toLocaleDateString()})`
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p>{tooltipText}</p>
          {status.receiptSignedDate && (
            <p className="text-muted-foreground">
              Receipt signed: {status.receiptSignedDate.toLocaleDateString()}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Inline version for pipeline cards - shows text instead of badge
 */
export function SalesEligibilityInline({ 
  receiptSignedAt 
}: { 
  receiptSignedAt: string | null | undefined 
}) {
  const status = calculateSalesEligibility(receiptSignedAt)
  
  // If receipt not signed yet, don't show anything
  if (status.daysRemaining === -1) {
    return null
  }
  
  if (status.isEligible) {
    return (
      <div className="flex items-center gap-1 text-xs text-emerald-600">
        <CheckCircle2 className="h-3 w-3" />
        <span>Sales eligible</span>
      </div>
    )
  }
  
  return (
    <div className="flex items-center gap-1 text-xs text-amber-600">
      <Lock className="h-3 w-3" />
      <span>Eligible in {status.daysRemaining}d</span>
    </div>
  )
}
