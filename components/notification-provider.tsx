"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { Bell, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export interface Notification {
  id: string
  type: "lead_activity" | "high_quality" | "item19_view" | "question_asked" | "download" | "connect_request"
  title: string
  message: string
  leadId: string
  leadName: string
  timestamp: Date
  read: boolean
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider")
  }
  return context
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    if (!supabase) {
      console.log("[v0] Supabase client not available, skipping notification subscription")
      return
    }

    const channel = supabase
      .channel("engagement_notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "engagement_events",
        },
        (payload) => {
          console.log("[v0] New engagement event:", payload)
          handleEngagementEvent(payload.new)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleEngagementEvent = async (event: any) => {
    const supabase = createSupabaseBrowserClient()

    if (!supabase) {
      console.log("[v0] Supabase client not available, skipping notification handling")
      return
    }

    // Fetch lead details
    const { data: lead } = await supabase
      .from("leads")
      .select("id, name, quality_score")
      .eq("id", event.lead_id)
      .single()

    if (!lead) return

    let notification: Notification | null = null

    switch (event.event_type) {
      case "fdd_viewed":
        if (lead.quality_score >= 80) {
          notification = {
            id: `${event.id}-${Date.now()}`,
            type: "high_quality",
            title: "High-Quality Lead Viewing FDD",
            message: `${lead.name} (Quality Score: ${lead.quality_score}) is viewing the FDD`,
            leadId: lead.id,
            leadName: lead.name,
            timestamp: new Date(event.created_at),
            read: false,
          }
        }
        break

      case "item_viewed":
        if (event.metadata?.item_number === 19) {
          notification = {
            id: `${event.id}-${Date.now()}`,
            type: "item19_view",
            title: "Lead Viewing Financial Performance",
            message: `${lead.name} is viewing Item 19 (Financial Performance)`,
            leadId: lead.id,
            leadName: lead.name,
            timestamp: new Date(event.created_at),
            read: false,
          }
        }
        break

      case "question_asked":
        notification = {
          id: `${event.id}-${Date.now()}`,
          type: "question_asked",
          title: "Lead Asked a Question",
          message: `${lead.name} asked: "${event.metadata?.question?.substring(0, 50)}..."`,
          leadId: lead.id,
          leadName: lead.name,
          timestamp: new Date(event.created_at),
          read: false,
        }
        break

      case "fdd_downloaded":
        notification = {
          id: `${event.id}-${Date.now()}`,
          type: "download",
          title: "Lead Downloaded FDD",
          message: `${lead.name} downloaded the FDD`,
          leadId: lead.id,
          leadName: lead.name,
          timestamp: new Date(event.created_at),
          read: false,
        }
        break

      case "connect_requested":
        notification = {
          id: `${event.id}-${Date.now()}`,
          type: "connect_request",
          title: "Lead Wants to Connect",
          message: `${lead.name} requested to connect with you`,
          leadId: lead.id,
          leadName: lead.name,
          timestamp: new Date(event.created_at),
          read: false,
        }
        break
    }

    if (notification) {
      setNotifications((prev) => [notification!, ...prev])

      showToast(notification)
    }
  }

  const showToast = (notification: Notification) => {
    // Toast will be handled by the NotificationToast component
    const event = new CustomEvent("show-notification-toast", { detail: notification })
    window.dispatchEvent(event)
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotification,
      }}
    >
      {children}
      <NotificationToast />
    </NotificationContext.Provider>
  )
}

function NotificationToast() {
  const [toast, setToast] = useState<Notification | null>(null)

  useEffect(() => {
    const handleToast = (event: CustomEvent<Notification>) => {
      setToast(event.detail)
      setTimeout(() => setToast(null), 5000)
    }

    window.addEventListener("show-notification-toast" as any, handleToast)
    return () => window.removeEventListener("show-notification-toast" as any, handleToast)
  }, [])

  if (!toast) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <Card className="p-4 bg-cta/10 border-cta/20 shadow-lg max-w-md">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-cta/10 p-2">
            <Bell className="h-4 w-4 text-cta" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-cta">{toast.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{toast.message}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-1" onClick={() => setToast(null)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </Card>
    </div>
  )
}
