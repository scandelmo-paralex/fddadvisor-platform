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

    console.log("[ContactHistory] Fetching contact history for id:", id)

    // The id might be from different sources:
    // 1. lead_invitations.id (invitation_id) - direct match
    // 2. lead_fdd_access.id - need to look up the invitation
    
    let invitationId = id
    
    // First, try to find if this is a valid invitation_id directly
    const { data: directInvitation } = await supabase
      .from("lead_invitations")
      .select("id")
      .eq("id", id)
      .single()
    
    if (!directInvitation) {
      console.log("[ContactHistory] id is not a direct invitation_id, searching...")
      
      // Try to find the invitation via lead_fdd_access
      const { data: access } = await supabase
        .from("lead_fdd_access")
        .select("buyer_id, franchise_id")
        .eq("id", id)
        .single()
      
      if (access) {
        console.log("[ContactHistory] Found lead_fdd_access, looking up invitation by buyer_id:", access.buyer_id)
        
        // Find the invitation for this buyer/franchise combination
        const { data: invitation } = await supabase
          .from("lead_invitations")
          .select("id")
          .eq("buyer_id", access.buyer_id)
          .eq("franchise_id", access.franchise_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()
        
        if (invitation) {
          invitationId = invitation.id
          console.log("[ContactHistory] Found invitation_id:", invitationId)
        } else {
          console.log("[ContactHistory] No invitation found for this lead_fdd_access")
          return NextResponse.json({
            contacts: [],
            count: 0,
          })
        }
      } else {
        console.log("[ContactHistory] No lead_fdd_access or invitation found for id:", id)
        return NextResponse.json({
          contacts: [],
          count: 0,
        })
      }
    } else {
      console.log("[ContactHistory] id is a valid invitation_id:", id)
    }

    // Fetch contact history for this invitation
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
