"use client"

import { useState } from "react"
import { X, CheckCircle2, Info, Loader2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { FranchisePreApproval } from "@/lib/data"
import { defaultBuyerProfile, lenders } from "@/lib/data"
import { VerificationStatusCard } from "@/components/verification-status-card"

interface ConnectLenderModalProps {
  franchiseId: string
  franchiseName: string
  preApproval?: FranchisePreApproval
  onClose: () => void
}

export function ConnectLenderModal({ franchiseId, franchiseName, preApproval, onClose }: ConnectLenderModalProps) {
  const [message, setMessage] = useState("")
  const [contactMethod, setContactMethod] = useState<"email" | "phone" | "both">("both")
  const [loanAmount, setLoanAmount] = useState("")
  const [selectedLenders, setSelectedLenders] = useState<string[]>([])
  const [isSubmitted, setIsSubmitted] = useState(false)

  const buyerProfile = defaultBuyerProfile

  const handleNavigateToProfile = () => {
    console.log("[v0] Navigating to profile to complete verification")
    onClose()
  }

  const handleLenderToggle = (lenderId: string) => {
    setSelectedLenders((prev) => (prev.includes(lenderId) ? prev.filter((id) => id !== lenderId) : [...prev, lenderId]))
  }

  const handleSubmit = () => {
    console.log("[v0] Lender connection request submitted:", {
      franchiseId,
      franchiseName,
      selectedLenders,
      message,
      contactMethod,
      loanAmount,
      buyer: buyerProfile.personalInfo,
    })
    setIsSubmitted(true)
    setTimeout(() => {
      onClose()
    }, 2000)
  }

  const renderContent = () => {
    if (preApproval?.status === "Approved") {
      const approvedLenders = preApproval.lenders.filter((l) => l.status === "Approved")
      return (
        <div className="p-6 space-y-6">
          <div className="text-center py-4">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-emerald-100 p-3">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">You're Pre-Approved!</h3>
            <p className="text-muted-foreground">
              {approvedLenders.length} lender{approvedLenders.length > 1 ? "s have" : " has"} pre-approved you for{" "}
              {franchiseName}
            </p>
          </div>

          <div className="space-y-3">
            {approvedLenders.map((lender) => (
              <Card key={lender.lenderId} className="p-4 bg-emerald-50 border-emerald-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-emerald-900">{lender.lenderName}</h4>
                    <div className="mt-2 space-y-1 text-sm text-emerald-800">
                      <p>Approved Amount: ${(lender.approvedAmount! / 1000).toFixed(0)}K</p>
                      <p>Rate: {lender.approvedRate}%</p>
                      <p className="text-xs text-emerald-600">
                        Approved on {new Date(lender.approvedDate!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-600 text-white">Approved</Badge>
                </div>
              </Card>
            ))}
          </div>

          <Button onClick={onClose} className="w-full bg-cta hover:bg-cta/90 text-cta-foreground">
            Close
          </Button>
        </div>
      )
    }

    if (preApproval?.status === "Pending") {
      const pendingLenders = preApproval.lenders.filter((l) => l.status === "Pending")
      return (
        <div className="p-6 space-y-6">
          <div className="text-center py-4">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-amber-100 p-3">
                <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">Pre-Approval Pending</h3>
            <p className="text-muted-foreground">
              Your pre-approval request is being reviewed by {pendingLenders.length} lender
              {pendingLenders.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="space-y-3">
            {pendingLenders.map((lender) => (
              <Card key={lender.lenderId} className="p-4 bg-amber-50 border-amber-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-amber-900">{lender.lenderName}</h4>
                    <div className="mt-2 space-y-1 text-sm text-amber-800">
                      <p className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        Submitted {new Date(lender.submittedDate!).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-amber-600">Typically responds in 2-5 business days</p>
                    </div>
                  </div>
                  <Badge className="bg-amber-600 text-white">Pending</Badge>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex gap-2">
              <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">What happens next?</p>
                <ul className="space-y-1 text-xs">
                  <li>• Lenders will review your application</li>
                  <li>• You'll receive email updates on your status</li>
                  <li>• Approved lenders will contact you directly</li>
                </ul>
              </div>
            </div>
          </Card>

          <Button onClick={onClose} variant="outline" className="w-full bg-transparent">
            Close
          </Button>
        </div>
      )
    }

    // Default: Get Pre-Approved flow
    return (
      <div className="p-6 space-y-6">
        <VerificationStatusCard profile={buyerProfile} onNavigateToProfile={handleNavigateToProfile} />

        <div className="space-y-3">
          <Label>Select Lenders to Request Pre-Approval</Label>
          <div className="space-y-2">
            {lenders.map((lender) => (
              <Card
                key={lender.id}
                className={`p-4 cursor-pointer transition-all ${
                  selectedLenders.includes(lender.id) ? "bg-cta/10 border-cta" : "hover:bg-accent/50"
                }`}
                onClick={() => handleLenderToggle(lender.id)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedLenders.includes(lender.id)}
                    onCheckedChange={() => handleLenderToggle(lender.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{lender.name}</h4>
                      {lender.isPreferred && (
                        <Badge variant="secondary" className="text-xs bg-cta/10 text-cta">
                          Preferred
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-0.5 text-xs text-muted-foreground">
                      <p>Rate: {lender.estimatedRate}</p>
                      <p>Processing: {lender.processingTime}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="loanAmount">Estimated Loan Amount Needed</Label>
          <Select value={loanAmount} onValueChange={setLoanAmount}>
            <SelectTrigger id="loanAmount">
              <SelectValue placeholder="Select amount range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50-100k">$50,000 - $100,000</SelectItem>
              <SelectItem value="100-250k">$100,000 - $250,000</SelectItem>
              <SelectItem value="250-500k">$250,000 - $500,000</SelectItem>
              <SelectItem value="500k+">$500,000+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Your Message (Optional)</Label>
          <Textarea
            id="message"
            placeholder="Share any specific questions or details about your financing needs..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedLenders.length === 0 || !loanAmount}
            className="flex-1 bg-cta hover:bg-cta/90 text-cta-foreground"
          >
            Request Pre-Approval ({selectedLenders.length})
          </Button>
        </div>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-emerald-100 p-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <h3 className="mb-2 text-xl font-bold">Request Sent!</h3>
          <p className="text-muted-foreground">
            Your pre-approval request has been sent to {selectedLenders.length} lender
            {selectedLenders.length > 1 ? "s" : ""}. They'll reach out within 2-5 business days.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">
              {preApproval?.status === "Approved"
                ? "Pre-Approval Status"
                : preApproval?.status === "Pending"
                  ? "Pre-Approval Pending"
                  : "Get Pre-Approved"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {preApproval?.status === "Approved"
                ? "View your approved financing options"
                : preApproval?.status === "Pending"
                  ? "Track your pre-approval requests"
                  : `Request pre-approval for ${franchiseName}`}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {renderContent()}
      </Card>
    </div>
  )
}
