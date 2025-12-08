"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, FileText, AlertCircle } from 'lucide-react'
import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ReceiptViewerModalProps {
  isOpen: boolean
  onClose: () => void
  leadName: string
  signedDate: string
  franchisorCopyUrl: string
  completeCopyUrl: string
  viewerType: "franchisor" | "buyer"
}

export function ReceiptViewerModal({
  isOpen,
  onClose,
  leadName,
  signedDate,
  franchisorCopyUrl,
  completeCopyUrl,
  viewerType,
}: ReceiptViewerModalProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const pdfUrl = viewerType === "franchisor" ? franchisorCopyUrl : completeCopyUrl

  const isPlaceholderData = pdfUrl?.includes("/sample-receipts/") || 
                           pdfUrl?.includes("/placeholder") || 
                           !pdfUrl || 
                           pdfUrl === "/placeholder-receipt.pdf"

  const handleDownload = async (url: string, filename: string) => {
    if (!url || url.includes("/sample-receipts/")) {
      alert("This is demo data. In production, the signed receipt PDF would be downloaded here.")
      return
    }

    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error("Download failed:", error)
      alert("Download failed. Please try again.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col bg-white">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-primary" />
            Item 23 Receipt - {viewerType === "franchisor" ? "Franchisor's Copy" : "Your Copy"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden py-4">
          {/* Receipt Info */}
          <div className="bg-muted/30 rounded-lg p-4 border">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Signed by</p>
                <p className="font-semibold text-lg">{leadName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Date Received</p>
                <p className="font-semibold text-lg">
                  {new Date(signedDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          {isPlaceholderData && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Demo Mode:</strong> This is sample data. In production, the signed Item 23 receipt PDF would be
                displayed here with the buyer's signature, date, and contact information.
              </AlertDescription>
            </Alert>
          )}

          {/* PDF Viewer or Placeholder */}
          <div className="flex-1 relative bg-gray-100 rounded-lg overflow-auto border min-h-[500px]">
            {isPlaceholderData ? (
              <div className="w-full h-full flex items-center justify-center bg-white p-8">
                <iframe
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Drybar-FDD-%282025%29%28Receipts%29_1-bmaCRApH0hkez9U8JzVFm1LIlwO3WT.png"
                  className="w-full h-full border-0"
                  title="Item 23 Receipt - Drybar FDD 2025"
                  style={{ minHeight: '800px' }}
                />
              </div>
            ) : (
              <>
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                      <p className="text-sm text-muted-foreground">Loading receipt...</p>
                    </div>
                  </div>
                )}
                {hasError && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Alert className="max-w-md">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>Unable to load receipt PDF. Please try downloading instead.</AlertDescription>
                    </Alert>
                  </div>
                )}
                <iframe
                  src={pdfUrl}
                  className="w-full h-full"
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    setIsLoading(false)
                    setHasError(true)
                  }}
                  title="Item 23 Receipt"
                />
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2 border-t">
            <Button
              variant="outline"
              onClick={() => handleDownload(pdfUrl, `item23-${viewerType}-copy-${leadName.replace(/\s+/g, "-")}.pdf`)}
            >
              <Download className="h-4 w-4 mr-2" />
              Download {viewerType === "franchisor" ? "Franchisor's" : "Your"} Copy
            </Button>
            {viewerType === "franchisor" && (
              <Button
                onClick={() => handleDownload(completeCopyUrl, `item23-complete-${leadName.replace(/\s+/g, "-")}.pdf`)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Complete Document
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
