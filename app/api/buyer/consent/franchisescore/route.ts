import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fddId = searchParams.get("fdd_id")

    if (!fddId) {
      return NextResponse.json({ error: "fdd_id is required" }, { status: 400 })
    }

    const supabase = await createClient()

    let user = null
    try {
      const { data } = await supabase.auth.getUser()
      user = data?.user
    } catch (authError) {
      console.log("[v0] Auth not available, using session-based consent")
    }

    if (!user) {
      // For non-authenticated users, default to not consented
      // In preview/testing mode, we'll allow consent via session storage on client
      return NextResponse.json({ consented: false, authRequired: false })
    }

    // Check for existing consent for this specific FDD
    const { data: consent, error } = await supabase
      .from("fdd_franchisescore_consents")
      .select("consented, consented_at")
      .eq("user_id", user.id)
      .eq("fdd_id", fddId)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned, which is fine
      console.error("Error fetching consent:", error)
      return NextResponse.json({ consented: false })
    }

    return NextResponse.json({
      consented: consent?.consented || false,
      consentedAt: consent?.consented_at || null,
    })
  } catch (error) {
    console.error("Error in consent check:", error)
    return NextResponse.json({ consented: false })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { fddId, consented } = body

    if (!fddId) {
      return NextResponse.json({ error: "fdd_id is required" }, { status: 400 })
    }

    const supabase = await createClient()

    let user = null
    try {
      const { data } = await supabase.auth.getUser()
      user = data?.user
    } catch (authError) {
      console.log("[v0] Auth not available for consent save")
    }

    if (!user) {
      // return success without saving to database - client will use sessionStorage
      return NextResponse.json({
        success: true,
        consented: consented === true,
        consentedAt: new Date().toISOString(),
        sessionOnly: true,
      })
    }

    // Get request metadata
    const userAgent = request.headers.get("user-agent") || ""
    const forwardedFor = request.headers.get("x-forwarded-for")
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown"

    // Upsert consent record for this specific FDD
    const { data, error } = await supabase
      .from("fdd_franchisescore_consents")
      .upsert(
        {
          user_id: user.id,
          fdd_id: fddId,
          consented: consented === true,
          consented_at: consented === true ? new Date().toISOString() : null,
          ip_address: ipAddress,
          user_agent: userAgent,
        },
        {
          onConflict: "user_id,fdd_id",
        },
      )
      .select()
      .single()

    if (error) {
      console.error("Error saving consent:", error)
      return NextResponse.json({ error: "Failed to save consent" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      consented: data.consented,
      consentedAt: data.consented_at,
    })
  } catch (error) {
    console.error("Error in consent save:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
