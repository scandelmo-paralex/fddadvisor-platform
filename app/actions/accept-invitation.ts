"use server"

import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export async function acceptInvitation(formData: {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  city: string
  state: string
  invitation_token: string
}) {
  const supabase = await createClient()
  const adminSupabase = createServiceRoleClient()

  try {
    // STEP 1: Validate invitation token
    console.log("[v0] Step 1 started: Validating invitation token")

    const { data: invitation, error: invitationError } = await adminSupabase
      .from("lead_invitations")
      .select("*")
      .eq("invitation_token", formData.invitation_token)
      .single()

    if (invitationError || !invitation) {
      console.error("[v0] Step 1 failed: Invalid invitation token", invitationError)
      return { success: false, error: "Invalid invitation token", step: 1 }
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      console.error("[v0] Step 1 failed: Invitation expired")
      return { success: false, error: "Invitation has expired", step: 1 }
    }

    // Check if already used
    if (invitation.status === "signed_up" || invitation.buyer_id) {
      console.error("[v0] Step 1 failed: Invitation already used")
      return { success: false, error: "Invitation has already been used", step: 1 }
    }

    console.log("[v0] Step 1 completed: Invitation validated", {
      franchisor_id: invitation.franchisor_id,
      franchise_id: invitation.franchise_id,
      invitation_id: invitation.id,
    })

    console.log("[v0] Step 2 started: Creating user with signUp")

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    })

    if (authError || !authData.user) {
      console.error("[v0] Step 2 failed: Failed to create user", authError)
      return { success: false, error: authError?.message || "Failed to create account", step: 2 }
    }

    const userId = authData.user.id
    console.log("[v0] Step 2 completed: User created with session", {
      user_id: userId,
      has_session: !!authData.session,
    })

    console.log("[v0] Step 2.5: Ensuring public.users record exists")
    const { error: userError } = await adminSupabase.from("users").upsert(
      {
        id: userId,
        email: formData.email,
        role: "buyer",
      },
      { onConflict: "id", ignoreDuplicates: true },
    )

    if (userError) {
      console.error("[v0] Warning: Failed to insert public user record (might already exist)", userError)
    }

    console.log("[v0] Step 3 started: Creating buyer profile with authenticated session")

    const { data: buyerProfile, error: profileError } = await adminSupabase
      .from("buyer_profiles")
      .insert({
        user_id: userId,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        city_location: formData.city || null,
        state_location: formData.state || null,
        signup_source: "fddhub",
      })
      .select("id")
      .single()

    if (profileError || !buyerProfile) {
      console.error("[v0] Step 3 failed: Failed to create buyer profile", profileError)
      return {
        success: false,
        error: `Failed to create buyer profile: ${profileError?.message}`,
        step: 3,
      }
    }

    console.log("[v0] Step 3 completed: Buyer profile created", { buyer_id: buyerProfile.id })

    // STEP 4: Create lead_fdd_access record
    console.log("[v0] Step 4 started: Creating FDD access record")

    const { error: fddAccessError } = await adminSupabase.from("lead_fdd_access").insert({
      franchisor_id: invitation.franchisor_id,
      buyer_id: buyerProfile.id,
      franchise_id: invitation.franchise_id,
      granted_via: "invitation",
      invitation_id: invitation.id,
      total_views: 0,
      total_time_spent_seconds: 0,
    })

    if (fddAccessError) {
      console.error("[v0] Step 4 failed: Failed to create FDD access", fddAccessError)
      return {
        success: false,
        error: `Failed to grant FDD access: ${fddAccessError.message}`,
        step: 4,
      }
    }

    console.log("[v0] Step 4 completed: FDD access granted")

    // STEP 5: Update invitation status
    console.log("[v0] Step 5 started: Updating invitation status")

    const { error: invitationUpdateError } = await adminSupabase
      .from("lead_invitations")
      .update({
        buyer_id: buyerProfile.id,
        status: "signed_up",
        signed_up_at: new Date().toISOString(),
      })
      .eq("id", invitation.id)

    if (invitationUpdateError) {
      console.error("[v0] Step 5 failed: Failed to update invitation", invitationUpdateError)
      return {
        success: false,
        error: `Failed to update invitation: ${invitationUpdateError.message}`,
        step: 5,
      }
    }

    console.log("[v0] Step 5 completed: Invitation status updated")
    console.log("[v0] All steps completed successfully!")

    return {
      success: true,
      buyer_id: buyerProfile.id,
      franchise_id: invitation.franchise_id,
    }
  } catch (error: any) {
    console.error("[v0] Unexpected error in acceptInvitation:", error)
    return {
      success: false,
      error: error.message || "Unexpected error occurred",
      step: -1,
    }
  }
}

