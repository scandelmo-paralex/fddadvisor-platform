import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function FranchiseItemMappingRedirect({
  params,
}: {
  params: { franchise_id: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get franchise details
  const { data: franchise, error: franchiseError } = await supabase
    .from("franchises")
    .select("id, name, slug")
    .eq("id", params.franchise_id)
    .single()

  if (franchiseError || !franchise) {
    redirect("/admin/fdd-processing")
  }

  // Get FDD for this franchise
  const { data: fdd, error: fddError } = await supabase
    .from("fdds")
    .select("id")
    .eq("franchise_name", franchise.name)
    .single()

  if (fddError || !fdd) {
    // No FDD found, redirect to processing page
    redirect("/admin/fdd-processing")
  }

  // Redirect to the FDD item-mapping page
  redirect(`/admin/fdd/${fdd.id}/item-mapping`)
}
