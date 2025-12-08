"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Lock } from "lucide-react"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [invitationToken, setInvitationToken] = useState<string | null>(null)

  useEffect(() => {
    // Get the invitation token from the URL if it exists
    const token = searchParams.get("invitation_token")
    if (token) {
      setInvitationToken(token)
    }
  }, [searchParams])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Validate passwords
    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      const supabase = createBrowserClient()

      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }

      setSuccess(true)

      // Redirect after 2 seconds
      setTimeout(() => {
        if (invitationToken) {
          // Redirect back to the invitation page
          router.push(`/hub/invite/${invitationToken}`)
        } else {
          // Redirect to login
          router.push("/login")
        }
      }, 2000)
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="size-8 text-green-600" />
            </div>
            <CardTitle>Password Reset Successful</CardTitle>
            <CardDescription>Your password has been updated successfully. Redirecting you back...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-blue-100">
            <Lock className="size-8 text-blue-600" />
          </div>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <XCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">Must be at least 8 characters long</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Resetting Password..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
