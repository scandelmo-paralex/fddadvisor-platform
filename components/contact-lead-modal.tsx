"use client"

import { useState } from "react"
import { X, Mail, Loader2, Send } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface ContactLeadModalProps {
  isOpen: boolean
  onClose: () => void
  lead: {
    id: string
    name: string
    email: string
  }
}

export function ContactLeadModal({ isOpen, onClose, lead }: ContactLeadModalProps) {
  // Get first name safely with fallback
  const firstName = lead?.name?.split(" ")[0] || "there"
  
  const [subject, setSubject] = useState("Following up on your franchise inquiry")
  const [message, setMessage] = useState(
    `Hi ${firstName},\n\nI wanted to follow up on your interest in our franchise opportunity.\n\nBest regards,\nYour Franchise Team`
  )
  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()

  // Don't render if modal is closed or lead is missing
  if (!isOpen || !lead) return null

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Missing fields",
        description: "Please enter a subject and message",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)

    try {
      const response = await fetch("/api/hub/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          to: lead.email,
          leadName: lead.name,
          subject,
          message,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email")
      }

      toast({
        title: "Email sent!",
        description: `Your message was sent to ${lead.name}`,
      })

      onClose()
    } catch (error: any) {
      console.error("[ContactLeadModal] Error:", error)
      toast({
        title: "Failed to send",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg bg-white">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">Contact Lead</h2>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSending}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* To field (read-only) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">To:</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{lead.name}</span>
              <span className="text-muted-foreground">({lead.email})</span>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject:</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject..."
              disabled={isSending}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Message:</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your message..."
              className="min-h-[200px] resize-none"
              disabled={isSending}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t p-4">
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending} className="gap-2">
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Email
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}
