"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminResetPasswordPage() {
  const [email, setEmail] = useState("scandelmo@gmail.com")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("✅ Password updated successfully! You can now log in.")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setMessage("❌ Failed to update password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Password Reset</CardTitle>
          <CardDescription>Reset password for any user account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
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
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Updating..." : "Reset Password"}
            </Button>

            {message && (
              <p className={`text-sm text-center ${message.includes("✅") ? "text-green-600" : "text-red-600"}`}>
                {message}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
