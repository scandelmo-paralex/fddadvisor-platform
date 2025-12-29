import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

/**
 * POST /api/team/accept
 * 
 * Accept a team invitation and create the user's account.
 * 
 * Request body:
 * {
 *   token: string,
 *   password: string
 * }
 * 
 * This endpoint:
 * 1. Validates the invitation token
 * 2. Creates a Supabase auth account for the user
 * 3. Links the auth account to the team member record
 * 4. Clears the invitation token
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, password } = body

    // Validate required fields
    if (!token || !password) {
      return NextResponse.json(
        { error: "Missing required fields: token, password" },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    // Use service role client to bypass RLS for this operation
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Find the team member by invitation token
    const { data: teamMember, error: findError } = await supabaseAdmin
      .from("franchisor_team_members")
      .select(`
        id,
        franchisor_id,
        email,
        full_name,
        role,
        is_active,
        accepted_at,
        user_id
      `)
      .eq("invitation_token", token)
      .single()

    if (findError || !teamMember) {
      return NextResponse.json(
        { error: "Invalid or expired invitation token" },
        { status: 404 }
      )
    }

    // Check if invitation was already accepted
    if (teamMember.accepted_at || teamMember.user_id) {
      return NextResponse.json(
        { error: "This invitation has already been accepted" },
        { status: 400 }
      )
    }

    // Check if team member is still active
    if (!teamMember.is_active) {
      return NextResponse.json(
        { error: "This invitation is no longer valid" },
        { status: 400 }
      )
    }

    // Get franchisor info for the welcome message
    const { data: franchisor } = await supabaseAdmin
      .from("franchisor_profiles")
      .select("company_name")
      .eq("id", teamMember.franchisor_id)
      .single()

    // Check if user already exists with this email
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === teamMember.email.toLowerCase()
    )

    let userId: string

    if (existingUser) {
      // User already has an account - just link it
      userId = existingUser.id
      
      // Optionally update their password (or skip this)
      // await supabaseAdmin.auth.admin.updateUserById(userId, { password })
    } else {
      // Create new auth user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: teamMember.email,
        password: password,
        email_confirm: true, // Auto-confirm since they have valid invitation
        user_metadata: {
          full_name: teamMember.full_name,
          role: "franchisor", // App-level role
          team_role: teamMember.role, // Team-level role
        },
      })

      if (createError || !newUser.user) {
        console.error("Error creating user:", createError)
        return NextResponse.json(
          { error: "Failed to create account. Please try again." },
          { status: 500 }
        )
      }

      userId = newUser.user.id
    }

    // Update team member record - link to auth user and clear token
    const { error: updateError } = await supabaseAdmin
      .from("franchisor_team_members")
      .update({
        user_id: userId,
        accepted_at: new Date().toISOString(),
        invitation_token: null, // Clear the token so it can't be reused
      })
      .eq("id", teamMember.id)

    if (updateError) {
      console.error("Error updating team member:", updateError)
      return NextResponse.json(
        { error: "Failed to complete registration. Please contact support." },
        { status: 500 }
      )
    }

    // Create a users table entry if needed (for app-level user tracking)
    const { error: usersError } = await supabaseAdmin
      .from("users")
      .upsert({
        id: userId,
        email: teamMember.email,
        role: "franchisor",
      }, {
        onConflict: "id",
      })

    if (usersError) {
      console.error("Error creating users entry:", usersError)
      // Non-fatal - continue anyway
    }

    return NextResponse.json({
      success: true,
      message: `Welcome to ${franchisor?.company_name || "FDDHub"}!`,
      redirect: "/dashboard",
      user: {
        email: teamMember.email,
        full_name: teamMember.full_name,
        role: teamMember.role,
      },
      franchisor: {
        id: teamMember.franchisor_id,
        company_name: franchisor?.company_name,
      },
    })

  } catch (error: any) {
    console.error("Error accepting team invitation:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/team/accept?token=xxx
 * 
 * Validate an invitation token and return team member info.
 * Used by the signup page to show who invited them.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 })
    }

    // Use service role to read invitation
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Find invitation
    const { data: teamMember, error } = await supabaseAdmin
      .from("franchisor_team_members")
      .select(`
        id,
        email,
        full_name,
        role,
        is_active,
        accepted_at,
        invited_at,
        franchisor_id
      `)
      .eq("invitation_token", token)
      .single()

    if (error || !teamMember) {
      return NextResponse.json(
        { error: "Invalid or expired invitation token", valid: false },
        { status: 404 }
      )
    }

    // Check if already accepted
    if (teamMember.accepted_at) {
      return NextResponse.json({
        valid: false,
        error: "This invitation has already been accepted",
        already_accepted: true,
      })
    }

    // Check if still active
    if (!teamMember.is_active) {
      return NextResponse.json({
        valid: false,
        error: "This invitation is no longer valid",
      })
    }

    // Get franchisor info
    const { data: franchisor } = await supabaseAdmin
      .from("franchisor_profiles")
      .select("company_name, logo_url")
      .eq("id", teamMember.franchisor_id)
      .single()

    // Get inviter info
    const { data: inviter } = await supabaseAdmin
      .from("franchisor_team_members")
      .select("full_name")
      .eq("franchisor_id", teamMember.franchisor_id)
      .eq("role", "owner")
      .single()

    return NextResponse.json({
      valid: true,
      invitation: {
        email: teamMember.email,
        full_name: teamMember.full_name,
        role: teamMember.role,
        invited_at: teamMember.invited_at,
      },
      franchisor: {
        company_name: franchisor?.company_name,
        logo_url: franchisor?.logo_url,
      },
      invited_by: inviter?.full_name || "Your organization",
    })

  } catch (error: any) {
    console.error("Error validating invitation:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
