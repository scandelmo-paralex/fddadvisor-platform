import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { FDDCoverImageManager } from "@/components/admin/fdd-cover-image-manager"

export const dynamic = "force-dynamic"

export default async function AdminCoverImagesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user is admin
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (userData?.role !== "admin") {
    redirect("/dashboard")
  }

  // Fetch all franchises
  const { data: franchises } = await supabase
    .from("franchises")
    .select("id, name, slug, logo_url, cover_image_url")
    .order("name")

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">FDD Cover Image Management</h1>
        <p className="text-muted-foreground mt-2">
          Upload PNG cover images to display in the FDD viewer for each franchise
        </p>
      </div>

      <FDDCoverImageManager franchises={franchises || []} />
    </div>
  )
}
