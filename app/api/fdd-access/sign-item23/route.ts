import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { franchiseSlug, signatureDataUrl } = await request.json()

    if (!franchiseSlug || !signatureDataUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get buyer profile
    const { data: buyerProfile } = await supabase
      .from("buyer_profiles")
      .select("id, user_id")
      .eq("user_id", user.id)
      .single()

    if (!buyerProfile) {
      return NextResponse.json({ error: "Buyer profile not found" }, { status: 404 })
    }

    // Get franchise
    const { data: franchise } = await supabase.from("franchises").select("id").eq("slug", franchiseSlug).single()

    if (!franchise) {
      return NextResponse.json({ error: "Franchise not found" }, { status: 404 })
    }

    // Convert base64 to blob and upload to Vercel Blob
    const base64Data = signatureDataUrl.split(",")[1]
    const buffer = Buffer.from(base64Data, "base64")

    const blob = await put(`item23-signatures/${buyerProfile.id}-${franchise.id}-${Date.now()}.png`, buffer, {
      access: "public",
      contentType: "image/png",
    })

    // Capture signature metadata
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    // Update lead_fdd_access with signature
    const { error: updateError } = await supabase
      .from("lead_fdd_access")
      .update({
        item23_signed: true,
        item23_signature_url: blob.url,
        item23_signed_at: new Date().toISOString(),
        item23_signature_ip_address: ipAddress,
        status: "active",
      })
      .eq("buyer_id", buyerProfile.id)
      .eq("franchise_id", franchise.id)

    if (updateError) {
      console.error("[v0] Signature update error:", updateError)
      return NextResponse.json({ error: "Failed to save signature" }, { status: 500 })
    }

    return NextResponse.json({ success: true, signatureUrl: blob.url })
  } catch (error) {
    console.error("[v0] Sign Item 23 API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
