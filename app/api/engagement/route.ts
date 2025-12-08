import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()
    const { lead_id, event_type, metadata } = body

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify lead access
    const { data: lead } = await supabase.from("leads").select("id, buyer_profile_id").eq("id", lead_id).single()

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    // Get buyer profile
    const { data: profile } = await supabase.from("buyer_profiles").select("id").eq("user_id", user.id).single()

    if (lead.buyer_profile_id !== profile?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Create engagement event
    const { data: event, error } = await supabase
      .from("engagement_events")
      .insert({
        lead_id,
        event_type,
        metadata,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Update lead status if needed
    if (event_type === "fdd_viewed" && lead) {
      await supabase.from("leads").update({ status: "viewing" }).eq("id", lead_id).eq("status", "signed_up") // Only update if still in signed_up status
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error("[v0] Engagement tracking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
