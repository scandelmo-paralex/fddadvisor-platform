import { getSupabaseRouteClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// PATCH /api/pipeline-stages/[id] - Update a stage
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Only franchisor owners can update stages
    const { data: profile } = await supabase
      .from("franchisor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Only franchisor owners can update stages" }, { status: 403 })
    }

    const stageId = params.id
    const body = await request.json()
    const { name, description, color, is_default, is_closed_won, is_closed_lost } = body

    // Verify the stage belongs to this franchisor
    const { data: existingStage, error: fetchError } = await supabase
      .from("pipeline_stages")
      .select("*")
      .eq("id", stageId)
      .eq("franchisor_id", profile.id)
      .single()

    if (fetchError || !existingStage) {
      return NextResponse.json({ error: "Stage not found" }, { status: 404 })
    }

    // If setting as default, unset other defaults first
    if (is_default && !existingStage.is_default) {
      await supabase
        .from("pipeline_stages")
        .update({ is_default: false })
        .eq("franchisor_id", profile.id)
        .eq("is_default", true)
    }

    // If setting as closed_won, unset other closed_won first
    if (is_closed_won && !existingStage.is_closed_won) {
      await supabase
        .from("pipeline_stages")
        .update({ is_closed_won: false })
        .eq("franchisor_id", profile.id)
        .eq("is_closed_won", true)
    }

    // If setting as closed_lost, unset other closed_lost first
    if (is_closed_lost && !existingStage.is_closed_lost) {
      await supabase
        .from("pipeline_stages")
        .update({ is_closed_lost: false })
        .eq("franchisor_id", profile.id)
        .eq("is_closed_lost", true)
    }

    // Build update object
    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (color !== undefined) updateData.color = color
    if (is_default !== undefined) updateData.is_default = is_default
    if (is_closed_won !== undefined) updateData.is_closed_won = is_closed_won
    if (is_closed_lost !== undefined) updateData.is_closed_lost = is_closed_lost

    const { data: updatedStage, error: updateError } = await supabase
      .from("pipeline_stages")
      .update(updateData)
      .eq("id", stageId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating pipeline stage:", updateError)
      if (updateError.code === "23505") {
        return NextResponse.json({ error: "A stage with this name already exists" }, { status: 409 })
      }
      return NextResponse.json({ error: "Failed to update stage" }, { status: 500 })
    }

    return NextResponse.json(updatedStage)
  } catch (error: any) {
    console.error("Error in pipeline stages PATCH:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/pipeline-stages/[id] - Delete a stage
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Only franchisor owners can delete stages
    const { data: profile } = await supabase
      .from("franchisor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Only franchisor owners can delete stages" }, { status: 403 })
    }

    const stageId = params.id

    // Verify the stage belongs to this franchisor
    const { data: existingStage, error: fetchError } = await supabase
      .from("pipeline_stages")
      .select("*")
      .eq("id", stageId)
      .eq("franchisor_id", profile.id)
      .single()

    if (fetchError || !existingStage) {
      return NextResponse.json({ error: "Stage not found" }, { status: 404 })
    }

    // Check if there are leads in this stage
    const { count: leadsCount } = await supabase
      .from("lead_invitations")
      .select("*", { count: "exact", head: true })
      .eq("stage_id", stageId)

    if (leadsCount && leadsCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete stage with ${leadsCount} lead(s). Move leads to another stage first.` },
        { status: 400 }
      )
    }

    // Delete the stage
    const { error: deleteError } = await supabase
      .from("pipeline_stages")
      .delete()
      .eq("id", stageId)

    if (deleteError) {
      console.error("Error deleting pipeline stage:", deleteError)
      return NextResponse.json({ error: "Failed to delete stage" }, { status: 500 })
    }

    // Reorder remaining stages to close the gap
    const { data: remainingStages } = await supabase
      .from("pipeline_stages")
      .select("id, position")
      .eq("franchisor_id", profile.id)
      .order("position", { ascending: true })

    if (remainingStages) {
      for (let i = 0; i < remainingStages.length; i++) {
        if (remainingStages[i].position !== i) {
          await supabase
            .from("pipeline_stages")
            .update({ position: i })
            .eq("id", remainingStages[i].id)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in pipeline stages DELETE:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
