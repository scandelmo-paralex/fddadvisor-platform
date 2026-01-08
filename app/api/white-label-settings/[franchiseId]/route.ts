import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ franchiseId: string }> }) {
  try {
    const supabase = await createServerClient()
    const { franchiseId } = await params

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

export async function PUT(request: Request, { params }: { params: Promise<{ franchiseId: string }> }) {
  try {
    const supabase = await createServerClient()
    const { franchiseId } = await params
    const body = await request.json()

    console.log("[v0] PUT white-label-settings - franchiseId:", franchiseId)

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Auth error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] User ID:", user.id)

    // Get franchisor profile
    const { data: profile, error: profileError } = await supabase
      .from("franchisor_profiles")
      .select("id, is_admin")
      .eq("user_id", user.id)
      .single()

    console.log("[v0] Profile:", profile, "Error:", profileError)

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Verify franchise ownership OR admin access
    let hasAccess = false
    
    // Check franchise ownership
    const { data: franchise, error: franchiseError } = await supabase
      .from("franchises")
      .select("id, franchisor_id")
      .eq("id", franchiseId)
      .single()

    console.log("[v0] Franchise lookup:", franchise, "Error:", franchiseError)
    console.log("[v0] Comparing franchisor_id:", franchise?.franchisor_id, "with profile.id:", profile.id)
    console.log("[v0] is_admin:", profile.is_admin)

    if (franchise) {
      // Allow if admin OR if franchisor_id matches profile.id
      hasAccess = profile.is_admin || franchise.franchisor_id === profile.id
    }

    console.log("[v0] hasAccess:", hasAccess)

    if (!hasAccess) {
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
