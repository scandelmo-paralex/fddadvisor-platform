import type React from "react"
import { HubHeader } from "@/components/hub-header"

export default function FDDViewerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <HubHeader userRole="buyer" />
      {children}
    </div>
  )
}
