import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()
    const { verification_type, data } = body

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

    // Update verification based on type
    let updateData: any = {}

    if (verification_type === "fico") {
      updateData = {
        fico_score: data.score,
        fico_verified_at: new Date().toISOString(),
      }
    } else if (verification_type === "plaid") {
      updateData = {
        plaid_connected: true,
        plaid_verified_at: new Date().toISOString(),
        liquid_capital: data.liquid_capital,
        net_worth: data.net_worth,
      }
    } else if (verification_type === "background_check") {
      updateData = {
        background_check_completed: true,
        background_check_verified_at: new Date().toISOString(),
      }
    }

    // Update buyer profile
    const { data: updatedProfile, error } = await supabase
      .from("buyer_profiles")
      .update(updateData)
      .eq("id", profile.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error("[v0] Verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
