"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function signupUser(formData: {
  email: string
  password: string
  role: "buyer" | "franchisor" | "lender"
  firstName: string
  lastName: string
  phone?: string
  company_name?: string
  tosAccepted?: boolean
  privacyAccepted?: boolean
}) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key for admin operations
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    console.log("[v0] Server: Creating auth user...")

    // Create auth user WITHOUT trigger (autoConfirm: true)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: formData.email,
      password: formData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role: formData.role,
        name: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        company_name: formData.company_name,
      },
    })

    if (authError) {
      console.error("[v0] Server: Auth error:", authError)
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: "Failed to create user" }
    }

    console.log("[v0] Server: Auth user created:", authData.user.id)

    // Insert into users table
    const { error: usersError } = await supabase.from("users").insert({
      id: authData.user.id,
      email: formData.email,
      role: formData.role,
    })

    if (usersError) {
      console.error("[v0] Server: Users table error:", usersError)
      // Clean up auth user if users table insert fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return { success: false, error: `Users table error: ${usersError.message}` }
    }

    console.log("[v0] Server: Users table updated")

    // Save consent record
    if (formData.tosAccepted || formData.privacyAccepted) {
      const now = new Date().toISOString()
      const { error: consentError } = await supabase.from("user_consents").insert({
        user_id: authData.user.id,
        tos_accepted: formData.tosAccepted || false,
        tos_accepted_at: formData.tosAccepted ? now : null,
        tos_version: "1.0",
        privacy_accepted: formData.privacyAccepted || false,
        privacy_accepted_at: formData.privacyAccepted ? now : null,
        privacy_version: "1.0",
      })

      if (consentError) {
        console.error("[v0] Server: Consent save error:", consentError)
        // Don't fail signup for consent error, but log it
        console.error("[v0] Server: WARNING - Consent not saved, continuing with signup")
      } else {
        console.log("[v0] Server: User consents saved successfully")
      }
    }

    // Create profile based on role
    const fullName = `${formData.firstName} ${formData.lastName}`

    if (formData.role === "buyer") {
      const { error: profileError } = await supabase.from("buyer_profiles").insert({
        user_id: authData.user.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone || "",
      })

      if (profileError) {
        console.error("[v0] Server: Buyer profile error:", profileError)
        return { success: false, error: `Buyer profile error: ${profileError.message}` }
      }
    } else if (formData.role === "franchisor") {
      const { error: profileError } = await supabase.from("franchisor_profiles").insert({
        user_id: authData.user.id,
        company_name: formData.company_name || "Company Name",
        contact_name: fullName,
        email: formData.email,
        phone: formData.phone || "",
      })

      if (profileError) {
        console.error("[v0] Server: Franchisor profile error:", profileError)
        return { success: false, error: `Franchisor profile error: ${profileError.message}` }
      }
    } else if (formData.role === "lender") {
      const { error: profileError } = await supabase.from("lender_profiles").insert({
        user_id: authData.user.id,
        institution_name: formData.company_name || "Institution Name",
        contact_name: fullName,
        email: formData.email,
        phone: formData.phone || "",
      })

      if (profileError) {
        console.error("[v0] Server: Lender profile error:", profileError)
        return { success: false, error: `Lender profile error: ${profileError.message}` }
      }
    }

    console.log("[v0] Server: Profile created successfully")

    return { success: true, user: authData.user }
  } catch (error: any) {
    console.error("[v0] Server: Unexpected error:", error)
    return { success: false, error: error.message || "Unexpected error occurred" }
  }
}
