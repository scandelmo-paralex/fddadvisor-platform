import { getSupabaseRouteClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await getSupabaseRouteClient()

    if (!supabase) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a franchisor owner
    const { data: profile, error: profileError } = await supabase
      .from("franchisor_profiles")
      .select("id, pipeline_lead_value, company_name")
      .eq("user_id", user.id)
      .single()

    if (profile) {
      console.log("[franchisor-settings] Found profile:", profile.company_name, "pipeline_lead_value:", profile.pipeline_lead_value)
      return NextResponse.json({
        pipeline_lead_value: profile.pipeline_lead_value || 50000,
        company_name: profile.company_name,
      })
    }

    // Check if user is a team member
    const { data: teamMember, error: tmError } = await supabase
      .from("franchisor_team_members")
      .select(`
        franchisor_id,
        franchisor:franchisor_profiles(
          id,
          pipeline_lead_value,
          company_name
        )
      `)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (tmError || !teamMember) {
      return NextResponse.json({ error: "Not associated with any franchisor" }, { status: 403 })
    }

    const franchisor = teamMember.franchisor as any

    return NextResponse.json({
      pipeline_lead_value: franchisor?.pipeline_lead_value || 50000,
      company_name: franchisor?.company_name,
    })
  } catch (error: any) {
    console.error("[franchisor-settings] Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
