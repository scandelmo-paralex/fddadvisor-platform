"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Search, Bell, User, X, LogOut } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { franchises } from "@/lib/data"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from 'next/navigation'
import { useNotifications } from "@/components/notification-provider"

interface HeaderProps {
  currentView: string
  onViewChange: (view: string) => void
  onBack: () => void
  onNavigate?: (view: string, franchiseId?: string) => void
  hideSearch?: boolean
  whiteLabelCompanyName?: string | null
}

export function Header({
  currentView,
  onViewChange,
  onBack,
  onNavigate,
  hideSearch = false,
  whiteLabelCompanyName,
}: HeaderProps) {
  const showBackButton =
    currentView !== "buyer-dashboard" && currentView !== "franchisor-dashboard" && currentView !== "profile-settings"

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<typeof franchises>([])
  const [showResults, setShowResults] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications()

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const results = franchises.filter(
        (franchise) =>
          franchise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          franchise.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
          franchise.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setSearchResults(results)
      setShowResults(true)
    } else {
      setSearchResults([])
      setShowResults(false)
    }
  }, [searchQuery])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearchResultClick = (franchiseId: string) => {
    if (onNavigate) {
      onNavigate("fdd-viewer", franchiseId)
    }
    setSearchQuery("")
    setShowResults(false)
  }

  const handleClearSearch = () => {
    setSearchQuery("")
    setShowResults(false)
  }

  const handleProfileClick = () => {
    if (currentView === "franchisor-dashboard" || currentView === "franchisor-profile") {
      onViewChange("franchisor-profile")
    } else {
      onViewChange("profile-settings")
    }
    setShowUserMenu(false)
  }

  const handleSignOut = async () => {
    try {
      console.log("[v0] Signing out...")
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("[v0] Sign out error:", error)
      } else {
        console.log("[v0] Sign out successful")
      }

      setShowUserMenu(false)

      window.location.href = "/login"
    } catch (error) {
      console.error("[v0] Sign out failed:", error)
      window.location.href = "/login"
    }
  }

  return (
    <header className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="gap-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 -ml-2 focus-visible:ring-2 focus-visible:ring-cta"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-cta">
                {whiteLabelCompanyName ? whiteLabelCompanyName : currentView === "fdd-viewer" ? "FDDHub" : "FDDHub"}
              </h1>
            </div>


            {!hideSearch && (
              <div className="hidden lg:flex items-center flex-1 max-w-md ml-6" ref={searchRef}>
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search franchises..."
                    className="pl-9 pr-9 h-10 bg-muted/50 border-border/50 focus-visible:ring-2 focus-visible:ring-cta transition-all duration-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery && setShowResults(true)}
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-accent/50 transition-all duration-200"
                      onClick={handleClearSearch}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}

                  {showResults && (
                    <Card className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto border-border/50 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      {searchResults.length > 0 ? (
                        <div className="p-2">
                          {searchResults.map((franchise) => (
                            <button
                              key={franchise.id}
                              className="w-full text-left p-3 rounded-lg hover:bg-cta/10 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-inset"
                              onClick={() => handleSearchResultClick(franchise.id)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium text-sm truncate">{franchise.name}</p>
                                    {franchise.hasItem19 && (
                                      <Badge variant="secondary" className="bg-cta/10 text-cta border-cta/20 text-xs">
                                        Item 19
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground leading-relaxed mb-1">
                                    {franchise.industry}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    ${(franchise.investmentMin / 1000).toFixed(0)}K - $
                                    {(franchise.investmentMax / 1000).toFixed(0)}K
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <p className="text-sm text-muted-foreground leading-relaxed">No franchises found</p>
                          <p className="text-xs text-muted-foreground mt-2">Try a different search term</p>
                        </div>
                      )}
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative" ref={notificationRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications(!showNotifications)}
                className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-cta relative"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-cta text-cta-foreground text-xs">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </Button>

              {showNotifications && (
                <Card className="absolute right-0 top-full mt-2 w-96 max-h-[500px] overflow-y-auto border-border/50 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-border/50 flex items-center justify-between sticky top-0 bg-background">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-xs text-cta hover:text-cta/80"
                      >
                        Mark all read
                      </Button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No notifications yet</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        You'll be notified when leads engage with your FDD
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                            !notification.read ? "bg-cta/5" : ""
                          }`}
                          onClick={() => {
                            markAsRead(notification.id)
                            setShowNotifications(false)
                            if (onNavigate) {
                              onNavigate("franchisor-dashboard")
                              setTimeout(() => {
                                const event = new CustomEvent("open-lead-intelligence", {
                                  detail: { leadId: notification.leadId },
                                })
                                window.dispatchEvent(event)
                              }, 100)
                            }
                          }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-sm font-medium">{notification.title}</p>
                            {!notification.read && <div className="h-2 w-2 rounded-full bg-cta flex-shrink-0 mt-1" />}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{notification.message}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {notification.timestamp.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                clearNotification(notification.id)
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}
            </div>

            <div className="relative" ref={userMenuRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="h-10 w-10 rounded-full bg-cta/10 hover:bg-cta/20 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-cta"
              >
                <User className="h-4 w-4 text-cta" />
              </Button>
              {showUserMenu && (
                <Card className="absolute right-0 top-full mt-2 w-56 border-border/50 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-2">
                    <button
                      onClick={handleProfileClick}
                      className="w-full text-left p-3 rounded-lg hover:bg-cta/10 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-inset flex items-center gap-3"
                    >
                      <User className="h-4 w-4 text-cta" />
                      <div>
                        <p className="text-sm font-medium">Profile Settings</p>
                        <p className="text-xs text-muted-foreground">Manage your account</p>
                      </div>
                    </button>
                    <div className="my-2 h-px bg-border/50" />
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left p-3 rounded-lg hover:bg-destructive/10 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-inset flex items-center gap-3 text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      <p className="text-sm font-medium">Sign Out</p>
                    </button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
