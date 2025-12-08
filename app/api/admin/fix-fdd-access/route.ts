import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email parameter required" }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Get the user by email
    const { data: authUser, error: authError } = await supabase.auth.admin.listUsers()
    const user = authUser?.users.find((u) => u.email === email)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get the buyer profile
    const { data: buyerProfile, error: buyerError } = await supabase
      .from("buyer_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (buyerError || !buyerProfile) {
      return NextResponse.json({ error: "Buyer profile not found" }, { status: 404 })
    }

    const { data: invitations, error: invError } = await supabase
      .from("lead_invitations")
      .select("id, franchise_id, franchisor_id, status")
      .eq("lead_email", email)

    if (invError || !invitations || invitations.length === 0) {
      return NextResponse.json({ error: "No invitations found for this email" }, { status: 404 })
    }

    const { error: updateError } = await supabase
      .from("lead_invitations")
      .update({
        status: "signed_up",
        signed_up_at: new Date().toISOString(),
        buyer_id: buyerProfile.id,
      })
      .eq("lead_email", email)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Create a map to store unique franchise access records
    const uniqueAccessMap = new Map<string, any>()

    for (const inv of invitations) {
      const key = `${buyerProfile.id}-${inv.franchise_id}`
      // Only add if not already in map (keeps first invitation for each franchise)
      if (!uniqueAccessMap.has(key)) {
        uniqueAccessMap.set(key, {
          buyer_id: buyerProfile.id,
          franchise_id: inv.franchise_id,
          franchisor_id: inv.franchisor_id,
          granted_via: "invitation",
          invitation_id: inv.id,
        })
      }
    }

    const accessRecords = Array.from(uniqueAccessMap.values())

    const { data: accessData, error: accessError } = await supabase
      .from("lead_fdd_access")
      .upsert(accessRecords, { onConflict: "buyer_id,franchise_id" })
      .select()

    if (accessError) {
      return NextResponse.json({ error: accessError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Accepted ${invitations.length} invitation(s) and created ${accessRecords.length} FDD access record(s)`,
      invitations: invitations.map((inv) => ({ id: inv.id, franchise_id: inv.franchise_id })),
      accessRecords: accessData,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
