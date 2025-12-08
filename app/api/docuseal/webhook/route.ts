import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    console.log("[v0] DocuSeal webhook received:", payload.event_type)

    // Only process completed submissions
    if (payload.event_type !== "submission.completed") {
      return NextResponse.json({ received: true })
    }

    const supabase = await createServerClient()
    const submission = payload.data

    // Extract metadata
    const metadata = submission.submitters[0]?.metadata
    if (!metadata?.franchise_id || !metadata?.buyer_id) {
      console.error("[v0] Missing metadata in DocuSeal webhook")
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 })
    }

    const pdfUrl = submission.audit_log_url || submission.submitters[0]?.documents?.[0]?.url

    if (!pdfUrl) {
      console.error("[v0] No PDF URL in DocuSeal webhook")
      return NextResponse.json({ error: "No PDF URL" }, { status: 400 })
    }

    const pdfResponse = await fetch(pdfUrl)
    const pdfBlob = await pdfResponse.blob()

    const filename = `item23-receipt-${metadata.franchise_id}-${metadata.buyer_id}-${Date.now()}.pdf`
    const blob = await put(filename, pdfBlob, {
      access: "public",
      addRandomSuffix: false,
    })

    const { error: updateError } = await supabase
      .from("lead_fdd_access")
      .update({
        receipt_signed_at: new Date().toISOString(),
        receipt_pdf_url: blob.url,
        docuseal_submission_id: submission.id,
      })
      .eq("franchise_id", metadata.franchise_id)
      .eq("buyer_id", metadata.buyer_id)

    if (updateError) {
      console.error("[v0] Error updating lead_fdd_access:", updateError)
      return NextResponse.json({ error: "Database update failed" }, { status: 500 })
    }

    console.log("[v0] Item 23 receipt completed and saved:", blob.url)

    // TODO: Send email notifications to buyer and franchisor

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error processing DocuSeal webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
