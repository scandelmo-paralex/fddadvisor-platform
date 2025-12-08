"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createBrowserClient } from "@/lib/supabase/client"
import { CheckCircle2, TrendingUp, FileText, MessageSquare } from "lucide-react"

interface AuthGateModalProps {
  isOpen: boolean
  onClose: () => void
  returnUrl?: string
  feature?: "fdd-viewer" | "ai-analysis" | "save" | "compare"
}

export function AuthGateModal({ isOpen, onClose, returnUrl, feature = "fdd-viewer" }: AuthGateModalProps) {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")

  const featureMessages = {
    "fdd-viewer": {
      title: "View Full FDD Analysis",
      description: "Get instant access to comprehensive FDD breakdowns, AI insights, and financial analysis.",
      icon: FileText,
    },
    "ai-analysis": {
      title: "Unlock AI Analysis",
      description: "Ask questions and get instant answers about any franchise disclosure document.",
      icon: MessageSquare,
    },
    save: {
      title: "Save Your Favorites",
      description: "Keep track of franchises you're interested in and compare them side-by-side.",
      icon: CheckCircle2,
    },
    compare: {
      title: "Compare Franchises",
      description: "See detailed side-by-side comparisons of investment, fees, and performance.",
      icon: TrendingUp,
    },
  }

  const currentFeature = featureMessages[feature]
  const Icon = currentFeature.icon

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createBrowserClient()

    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error("Supabase is not configured. Please check your environment variables.")
      }

      if (isLogin) {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        // Redirect to return URL or discover page
        router.push(returnUrl || "/discover")
        router.refresh()
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
            data: {
              first_name: firstName,
              last_name: lastName,
              signup_source: "fddadvisor",
            },
          },
        })

        if (error) throw error

        // Check if session was created (email confirmation disabled) or not (email confirmation required)
        if (data.session) {
          // Session exists - email confirmation disabled, redirect to onboarding
          const onboardingUrl = `/onboarding${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ""}`
          router.push(onboardingUrl)
          router.refresh()
        } else {
          // No session - email confirmation required, redirect to signup success
          router.push("/signup-success")
        }
      }
    } catch (err: any) {
      let errorMessage = err.message || "An error occurred"

      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("fetch")) {
        errorMessage =
          "Unable to connect to authentication service. Please check your internet connection or try again later."
      }

      console.error("[v0] Auth error:", err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">{currentFeature.title}</DialogTitle>
          <DialogDescription className="text-center">{currentFeature.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Loading..." : isLogin ? "Log In" : "Create Free Account"}
          </Button>

          <div className="text-center text-sm">
            {isLogin ? (
              <>
                Don't have an account?{" "}
                <button type="button" onClick={() => setIsLogin(false)} className="text-primary hover:underline">
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button type="button" onClick={() => setIsLogin(true)} className="text-primary hover:underline">
                  Log in
                </button>
              </>
            )}
          </div>
        </form>

        <div className="mt-6 space-y-2 border-t pt-4">
          <p className="text-xs text-muted-foreground text-center font-medium">What you'll get:</p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-primary" />
              Full access to 400+ franchise FDDs
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-primary" />
              AI-powered analysis and Q&A
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-primary" />
              Side-by-side franchise comparisons
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-primary" />
              Save favorites and track your research
            </li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
