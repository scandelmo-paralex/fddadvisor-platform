import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { franchiseSlug } = await request.json()

    if (!franchiseSlug) {
      return NextResponse.json({ error: "Franchise slug required" }, { status: 400 })
    }

    // Get buyer profile
    const { data: buyerProfile } = await supabase.from("buyer_profiles").select("id").eq("user_id", user.id).single()

    if (!buyerProfile) {
      return NextResponse.json({ error: "Buyer profile not found" }, { status: 404 })
    }

    // Get franchise
    const { data: franchise } = await supabase.from("franchises").select("id").eq("slug", franchiseSlug).single()

    if (!franchise) {
      return NextResponse.json({ error: "Franchise not found" }, { status: 404 })
    }

    // Capture consent metadata
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Update lead_fdd_access with consent
    const { error: updateError } = await supabase
      .from("lead_fdd_access")
      .update({
        consent_given: true,
        consent_given_at: new Date().toISOString(),
        consent_ip_address: ipAddress,
        consent_user_agent: userAgent,
        status: "consent_given",
      })
      .eq("buyer_id", buyerProfile.id)
      .eq("franchise_id", franchise.id)

    if (updateError) {
      console.error("[v0] Consent update error:", updateError)
      return NextResponse.json({ error: "Failed to save consent" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Consent API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
