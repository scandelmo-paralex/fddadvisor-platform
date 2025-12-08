import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { sendFDDEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()
    const { lead_id } = body

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get lead with franchise details
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select(`
        *,
        franchise:franchises(
          *,
          franchisor:franchisor_profiles(*)
        )
      `)
      .eq("id", lead_id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    // Verify ownership
    const { data: profile } = await supabase.from("franchisor_profiles").select("id").eq("user_id", user.id).single()

    if (lead.franchise.franchisor_id !== profile?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Generate FDD link
    const fddLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/fdd/${lead.fdd_link_id}`

    try {
      await sendFDDEmail({
        to: lead.email,
        leadName: lead.name,
        franchiseName: lead.franchise.name,
        fddLink,
        franchisorName: lead.franchise.franchisor.company_name,
      })
    } catch (emailError) {
      console.error("[v0] Failed to send FDD email:", emailError)
      // Don't fail the request if email fails
    }

    // Update lead status
    await supabase
      .from("leads")
      .update({
        status: "invited",
        fdd_sent_at: new Date().toISOString(),
      })
      .eq("id", lead_id)

    return NextResponse.json({
      success: true,
      message: "FDD link sent successfully",
      fdd_link: fddLink,
    })
  } catch (error) {
    console.error("[v0] Send FDD error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
