import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
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

    // Get user role
    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    let query = supabase
      .from("pre_approval_requests")
      .select(`
        *,
        buyer:buyer_profiles(*),
        lender:lender_profiles(*),
        franchise:franchises(*)
      `)
      .order("created_at", { ascending: false })

    // Buyers see their own requests
    if (userData?.role === "buyer") {
      const { data: profile } = await supabase.from("buyer_profiles").select("id").eq("user_id", user.id).single()

      query = query.eq("buyer_profile_id", profile?.id)
    }

    // Lenders see requests assigned to them
    if (userData?.role === "lender") {
      const { data: profile } = await supabase.from("lender_profiles").select("id").eq("user_id", user.id).single()

      query = query.eq("lender_id", profile?.id)
    }

    const { data: requests, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(requests)
  } catch (error) {
    console.error("[v0] Pre-approval requests fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only buyers can create pre-approval requests
    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userData?.role !== "buyer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get buyer profile
    const { data: profile } = await supabase.from("buyer_profiles").select("id").eq("user_id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Create pre-approval request
    const { data: preApproval, error } = await supabase
      .from("pre_approval_requests")
      .insert({
        buyer_profile_id: profile.id,
        lender_id: body.lender_id,
        franchise_id: body.franchise_id,
        requested_amount: body.requested_amount,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(preApproval)
  } catch (error) {
    console.error("[v0] Pre-approval request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
