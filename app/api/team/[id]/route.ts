import { getSupabaseRouteClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { TeamMemberRole } from "@/lib/types/database"

/**
 * GET /api/team/[id]
 * 
 * Get a single team member by ID.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params

    // RLS will handle permission checking
    const { data: teamMember, error } = await supabase
      .from("franchisor_team_members")
      .select(`
        id,
        franchisor_id,
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
      .eq("id", id)
      .single()

    if (error || !teamMember) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 })
    }

    return NextResponse.json({
      team_member: {
        ...teamMember,
        status: getStatus(teamMember),
      },
    })

  } catch (error: any) {
    console.error("Error fetching team member:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

/**
 * PUT /api/team/[id]
 * 
 * Update a team member's role, status, or notification preferences.
 * 
 * Request body (all optional):
 * {
 *   role?: "admin" | "recruiter" | "viewer",
 *   is_active?: boolean,
 *   receives_notifications?: boolean,
 *   notification_email?: string
 * }
 * 
 * Access:
 * - Owner: Can update any team member (except change owner role)
 * - Admin: Can update recruiters/viewers only
 * - Others: Can only update their own notification preferences
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params
    const body = await request.json()
    const { role, is_active, receives_notifications, notification_email } = body

    // Get the target team member
    const { data: targetMember, error: targetError } = await supabase
      .from("franchisor_team_members")
      .select("id, franchisor_id, role, user_id")
      .eq("id", id)
      .single()

    if (targetError || !targetMember) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 })
    }

    // Get current user's team member record and role
    const { data: currentUserMember } = await supabase
      .from("franchisor_team_members")
      .select("id, role")
      .eq("franchisor_id", targetMember.franchisor_id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    // Also check if user is the franchisor owner directly
    const { data: franchisorProfile } = await supabase
      .from("franchisor_profiles")
      .select("id")
      .eq("id", targetMember.franchisor_id)
      .eq("user_id", user.id)
      .single()

    const isOwner = !!franchisorProfile || currentUserMember?.role === "owner"
    const isAdmin = currentUserMember?.role === "admin"
    const isSelf = targetMember.user_id === user.id

    // Permission checks
    if (role !== undefined) {
      // Validate role value
      const validRoles: TeamMemberRole[] = ["admin", "recruiter", "viewer"]
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: "Invalid role. Must be: admin, recruiter, or viewer" },
          { status: 400 }
        )
      }

      // Can't change owner role
      if (targetMember.role === "owner") {
        return NextResponse.json({ error: "Cannot change owner role" }, { status: 403 })
      }

      // Only owner can promote to admin
      if (role === "admin" && !isOwner) {
        return NextResponse.json({ error: "Only owner can promote to admin" }, { status: 403 })
      }

      // Admin can only change recruiter/viewer roles
      if (isAdmin && !isOwner && targetMember.role === "admin") {
        return NextResponse.json({ error: "Admins cannot change other admin roles" }, { status: 403 })
      }

      // Must be owner or admin to change roles
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: "Not authorized to change roles" }, { status: 403 })
      }
    }

    if (is_active !== undefined) {
      // Can't deactivate owner
      if (targetMember.role === "owner" && is_active === false) {
        return NextResponse.json({ error: "Cannot deactivate owner" }, { status: 403 })
      }

      // Can't deactivate yourself
      if (isSelf && is_active === false) {
        return NextResponse.json({ error: "Cannot deactivate yourself" }, { status: 403 })
      }

      // Must be owner or admin
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: "Not authorized to change status" }, { status: 403 })
      }
    }

    // Notification preferences - anyone can update their own
    if ((receives_notifications !== undefined || notification_email !== undefined) && !isSelf && !isOwner && !isAdmin) {
      return NextResponse.json({ error: "Not authorized to change notification settings" }, { status: 403 })
    }

    // Build update object
    const updateData: any = {}
    if (role !== undefined) updateData.role = role
    if (is_active !== undefined) updateData.is_active = is_active
    if (receives_notifications !== undefined) updateData.receives_notifications = receives_notifications
    if (notification_email !== undefined) updateData.notification_email = notification_email

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    // Perform update
    const { data: updatedMember, error: updateError } = await supabase
      .from("franchisor_team_members")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating team member:", updateError)
      return NextResponse.json({ error: "Failed to update team member" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      team_member: {
        ...updatedMember,
        status: getStatus(updatedMember),
      },
    })

  } catch (error: any) {
    console.error("Error updating team member:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/team/[id]
 * 
 * Deactivate (soft delete) a team member.
 * 
 * Access:
 * - Owner: Can delete any team member except owner
 * - Admin: Can delete recruiters/viewers only
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params

    // Get the target team member
    const { data: targetMember, error: targetError } = await supabase
      .from("franchisor_team_members")
      .select("id, franchisor_id, role, user_id, full_name")
      .eq("id", id)
      .single()

    if (targetError || !targetMember) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 })
    }

    // Can't delete owner
    if (targetMember.role === "owner") {
      return NextResponse.json({ error: "Cannot remove owner from team" }, { status: 403 })
    }

    // Can't delete yourself
    if (targetMember.user_id === user.id) {
      return NextResponse.json({ error: "Cannot remove yourself from team" }, { status: 403 })
    }

    // Get current user's role
    const { data: currentUserMember } = await supabase
      .from("franchisor_team_members")
      .select("role")
      .eq("franchisor_id", targetMember.franchisor_id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    const { data: franchisorProfile } = await supabase
      .from("franchisor_profiles")
      .select("id")
      .eq("id", targetMember.franchisor_id)
      .eq("user_id", user.id)
      .single()

    const isOwner = !!franchisorProfile || currentUserMember?.role === "owner"
    const isAdmin = currentUserMember?.role === "admin"

    // Admin can't delete other admins
    if (isAdmin && !isOwner && targetMember.role === "admin") {
      return NextResponse.json({ error: "Admins cannot remove other admins" }, { status: 403 })
    }

    // Must be owner or admin
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Not authorized to remove team members" }, { status: 403 })
    }

    // Soft delete - set is_active to false
    const { error: deleteError } = await supabase
      .from("franchisor_team_members")
      .update({ is_active: false })
      .eq("id", id)

    if (deleteError) {
      console.error("Error deactivating team member:", deleteError)
      return NextResponse.json({ error: "Failed to remove team member" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${targetMember.full_name} has been removed from the team`,
    })

  } catch (error: any) {
    console.error("Error deleting team member:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
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
