import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const {
      buyerId,
      franchiseId,
      entityType,
      businessName,
      businessTitle,
      businessPrintName,
      individualPrintName,
      signature,
      dateSigned,
    } = body

    if (!buyerId || !franchiseId || !signature || !dateSigned) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const base64Data = signature.replace(/^data:image\/\w+;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")

    const signatureBlob = await put(`signatures/buyer-${buyerId}-${Date.now()}.png`, buffer, {
      access: "public",
      contentType: "image/png",
    })

    const { error: updateError } = await supabase
      .from("lead_fdd_access")
      .update({
        item23_signed: true,
        item23_signed_at: new Date().toISOString(),
        item23_signature_data: {
          entityType,
          businessName,
          businessTitle,
          businessPrintName,
          individualPrintName,
          signatureUrl: signatureBlob.url,
          dateSigned,
        },
        status: "signed",
      })
      .eq("buyer_id", buyerId)
      .eq("franchise_id", franchiseId)

    if (updateError) {
      console.error("[v0] Error updating Item 23 signature:", updateError)
      return NextResponse.json({ error: "Failed to save Item 23 signature" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      signatureUrl: signatureBlob.url,
    })
  } catch (error) {
    console.error("[v0] Error in sign-item23 API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
