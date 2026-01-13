import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { sendInvitationEmail } from "@/lib/email"

console.log("[v0] ===== INVITATIONS MODULE LOADED =====")

export async function POST(request: Request) {
  console.log("[v0] ===== POST HANDLER CALLED =====")

  try {
    const body = await request.json()
    console.log("[v0] Request body:", JSON.stringify(body).substring(0, 200) + "...")

    const {
      franchise_id,
      lead_email,
      firstName,
      lastName,
      lead_phone,
      invitation_message,
      source,
      city,
      state,
      timeline,
      target_location,
    } = body

    if (!franchise_id || !lead_email || !firstName || !lastName) {
      console.log("[v0] Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const lead_name = `${firstName} ${lastName}`

    const supabase = await createServerClient()

    if (!supabase) {
      console.error("[v0] Database not available")
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Authentication failed:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Authenticated user:", user.id)

    // First try to get franchisor profile directly (user is owner)
    let { data: profile, error: profileError } = await supabase
      .from("franchisor_profiles")
      .select("id, company_name")
      .eq("user_id", user.id)
      .single()

    // If not owner, check if user is a team member
    if (profileError || !profile) {
      console.log("[v0] User is not franchisor owner, checking team membership...")
      
      const { data: teamMemberCheck, error: tmError } = await supabase
        .from("franchisor_team_members")
        .select(`
          id,
          franchisor_id,
          role,
          franchisor_profiles!inner(id, company_name)
        `)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single()
      
      if (tmError || !teamMemberCheck) {
        console.log("[v0] User not found as owner or team member:", tmError || profileError)
        return NextResponse.json({ error: "Profile not found" }, { status: 404 })
      }
      
      // Use the franchisor profile from team membership
      profile = teamMemberCheck.franchisor_profiles as any
      console.log("[v0] User is team member with role:", teamMemberCheck.role)
    }

    console.log("[v0] Franchisor profile ID:", profile.id)

    // Get the current user's team member record (for created_by tracking)
    // This will find the record for both owners (who may have a team_member entry) and actual team members
    let createdByTeamMemberId: string | null = null
    const { data: teamMember } = await supabase
      .from("franchisor_team_members")
      .select("id")
      .eq("franchisor_id", profile.id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (teamMember) {
      createdByTeamMemberId = teamMember.id
    }
    console.log("[v0] Created by team member:", createdByTeamMemberId)

    const { data: franchise, error: franchiseError } = await supabase
      .from("franchises")
      .select("id, name, franchisor_id")
      .eq("id", franchise_id)
      .eq("franchisor_id", profile.id)
      .single()

    if (franchiseError || !franchise) {
      console.log("[v0] Franchise verification failed:", franchiseError)
      return NextResponse.json({ error: "Franchise not found or unauthorized" }, { status: 404 })
    }

    console.log("[v0] Franchise verified:", franchise.name)

    // =========================================================================
    // NEW: Get default pipeline stage for this franchisor
    // =========================================================================
    let defaultStageId: string | null = null
    
    try {
      // First try to get the explicitly marked default stage
      const { data: defaultStage } = await supabase
        .from("pipeline_stages")
        .select("id")
        .eq("franchisor_id", profile.id)
        .eq("is_default", true)
        .single()
      
      if (defaultStage) {
        defaultStageId = defaultStage.id
        console.log("[v0] Found default stage:", defaultStageId)
      } else {
        // Fall back to the first stage by position
        const { data: firstStage } = await supabase
          .from("pipeline_stages")
          .select("id")
          .eq("franchisor_id", profile.id)
          .order("position", { ascending: true })
          .limit(1)
          .single()
        
        if (firstStage) {
          defaultStageId = firstStage.id
          console.log("[v0] Using first stage as default:", defaultStageId)
        }
      }
    } catch (stageError) {
      console.warn("[v0] Could not fetch default stage:", stageError)
      // Continue without stage assignment - lead will still show in table
    }
    // =========================================================================

    const tokenArray = new Uint8Array(32)
    crypto.getRandomValues(tokenArray)
    const token = Array.from(tokenArray, (byte) => byte.toString(16).padStart(2, "0")).join("")

    console.log("[v0] Generated token (first 10 chars):", token.substring(0, 10))

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 14) // 14 days for FDD disclosure

    // =========================================================================
    // UPDATED: Include stage_id and stage_changed_at in invitation
    // =========================================================================
    const invitationData: Record<string, any> = {
      franchisor_id: profile.id,
      franchise_id,
      lead_email,
      lead_name,
      lead_phone: lead_phone || null,
      invitation_token: token,
      invitation_message: invitation_message || null,
      status: "sent",
      sent_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      source: source || "Direct Inquiry",
      timeline: timeline || null,
      city: city || null,
      state: state || null,
      target_location: target_location || null,
      brand: franchise.name,
      created_by: createdByTeamMemberId, // Track which team member sent this
    }
    
    // Add stage_id if we found a default stage
    if (defaultStageId) {
      invitationData.stage_id = defaultStageId
      invitationData.stage_changed_at = new Date().toISOString()
      console.log("[v0] Assigning lead to stage:", defaultStageId)
    }

    const { data: invitation, error: insertError } = await supabase
      .from("lead_invitations")
      .insert(invitationData)
      .select()
      .single()

    if (insertError) {
      console.error("[v0] Database insert error:", insertError)
      return NextResponse.json({ error: "Failed to create invitation: " + insertError.message }, { status: 500 })
    }

    console.log("[v0] Invitation created:", invitation.id, "with stage_id:", invitation.stage_id)
    // =========================================================================

    try {
      const { data: existingLead } = await supabase
        .from("leads")
        .select("id")
        .eq("email", lead_email)
        .eq("franchise_id", franchise_id)
        .single()

      if (!existingLead) {
        const leadData = {
          franchisor_id: profile.id,
          franchise_id,
          name: lead_name,
          email: lead_email,
          phone: lead_phone || null,
          source: source || "Direct Inquiry",
          location: `${city}, ${state}`,
          timeline: timeline || "Unknown",
          brand: franchise.name,
          // Disclosure tracking
          disclosure_status: "sent",
          fdd_send_date: new Date().toISOString(),
          disclosure_expires_date: expiresAt.toISOString(),
          // Lead qualification
          verification_status: "unverified",
          intent: "Medium",
          stage: "inquiry",
          quality_score: 50,
          is_new: true,
          invitation_status: "sent",
          invitation_sent_date: new Date().toISOString(),
        }

        const { error: leadError } = await supabase.from("leads").insert(leadData)

        if (leadError) {
          console.error("[v0] Lead creation error:", leadError)
        } else {
          console.log("[v0] Lead record created with disclosure tracking")
        }
      } else {
        // Update existing lead
        const { error: updateError } = await supabase
          .from("leads")
          .update({
            disclosure_status: "sent",
            fdd_send_date: new Date().toISOString(),
            disclosure_expires_date: expiresAt.toISOString(),
            invitation_status: "sent",
            invitation_sent_date: new Date().toISOString(),
          })
          .eq("id", existingLead.id)

        if (updateError) {
          console.error("[v0] Lead update error:", updateError)
        } else {
          console.log("[v0] Updated existing lead with disclosure tracking")
        }
      }
    } catch (leadError) {
      console.error("[v0] Lead management error:", leadError)
      // Continue with invitation even if lead tracking fails
    }

    const host = request.headers.get("host") || "localhost:3000"
    const protocol = host.includes("localhost") ? "http" : "https"
    const baseUrl = `${protocol}://${host}`
    const invitation_link = `${baseUrl}/hub/invite/${token}`

    console.log("[v0] Invitation link:", invitation_link)

    if (process.env.RESEND_API_KEY) {
      try {
        console.log("[v0] Attempting to send email...")
        await sendInvitationEmail({
          to: lead_email,
          leadName: lead_name,
          franchiseName: franchise.name,
          invitationLink: invitation_link,
          franchisorName: profile.company_name,
          customMessage: invitation_message,
        })
        console.log("[v0] Email sent successfully")
      } catch (emailError: any) {
        console.error("[v0] Email send failed:", emailError)
        // Don't fail the request if email fails
      }
    } else {
      console.log("[v0] Resend not configured, skipping email")
    }

    return NextResponse.json({
      invitation,
      invitation_link,
    })
  } catch (error: any) {
    console.error("[v0] Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  console.log("[v0] ===== GET HANDLER CALLED =====")
  return NextResponse.json({ message: "Invitations API GET endpoint" })
}
