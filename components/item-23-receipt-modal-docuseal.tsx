"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DocusealForm } from "@docuseal/react"

interface Item23ReceiptModalDocuSealProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  franchiseName: string
  franchiseId: string
  buyerId: string
  buyerEmail: string
  templateUrl: string
}

export function Item23ReceiptModalDocuSeal({
  isOpen,
  onClose,
  onComplete,
  franchiseName,
  franchiseId,
  buyerId,
  buyerEmail,
  templateUrl,
}: Item23ReceiptModalDocuSealProps) {
  const handleComplete = async (data: any) => {
    console.log("[v0] DocuSeal signature completed:", data)

    try {
      const response = await fetch("/api/docuseal/complete-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          franchiseId,
          buyerId,
          submissionId: data.submission_id,
        }),
      })

      if (!response.ok) {
        console.error("[v0] Failed to save receipt completion")
      }
    } catch (err) {
      console.error("[v0] Error saving receipt completion:", err)
    }

    onComplete()
    onClose()
  }

  if (!templateUrl) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Configuration Required</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              The Item 23 receipt template has not been configured for {franchiseName}. Please contact support.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] bg-white">
        <DialogHeader>
          <DialogTitle>Item 23 Receipt - {franchiseName}</DialogTitle>
        </DialogHeader>

        <div className="h-[calc(90vh-8rem)]">
          <DocusealForm src={templateUrl} email={buyerEmail} onComplete={handleComplete} className="w-full h-full" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
