import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const token = url.searchParams.get("token")

    // Test 1: Create service role client
    const supabase = createServiceRoleClient()

    // Test 2: Query all invitations
    const { data: allInvitations, error: allError } = await supabase
      .from("lead_invitations")
      .select("id, invitation_token, lead_email, status")
      .order("created_at", { ascending: false })
      .limit(5)

    // Test 3: Query specific token if provided
    let specificInvitation = null
    let specificError = null
    if (token) {
      const result = await supabase.from("lead_invitations").select("*").eq("invitation_token", token).single()

      specificInvitation = result.data
      specificError = result.error
    }

    return NextResponse.json({
      success: true,
      serviceRoleWorking: true,
      allInvitations: {
        count: allInvitations?.length || 0,
        data: allInvitations,
        error: allError,
      },
      specificToken: token
        ? {
            found: !!specificInvitation,
            data: specificInvitation,
            error: specificError,
          }
        : null,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null,
      },
      { status: 500 },
    )
  }
}
