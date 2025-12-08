"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { AlertTriangle } from "lucide-react"

interface FranchiseScoreConsentModalProps {
  open: boolean
  onAccept: () => void
  onDecline: () => void
  isLoading?: boolean
  fddId: string
  franchiseName?: string
}

export function FranchiseScoreConsentModal({
  open,
  onAccept,
  onDecline,
  isLoading = false,
  fddId,
  franchiseName,
}: FranchiseScoreConsentModalProps) {
  const [agreed, setAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAccept = async () => {
    if (!agreed || !fddId) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/buyer/consent/franchisescore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fddId, consented: true }),
      })

      const data = await response.json()

      if (response.ok && (data.success || data.sessionOnly)) {
        // Store in sessionStorage for non-authenticated users
        if (data.sessionOnly) {
          try {
            const key = `franchisescore_consent_${fddId}`
            sessionStorage.setItem(
              key,
              JSON.stringify({
                consented: true,
                consentedAt: data.consentedAt,
              }),
            )
          } catch (e) {
            // sessionStorage might not be available
          }
        }
        onAccept()
      } else {
        console.error("Failed to save consent:", data.error)
      }
    } catch (error) {
      console.error("Error saving consent:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDecline()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <DialogTitle className="text-xl">FranchiseScore™ Disclaimer</DialogTitle>
          </div>
          {franchiseName && <p className="text-sm text-muted-foreground">For: {franchiseName}</p>}
          <DialogDescription className="text-base text-foreground/80 pt-2 leading-relaxed">
            FranchiseScore™ is independent third-party analysis provided to assist in your evaluation of the FDD. It is
            not prepared, influenced, or endorsed by any franchisor and is not a prediction of your financial results.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="consent"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer text-foreground/90">
              I understand and agree. I have been advised to consult with a franchise attorney, accountant, or financial
              advisor before making any investment decision.
            </Label>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onDecline} disabled={isLoading || isSubmitting}>
            Go Back
          </Button>
          <Button onClick={handleAccept} disabled={!agreed || isLoading || isSubmitting} className="bg-primary">
            {isLoading || isSubmitting ? "Processing..." : "View FranchiseScore"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
