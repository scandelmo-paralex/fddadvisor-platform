"use client"

import { useState, useEffect } from "react"
import { 
  Eye, 
  MessageSquare, 
  FileSignature, 
  Clock, 
  UserPlus,
  FileText,
  MousePointer,
  TrendingUp,
  Filter,
  RefreshCw
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface ActivityItem {
  id: string
  type: "fdd_opened" | "question_asked" | "item_viewed" | "receipt_signed" | "lead_invited" | "time_milestone"
  leadName: string
  leadEmail: string
  brand?: string
  description: string
  detail?: string
  timestamp: Date
  isHighIntent?: boolean
}

interface ActivityFeedProps {
  // In production, this would be the franchisor_id to filter activities
  franchisorId?: string
  // For recruiters, only show their leads
  teamMemberId?: string
  isRecruiter?: boolean
}

export function ActivityFeed({ franchisorId, teamMemberId, isRecruiter }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "high_intent" | "questions">("all")
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Mock data for demo - in production this would come from API
  useEffect(() => {
    const mockActivities: ActivityItem[] = [
      {
        id: "1",
        type: "question_asked",
        leadName: "Bob Smith",
        leadEmail: "bob@test.com",
        brand: "Drybar",
        description: "Asked a question about Item 7",
        detail: "What's included in the initial franchise fee?",
        timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 min ago
        isHighIntent: true
      },
      {
        id: "2", 
        type: "item_viewed",
        leadName: "Bob Smith",
        leadEmail: "bob@test.com",
        brand: "Drybar",
        description: "Viewed Item 19 (Financial Performance)",
        detail: "Spent 4 min 32 sec reading",
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
        isHighIntent: true
      },
      {
        id: "3",
        type: "receipt_signed",
        leadName: "Sarah Johnson",
        leadEmail: "sarah@email.com",
        brand: "Elements Massage",
        description: "Signed Item 23 Receipt",
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
        isHighIntent: true
      },
      {
        id: "4",
        type: "fdd_opened",
        leadName: "Willie Nelson",
        leadEmail: "willie@test.com",
        brand: "Radiant Waxing",
        description: "Opened FDD for the first time",
        timestamp: new Date(Date.now() - 32 * 60 * 1000), // 32 min ago
      },
      {
        id: "5",
        type: "time_milestone",
        leadName: "Bob Smith",
        leadEmail: "bob@test.com",
        brand: "Drybar",
        description: "Reached 30 minutes total viewing time",
        detail: "Top 10% engagement",
        timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 min ago
        isHighIntent: true
      },
      {
        id: "6",
        type: "question_asked",
        leadName: "Willie Nelson",
        leadEmail: "willie@test.com", 
        brand: "Radiant Waxing",
        description: "Asked about territory protection",
        detail: "Is the territory exclusive?",
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      },
      {
        id: "7",
        type: "lead_invited",
        leadName: "Mike Chen",
        leadEmail: "mike.chen@email.com",
        brand: "Fitness Together",
        description: "Invitation sent",
        detail: "Via Internal referral",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        id: "8",
        type: "item_viewed",
        leadName: "Sarah Johnson",
        leadEmail: "sarah@email.com",
        brand: "Elements Massage",
        description: "Viewed Item 5 (Initial Fees)",
        detail: "Spent 2 min 15 sec",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      },
    ]

    // Simulate loading
    setTimeout(() => {
      setActivities(mockActivities)
      setLoading(false)
    }, 500)
  }, [])

  // Auto-refresh simulation
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      // In production, this would fetch new activities from API
      console.log("[ActivityFeed] Auto-refresh triggered")
    }, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh])

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "fdd_opened":
        return <Eye className="h-4 w-4" />
      case "question_asked":
        return <MessageSquare className="h-4 w-4" />
      case "item_viewed":
        return <FileText className="h-4 w-4" />
      case "receipt_signed":
        return <FileSignature className="h-4 w-4" />
      case "lead_invited":
        return <UserPlus className="h-4 w-4" />
      case "time_milestone":
        return <TrendingUp className="h-4 w-4" />
      default:
        return <MousePointer className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: ActivityItem["type"], isHighIntent?: boolean) => {
    if (isHighIntent) return "bg-emerald-100 text-emerald-600 border-emerald-200"
    
    switch (type) {
      case "fdd_opened":
        return "bg-blue-100 text-blue-600 border-blue-200"
      case "question_asked":
        return "bg-purple-100 text-purple-600 border-purple-200"
      case "item_viewed":
        return "bg-slate-100 text-slate-600 border-slate-200"
      case "receipt_signed":
        return "bg-emerald-100 text-emerald-600 border-emerald-200"
      case "lead_invited":
        return "bg-amber-100 text-amber-600 border-amber-200"
      case "time_milestone":
        return "bg-emerald-100 text-emerald-600 border-emerald-200"
      default:
        return "bg-gray-100 text-gray-600 border-gray-200"
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const filteredActivities = activities.filter((activity) => {
    if (filter === "high_intent") return activity.isHighIntent
    if (filter === "questions") return activity.type === "question_asked"
    return true
  })

  const getBrandColor = (brand?: string) => {
    const brandLower = brand?.toLowerCase() || ""
    if (brandLower.includes("drybar")) return "text-amber-600"
    if (brandLower.includes("radiant")) return "text-purple-600"
    if (brandLower.includes("elements")) return "text-emerald-600"
    if (brandLower.includes("amazing lash")) return "text-pink-600"
    if (brandLower.includes("fitness together")) return "text-blue-600"
    return "text-muted-foreground"
  }

  return (
    <Card className="border border-border/60 shadow-sm overflow-hidden rounded-xl">
      <div className="p-4 border-b border-border/60 bg-muted/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Activity Feed</h3>
              <p className="text-xs text-muted-foreground">Real-time lead engagement</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-background p-1 rounded-lg border border-border/50">
              <Button
                variant={filter === "all" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilter("all")}
                className="h-7 px-2 text-xs"
              >
                All
              </Button>
              <Button
                variant={filter === "high_intent" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilter("high_intent")}
                className="h-7 px-2 text-xs gap-1"
              >
                <TrendingUp className="h-3 w-3" />
                High Intent
              </Button>
              <Button
                variant={filter === "questions" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilter("questions")}
                className="h-7 px-2 text-xs gap-1"
              >
                <MessageSquare className="h-3 w-3" />
                Questions
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`h-8 w-8 p-0 ${autoRefresh ? "text-emerald-600" : "text-muted-foreground"}`}
              title={autoRefresh ? "Auto-refresh on" : "Auto-refresh off"}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? "animate-spin-slow" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading activity...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No activity to show</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className="p-4 hover:bg-muted/30 transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9 border border-border/50">
                    <AvatarFallback className="bg-muted text-xs font-medium">
                      {getInitials(activity.leadName)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-foreground">
                        {activity.leadName}
                      </span>
                      {activity.brand && (
                        <span className={`text-xs font-medium ${getBrandColor(activity.brand)}`}>
                          • {activity.brand}
                        </span>
                      )}
                      {activity.isHighIntent && (
                        <Badge 
                          variant="secondary" 
                          className="h-5 px-1.5 text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200"
                        >
                          High Intent
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`p-1 rounded border ${getActivityColor(activity.type, activity.isHighIntent)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <span className="text-sm text-foreground/80">
                        {activity.description}
                      </span>
                    </div>
                    
                    {activity.detail && (
                      <p className="text-xs text-muted-foreground mt-1 pl-7 italic">
                        "{activity.detail}"
                      </p>
                    )}
                  </div>
                  
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTimestamp(activity.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {filteredActivities.length > 0 && (
        <div className="p-3 border-t border-border/60 bg-muted/20 text-center">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
            View All Activity →
          </Button>
        </div>
      )}
    </Card>
  )
}
