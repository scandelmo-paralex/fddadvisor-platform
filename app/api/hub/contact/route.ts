import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { sendContactEmail } from "@/lib/email"

export async function POST(request: Request) {
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

    const body = await request.json()
    const { leadId, to, leadName, subject, message } = body

    if (!to || !leadName || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields: to, leadName, subject, message" },
        { status: 400 }
      )
    }

    // Get franchisor profile to get company name and sender details
    const { data: franchisorProfile } = await supabase
      .from("franchisor_profiles")
      .select("id, company_name, contact_name, contact_email")
      .eq("user_id", user.id)
      .single()

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
    } else {
      // Check team membership
      const { data: teamMember } = await supabase
        .from("franchisor_team_members")
        .select(`
          first_name,
          last_name,
          franchisor_id,
          franchisor_profiles!inner(company_name, contact_email)
        `)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single()

      if (!teamMember) {
        return NextResponse.json(
          { error: "No franchisor profile found" },
          { status: 403 }
        )
      }

      franchisorId = teamMember.franchisor_id
      companyName = (teamMember.franchisor_profiles as any)?.company_name || "Your Franchise"
      senderName = `${teamMember.first_name} ${teamMember.last_name}`.trim() || "Your Franchise Team"
      senderEmail = user.email || ""
    }

    // Send the email
    await sendContactEmail({
      to,
      leadName,
      franchiseName: companyName,
      subject,
      message,
      senderName,
      senderEmail,
    })

    // Log the contact activity
    if (leadId) {
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
        console.error("[ContactAPI] Failed to log contact:", logError)
      } else {
        console.log("[ContactAPI] Contact logged for lead:", leadId)
      }
    }

    console.log("[ContactAPI] Email sent to lead:", leadId, "from:", senderName)

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
