"use client"

import { useState } from "react"
import { X, Shield, Eye, Clock, FileText } from "lucide-react"

interface TrackingConsentModalProps {
  isOpen: boolean
  franchiseName: string
  franchiseId: string // Added franchiseId prop
  buyerId: string // Added buyerId prop
  onConsent: () => Promise<void>
  onDecline: () => void
}

export function TrackingConsentModal({
  isOpen,
  franchiseName,
  franchiseId,
  buyerId,
  onConsent,
  onDecline,
}: TrackingConsentModalProps) {
  const [agreed, setAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleConsent = async () => {
    if (!agreed) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/hub/fdd-access/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          franchiseId,
          buyerId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save consent")
      }

      console.log("[v0] Consent saved to database")

      await onConsent()
    } catch (error) {
      console.error("[v0] Consent error:", error)
      alert("Failed to save consent. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <button
          onClick={onDecline}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-full bg-blue-100 p-3">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Engagement Tracking Consent</h2>
            <p className="text-sm text-gray-600">{franchiseName} Franchise Disclosure Document</p>
          </div>
        </div>

        <div className="mb-6 space-y-4 text-gray-700">
          <p>
            Before viewing the Franchise Disclosure Document, please review and consent to our engagement tracking
            practices.
          </p>

          <div className="rounded-lg bg-gray-50 p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Eye className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
              What We Track
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                <span>Time spent viewing each section of the FDD</span>
              </li>
              <li className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                <span>Pages and sections you view</span>
              </li>
              <li className="flex items-start gap-2">
                <Eye className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                <span>Questions you ask about the FDD content</span>
              </li>
            </ul>
          </div>

          <div className="rounded-lg bg-blue-50 p-4">
            <h3 className="font-semibold text-gray-900 mb-2">How This Information is Used</h3>
            <p className="text-sm">
              The franchisor uses this engagement data to understand your interests and provide better support during
              your evaluation process. Your engagement information will only be shared with {franchiseName} and will be
              used in accordance with applicable privacy laws.
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-lg border-2 border-gray-200 bg-gray-50 p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              <strong>I agree</strong> to have my engagement with this Franchise Disclosure Document tracked and shared
              with {franchiseName}. I understand this information will be used to assess my interest and provide better
              support during my franchise evaluation.
            </span>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleConsent}
            disabled={!agreed || isSubmitting}
            className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Saving..." : "Continue to FDD"}
          </button>
          <button
            onClick={onDecline}
            className="rounded-lg border-2 border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Decline
          </button>
        </div>

        <p className="mt-4 text-xs text-gray-500 text-center">
          Your consent and viewing activity will be recorded with timestamp and IP address for compliance purposes.
        </p>
      </div>
    </div>
  )
}
