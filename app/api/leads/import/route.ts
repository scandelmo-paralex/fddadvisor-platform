import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()
    const { franchise_id, leads } = body

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only franchisors can import leads
    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userData?.role !== "franchisor") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Verify franchise ownership
    const { data: profile } = await supabase.from("franchisor_profiles").select("id").eq("user_id", user.id).single()

    const { data: franchise } = await supabase
      .from("franchises")
      .select("id")
      .eq("id", franchise_id)
      .eq("franchisor_id", profile?.id)
      .single()

    if (!franchise) {
      return NextResponse.json({ error: "Franchise not found or unauthorized" }, { status: 404 })
    }

    // Prepare leads for insertion
    const leadsToInsert = leads.map((lead: any) => ({
      franchise_id,
      email: lead.email,
      name: lead.name,
      phone: lead.phone,
      source: lead.source || "import",
      connection_type: "franchisor_initiated",
      fdd_link_id: crypto.randomUUID(),
      status: "invited",
    }))

    // Bulk insert leads
    const { data: insertedLeads, error } = await supabase.from("leads").insert(leadsToInsert).select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      count: insertedLeads?.length || 0,
      leads: insertedLeads,
    })
  } catch (error) {
    console.error("[v0] Lead import error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
