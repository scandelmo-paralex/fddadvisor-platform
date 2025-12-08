import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()
    const { franchise_id } = body

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get buyer profile
    const { data: profile } = await supabase.from("buyer_profiles").select("id").eq("user_id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Update FDD access tracking
    const now = new Date().toISOString()
    const { data: access, error: accessError } = await supabase
      .from("lead_fdd_access")
      .select("id, total_views, first_viewed_at")
      .eq("buyer_id", profile.id)
      .eq("franchise_id", franchise_id)
      .single()

    if (accessError || !access) {
      return NextResponse.json({ error: "Access not found" }, { status: 404 })
    }

    // Update view tracking
    const { error: updateError } = await supabase
      .from("lead_fdd_access")
      .update({
        first_viewed_at: access.first_viewed_at || now,
        last_viewed_at: now,
        total_views: access.total_views + 1,
      })
      .eq("id", access.id)

    if (updateError) {
      console.error("[v0] Error updating FDD access:", updateError)
      return NextResponse.json({ error: "Failed to update access" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] FDD access tracking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
