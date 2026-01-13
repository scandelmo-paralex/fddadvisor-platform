import { getSupabaseRouteClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params
    
    const supabase = await getSupabaseRouteClient()
    
    if (!supabase) {
      console.error("[ContactHistoryAPI] Database not available")
      return NextResponse.json(
        { error: "Database not available" },
        { status: 500 }
      )
    }
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error("[ContactHistoryAPI] Auth error:", authError)
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log("[ContactHistoryAPI] Fetching contact history for lead:", leadId)

    // Fetch contact history for this lead/invitation
    const { data: contacts, error: fetchError } = await supabase
      .from("lead_contact_log")
      .select("*")
      .eq("invitation_id", leadId)
      .order("created_at", { ascending: false })

    if (fetchError) {
      console.error("[ContactHistoryAPI] Error fetching contacts:", fetchError)
      return NextResponse.json(
        { error: "Failed to fetch contact history" },
        { status: 500 }
      )
    }

    console.log("[ContactHistoryAPI] Found", contacts?.length || 0, "contact records")

    return NextResponse.json({
      contacts: contacts || [],
    })

  } catch (error: any) {
    console.error("[ContactHistoryAPI] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch contact history" },
      { status: 500 }
    )
  }
}
