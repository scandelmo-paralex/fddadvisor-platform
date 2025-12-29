import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { ProfilePageClient } from "@/components/profile-page-client"
import type { Metadata } from "next"

// Force dynamic rendering for authentication
export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  title: "My Profile",
  description: "Manage your profile and account settings",
}

export default async function ProfilePage() {
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

  return <ProfilePageClient userId={user.id} userEmail={user.email || ""} />
}