export async function linkInvitationToExistingUser(formData: {
  email: string
  password: string
  invitation_token: string
}) {
  try {
    const supabase = await createClient()
    const adminSupabase = createServiceRoleClient()

    console.log("[v0] Server: Linking invitation to existing user...")
    console.log("[v0] Server: Token:", formData.invitation_token)
    console.log("[v0] Server: Email:", formData.email)

    const invitationQuery = adminSupabase
      .from("lead_invitations")
      .select("*")
      .eq("invitation_token", formData.invitation_token)

    console.log("[v0] Server: About to execute query...")

    const { data: invitationData, error: invitationFetchError } = await invitationQuery.single()

    console.log("[v0] Server: Query complete")
    console.log("[v0] Server: Invitation data:", invitationData)
    console.log("[v0] Server: Invitation error:", invitationFetchError)
    console.log("[v0] Server: Error details:", {
      message: invitationFetchError?.message,
      details: invitationFetchError?.details,
      hint: invitationFetchError?.hint,
      code: invitationFetchError?.code,
    })

    if (invitationFetchError || !invitationData) {
      console.error("[v0] Server: Failed to fetch invitation")
      return {
        success: false,
        error: `Invalid invitation token. Error: ${invitationFetchError?.message || "Not found"}. Code: ${invitationFetchError?.code || "UNKNOWN"}`,
      }
    }

    if (invitationData.status === "expired") {
      return { success: false, error: "Invitation has expired" }
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    })

    if (authError) {
      console.error("[v0] Server: Auth error:", authError)
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: "Failed to authenticate user" }
    }

    console.log("[v0] Server: User authenticated:", authData.user.id)

    let { data: profileData, error: profileError } = await adminSupabase
      .from("buyer_profiles")
      .select("id")
      .eq("user_id", authData.user.id)
      .single()

    if (profileError || !profileData) {
      console.log("[v0] Server: Buyer profile not found, creating it now...")

      const nameParts = (invitationData.lead_name || "").split(" ")
      const firstName = nameParts[0] || ""
      const lastName = nameParts.slice(1).join(" ") || ""

      // Create the missing buyer profile
      const { data: newProfileData, error: createProfileError } = await adminSupabase
        .from("buyer_profiles")
        .insert({
          user_id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          email: formData.email,
          phone: invitationData.lead_phone || "",
          buying_timeline: "",
          signup_source: "fddhub",
        })
        .select("id")
        .single()

      if (createProfileError || !newProfileData) {
        console.error("[v0] Server: Failed to create buyer profile:", createProfileError)
        return { success: false, error: `Failed to create buyer profile: ${createProfileError?.message}` }
      }

      profileData = newProfileData
      console.log("[v0] Server: Buyer profile created:", profileData.id)
    } else {
      console.log("[v0] Server: Buyer profile found:", profileData.id)
    }

    const { error: fddAccessError } = await adminSupabase.from("lead_fdd_access").upsert(
      {
        buyer_id: profileData.id,
        franchise_id: invitationData.franchise_id,
        franchisor_id: invitationData.franchisor_id,
        invitation_id: invitationData.id,
        granted_via: "invitation",
        total_views: 0,
        total_time_spent_seconds: 0,
      },
      {
        onConflict: "buyer_id,franchise_id",
        ignoreDuplicates: true,
      },
    )

    if (fddAccessError) {
      console.error("[v0] Server: FDD access error:", fddAccessError)
      return { success: false, error: `Failed to grant FDD access: ${fddAccessError.message}` }
    }

    console.log("[v0] Server: FDD access granted")

    const { error: invitationError } = await adminSupabase
      .from("lead_invitations")
      .update({
        buyer_id: profileData.id,
        status: "signed_up",
        signed_up_at: new Date().toISOString(),
      })
      .eq("invitation_token", formData.invitation_token)

    if (invitationError) {
      console.error("[v0] Server: Invitation link error:", invitationError)
      return { success: false, error: `Failed to link invitation: ${invitationError.message}` }
    }

    console.log("[v0] Server: Invitation linked successfully")

    return { success: true, user: authData.user }
  } catch (error: any) {
    console.error("[v0] Server: Unexpected error:", error)
    return { success: false, error: error.message || "Unexpected error occurred" }
  }
}
