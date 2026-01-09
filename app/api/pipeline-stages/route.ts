import { getSupabaseRouteClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export interface PipelineStage {
  id: string
  franchisor_id: string
  name: string
  description: string | null
  color: string
  position: number
  is_default: boolean
  is_closed_won: boolean
  is_closed_lost: boolean
  created_at: string
  updated_at: string
}

// GET /api/pipeline-stages - List all stages for the franchisor
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

    // Get franchisor ID (either owner or team member)
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

    // Get all stages for this franchisor, ordered by position
    const { data: stages, error: stagesError } = await supabase
      .from("pipeline_stages")
      .select("*")
      .eq("franchisor_id", franchisorId)
      .order("position", { ascending: true })

    if (stagesError) {
      console.error("Error fetching pipeline stages:", stagesError)
      return NextResponse.json({ error: "Failed to fetch stages" }, { status: 500 })
    }

    return NextResponse.json(stages || [])
  } catch (error: any) {
    console.error("Error in pipeline stages GET:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

// POST /api/pipeline-stages - Create a new stage
export async function POST(request: Request) {
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

    // Only franchisor owners can create stages
    const { data: profile } = await supabase
      .from("franchisor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Only franchisor owners can create stages" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, color, is_default, is_closed_won, is_closed_lost } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Stage name is required" }, { status: 400 })
    }

    // Get the highest position to add new stage at the end
    const { data: maxPositionData } = await supabase
      .from("pipeline_stages")
      .select("position")
      .eq("franchisor_id", profile.id)
      .order("position", { ascending: false })
      .limit(1)
      .single()

    const newPosition = (maxPositionData?.position ?? -1) + 1

    // If setting as default, unset other defaults first
    if (is_default) {
      await supabase
        .from("pipeline_stages")
        .update({ is_default: false })
        .eq("franchisor_id", profile.id)
        .eq("is_default", true)
    }

    // If setting as closed_won, unset other closed_won first
    if (is_closed_won) {
      await supabase
        .from("pipeline_stages")
        .update({ is_closed_won: false })
        .eq("franchisor_id", profile.id)
        .eq("is_closed_won", true)
    }

    // If setting as closed_lost, unset other closed_lost first
    if (is_closed_lost) {
      await supabase
        .from("pipeline_stages")
        .update({ is_closed_lost: false })
        .eq("franchisor_id", profile.id)
        .eq("is_closed_lost", true)
    }

    const { data: newStage, error: createError } = await supabase
      .from("pipeline_stages")
      .insert({
        franchisor_id: profile.id,
        name: name.trim(),
        description: description?.trim() || null,
        color: color || "#6B7280",
        position: newPosition,
        is_default: is_default || false,
        is_closed_won: is_closed_won || false,
        is_closed_lost: is_closed_lost || false,
      })
      .select()
      .single()

    if (createError) {
      console.error("Error creating pipeline stage:", createError)
      if (createError.code === "23505") {
        return NextResponse.json({ error: "A stage with this name already exists" }, { status: 409 })
      }
      return NextResponse.json({ error: "Failed to create stage" }, { status: 500 })
    }

    return NextResponse.json(newStage, { status: 201 })
  } catch (error: any) {
    console.error("Error in pipeline stages POST:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
