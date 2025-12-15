"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
  Briefcase,
  Crown,
} from "lucide-react"

interface InvitationData {
  email: string
  full_name: string
  role: "owner" | "admin" | "recruiter"
}

interface ValidatedInvitation {
  invitation: InvitationData
  franchisor: {
    company_name: string
    logo_url?: string
  }
  invited_by: string
}

const roleConfig = {
  owner: {
    label: "Owner",
    icon: Crown,
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    description: "Full access to manage everything",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    description: "Manage team and view all leads",
  },
  recruiter: {
    label: "Recruiter",
    icon: Briefcase,
    color: "bg-green-500/10 text-green-600 border-green-500/20",
    description: "Send FDDs and manage your leads",
  },
}

export function TeamSignupContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  const [isValidating, setIsValidating] = useState(true)
  const [invitationData, setInvitationData] = useState<ValidatedInvitation | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setError("No invitation token provided")
      setIsValidating(false)
      return
    }

    validateToken()
  }, [token])

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/team/accept?token=${token}`)
      const data = await response.json()

      if (data.valid) {
        setInvitationData(data)
      } else {
        setError(data.error || "Invalid invitation")
      }
    } catch (err) {
      setError("Failed to validate invitation")
    } finally {
      setIsValidating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/team/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        setError(data.error || "Failed to create account")
      }
    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <Card className="p-8 text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-cta" />
          <p className="text-muted-foreground">Validating invitation...</p>
        </Card>
      </div>
    )
  }

  // Error state (invalid/expired token)
  if (error && !invitationData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Invalid Invitation</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            This invitation link may have expired or already been used.
            Please contact your administrator for a new invitation.
          </p>
          <Button variant="outline" onClick={() => router.push("/login")}>
            Go to Login
          </Button>
        </Card>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Welcome to the Team!</h1>
            <p className="text-muted-foreground">
              Your account has been created successfully.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Redirecting you to the dashboard...
          </p>
          <Loader2 className="h-5 w-5 animate-spin mx-auto text-cta" />
        </Card>
      </div>
    )
  }

  // Signup form
  const invitation = invitationData?.invitation
  const franchisor = invitationData?.franchisor
  const RoleIcon = invitation ? roleConfig[invitation.role].icon : Users

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <Card className="max-w-md w-full p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          {franchisor?.logo_url ? (
            <img
              src={franchisor.logo_url}
              alt={franchisor.company_name}
              className="h-16 w-16 mx-auto rounded-xl object-contain border border-border/50 bg-white p-2"
            />
          ) : (
            <div className="mx-auto w-16 h-16 rounded-xl bg-cta/10 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-cta" />
            </div>
          )}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Join {franchisor?.company_name}</h1>
            <p className="text-muted-foreground">
              You've been invited to join as a team member
            </p>
          </div>
        </div>

        {/* Invitation Details */}
        <div className="bg-muted/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-cta/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-cta">
                  {invitation?.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </span>
              </div>
              <div>
                <p className="font-medium">{invitation?.full_name}</p>
                <p className="text-sm text-muted-foreground">{invitation?.email}</p>
              </div>
            </div>
            <Badge variant="outline" className={invitation ? roleConfig[invitation.role].color : ""}>
              <RoleIcon className="mr-1 h-3 w-3" />
              {invitation ? roleConfig[invitation.role].label : "Member"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {invitation ? roleConfig[invitation.role].description : ""}
          </p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                value={invitation?.email || ""}
                disabled
                className="pl-10 bg-muted/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || !password || !confirmPassword}
            className="w-full bg-cta hover:bg-cta/90 text-cta-foreground h-11"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" />
                Join Team
              </>
            )}
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <a href="/login" className="text-cta hover:underline">
            Sign in
          </a>
        </p>
      </Card>
    </div>
  )
}
