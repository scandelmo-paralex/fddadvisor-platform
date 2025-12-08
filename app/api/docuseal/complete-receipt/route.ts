import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export async function POST(request: Request) {
  try {
    const { franchiseId, buyerId, submissionId } = await request.json()

    console.log("[v0] Receipt completion request:", { franchiseId, buyerId, submissionId })

    if (!franchiseId || !buyerId || !submissionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Update the lead_fdd_access record with receipt completion
    const { data, error } = await supabase
      .from("lead_fdd_access")
      .update({
        receipt_signed_at: new Date().toISOString(),
        docuseal_submission_id: submissionId,
      })
      .eq("franchise_id", franchiseId)
      .eq("buyer_id", buyerId)
      .select()

    if (error) {
      console.error("[v0] Error updating receipt completion:", error)
      return NextResponse.json({ error: "Failed to update receipt" }, { status: 500 })
    }

    console.log("[v0] Receipt completion saved successfully:", data)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Complete receipt error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
