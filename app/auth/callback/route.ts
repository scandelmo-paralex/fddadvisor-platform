import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const redirect = requestUrl.searchParams.get("redirect")
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createServerClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("[v0] Auth callback error:", error)
      return NextResponse.redirect(`${origin}/login?error=confirmation_failed`)
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      console.log("[v0] Email confirmed for user:", user.id)

      if (user.user_metadata?.role === "buyer") {
        const { error: profileError } = await supabase
          .from("buyer_profiles")
          .insert({
            user_id: user.id,
            full_name: user.user_metadata.name,
            email: user.email,
            phone: user.user_metadata.phone,
            investment_range_min: user.user_metadata.investment_range_min,
            investment_range_max: user.user_metadata.investment_range_max,
            industries_interested: user.user_metadata.industries_interested,
            buying_timeline: user.user_metadata.buying_timeline,
            current_occupation: user.user_metadata.current_occupation,
            business_experience_years: user.user_metadata.business_experience_years,
            has_franchise_experience: user.user_metadata.has_franchise_experience,
            preferred_location: user.user_metadata.preferred_location,
            signup_source: user.user_metadata.signup_source || "fddadvisor",
          })
          .select()
          .single()

        if (profileError) {
          console.error("[v0] Error creating buyer profile:", profileError)
        }
      }

      if (redirect) {
        return NextResponse.redirect(`${origin}${redirect}`)
      }

      // Check user role and signup source for smart redirect
      const { data: userData } = await supabase.from("users").select("role, signup_source").eq("id", user.id).single()

      if (userData?.role === "buyer") {
        return NextResponse.redirect(`${origin}/hub/my-fdds`)
      }

      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}
