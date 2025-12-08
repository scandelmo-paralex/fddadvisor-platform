import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const testToken = "4de8c08e99a28b4094a5f7d5d172019767994f2d270e65fe3938b721700f1827"

    // Test 1: Query by invitation_token
    const { data: byToken, error: tokenError } = await supabase
      .from("lead_invitations")
      .select("*")
      .eq("invitation_token", testToken)
      .single()

    // Test 2: Get all invitations to see what exists
    const { data: allInvitations, error: allError } = await supabase
      .from("lead_invitations")
      .select("id, lead_email, invitation_token, status")
      .limit(5)

    return NextResponse.json({
      test1_query_by_token: {
        success: !tokenError,
        data: byToken,
        error: tokenError,
      },
      test2_all_invitations: {
        success: !allError,
        count: allInvitations?.length || 0,
        data: allInvitations,
        error: allError,
      },
      environment: {
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        supabaseUrl: process.env.SUPABASE_URL,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
