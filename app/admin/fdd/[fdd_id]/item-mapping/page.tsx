import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { FDDItemMappingAdmin } from "@/components/fdd-item-mapping-admin"

export const dynamic = "force-dynamic"

export default async function FDDItemMappingPage({ params }: { params: { fdd_id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get FDD details
  const { data: fdd, error } = await supabase
    .from("fdds")
    .select(
      `
      *,
      franchises!franchise_id (
        id,
        name,
        slug
      )
    `,
    )
    .eq("id", params.fdd_id)
    .single()

  if (error || !fdd) {
    redirect("/admin/fdd-processing")
  }

  const franchiseSlug = fdd.franchises.slug || fdd.franchises.name.toLowerCase().replace(/\s+/g, "-")

  // Create a modified FDD object with the generated slug
  const fddWithSlug = {
    ...fdd,
    franchises: {
      ...fdd.franchises,
      slug: franchiseSlug,
    },
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <FDDItemMappingAdmin fdd={fddWithSlug} />
      </div>
    </div>
  )
}
