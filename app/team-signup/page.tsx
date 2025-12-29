import { Suspense } from "react"
import { TeamSignupContent } from "./team-signup-content"

export const dynamic = "force-dynamic"

export default function TeamSignupPage() {
  return (
    <Suspense fallback={<TeamSignupLoading />}>
      <TeamSignupContent />
    </Suspense>
  )
}

function TeamSignupLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  )
}
