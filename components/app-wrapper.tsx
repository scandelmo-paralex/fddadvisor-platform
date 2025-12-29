"use client"

import { useState, useEffect } from "react"
import { PasswordGate } from "./password-gate"

interface AppWrapperProps {
  children: React.ReactNode
}

export function AppWrapper({ children }: AppWrapperProps) {
  const [needsGate, setNeedsGate] = useState<boolean | null>(null)

  useEffect(() => {
    const hostname = window.location.hostname
    // Only show password gate on app.fddhub.com
    // Skip gate for localhost, preview URLs, and www.fddhub.com (which has its own placeholder)
    const isAppDomain = hostname === "app.fddhub.com"
    setNeedsGate(isAppDomain)
  }, [])

  // Still determining
  if (needsGate === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-gray-900 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  // app.fddhub.com - wrap with password gate
  if (needsGate) {
    return <PasswordGate>{children}</PasswordGate>
  }

  // All other domains (localhost, preview URLs, www) - no gate
  return <>{children}</>
}
