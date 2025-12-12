"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { BuyerDashboardView } from "@/components/dashboard/buyer-dashboard-view"
import { FranchisorDashboardView } from "@/components/dashboard/franchisor-dashboard-view"
import { LenderDashboardView } from "@/components/dashboard/lender-dashboard-view"
import { Loader2 } from "lucide-react"

type UserRole = "franchisor" | "buyer" | "lender" | null

export default function DashboardPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [userId, setUserId] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          console.log("[Dashboard] No authenticated user, redirecting to login")
          router.push("/login")
          return
        }

        setUserId(user.id)

        // Check if user is a franchisor
        const { data: franchisorProfile } = await supabase
          .from("franchisor_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single()

        if (franchisorProfile) {
          console.log("[Dashboard] User is a franchisor")
          setUserRole("franchisor")
          setLoading(false)
          return
        }

        // Check if user is a buyer
        const { data: buyerProfile } = await supabase
          .from("buyer_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single()

        if (buyerProfile) {
          console.log("[Dashboard] User is a buyer")
          setUserRole("buyer")
          setLoading(false)
          return
        }

        // Check if user is a lender
        const { data: lenderProfile } = await supabase
          .from("lender_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single()

        if (lenderProfile) {
          console.log("[Dashboard] User is a lender")
          setUserRole("lender")
          setLoading(false)
          return
        }

        // No profile found - default to buyer view or redirect to onboarding
        console.log("[Dashboard] No profile found, defaulting to buyer")
        setUserRole("buyer")
        setLoading(false)

      } catch (error) {
        console.error("[Dashboard] Error checking user role:", error)
        setLoading(false)
      }
    }

    checkUserRole()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Render only the appropriate dashboard based on user role
  switch (userRole) {
    case "franchisor":
      return <FranchisorDashboardView userId={userId} />
    case "lender":
      return <LenderDashboardView userId={userId} />
    case "buyer":
    default:
      return <BuyerDashboardView userId={userId} />
  }
}
