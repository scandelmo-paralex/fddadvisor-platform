import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  const params = await context.params
  const debugMode = new URL(request.url).searchParams.get("debug") === "true"
  const debugInfo: any = {
    routeHit: true,
    timestamp: new Date().toISOString(),
    requestUrl: request.url,
    params: params,
  }

  try {
    const { token } = params
    debugInfo.token = token
    debugInfo.tokenLength = token?.length
    debugInfo.tokenType = typeof token

    if (!token) {
      debugInfo.error = "Token is undefined or empty"
      if (debugMode) return NextResponse.json({ debug: debugInfo }, { status: 400 })
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    debugInfo.supabaseClientCreated = true

    console.log("[v0] API: Querying for invitation with token:", token)

    const { data: invitation, error } = await supabase
      .from("lead_invitations")
      .select("*")
      .eq("invitation_token", token)
      .single()

    console.log("[v0] API: Query result - invitation:", invitation)
    console.log("[v0] API: Query result - error:", error)
    console.log("[v0] API: Error details:", JSON.stringify(error, null, 2))

    debugInfo.queryCompleted = true
    debugInfo.invitationFound = !!invitation
    debugInfo.queryError = error
    debugInfo.errorDetails = error
      ? {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }
      : null

    if (invitation) {
      debugInfo.invitationId = invitation.id
      debugInfo.invitationStatus = invitation.status
      debugInfo.invitationEmail = invitation.lead_email
    }

    if (error || !invitation) {
      debugInfo.returning404 = true
      console.log("[v0] API: Returning 404 - invitation not found")
      if (debugMode) return NextResponse.json({ debug: debugInfo }, { status: 404 })
      return NextResponse.json({ error: "Invitation not found", debug: debugInfo }, { status: 404 })
    }

    let franchiseData = null
    let franchisorData = null

    if (invitation.franchise_id) {
      const { data: franchise } = await supabase
        .from("franchises")
        .select("*")
        .eq("id", invitation.franchise_id)
        .single()

      franchiseData = franchise
      debugInfo.franchiseFound = !!franchise

      if (franchise?.franchisor_id) {
        const { data: franchisor } = await supabase
          .from("franchisor_profiles")
          .select("company_name, logo_url")
          .eq("id", franchise.franchisor_id)
          .single()

        franchisorData = franchisor
        debugInfo.franchisorFound = !!franchisor
      }
    }

    // Check if expired
    const expiresAt = new Date(invitation.expires_at)
    debugInfo.expiresAt = expiresAt.toISOString()
    debugInfo.isExpired = expiresAt < new Date()

    if (expiresAt < new Date()) {
      await supabase.from("lead_invitations").update({ status: "expired" }).eq("id", invitation.id)
      if (debugMode) return NextResponse.json({ debug: debugInfo }, { status: 410 })
      return NextResponse.json({ error: "Invitation expired" }, { status: 410 })
    }

    // Mark as viewed if not already
    if (invitation.status === "sent") {
      await supabase
        .from("lead_invitations")
        .update({
          status: "viewed",
          viewed_at: new Date().toISOString(),
        })
        .eq("id", invitation.id)
      debugInfo.markedAsViewed = true
    }

    const invitationWithRelations = {
      ...invitation,
      franchise: franchiseData,
      franchisor: franchisorData,
    }

    if (debugMode) return NextResponse.json({ debug: debugInfo, invitation: invitationWithRelations }, { status: 200 })
    return NextResponse.json({ invitation: invitationWithRelations }, { status: 200 })
  } catch (error) {
    console.log("[v0] API: Catch block error:", error)
    debugInfo.catchError = error
    if (debugMode) return NextResponse.json({ debug: debugInfo }, { status: 500 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
