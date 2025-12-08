import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { logoUrl } = await request.json()

    if (!logoUrl) {
      return NextResponse.json({ error: "Logo URL is required" }, { status: 400 })
    }

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: franchisorProfile, error: franchisorError } = await supabase
      .from("franchisor_profiles")
      .update({ logo_url: logoUrl })
      .eq("user_id", user.id)
      .select()
      .single()

    if (franchisorError) {
      console.error("[v0] Error updating franchisor profile:", franchisorError)
      return NextResponse.json({ error: "Failed to update franchisor profile" }, { status: 500 })
    }

    const { error: franchiseError } = await supabase
      .from("franchises")
      .update({ logo_url: logoUrl })
      .eq("franchisor_id", franchisorProfile.id)

    if (franchiseError) {
      console.error("[v0] Error updating franchise logos:", franchiseError)
      // Don't fail the request if franchise update fails, just log it
    }

    return NextResponse.json({ success: true, logoUrl })
  } catch (error) {
    console.error("[v0] Logo update error:", error)
    return NextResponse.json({ error: "Failed to update logo" }, { status: 500 })
  }
}
