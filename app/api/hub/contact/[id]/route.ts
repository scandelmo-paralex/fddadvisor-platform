import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const invitationId = params.id

    // Fetch contact history for this lead
    // RLS policies will handle access control
    const { data: contacts, error } = await supabase
      .from("lead_contact_log")
      .select(`
        id,
        sender_name,
        sender_email,
        subject,
        message,
        created_at
      `)
      .eq("invitation_id", invitationId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[ContactHistory] Error fetching contacts:", error)
      return NextResponse.json(
        { error: "Failed to fetch contact history" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      contacts: contacts || [],
      count: contacts?.length || 0,
    })

  } catch (error: any) {
    console.error("[ContactHistory] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch contact history" },
      { status: 500 }
    )
  }
}
