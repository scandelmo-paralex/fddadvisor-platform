import { getSupabaseRouteClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// PATCH /api/leads/[id]/stage - Update a lead's stage
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params
    console.log("[PATCH /api/leads/[id]/stage] Starting update for lead:", leadId)
    
    const supabase = await getSupabaseRouteClient()

    if (!supabase) {
      console.log("[PATCH lead stage] Database not available")
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[PATCH lead stage] Auth error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.log("[PATCH lead stage] Authenticated user:", user.id)

    // Get franchisor ID (owner or team member)
    const { data: profile, error: profileError } = await supabase
      .from("franchisor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    let franchisorId: string | null = profile?.id || null
    console.log("[PATCH lead stage] Franchisor profile:", profile?.id, "error:", profileError?.message)

    if (!franchisorId) {
      // Check if user is a team member
      const { data: teamMember, error: teamError } = await supabase
        .from("franchisor_team_members")
        .select("franchisor_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single()

      franchisorId = teamMember?.franchisor_id || null
      console.log("[PATCH lead stage] Team member franchisor_id:", franchisorId, "error:", teamError?.message)
    }

    if (!franchisorId) {
      console.log("[PATCH lead stage] Not associated with any franchisor")
      return NextResponse.json({ error: "Not associated with any franchisor" }, { status: 403 })
    }

    const body = await request.json()
    console.log("[PATCH lead stage] Request body:", JSON.stringify(body))
    const { stage_id, notes } = body

    if (!stage_id) {
      console.log("[PATCH lead stage] stage_id is missing")
      return NextResponse.json({ error: "stage_id is required" }, { status: 400 })
    }

    // Verify the lead belongs to this franchisor
    const { data: lead, error: leadError } = await supabase
      .from("lead_invitations")
      .select("id, stage_id, stage_changed_at, franchisor_id")
      .eq("id", leadId)
      .single()

    console.log("[PATCH lead stage] Lead lookup - found:", !!lead, "error:", leadError?.message)

    if (leadError || !lead) {
      console.log("[PATCH lead stage] Lead not found:", leadId)
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    console.log("[PATCH lead stage] Lead franchisor_id:", lead.franchisor_id, "User franchisor_id:", franchisorId)
    if (lead.franchisor_id !== franchisorId) {
      console.log("[PATCH lead stage] Lead does not belong to user's organization")
      return NextResponse.json({ error: "Lead does not belong to your organization" }, { status: 403 })
    }

    // Verify the new stage belongs to this franchisor
    const { data: stage, error: stageError } = await supabase
      .from("pipeline_stages")
      .select("id, name, franchisor_id")
      .eq("id", stage_id)
      .single()

    console.log("[PATCH lead stage] Stage lookup - found:", !!stage, "error:", stageError?.message)

    if (stageError || !stage) {
      console.log("[PATCH lead stage] Stage not found:", stage_id)
      return NextResponse.json({ error: "Stage not found" }, { status: 404 })
    }

    if (stage.franchisor_id !== franchisorId) {
      console.log("[PATCH lead stage] Stage does not belong to user's organization")
      return NextResponse.json({ error: "Stage does not belong to your organization" }, { status: 403 })
    }

    // Calculate time in previous stage
    let timeInPreviousStage: number | null = null
    if (lead.stage_changed_at) {
      const previousChangeDate = new Date(lead.stage_changed_at)
      const now = new Date()
      timeInPreviousStage = Math.floor((now.getTime() - previousChangeDate.getTime()) / 1000)
    }

    // Record stage history if there was a previous stage
    if (lead.stage_id && lead.stage_id !== stage_id) {
      console.log("[PATCH lead stage] Recording stage history...")
      const { error: historyError } = await supabase.from("lead_stage_history").insert({
        lead_invitation_id: leadId,
        from_stage_id: lead.stage_id,
        to_stage_id: stage_id,
        changed_by: user.id,
        notes: notes || null,
        time_in_previous_stage: timeInPreviousStage,
      })
      if (historyError) {
        console.log("[PATCH lead stage] Stage history error:", historyError.message)
      }
    }

    // Update the lead's stage
    console.log("[PATCH lead stage] Updating lead stage to:", stage_id)
    const { data: updatedLead, error: updateError } = await supabase
      .from("lead_invitations")
      .update({
        stage_id: stage_id,
        stage_changed_at: new Date().toISOString(),
        stage_changed_by: user.id,
      })
      .eq("id", leadId)
      .select("*, pipeline_stages:stage_id(id, name, color)")
      .single()

    if (updateError) {
      console.error("[PATCH lead stage] Error updating lead stage:", updateError)
      return NextResponse.json({ error: "Failed to update lead stage: " + updateError.message }, { status: 500 })
    }

    console.log("[PATCH lead stage] Successfully updated lead stage")
    return NextResponse.json({
      lead: updatedLead,
      stage: stage,
      message: `Lead moved to ${stage.name}`,
    })
  } catch (error: any) {
    console.error("[PATCH lead stage] Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
