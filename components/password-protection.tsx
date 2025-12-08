"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"

export function PasswordProtection({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Check if already authenticated on mount
  useEffect(() => {
    const authenticated = sessionStorage.getItem("app_authenticated")
    if (authenticated === "true") {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const correctPassword = process.env.NEXT_PUBLIC_APP_PASSWORD || "fddadvisor1214!!"

    if (password === correctPassword) {
      sessionStorage.setItem("app_authenticated", "true")
      setIsAuthenticated(true)
      setError("")
    } else {
      setError("Incorrect password. Please try again.")
      setPassword("")
    }
  }

  // Show loading state briefly to check authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-pulse text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  // Show splash page if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">FDDAdvisor</h1>
            <p className="text-gray-600 dark:text-gray-400">Enter password to access the platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-center text-lg"
                autoFocus
              />
              {error && <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}
            </div>

            <Button type="submit" className="w-full" size="lg">
              Access Platform
            </Button>
          </form>

          <p className="text-xs text-center text-gray-500 dark:text-gray-500">
            Your session will expire when you close the browser
          </p>
        </Card>
      </div>
    )
  }

  // Show app if authenticated
  return <>{children}</>
}
