import { getSupabaseRouteClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// PATCH /api/leads/[id]/stage - Update a lead's stage
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params
    
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

    // Get franchisor ID (owner or team member)
    const { data: profile } = await supabase
      .from("franchisor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    let franchisorId: string | null = profile?.id || null

    if (!franchisorId) {
      // Check if user is a team member
      const { data: teamMember } = await supabase
        .from("franchisor_team_members")
        .select("franchisor_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single()

      franchisorId = teamMember?.franchisor_id || null
    }

    if (!franchisorId) {
      return NextResponse.json({ error: "Not associated with any franchisor" }, { status: 403 })
    }

    const body = await request.json()
    const { stage_id, notes } = body

    if (!stage_id) {
      return NextResponse.json({ error: "stage_id is required" }, { status: 400 })
    }

    // Verify the lead belongs to this franchisor
    const { data: lead, error: leadError } = await supabase
      .from("lead_invitations")
      .select("id, stage_id, stage_changed_at, franchisor_id")
      .eq("id", leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    if (lead.franchisor_id !== franchisorId) {
      return NextResponse.json({ error: "Lead does not belong to your organization" }, { status: 403 })
    }

    // Verify the new stage belongs to this franchisor
    const { data: stage, error: stageError } = await supabase
      .from("pipeline_stages")
      .select("id, name, franchisor_id")
      .eq("id", stage_id)
      .single()

    if (stageError || !stage) {
      return NextResponse.json({ error: "Stage not found" }, { status: 404 })
    }

    if (stage.franchisor_id !== franchisorId) {
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
      await supabase.from("lead_stage_history").insert({
        lead_invitation_id: leadId,
        from_stage_id: lead.stage_id,
        to_stage_id: stage_id,
        changed_by: user.id,
        notes: notes || null,
        time_in_previous_stage: timeInPreviousStage,
      })
    }

    // Update the lead's stage
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
      console.error("Error updating lead stage:", updateError)
      return NextResponse.json({ error: "Failed to update lead stage" }, { status: 500 })
    }

    return NextResponse.json({
      lead: updatedLead,
      stage: stage,
      message: `Lead moved to ${stage.name}`,
    })
  } catch (error: any) {
    console.error("Error in lead stage PATCH:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
