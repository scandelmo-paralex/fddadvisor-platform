"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface FranchiseScoreDisclaimerModalProps {
  open: boolean
  onClose: () => void
  franchiseName?: string
}

export function FranchiseScoreDisclaimerModal({
  open,
  onClose,
  franchiseName,
}: FranchiseScoreDisclaimerModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
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
          <p className="text-sm leading-relaxed text-foreground/90">
            You have agreed that you have been advised to consult with a franchise attorney, accountant, or financial
            advisor before making any investment decision.
          </p>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
