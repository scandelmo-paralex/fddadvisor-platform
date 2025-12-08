"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useParams } from 'next/navigation'
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import type { LeadInvitation } from "@/lib/types/database"
import { acceptInvitation, linkInvitationToExistingUser } from "@/app/actions/accept-invitation"

export default function InvitationPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [invitation, setInvitation] = useState<LeadInvitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [creating, setCreating] = useState(false)
  const [mode, setMode] = useState<"signup" | "login">("signup")
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)

  useEffect(() => {
    validateInvitation()
  }, [token])

  const validateInvitation = async () => {
    try {
      console.log("[v0] CLIENT: Starting invitation validation")
      console.log("[v0] CLIENT: Token:", token)
      console.log("[v0] CLIENT: Fetching from:", `/api/hub/invite/${token}`)

      const response = await fetch(`/api/hub/invite/${token}`)

      console.log("[v0] CLIENT: Response status:", response.status)
      console.log("[v0] CLIENT: Response ok:", response.ok)
      console.log("[v0] CLIENT: Response headers:", Object.fromEntries(response.headers.entries()))

      const data = await response.json()
      console.log("[v0] CLIENT: Response data:", data)

      if (!response.ok) {
        console.log("[v0] CLIENT: Setting error:", data.error || "Invalid invitation")
        setError(data.error || "Invalid invitation")
        setLoading(false)
        return
      }

      console.log("[v0] CLIENT: Setting invitation data")
      setInvitation(data.invitation)
      if (data.invitation.lead_phone) {
        setPhone(data.invitation.lead_phone)
      }
      setLoading(false)
    } catch (err) {
      console.error("[v0] CLIENT: Validation error:", err)
      setError("Failed to validate invitation")
      setLoading(false)
    }
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !city.trim() || !state.trim()) {
      setError("Please fill in all required fields")
      return
    }

    setCreating(true)
    setError("")

    try {
      console.log("[v0] Creating account from invitation...")

      const result = await acceptInvitation({
        email: invitation!.lead_email,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        city: city.trim(),
        state: state.trim(),
        invitation_token: token,
      })

      console.log("[v0] acceptInvitation result:", result)

      if (!result.success) {
        if (result.error?.includes("already") || result.error?.includes("exists")) {
          setError("A user with this email address has already been registered")
          setMode("login")
          setCreating(false)
          return
        }
        throw new Error(result.error)
      }

      console.log("[v0] Account created successfully, redirecting to FDD...")
      window.location.href = `/hub/fdd/${invitation!.franchise_id}`
    } catch (err: any) {
      console.error("[v0] Account creation error:", err)
      setError(err.message || "Failed to create account")
      setCreating(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setCreating(true)
    setError("")

    try {
      console.log("[v0] Logging in existing user...")

      const result = await linkInvitationToExistingUser({
        email: invitation!.lead_email,
        password,
        invitation_token: token,
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      console.log("[v0] Logged in successfully, redirecting to specific FDD...")

      window.location.href = `/hub/fdd/${invitation!.franchise_id}`
    } catch (err: any) {
      console.error("[v0] Login error:", err)
      setError(err.message || "Failed to log in")
      setCreating(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!invitation?.lead_email) return

    setSendingReset(true)
    setError("")

    try {
      const supabase = createBrowserClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(invitation.lead_email, {
        redirectTo: `${window.location.origin}/reset-password?invitation_token=${token}`,
      })

      if (resetError) throw resetError

      setResetEmailSent(true)
    } catch (err: any) {
      console.error("[v0] Password reset error:", err)
      setError(err.message || "Failed to send reset email")
    } finally {
      setSendingReset(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (resetEmailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cta/10">
              <CheckCircle2 className="h-6 w-6 text-cta" />
            </div>
            <CardTitle>Check Your Email</CardTitle>
            <CardDescription>
              We've sent a password reset link to {invitation?.lead_email}. Click the link in the email to reset your
              password and return to this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setResetEmailSent(false)} variant="outline" className="w-full">
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cta/10">
            <CheckCircle2 className="h-6 w-6 text-cta" />
          </div>
          <CardTitle>You've been invited!</CardTitle>
          <CardDescription>
            {invitation?.franchisor?.company_name} has invited you to view the {invitation?.franchise?.name} Franchise
            Disclosure Document
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={mode === "signup" ? handleCreateAccount : handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={invitation?.lead_email || ""} disabled className="bg-muted" />
            </div>

            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="Enter your first name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="Enter your last name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="(555) 555-5555"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    placeholder="Enter your city"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                    placeholder="TX"
                    maxLength={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Create Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Re-enter password"
                  />
                </div>
              </>
            )}

            {mode === "login" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleForgotPassword}
                    disabled={sendingReset}
                    className="h-auto p-0 text-xs"
                  >
                    {sendingReset ? "Sending..." : "Forgot password?"}
                  </Button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Enter your password"
                />
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "signup" ? "Creating account..." : "Logging in..."}
                </>
              ) : mode === "signup" ? (
                "Create Account & View FDD"
              ) : (
                "Log In & View FDD"
              )}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => {
                  setMode(mode === "signup" ? "login" : "signup")
                  setError("")
                  setPassword("")
                  setConfirmPassword("")
                }}
                className="text-sm"
              >
                {mode === "signup" ? "Already have an account? Log in" : "Need to create an account? Sign up"}
              </Button>
            </div>

            {mode === "signup" && (
              <p className="text-xs text-center text-muted-foreground">
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
