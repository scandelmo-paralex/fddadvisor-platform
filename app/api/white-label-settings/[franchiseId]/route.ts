import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { franchiseId: string } }) {
  try {
    const supabase = await createServerClient()
    const { franchiseId } = params

    // Get white-label settings for franchise
    const { data: settings, error } = await supabase
      .from("white_label_settings")
      .select("*")
      .eq("franchise_id", franchiseId)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Return default settings if none exist
    if (!settings) {
      return NextResponse.json({
        franchise_id: franchiseId,
        primary_color: "#2563eb",
        accent_color: "#10b981",
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("[v0] White-label settings fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { franchiseId: string } }) {
  try {
    const supabase = await createServerClient()
    const { franchiseId } = params
    const body = await request.json()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get franchisor profile
    const { data: profile } = await supabase.from("franchisor_profiles").select("id").eq("user_id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Verify franchise ownership
    const { data: franchise } = await supabase
      .from("franchises")
      .select("id")
      .eq("id", franchiseId)
      .eq("franchisor_id", profile.id)
      .single()

    if (!franchise) {
      return NextResponse.json({ error: "Franchise not found or unauthorized" }, { status: 403 })
    }

    // Upsert white-label settings
    const { data: settings, error } = await supabase
      .from("white_label_settings")
      .upsert(
        {
          franchise_id: franchiseId,
          franchisor_id: profile.id,
          logo_url: body.logo_url,
          primary_color: body.primary_color,
          accent_color: body.accent_color,
          header_text: body.header_text,
          contact_name: body.contact_name,
          contact_email: body.contact_email,
          contact_phone: body.contact_phone,
          resources_video_url: body.resources_video_url || null,
          resources_video_title: body.resources_video_title || null,
          resources_video_description: body.resources_video_description || null,
        },
        {
          onConflict: "franchise_id",
        },
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("[v0] White-label settings update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
