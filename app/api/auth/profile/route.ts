import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = user.user_metadata?.role

    if (!role) {
      return NextResponse.json({ error: "User role not found" }, { status: 404 })
    }

    // Get profile based on role
    let profile = null
    if (role === "franchisor") {
      const { data } = await supabase.from("franchisor_profiles").select("*").eq("user_id", user.id).single()
      profile = data
    } else if (role === "buyer") {
      const { data } = await supabase.from("buyer_profiles").select("*").eq("user_id", user.id).single()
      profile = data
    } else if (role === "lender") {
      const { data } = await supabase.from("lender_profiles").select("*").eq("user_id", user.id).single()
      profile = data
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: role,
      },
      profile,
    })
  } catch (error) {
    console.error("[v0] Profile fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = user.user_metadata?.role

    if (!role) {
      return NextResponse.json({ error: "User role not found" }, { status: 404 })
    }

    // Update profile based on role
    let result
    if (role === "franchisor") {
      result = await supabase.from("franchisor_profiles").update(body).eq("user_id", user.id).select().single()
    } else if (role === "buyer") {
      result = await supabase.from("buyer_profiles").update(body).eq("user_id", user.id).select().single()
    } else if (role === "lender") {
      result = await supabase.from("lender_profiles").update(body).eq("user_id", user.id).select().single()
    }

    if (result?.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 })
    }

    return NextResponse.json(result?.data)
  } catch (error) {
    console.error("[v0] Profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
