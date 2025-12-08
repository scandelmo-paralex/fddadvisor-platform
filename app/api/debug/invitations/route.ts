import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    // Get all invitations
    const { data: invitations, error } = await supabase
      .from("lead_invitations")
      .select("id, invitation_token, lead_email, lead_name, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Return invitation details with token info
    const debugInfo = invitations?.map((inv) => ({
      id: inv.id,
      lead_email: inv.lead_email,
      lead_name: inv.lead_name,
      status: inv.status,
      created_at: inv.created_at,
      token_length: inv.invitation_token?.length || 0,
      token_first_10: inv.invitation_token?.substring(0, 10) || "N/A",
      token_last_10: inv.invitation_token?.substring(inv.invitation_token.length - 10) || "N/A",
      full_token: inv.invitation_token, // Include full token for debugging
    }))

    return NextResponse.json({
      count: invitations?.length || 0,
      invitations: debugInfo,
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
