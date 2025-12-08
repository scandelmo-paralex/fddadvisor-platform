"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, TrendingUp } from "lucide-react"

interface ProfileCompletionBannerProps {
  completionPercentage: number
}

export function ProfileCompletionBanner({ completionPercentage }: ProfileCompletionBannerProps) {
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || completionPercentage >= 80) {
    return null
  }

  return (
    <Card className="p-6 border-cta/30 bg-gradient-to-br from-cta/10 to-transparent relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-cta/10 p-3">
          <TrendingUp className="h-6 w-6 text-cta" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">Complete Your Profile</h3>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Add more details to stand out to franchisors and get better recommendations. Your profile is{" "}
            {completionPercentage}% complete.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-cta transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <Button onClick={() => router.push("/profile")} size="sm" className="shrink-0">
              Complete Profile
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
