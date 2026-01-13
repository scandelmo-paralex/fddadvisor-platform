import { getSupabaseRouteClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { sendContactEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseRouteClient()
    
    if (!supabase) {
      console.error("[ContactAPI] Database not available")
      return NextResponse.json(
        { error: "Database not available" },
        { status: 500 }
      )
    }
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error("[ContactAPI] Auth error:", authError)
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { leadId, to, leadName, subject, message } = body

    console.log("[ContactAPI] Received request:", { leadId, to, leadName, subject: subject?.substring(0, 50) })

    if (!to || !leadName || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields: to, leadName, subject, message" },
        { status: 400 }
      )
    }

    console.log("[ContactAPI] Looking up franchisor profile for user:", user.id, "email:", user.email)
    
    // First, let's see ALL franchisor profiles to debug
    const { data: allProfiles, error: allError } = await supabase
      .from("franchisor_profiles")
      .select("id, user_id, company_name")
    
    console.log("[ContactAPI] DEBUG - All franchisor_profiles visible:", {
      count: allProfiles?.length || 0,
      profiles: allProfiles?.map(p => ({ id: p.id, user_id: p.user_id, company: p.company_name })),
      error: allError?.message
    })
    
    // Get franchisor profile to get company name and sender details
    const { data: franchisorProfile, error: fpError } = await supabase
      .from("franchisor_profiles")
      .select("id, company_name, contact_name, contact_email")
      .eq("user_id", user.id)
      .single()

    console.log("[ContactAPI] Direct franchisor_profiles lookup result:", { 
      found: !!franchisorProfile, 
      error: fpError?.message,
      profileId: franchisorProfile?.id 
    })

    // If not owner, check if team member
    let senderName = ""
    let senderEmail = ""
    let companyName = ""
    let franchisorId = ""

    if (franchisorProfile) {
      franchisorId = franchisorProfile.id
      companyName = franchisorProfile.company_name || "Your Franchise"
      senderName = franchisorProfile.contact_name || "Your Franchise Team"
      senderEmail = franchisorProfile.contact_email || user.email || ""
      console.log("[ContactAPI] Franchisor owner:", { companyName, senderName })
    } else {
      console.log("[ContactAPI] User is not direct owner, checking team membership...")
      
      // Check team membership - use franchisor_id to get the profile
      const { data: teamMember, error: tmError } = await supabase
        .from("franchisor_team_members")
        .select(`
          first_name,
          last_name,
          franchisor_id
        `)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single()

      console.log("[ContactAPI] Team member lookup result:", { 
        found: !!teamMember, 
        error: tmError?.message,
        franchisorId: teamMember?.franchisor_id 
      })

      if (!teamMember) {
        console.error("[ContactAPI] No franchisor profile or team membership found for user:", user.id)
        return NextResponse.json(
          { error: "No franchisor profile found" },
          { status: 403 }
        )
      }

      // Now fetch the franchisor profile using franchisor_id
      const { data: franchisorFromTeam, error: ftError } = await supabase
        .from("franchisor_profiles")
        .select("id, company_name, contact_email")
        .eq("id", teamMember.franchisor_id)
        .single()

      console.log("[ContactAPI] Franchisor profile from team membership:", { 
        found: !!franchisorFromTeam, 
        error: ftError?.message,
        companyName: franchisorFromTeam?.company_name 
      })

      if (!franchisorFromTeam) {
        console.error("[ContactAPI] Could not find franchisor profile for team member's franchisor_id:", teamMember.franchisor_id)
        return NextResponse.json(
          { error: "No franchisor profile found" },
          { status: 403 }
        )
      }

      franchisorId = teamMember.franchisor_id
      companyName = franchisorFromTeam.company_name || "Your Franchise"
      senderName = `${teamMember.first_name || ''} ${teamMember.last_name || ''}`.trim() || "Your Franchise Team"
      senderEmail = user.email || ""
      console.log("[ContactAPI] Team member:", { companyName, senderName })
    }

    // Send the email
    console.log("[ContactAPI] Sending email to:", to)
    try {
      await sendContactEmail({
        to,
        leadName,
        franchiseName: companyName,
        subject,
        message,
        senderName,
        senderEmail,
      })
      console.log("[ContactAPI] Email sent successfully to:", to)
    } catch (emailError: any) {
      console.error("[ContactAPI] Email send failed:", emailError)
      return NextResponse.json(
        { error: `Failed to send email: ${emailError.message}` },
        { status: 500 }
      )
    }

    // Log the contact activity (optional - don't fail if table doesn't exist)
    if (leadId) {
      try {
        const { error: logError } = await supabase
          .from("lead_contact_log")
          .insert({
            invitation_id: leadId,
            sender_user_id: user.id,
            sender_name: senderName,
            sender_email: senderEmail || user.email,
            subject,
            message,
            recipient_email: to,
            recipient_name: leadName,
          })

        if (logError) {
          // Log error but don't fail the request - email was already sent
          console.warn("[ContactAPI] Failed to log contact (table may not exist):", logError.message)
        } else {
          console.log("[ContactAPI] Contact logged for lead:", leadId)
        }
      } catch (logCatchError) {
        // Silently ignore if table doesn't exist
        console.warn("[ContactAPI] Contact log table may not exist:", logCatchError)
      }
    }

    console.log("[ContactAPI] SUCCESS - Email sent to:", leadName, "at", to)

    return NextResponse.json({
      success: true,
      message: `Email sent to ${leadName}`,
    })

  } catch (error: any) {
    console.error("[ContactAPI] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    )
  }
}
