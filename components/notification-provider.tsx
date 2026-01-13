"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { Bell, X, UserPlus, FileText, FileCheck, ArrowRightLeft, MessageSquare, TrendingUp, Users } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Match the database schema
export interface Notification {
  id: string
  user_id: string
  type: string // 'lead_signup', 'fdd_viewed', 'receipt_signed', 'high_engagement', 'ai_question', 'stage_change', 'team_change'
  title: string
  message: string | null
  data: {
    invitation_id?: string
    lead_name?: string
    lead_email?: string
    franchise_id?: string
    franchise_name?: string
    old_stage_name?: string
    new_stage_name?: string
    receipt_signed_at?: string
    [key: string]: any
  }
  read: boolean
  read_at: string | null
  created_at: string
  franchisor_profile_id: string | null
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  clearNotification: (id: string) => Promise<void>
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider")
  }
  return context
}

// Get icon for notification type
function getNotificationIcon(type: string) {
  switch (type) {
    case 'lead_signup':
      return <UserPlus className="h-4 w-4 text-green-500" />
    case 'fdd_viewed':
      return <FileText className="h-4 w-4 text-blue-500" />
    case 'receipt_signed':
      return <FileCheck className="h-4 w-4 text-purple-500" />
    case 'stage_change':
      return <ArrowRightLeft className="h-4 w-4 text-orange-500" />
    case 'ai_question':
      return <MessageSquare className="h-4 w-4 text-cyan-500" />
    case 'high_engagement':
      return <TrendingUp className="h-4 w-4 text-yellow-500" />
    case 'team_change':
      return <Users className="h-4 w-4 text-indigo-500" />
    default:
      return <Bell className="h-4 w-4 text-cta" />
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    const supabase = createSupabaseBrowserClient()
    if (!supabase) {
      console.log("[Notifications] Supabase client not available")
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log("[Notifications] No authenticated user")
        setLoading(false)
        return
      }

      // Fetch recent notifications (last 50, ordered by created_at desc)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error("[Notifications] Error fetching:", error)
      } else {
        console.log("[Notifications] Fetched:", data?.length || 0, "notifications")
        setNotifications(data || [])
      }
    } catch (err) {
      console.error("[Notifications] Fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Subscribe to realtime notifications
  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    if (!supabase) {
      console.log("[Notifications] Supabase client not available, skipping subscription")
      setLoading(false)
      return
    }

    // Initial fetch
    fetchNotifications()

    // Get current user for subscription filter
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      console.log("[Notifications] Setting up realtime subscription for user:", user.id)

      // Subscribe to new notifications for this user
      const channel = supabase
        .channel('notifications_realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log("[Notifications] New notification received:", payload.new)
            const newNotification = payload.new as Notification
            
            // Add to state (prepend to show newest first)
            setNotifications(prev => [newNotification, ...prev])
            
            // Show toast
            showToast(newNotification)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log("[Notifications] Notification updated:", payload.new)
            const updatedNotification = payload.new as Notification
            
            // Update in state
            setNotifications(prev => 
              prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
            )
          }
        )
        .subscribe((status) => {
          console.log("[Notifications] Subscription status:", status)
        })

      return () => {
        console.log("[Notifications] Cleaning up subscription")
        supabase.removeChannel(channel)
      }
    }

    const cleanup = setupSubscription()
    
    return () => {
      cleanup.then(fn => fn?.())
    }
  }, [fetchNotifications])

  const showToast = (notification: Notification) => {
    const event = new CustomEvent("show-notification-toast", { detail: notification })
    window.dispatchEvent(event)
  }

  const markAsRead = async (id: string) => {
    const supabase = createSupabaseBrowserClient()
    if (!supabase) return

    // Optimistic update
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n)
    )

    // Update in database
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error("[Notifications] Error marking as read:", error)
      // Revert on error
      fetchNotifications()
    }
  }

  const markAllAsRead = async () => {
    const supabase = createSupabaseBrowserClient()
    if (!supabase) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Optimistic update
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
    )

    // Update in database using the function
    const { error } = await supabase.rpc('mark_all_notifications_read')

    if (error) {
      console.error("[Notifications] Error marking all as read:", error)
      // Revert on error
      fetchNotifications()
    }
  }

  const clearNotification = async (id: string) => {
    const supabase = createSupabaseBrowserClient()
    if (!supabase) return

    // Optimistic update
    setNotifications(prev => prev.filter(n => n.id !== id))

    // Delete from database
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)

    if (error) {
      console.error("[Notifications] Error deleting:", error)
      // Revert on error
      fetchNotifications()
    }
  }

  const refreshNotifications = async () => {
    setLoading(true)
    await fetchNotifications()
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        clearNotification,
        refreshNotifications,
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

  const leadName = toast.data?.lead_name || 'Someone'

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <Card className="p-4 bg-background border shadow-lg max-w-md">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-muted p-2">
            {getNotificationIcon(toast.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{toast.title}</p>
            {toast.message && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{toast.message}</p>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-1" onClick={() => setToast(null)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </Card>
    </div>
  )
}

// Export the icon getter for use in other components
export { getNotificationIcon }
