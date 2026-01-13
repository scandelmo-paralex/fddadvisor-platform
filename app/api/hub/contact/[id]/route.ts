import { getSupabaseRouteClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const supabase = await getSupabaseRouteClient()
    
    if (!supabase) {
      console.error("[ContactHistory] Database not available")
      return NextResponse.json(
        { error: "Database not available" },
        { status: 500 }
      )
    }
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error("[ContactHistory] Auth error:", authError)
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log("[ContactHistory] Fetching contact history for invitation:", id)

    // Fetch contact history for this lead
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
      .eq("invitation_id", id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[ContactHistory] Error fetching contacts:", error)
      return NextResponse.json(
        { error: "Failed to fetch contact history" },
        { status: 500 }
      )
    }

    console.log("[ContactHistory] Found", contacts?.length || 0, "contact records")

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
