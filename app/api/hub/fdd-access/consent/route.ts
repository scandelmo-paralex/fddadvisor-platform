import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export async function POST(request: Request) {
  try {
    const { franchiseId, buyerId } = await request.json()

    if (!franchiseId || !buyerId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("[v0] Recording consent for buyer:", buyerId, "franchise:", franchiseId)

    const supabase = createServiceRoleClient()

    // Update the lead_fdd_access record with consent timestamp
    const { data, error } = await supabase
      .from("lead_fdd_access")
      .update({
        consent_given_at: new Date().toISOString(),
      })
      .eq("franchise_id", franchiseId)
      .eq("buyer_id", buyerId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating consent:", error)
      return NextResponse.json({ error: "Failed to update consent", details: error.message }, { status: 500 })
    }

    console.log("[v0] Consent recorded successfully:", data)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Consent tracking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
