import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { CompanySettingsContent } from "@/components/company-settings-content"

// Force dynamic rendering for authentication
export const dynamic = "force-dynamic"

export default async function CompanySettingsPage() {
  const supabase = await createServerClient()

  if (!supabase) {
    redirect("/login")
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: franchisorProfile } = await supabase
    .from("franchisor_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single()

  // Only franchisors can access company settings
  if (!franchisorProfile) {
    redirect("/dashboard")
  }

  console.log("[v0] Company Settings - User:", user.email, "Franchisor:", franchisorProfile.company_name, "isAdmin:", franchisorProfile.is_admin)

  // Admin sees all franchises, regular franchisor sees only their own
  let franchisesQuery = supabase
    .from("franchises")
    .select("id, name, slug, industry, logo_url, created_at")
    .order("name")
  
  if (!franchisorProfile.is_admin) {
    franchisesQuery = franchisesQuery.eq("franchisor_id", franchisorProfile.id)
  }
  
  const { data: franchises } = await franchisesQuery

  console.log("[v0] Franchises for franchisor:", franchises?.length || 0, franchisorProfile.is_admin ? "(admin - all)" : "")

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <CompanySettingsContent user={user} franchisorProfile={franchisorProfile} franchises={franchises || []} />
      </main>
    </div>
  )
}
