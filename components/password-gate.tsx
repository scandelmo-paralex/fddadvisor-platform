"use client"

import { useState, useEffect } from "react"

interface PasswordGateProps {
  children: React.ReactNode
}

const GATE_PASSWORD = "fddhub2025" // Change this to whatever you want
const COOKIE_NAME = "fddhub_access"
const COOKIE_DAYS = 30

export function PasswordGate({ children }: PasswordGateProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    // Check if user already has access cookie
    const hasAccess = document.cookie.includes(`${COOKIE_NAME}=granted`)
    setIsAuthorized(hasAccess)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password === GATE_PASSWORD) {
      // Set cookie
      const expires = new Date()
      expires.setDate(expires.getDate() + COOKIE_DAYS)
      document.cookie = `${COOKIE_NAME}=granted; expires=${expires.toUTCString()}; path=/`
      
      setIsAuthorized(true)
      setError("")
    } else {
      setError("Invalid password")
      setPassword("")
    }
  }

  // Still checking
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-gray-900 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  // Not authorized - show password form
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="text-center space-y-8">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
            FDDHub
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-64 px-4 py-2 text-sm text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                autoFocus
              />
            </div>
            
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-gray-900 underline underline-offset-4 transition-colors"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Authorized - show the app
  return <>{children}</>
}
