"use client"

import { useState } from "react"
import { X, Mail, Phone, CheckCircle2, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Franchise, FDDEngagement } from "@/lib/data"
import { defaultBuyerProfile } from "@/lib/data"
import { VerificationStatusCard } from "@/components/verification-status-card"

interface ConnectFranchisorModalProps {
  franchise: Franchise
  engagement: FDDEngagement
  onClose: () => void
}

export function ConnectFranchisorModal({ franchise, engagement, onClose }: ConnectFranchisorModalProps) {
  const [message, setMessage] = useState("")
  const [contactMethod, setContactMethod] = useState<"email" | "phone" | "both">("both")
  const [timeline, setTimeline] = useState("3-6 months")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const buyerProfile = defaultBuyerProfile

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`
  }

  const handleNavigateToProfile = () => {
    console.log("[v0] Navigating to profile to complete verification")
    onClose()
    // TODO: Implement navigation to profile page
    // router.push('/profile?section=verification')
  }

  const handleSubmit = () => {
    console.log("[v0] Connection request submitted:", {
      franchise: franchise.name,
      message,
      contactMethod,
      timeline,
      buyer: buyerProfile.personalInfo,
      engagement,
    })
    setIsSubmitted(true)
    setTimeout(() => {
      onClose()
    }, 2000)
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
            Your connection request has been sent to {franchise.name}. They'll reach out to you within 24-48 hours.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Connect with {franchise.name}</h2>
            <p className="text-sm text-muted-foreground">
              Express your interest and the franchisor will reach out to you
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Verification Status Card */}
          <VerificationStatusCard profile={buyerProfile} onNavigateToProfile={handleNavigateToProfile} />

          {/* Franchise Info */}
          <Card className="p-4 bg-accent/5">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-cta/10 p-2">
                <span className="text-2xl">
                  {franchise.industry === "Food & Beverage"
                    ? "🍔"
                    : franchise.industry === "Health & Fitness"
                      ? "💪"
                      : franchise.industry === "Business Services"
                        ? "📦"
                        : "✂️"}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{franchise.name}</h3>
                  {franchise.status && (
                    <Badge variant="secondary" className="text-xs">
                      {franchise.status}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{franchise.description}</p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>
                    Investment: ${(franchise.investmentMin / 1000).toFixed(0)}K - $
                    {(franchise.investmentMax / 1000).toFixed(0)}K
                  </span>
                  <span>•</span>
                  <span>ROI: {franchise.roiTimeframe}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Your Message</Label>
            <Textarea
              id="message"
              placeholder="Introduce yourself and share why you're interested in this franchise opportunity..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Tip: Mention your background, experience, and specific questions about the franchise
            </p>
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            <Label htmlFor="timeline">Decision Timeline</Label>
            <Select value={timeline} onValueChange={setTimeline}>
              <SelectTrigger id="timeline">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-3 months">1-3 months</SelectItem>
                <SelectItem value="3-6 months">3-6 months</SelectItem>
                <SelectItem value="6-12 months">6-12 months</SelectItem>
                <SelectItem value="12+ months">12+ months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contact Method */}
          <div className="space-y-3">
            <Label>Preferred Contact Method</Label>
            <RadioGroup value={contactMethod} onValueChange={(value: any) => setContactMethod(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="email" />
                <Label htmlFor="email" className="flex items-center gap-2 font-normal cursor-pointer">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email ({buyerProfile.personalInfo.email})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="phone" id="phone" />
                <Label htmlFor="phone" className="flex items-center gap-2 font-normal cursor-pointer">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Phone ({buyerProfile.personalInfo.phone})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="both" />
                <Label htmlFor="both" className="font-normal cursor-pointer">
                  Both (Email & Phone)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Engagement Summary */}
          <Card className="p-4 bg-accent/5 border-accent/20">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-accent" />
              Your Engagement Summary
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Time Spent</p>
                <p className="font-medium">{formatTime(engagement.timeSpent)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Questions Asked</p>
                <p className="font-medium">{engagement.questionsAsked.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Notes Created</p>
                <p className="font-medium">{engagement.notesCreated}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Sections Viewed</p>
                <p className="font-medium">{engagement.sectionsViewed.length || "Multiple"}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 italic">
              This engagement data will be shared with the franchisor to show your genuine interest
            </p>
          </Card>

          {/* Information Shared */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-1">Information Shared with Franchisor</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>
                    • Name: {buyerProfile.personalInfo.firstName} {buyerProfile.personalInfo.lastName}
                  </li>
                  <li>• Location: {buyerProfile.personalInfo.location}</li>
                  <li>
                    • Contact:{" "}
                    {contactMethod === "email"
                      ? "Email only"
                      : contactMethod === "phone"
                        ? "Phone only"
                        : "Email & Phone"}
                  </li>
                  <li>• Timeline: {timeline}</li>
                  {buyerProfile.privacySettings.showFinancialInfo && (
                    <li>• Financial qualification status (if completed)</li>
                  )}
                </ul>
                <p className="text-xs text-blue-700 mt-2">You can update your privacy settings in your profile</p>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!message.trim()}
              className="flex-1 bg-cta hover:bg-cta/90 text-cta-foreground"
            >
              Send Connection Request
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
