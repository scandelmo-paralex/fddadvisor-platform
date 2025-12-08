"use client"

import { useState } from "react"
import { X, Check, Clock, Shield, Zap, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import type { Franchise } from "@/lib/data"
import { lenders } from "@/lib/data"

interface PreApprovalModalProps {
  franchise: Franchise
  onClose: () => void
}

export function PreApprovalModal({ franchise, onClose }: PreApprovalModalProps) {
  const [selectedLenders, setSelectedLenders] = useState<string[]>([])
  const [isSubmitted, setIsSubmitted] = useState(false)

  const toggleLender = (lenderId: string) => {
    if (selectedLenders.includes(lenderId)) {
      setSelectedLenders(selectedLenders.filter((id) => id !== lenderId))
    } else if (selectedLenders.length < 3) {
      setSelectedLenders([...selectedLenders, lenderId])
    }
  }

  const handleSubmit = () => {
    console.log("[v0] Pre-approval request submitted for:", franchise.name)
    console.log("[v0] Selected lenders:", selectedLenders)
    setIsSubmitted(true)
    setTimeout(() => {
      onClose()
    }, 2000)
  }

  const getLikelihoodColor = (likelihood: string) => {
    switch (likelihood) {
      case "High":
        return "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
      case "Medium":
        return "text-amber-600 bg-amber-500/10 border-amber-500/20"
      case "Low":
        return "text-red-600 bg-red-500/10 border-red-500/20"
      default:
        return "text-muted-foreground bg-muted border-border"
    }
  }

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <Check className="h-8 w-8 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Request Submitted!</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Your pre-approval requests have been sent to {selectedLenders.length} lender
              {selectedLenders.length > 1 ? "s" : ""}. You'll receive responses within 2-5 business days.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-border/50 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold">Get Pre-Approved</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Select up to 3 lenders to receive pre-approval quotes for{" "}
              <span className="font-medium text-foreground">{franchise.name}</span>
            </p>
            <div className="flex items-center gap-4 mt-3">
              <div className="text-sm">
                <span className="text-muted-foreground">Investment Range:</span>
                <span className="font-semibold ml-2">
                  ${(franchise.investmentMin / 1000).toFixed(0)}K - ${(franchise.investmentMax / 1000).toFixed(0)}K
                </span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="text-sm">
                <span className="text-muted-foreground">Selected:</span>
                <span className="font-semibold ml-2">{selectedLenders.length} of 3</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {lenders.map((lender, index) => {
              const isSelected = selectedLenders.includes(lender.id)
              const canSelect = selectedLenders.length < 3 || isSelected

              return (
                <Card
                  key={lender.id}
                  className={`p-5 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-cta bg-cta/5 shadow-md"
                      : canSelect
                        ? "border-border/50 hover:border-cta/30 hover:shadow-sm"
                        : "border-border/30 opacity-50 cursor-not-allowed"
                  }`}
                  onClick={() => canSelect && toggleLender(lender.id)}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        isSelected ? "border-cta bg-cta" : "border-border"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-cta-foreground" />}
                    </div>

                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{lender.name}</h3>
                          {lender.isPreferred && (
                            <Badge className="bg-cta text-cta-foreground border-cta">
                              <Star className="h-3 w-3 mr-1 fill-current" />
                              Preferred Partner
                            </Badge>
                          )}
                          {index === 0 && !lender.isPreferred && (
                            <Badge variant="secondary" className="bg-muted text-muted-foreground">
                              Popular Choice
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className={getLikelihoodColor(lender.approvalLikelihood)}>
                          {lender.approvalLikelihood} Approval Likelihood
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Interest Rate</p>
                          <p className="text-sm font-semibold">{lender.estimatedRate}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Loan Terms</p>
                          <p className="text-sm font-semibold">{lender.loanTerms}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Processing Time</p>
                          <p className="text-sm font-semibold flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {lender.processingTime}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border/50">
                        <p className="text-xs text-muted-foreground mb-2">Special Features:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {lender.specialFeatures.map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <div className="flex-shrink-0 w-1 h-1 rounded-full bg-cta mt-1.5" />
                              <p className="text-xs text-muted-foreground leading-relaxed">{feature}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        <div className="p-6 border-t border-border/50 bg-muted/30">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Shield className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground leading-relaxed">
                <p className="font-medium text-foreground mb-1">Your information is secure</p>
                <p className="text-xs">
                  Pre-approval requests are soft credit inquiries and won't impact your credit score. Lenders will
                  contact you directly with personalized offers.
                </p>
              </div>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={selectedLenders.length === 0}
                className="bg-cta hover:bg-cta-hover text-cta-foreground min-w-[140px]"
              >
                {selectedLenders.length === 0 ? (
                  "Select Lenders"
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Request Quotes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
