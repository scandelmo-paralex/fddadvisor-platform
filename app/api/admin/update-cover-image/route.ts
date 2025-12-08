import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { franchiseId, coverImageUrl } = await request.json()

    if (!franchiseId) {
      return NextResponse.json({ error: "Franchise ID required" }, { status: 400 })
    }

    // Update franchise cover image
    const { error } = await supabase.from("franchises").update({ cover_image_url: coverImageUrl }).eq("id", franchiseId)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to update cover image" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
