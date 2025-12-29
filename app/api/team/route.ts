import { getSupabaseRouteClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { TeamMemberRole } from "@/lib/types/database"
import { randomBytes } from "crypto"
import { sendTeamInvitationEmail } from "@/lib/email"

/**
 * GET /api/team
 * 
 * Returns all team members for the current user's franchisor organization.
 * 
 * Access:
 * - Owner/Admin: See all team members
 * - Recruiter/Viewer: See only their own record
 * 
 * RLS policies handle the filtering automatically.
 */
export async function GET() {
  try {
    const supabase = await getSupabaseRouteClient()

    if (!supabase) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's franchisor profile
    const { data: profile, error: profileError } = await supabase
      .from("franchisor_profiles")
      .select("id, company_name")
      .eq("user_id", user.id)
      .single()

    if (profileError || !profile) {
      // User might be a team member, not the franchisor owner
      // Try to find their team member record to get franchisor_id
      const { data: teamMember, error: tmError } = await supabase
        .from("franchisor_team_members")
        .select("franchisor_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single()

      if (tmError || !teamMember) {
        return NextResponse.json({ error: "Not associated with any franchisor" }, { status: 403 })
      }

      // Get team members for this franchisor (RLS will filter based on role)
      const { data: teamMembers, error: teamError } = await supabase
        .from("franchisor_team_members")
        .select(`
          id,
          email,
          full_name,
          role,
          is_active,
          invited_at,
          accepted_at,
          receives_notifications,
          notification_email,
          created_at,
          updated_at
        `)
        .eq("franchisor_id", teamMember.franchisor_id)
        .order("role", { ascending: true })
        .order("full_name", { ascending: true })

      if (teamError) {
        console.error("Error fetching team members:", teamError)
        return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 })
      }

      return NextResponse.json({
        team_members: formatTeamMembers(teamMembers || []),
        franchisor_id: teamMember.franchisor_id,
      })
    }

    // User is the franchisor owner - get all team members
    const { data: teamMembers, error: teamError } = await supabase
      .from("franchisor_team_members")
      .select(`
        id,
        email,
        full_name,
        role,
        is_active,
        invited_at,
        accepted_at,
        receives_notifications,
        notification_email,
        created_at,
        updated_at
      `)
      .eq("franchisor_id", profile.id)
      .order("role", { ascending: true })
      .order("full_name", { ascending: true })

    if (teamError) {
      console.error("Error fetching team members:", teamError)
      return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 })
    }

    return NextResponse.json({
      team_members: formatTeamMembers(teamMembers || []),
      franchisor_id: profile.id,
      company_name: profile.company_name,
    })

  } catch (error: any) {
    console.error("Error in team API:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

/**
 * Format team members for API response
 */
function formatTeamMembers(members: any[]) {
  return members.map((member) => ({
    id: member.id,
    email: member.email,
    full_name: member.full_name,
    role: member.role as TeamMemberRole,
    is_active: member.is_active,
    status: getStatus(member),
    invited_at: member.invited_at,
    accepted_at: member.accepted_at,
    receives_notifications: member.receives_notifications,
    notification_email: member.notification_email,
    created_at: member.created_at,
    updated_at: member.updated_at,
  }))
}

/**
 * Derive status from member data
 */
function getStatus(member: any): "active" | "pending" | "deactivated" {
  if (!member.is_active) {
    return "deactivated"
  }
  if (!member.accepted_at) {
    return "pending"
  }
  return "active"
}

/**
 * POST /api/team
 * 
 * Invite a new team member to the franchisor organization.
 * 
 * Request body:
 * {
 *   email: string,
 *   full_name: string,
 *   role: "admin" | "recruiter" | "viewer"
 * }
 * 
 * Access: Owner and Admin only
 */
export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseRouteClient()

    if (!supabase) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { email, full_name, role } = body

    // Validate required fields
    if (!email || !full_name || !role) {
      return NextResponse.json(
        { error: "Missing required fields: email, full_name, role" },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles: TeamMemberRole[] = ["admin", "recruiter"]
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be: admin or recruiter" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Get user's franchisor profile (must be owner)
    const { data: profile, error: profileError } = await supabase
      .from("franchisor_profiles")
      .select("id, company_name")
      .eq("user_id", user.id)
      .single()

    let franchisorId: string
    let companyName: string
    let invitedByMemberId: string | null = null

    if (profileError || !profile) {
      // User might be an admin team member
      const { data: teamMember, error: tmError } = await supabase
        .from("franchisor_team_members")
        .select("id, franchisor_id, role")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single()

      if (tmError || !teamMember) {
        return NextResponse.json({ error: "Not associated with any franchisor" }, { status: 403 })
      }

      // Only owner and admin can invite
      if (!['owner', 'admin'].includes(teamMember.role)) {
        return NextResponse.json({ error: "Only owners and admins can invite team members" }, { status: 403 })
      }

      franchisorId = teamMember.franchisor_id
      invitedByMemberId = teamMember.id

      // Get company name
      const { data: fp } = await supabase
        .from("franchisor_profiles")
        .select("company_name")
        .eq("id", franchisorId)
        .single()
      
      companyName = fp?.company_name || "Your organization"
    } else {
      franchisorId = profile.id
      companyName = profile.company_name

      // Get the owner's team member record for invited_by
      const { data: ownerMember } = await supabase
        .from("franchisor_team_members")
        .select("id")
        .eq("franchisor_id", franchisorId)
        .eq("user_id", user.id)
        .single()
      
      invitedByMemberId = ownerMember?.id || null
    }

    // Check if email already exists in this organization
    const { data: existingMember } = await supabase
      .from("franchisor_team_members")
      .select("id, is_active")
      .eq("franchisor_id", franchisorId)
      .eq("email", email.toLowerCase())
      .single()

    if (existingMember) {
      if (existingMember.is_active) {
        return NextResponse.json(
          { error: "A team member with this email already exists" },
          { status: 409 }
        )
      } else {
        // Reactivate deactivated member
        const { data: reactivated, error: reactivateError } = await supabase
          .from("franchisor_team_members")
          .update({
            is_active: true,
            role: role,
            full_name: full_name,
            invitation_token: generateToken(),
            invited_at: new Date().toISOString(),
            accepted_at: null,
            invited_by: invitedByMemberId,
          })
          .eq("id", existingMember.id)
          .select()
          .single()

        if (reactivateError) {
          console.error("Error reactivating team member:", reactivateError)
          return NextResponse.json({ error: "Failed to reactivate team member" }, { status: 500 })
        }

        // Build invitation link
        const host = request.headers.get("host") || "localhost:3000"
        const protocol = host.includes("localhost") ? "http" : "https"
        const invitationLink = `${protocol}://${host}/team-signup?token=${reactivated.invitation_token}`

        // Send invitation email
        let emailSent = false
        if (process.env.RESEND_API_KEY) {
          try {
            await sendTeamInvitationEmail({
              to: email,
              memberName: full_name,
              companyName: companyName,
              role: role,
              invitationLink: invitationLink,
            })
            emailSent = true
            console.log("[v0] Team invitation email sent to:", email)
          } catch (emailError) {
            console.error("[v0] Failed to send team invitation email:", emailError)
          }
        }

        return NextResponse.json({
          success: true,
          team_member: formatTeamMembers([reactivated])[0],
          message: emailSent ? "Team member reactivated and invitation sent" : "Team member reactivated (email not sent)",
          invitation_sent: emailSent,
          invitation_link: invitationLink,
        })
      }
    }

    // Create new team member with invitation token
    const invitationToken = generateToken()

    const { data: newMember, error: insertError } = await supabase
      .from("franchisor_team_members")
      .insert({
        franchisor_id: franchisorId,
        email: email.toLowerCase(),
        full_name: full_name,
        role: role,
        is_active: true,
        invitation_token: invitationToken,
        invited_at: new Date().toISOString(),
        invited_by: invitedByMemberId,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error creating team member:", insertError)
      return NextResponse.json({ error: "Failed to create team member" }, { status: 500 })
    }

    // Build invitation link
    const host = request.headers.get("host") || "localhost:3000"
    const protocol = host.includes("localhost") ? "http" : "https"
    const invitationLink = `${protocol}://${host}/team-signup?token=${invitationToken}`

    // Send invitation email
    let emailSent = false
    if (process.env.RESEND_API_KEY) {
      try {
        await sendTeamInvitationEmail({
          to: email,
          memberName: full_name,
          companyName: companyName,
          role: role,
          invitationLink: invitationLink,
        })
        emailSent = true
        console.log("[v0] Team invitation email sent to:", email)
      } catch (emailError) {
        console.error("[v0] Failed to send team invitation email:", emailError)
      }
    } else {
      console.log("[v0] RESEND_API_KEY not configured, skipping email")
    }

    return NextResponse.json({
      success: true,
      team_member: formatTeamMembers([newMember])[0],
      message: emailSent ? `Invitation sent to ${email}` : `Invitation created for ${email} (email not sent)`,
      invitation_sent: emailSent,
      invitation_link: invitationLink,
    })

  } catch (error: any) {
    console.error("Error in team invite API:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

/**
 * Generate a secure random token for invitations
 */
function generateToken(): string {
  return randomBytes(32).toString("hex")
}
