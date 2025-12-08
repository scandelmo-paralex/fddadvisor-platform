"use client"

import { useState, useRef, useEffect } from "react"
import { User, LogOut, Settings, FileText, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"

interface HubHeaderProps {
  userRole?: "buyer" | "franchisor"
}

export function HubHeader({ userRole = "buyer" }: HubHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    setShowUserMenu(false)
    router.push("/login")
    router.refresh()
  }

  const isActive = (path: string) => pathname === path

  return (
    <header className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo and Navigation */}
          <div className="flex items-center gap-8">
            <button onClick={() => router.push("/")} className="flex items-center">
              <h1 className="text-xl font-bold text-cta">FDDHub</h1>
            </button>

            <nav className="hidden md:flex items-center gap-2">
              {userRole === "buyer" && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/hub/my-fdds")}
                    className={`font-medium transition-all duration-200 ${
                      isActive("/hub/my-fdds")
                        ? "bg-cta/10 text-cta hover:bg-cta/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    My FDDs
                  </Button>
                </>
              )}

              {userRole === "franchisor" && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/dashboard")}
                    className={`font-medium transition-all duration-200 ${
                      isActive("/dashboard")
                        ? "bg-cta/10 text-cta hover:bg-cta/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/company-settings")}
                    className={`font-medium transition-all duration-200 ${
                      isActive("/company-settings")
                        ? "bg-cta/10 text-cta hover:bg-cta/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </>
              )}
            </nav>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2">
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
                      onClick={() => {
                        router.push("/profile")
                        setShowUserMenu(false)
                      }}
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
