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

// Custom CSS to make the signature area more compact and form scrollable
const customCss = `
  /* Make the scrollable document area take more space */
  .scrollbox {
    max-height: 40vh !important;
  }
  
  /* Reduce the page container margins */
  .page-container {
    margin-bottom: 4px !important;
  }
  
  /* Make signature drawing canvas smaller */
  .draw-canvas {
    max-height: 80px !important;
    height: 80px !important;
  }
  
  /* Compact the steps form area */
  .steps-form {
    padding: 8px !important;
  }
  
  /* Make the form container more compact */
  .form-container {
    padding: 8px !important;
  }
  
  /* Compact the signature type buttons */
  .type-text-button, .upload-image-button, .clear-canvas-button {
    padding: 4px 8px !important;
    font-size: 12px !important;
  }
  
  /* Make submit button more compact */
  .submit-form-button {
    margin-top: 8px !important;
    padding: 8px 16px !important;
  }
  
  /* Reduce field area padding */
  .field-area {
    padding: 2px !important;
  }
`

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
      {/* Responsive: full screen on mobile, sized on desktop */}
      <DialogContent className="w-full h-full max-w-none max-h-none md:max-w-6xl md:w-[95vw] md:h-[95vh] md:max-h-[95vh] bg-white flex flex-col rounded-none md:rounded-lg">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-base md:text-lg">Item 23 Receipt - {franchiseName}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-auto">
          <DocusealForm 
            src={templateUrl} 
            email={buyerEmail} 
            onComplete={handleComplete}
            customCss={customCss}
            className="w-full h-full" 
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
