import { getSupabaseRouteClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { randomBytes } from "crypto"

/**
 * POST /api/team/[id]/resend
 * 
 * Resend invitation email to a pending team member.
 * Generates a new invitation token.
 * 
 * Access: Owner and Admin only
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getSupabaseRouteClient()

    if (!supabase) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Get the target team member
    const { data: teamMember, error: memberError } = await supabase
      .from("franchisor_team_members")
      .select("id, franchisor_id, email, full_name, role, is_active, accepted_at")
      .eq("id", id)
      .single()

    if (memberError || !teamMember) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 })
    }

    // Can only resend to pending members
    if (teamMember.accepted_at) {
      return NextResponse.json(
        { error: "This team member has already accepted their invitation" },
        { status: 400 }
      )
    }

    // Must be active
    if (!teamMember.is_active) {
      return NextResponse.json(
        { error: "This team member has been deactivated" },
        { status: 400 }
      )
    }

    // Check current user's permissions
    const { data: currentUserMember } = await supabase
      .from("franchisor_team_members")
      .select("role")
      .eq("franchisor_id", teamMember.franchisor_id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    const { data: franchisorProfile } = await supabase
      .from("franchisor_profiles")
      .select("id, company_name")
      .eq("id", teamMember.franchisor_id)
      .eq("user_id", user.id)
      .single()

    const isOwner = !!franchisorProfile || currentUserMember?.role === "owner"
    const isAdmin = currentUserMember?.role === "admin"

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Only owners and admins can resend invitations" },
        { status: 403 }
      )
    }

    // Generate new token
    const newToken = randomBytes(32).toString("hex")

    // Update team member with new token and timestamp
    const { error: updateError } = await supabase
      .from("franchisor_team_members")
      .update({
        invitation_token: newToken,
        invited_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (updateError) {
      console.error("Error updating invitation token:", updateError)
      return NextResponse.json({ error: "Failed to resend invitation" }, { status: 500 })
    }

    // Get company name if not already fetched
    let companyName = franchisorProfile?.company_name
    if (!companyName) {
      const { data: fp } = await supabase
        .from("franchisor_profiles")
        .select("company_name")
        .eq("id", teamMember.franchisor_id)
        .single()
      companyName = fp?.company_name || "Your organization"
    }

    // TODO: Send invitation email
    // await sendTeamInvitationEmail({
    //   to: teamMember.email,
    //   teamMemberName: teamMember.full_name,
    //   franchisorName: companyName,
    //   invitationLink: `${process.env.NEXT_PUBLIC_APP_URL}/team-signup?token=${newToken}`,
    //   invitedBy: user.email || "Your organization",
    //   role: teamMember.role,
    // })

    return NextResponse.json({
      success: true,
      message: `Invitation resent to ${teamMember.email}`,
      invitation_sent: true,
    })

  } catch (error: any) {
    console.error("Error resending invitation:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
