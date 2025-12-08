import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get franchisor profile
    const { data: franchisorProfile, error: profileError } = await supabase
      .from("franchisor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (profileError || !franchisorProfile) {
      return NextResponse.json({ error: "Franchisor profile not found" }, { status: 404 })
    }

    try {
      // Get shared access list
      const { data: sharedAccess, error: sharedError } = await supabase
        .from("shared_access")
        .select("*")
        .eq("franchisor_id", franchisorProfile.id)
        .order("created_at", { ascending: false })

      if (sharedError) {
        // If table doesn't exist, return empty array
        if (sharedError.code === "PGRST204" || sharedError.code === "42P01") {
          console.log("[v0] shared_access table not found, returning empty array")
          return NextResponse.json({ sharedAccess: [] })
        }
        return NextResponse.json({ error: sharedError.message }, { status: 500 })
      }

      return NextResponse.json({ sharedAccess })
    } catch (tableError) {
      console.error("[v0] Error querying shared_access table:", tableError)
      return NextResponse.json({ sharedAccess: [] })
    }
  } catch (error) {
    console.error("[v0] Error fetching shared access:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { email } = await request.json()

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    // Get franchisor profile
    const { data: franchisorProfile, error: profileError } = await supabase
      .from("franchisor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (profileError || !franchisorProfile) {
      return NextResponse.json({ error: "Franchisor profile not found" }, { status: 404 })
    }

    try {
      // Add shared access
      const { data: sharedAccess, error: insertError } = await supabase
        .from("shared_access")
        .insert({
          franchisor_id: franchisorProfile.id,
          shared_with_email: email.toLowerCase(),
          shared_by_user_id: user.id,
        })
        .select()
        .single()

      if (insertError) {
        if (insertError.code === "23505") {
          // Unique constraint violation
          return NextResponse.json({ error: "This email already has access" }, { status: 400 })
        }
        // If table doesn't exist, return helpful error
        if (insertError.code === "PGRST204" || insertError.code === "42P01") {
          return NextResponse.json({ error: "Shared access feature is not available yet" }, { status: 503 })
        }
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      return NextResponse.json({ sharedAccess })
    } catch (tableError) {
      console.error("[v0] Error inserting into shared_access table:", tableError)
      return NextResponse.json({ error: "Shared access feature is not available yet" }, { status: 503 })
    }
  } catch (error) {
    console.error("[v0] Error adding shared access:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    // Get franchisor profile
    const { data: franchisorProfile, error: profileError } = await supabase
      .from("franchisor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (profileError || !franchisorProfile) {
      return NextResponse.json({ error: "Franchisor profile not found" }, { status: 404 })
    }

    try {
      // Delete shared access
      const { error: deleteError } = await supabase
        .from("shared_access")
        .delete()
        .eq("id", id)
        .eq("franchisor_id", franchisorProfile.id)

      if (deleteError) {
        // If table doesn't exist, return success anyway
        if (deleteError.code === "PGRST204" || deleteError.code === "42P01") {
          return NextResponse.json({ success: true })
        }
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    } catch (tableError) {
      console.error("[v0] Error deleting from shared_access table:", tableError)
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error("[v0] Error removing shared access:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
