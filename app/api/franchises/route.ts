import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] ===== FRANCHISES API START =====")
    const supabase = await createServerClient()

    if (!supabase) {
      console.log("[v0] Supabase client is null (missing env vars)")
      return NextResponse.json({ error: "Configuration error" }, { status: 500 })
    }

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Auth error or no user:", authError?.message)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] ✓ User authenticated:", user.email)

    const { data: profile, error: profileError } = await supabase
      .from("franchisor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()

    console.log("[v0] Franchisor profile check:", {
      hasProfile: !!profile,
      profileId: profile?.id,
      error: profileError?.message,
    })

    // Buyers don't have RLS permission to read franchisor_profiles
    let query = supabase
      .from("franchises")
      .select(`
        id,
        name,
        slug,
        industry,
        logo_url,
        description,
        cover_image_url,
        royalty_fee,
        franchise_fee,
        average_revenue,
        franchisor_id,
        total_investment_min,
        total_investment_max,
        created_at,
        updated_at,
        status,
        has_item19,
        franchise_score,
        franchise_score_breakdown,
        analytical_summary,
        risk_level,
        opportunities,
        concerns,
        competitive_advantages,
        marketing_fee
      `)
      .order("created_at", { ascending: false })

    if (profile?.id) {
      console.log("[v0] ✓ Applying franchisor filter for profile:", profile.id)
      query = query.eq("franchisor_id", profile.id)
    } else {
      console.log("[v0] No franchisor profile - showing all franchises (buyer/lender view)")
    }

    console.log("[v0] Executing query...")
    const { data: franchises, error } = await query

    if (error) {
      console.log("[v0] ✗ Query error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log("[v0] ✓ Query successful, fetched", franchises?.length || 0, "franchises")
    if (franchises && franchises.length > 0) {
      console.log("[v0] Franchise names:", franchises.map((f) => f.name).join(", "))
    }

    console.log("[v0] ===== FRANCHISES API END =====")

    return NextResponse.json(franchises || [])
  } catch (error) {
    console.error("[v0] ✗ Franchises fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Configuration error" }, { status: 500 })
    }
    const body = await request.json()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only franchisors can create franchises
    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userData?.role !== "franchisor") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get franchisor profile
    const { data: profile } = await supabase.from("franchisor_profiles").select("id").eq("user_id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Create franchise
    const { data: franchise, error } = await supabase
      .from("franchises")
      .insert({
        franchisor_id: profile.id,
        name: body.name,
        industry: body.industry,
        franchise_fee: body.franchise_fee,
        total_investment_min: body.total_investment_min,
        total_investment_max: body.total_investment_max,
        fdd_url: body.fdd_url,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(franchise)
  } catch (error) {
    console.error("[v0] ✗ Franchise creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
