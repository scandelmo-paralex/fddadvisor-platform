"use client"

import { CheckCircle2, XCircle, AlertCircle, ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { BuyerProfile } from "@/lib/data"
import { checkVerificationStatus, getVerificationStatusBadge } from "@/lib/verification-utils"

interface VerificationStatusCardProps {
  profile: BuyerProfile
  onNavigateToProfile: () => void
}

export function VerificationStatusCard({ profile, onNavigateToProfile }: VerificationStatusCardProps) {
  const creditStatus = checkVerificationStatus(
    profile.financialQualification.creditVerifiedAt,
    profile.financialQualification.creditExpiresAt,
  )

  const liquidCapitalStatus = checkVerificationStatus(
    profile.financialQualification.liquidCapitalVerifiedAt,
    profile.financialQualification.liquidCapitalExpiresAt,
  )

  const backgroundStatus = profile.financialQualification.backgroundSelfReported ? "complete" : "incomplete"

  const allComplete =
    creditStatus.status === "complete" && liquidCapitalStatus.status === "complete" && backgroundStatus === "complete"

  const hasExpired = creditStatus.isExpired || liquidCapitalStatus.isExpired

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      case "expired":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "incomplete":
        return <AlertCircle className="h-4 w-4 text-amber-600" />
    }
  }

  return (
    <Card
      className={`p-4 ${allComplete && !hasExpired ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-sm font-semibold mb-1">Verification Status</h4>
            <p className="text-xs text-muted-foreground">
              {allComplete && !hasExpired
                ? "Your profile is fully verified"
                : hasExpired
                  ? "Some verifications have expired"
                  : "Complete your verification to connect"}
            </p>
          </div>
          {(!allComplete || hasExpired) && (
            <Button variant="outline" size="sm" onClick={onNavigateToProfile} className="text-xs bg-transparent">
              Update Profile
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {/* Credit Score */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {getStatusIcon(creditStatus.status)}
              <span className="text-sm">Credit Score</span>
            </div>
            <div className="flex items-center gap-2">
              {profile.financialQualification.creditScore && creditStatus.status === "complete" ? (
                <>
                  <span className="font-medium">{profile.financialQualification.creditScore}</span>
                  <Badge variant="outline" className={`text-xs ${getVerificationStatusBadge(creditStatus.status)}`}>
                    {creditStatus.isExpired
                      ? "Expired"
                      : creditStatus.daysUntilExpiration && creditStatus.daysUntilExpiration < 30
                        ? `${creditStatus.daysUntilExpiration}d left`
                        : "Verified"}
                  </Badge>
                </>
              ) : (
                <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                  Not Verified
                </Badge>
              )}
            </div>
          </div>

          {/* Liquid Capital */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {getStatusIcon(liquidCapitalStatus.status)}
              <span className="text-sm">Liquid Capital</span>
            </div>
            <div className="flex items-center gap-2">
              {profile.financialQualification.liquidCapital && liquidCapitalStatus.status === "complete" ? (
                <>
                  <span className="font-medium">
                    ${(profile.financialQualification.liquidCapital / 1000).toFixed(0)}K
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getVerificationStatusBadge(liquidCapitalStatus.status)}`}
                  >
                    {liquidCapitalStatus.isExpired
                      ? "Expired"
                      : liquidCapitalStatus.daysUntilExpiration && liquidCapitalStatus.daysUntilExpiration < 30
                        ? `${liquidCapitalStatus.daysUntilExpiration}d left`
                        : "Verified"}
                  </Badge>
                </>
              ) : (
                <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                  Not Verified
                </Badge>
              )}
            </div>
          </div>

          {/* Total Investment Capacity */}
          {profile.financialQualification.totalInvestmentCapacity && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {getStatusIcon("complete")}
                <span className="text-sm">Total Available</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  ${(profile.financialQualification.totalInvestmentCapacity.total / 1000).toFixed(0)}K
                </span>
                <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                  Self-Reported
                </Badge>
              </div>
            </div>
          )}

          {/* Background Check */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {getStatusIcon(backgroundStatus)}
              <span className="text-sm">Background</span>
            </div>
            <div className="flex items-center gap-2">
              {profile.financialQualification.backgroundSelfReported ? (
                <Badge variant="outline" className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">
                  Self-Reported
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                  Not Completed
                </Badge>
              )}
            </div>
          </div>
        </div>

        {(!allComplete || hasExpired) && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              {hasExpired
                ? "Please update your expired verifications to proceed with this connection."
                : "Complete your verification to show franchisors you're a serious buyer."}
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
