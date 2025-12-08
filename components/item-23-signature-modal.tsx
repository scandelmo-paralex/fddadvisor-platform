"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react"

interface Item23SignatureModalProps {
  isOpen: boolean
  franchiseName: string
  franchiseSlug: string
  onSign: (signatureDataUrl: string) => Promise<void>
  onClose: () => void
}

export function Item23SignatureModal({
  isOpen,
  franchiseName,
  franchiseSlug,
  onSign,
  onClose,
}: Item23SignatureModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasAgreed, setHasAgreed] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [signatureTimestamp, setSignatureTimestamp] = useState<string | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Set drawing style
    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    setIsDrawing(true)
    setHasSignature(true)

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)

    if (!signatureTimestamp) {
      setSignatureTimestamp(new Date().toISOString())
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    setSignatureTimestamp(null)
  }

  const handleSign = async () => {
    if (!hasAgreed) {
      setError("Please confirm you have read and understood the disclosure")
      return
    }

    if (!hasSignature) {
      setError("Please provide your signature")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const canvas = canvasRef.current
      if (!canvas) throw new Error("Canvas not found")

      // Get signature as base64
      const signatureData = canvas.toDataURL("image/png")
      await onSign(signatureData)
    } catch (err) {
      setError("Failed to sign receipt. Please try again.")
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <FileText className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">FDD Receipt Required</h2>
                <p className="text-sm text-muted-foreground">Item 23 - Receipt Acknowledgment</p>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <Card className="border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="font-semibold text-amber-900">14-Day Disclosure Rule</p>
                <p className="text-sm text-amber-800">
                  Federal law requires that you receive the Franchise Disclosure Document (FDD) at least 14 calendar
                  days before signing any franchise agreement or paying any money to the franchisor. By signing this
                  receipt, you acknowledge receipt of the FDD from {franchiseName}.
                </p>
              </div>
            </div>
          </Card>

          {/* Receipt Document Preview */}
          <div className="border-2 border-border rounded-lg p-6 bg-muted/30">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Item 23 Receipt</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://example.com/${franchiseSlug}`, "_blank")}
                >
                  View Full Document
                </Button>
              </div>

              <div className="space-y-3 text-sm">
                <p className="font-medium">I acknowledge that:</p>
                <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                  <li>I have received the Franchise Disclosure Document from {franchiseName}</li>
                  <li>I understand I must wait at least 14 calendar days before signing any agreement</li>
                  <li>I have been given the opportunity to review this document with legal and financial advisors</li>
                  <li>The date and time of this receipt will be recorded for compliance purposes</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Signature Pad */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-sm">Your Signature</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSignature}
                disabled={!hasSignature}
                className="text-muted-foreground"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
            <div className="border-2 border-border rounded-lg bg-white p-4">
              <canvas
                ref={canvasRef}
                className="w-full h-40 touch-none cursor-crosshair bg-white"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              <p className="text-xs text-muted-foreground text-center mt-2">
                Sign above using your mouse or touchscreen
              </p>
            </div>
            {signatureTimestamp && (
              <p className="text-xs text-muted-foreground">
                Signature timestamp: {new Date(signatureTimestamp).toLocaleString()}
              </p>
            )}
          </div>

          {/* Agreement Checkbox */}
          <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
            <input
              type="checkbox"
              id="agree"
              checked={hasAgreed}
              onChange={(e) => {
                setHasAgreed(e.target.checked)
                setError(null)
              }}
              className="h-5 w-5 rounded border-border text-cta focus:ring-cta mt-0.5"
            />
            <label htmlFor="agree" className="text-sm cursor-pointer">
              <span className="font-medium">I confirm that I have read and understood this receipt.</span> I acknowledge
              that I am receiving the Franchise Disclosure Document and understand the 14-day waiting period
              requirement.
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <Card className="border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleSign}
              disabled={!hasAgreed || !hasSignature || isLoading}
              className="bg-cta hover:bg-cta/90 text-cta-foreground gap-2"
            >
              {isLoading ? (
                "Signing..."
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Sign Receipt
                </>
              )}
            </Button>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-muted-foreground text-center pt-4 border-t">
            Your signature will be timestamped and stored securely. You will receive a copy via email.
          </p>
        </div>
      </Card>
    </div>
  )
}
