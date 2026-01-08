import { getSupabaseRouteClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// POST /api/pipeline-stages/reorder - Reorder stages
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

    // Only franchisor owners can reorder stages
    const { data: profile } = await supabase
      .from("franchisor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Only franchisor owners can reorder stages" }, { status: 403 })
    }

    const body = await request.json()
    const { stageIds } = body

    if (!Array.isArray(stageIds) || stageIds.length === 0) {
      return NextResponse.json({ error: "stageIds array is required" }, { status: 400 })
    }

    // Verify all stages belong to this franchisor
    const { data: existingStages, error: fetchError } = await supabase
      .from("pipeline_stages")
      .select("id")
      .eq("franchisor_id", profile.id)
      .in("id", stageIds)

    if (fetchError) {
      return NextResponse.json({ error: "Failed to verify stages" }, { status: 500 })
    }

    if (!existingStages || existingStages.length !== stageIds.length) {
      return NextResponse.json({ error: "Some stages not found or don't belong to you" }, { status: 400 })
    }

    // Update positions based on the new order
    const updatePromises = stageIds.map((stageId, index) =>
      supabase
        .from("pipeline_stages")
        .update({ position: index })
        .eq("id", stageId)
    )

    await Promise.all(updatePromises)

    // Fetch and return the reordered stages
    const { data: reorderedStages, error: reorderError } = await supabase
      .from("pipeline_stages")
      .select("*")
      .eq("franchisor_id", profile.id)
      .order("position", { ascending: true })

    if (reorderError) {
      return NextResponse.json({ error: "Failed to fetch reordered stages" }, { status: 500 })
    }

    return NextResponse.json(reorderedStages)
  } catch (error: any) {
    console.error("Error in pipeline stages reorder:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
