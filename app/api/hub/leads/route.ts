import { getSupabaseRouteClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await getSupabaseRouteClient()

    if (!supabase) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("franchisor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Get franchises owned by this franchisor
    const { data: franchises } = await supabase
      .from("franchises")
      .select("id, name, slug")
      .eq("franchisor_id", profile.id)

    const franchiseIds = franchises?.map((f) => f.id) || []
    const franchiseMap = new Map(franchises?.map((f) => [f.id, f]) || [])

    const { data: leadsRecords, error: leadsError } = await supabase
      .from("leads")
      .select("*")
      .eq("franchisor_id", profile.id)
      .order("created_at", { ascending: false })

    // Get all FDD access records for this franchisor's franchises
    const { data: fddAccessRecords, error: accessError } = await supabase
      .from("lead_fdd_access")
      .select(
        `
        *,
        buyer:buyer_profiles(
          id,
          user_id,
          first_name,
          last_name,
          email,
          phone,
          city_location,
          state_location,
          buying_timeline,
          signup_source,
          created_at,
          updated_at
        )
      `,
      )
      .in("franchise_id", franchiseIds)
      .order("created_at", { ascending: false })

    if (accessError) {
      console.error("Error fetching FDD access records:", accessError)
      return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 })
    }

    // Get engagement data for all buyers
    const buyerIds = fddAccessRecords?.map((r: any) => r.buyer_id).filter(Boolean) || []

    const { data: engagements } = await supabase.from("fdd_engagements").select("*").in("buyer_id", buyerIds)

    // Create engagement map: buyer_id + franchise_id -> engagement data
    const engagementMap = new Map()
    engagements?.forEach((eng: any) => {
      const key = `${eng.buyer_id}_${eng.franchise_id}`
      if (!engagementMap.has(key)) {
        engagementMap.set(key, {
          time_spent: 0,
          questions_asked: 0,
          sections_viewed: [],
          last_activity: eng.created_at,
        })
      }
      const current = engagementMap.get(key)
      current.time_spent += eng.duration_seconds || 0
      current.questions_asked += eng.questions_list?.length || 0
      if (eng.viewed_items) {
        current.sections_viewed = [...new Set([...current.sections_viewed, ...eng.viewed_items])]
      }
      if (new Date(eng.created_at) > new Date(current.last_activity)) {
        current.last_activity = eng.created_at
      }
    })

    // Get invitation data
    const { data: invitations, error: invError } = await supabase
      .from("lead_invitations")
      .select("*")
      .eq("franchisor_id", profile.id)
      .order("sent_at", { ascending: false })

    // Create invitation map by email (for matching with leads)
    const invitationByEmailMap = new Map(invitations?.map((inv: any) => [inv.lead_email, inv]) || [])

    const fddAccessEmails = new Set(fddAccessRecords?.map((access: any) => access.buyer?.email).filter(Boolean) || [])

    // Transform FDD access records into lead objects (buyers who have accessed)
    const accessLeads =
      fddAccessRecords?.map((access: any) => {
        const buyer = access.buyer
        const franchise = franchiseMap.get(access.franchise_id)
        const invitation = invitationByEmailMap.get(buyer?.email)
        const engagementKey = `${access.buyer_id}_${access.franchise_id}`
        const engagement = engagementMap.get(engagementKey)

        const buyerName =
          buyer?.first_name && buyer?.last_name
            ? `${buyer.first_name} ${buyer.last_name}`
            : invitation?.lead_name || "Unknown"

        const buyerEmail = buyer?.email || invitation?.lead_email || ""
        const buyerPhone = buyer?.phone || invitation?.lead_phone || ""
        const buyerCity = buyer?.city_location || ""
        const buyerState = buyer?.state_location || ""
        const buyerTimeline = invitation?.timeline || buyer?.buying_timeline || "3-6"

        return {
          id: access.id,
          name: buyerName,
          email: buyerEmail,
          phone: buyerPhone,
          brand: franchise?.name || "",
          franchiseSlug: franchise?.slug || "",
          fddSendDate: access.created_at ? new Date(access.created_at).toLocaleDateString() : undefined,
          item23SignedAt: access.receipt_signed_at,
          consentGivenAt: access.consent_given_at,
          disclosureExpiresDate: access.created_at
            ? new Date(new Date(access.created_at).getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()
            : undefined,
          invitationStatus: access.receipt_signed_at ? "signed" : invitation?.status || "granted",
          invitationSentDate: invitation?.sent_at ? new Date(invitation.sent_at).toLocaleDateString() : "",
          fddAccessDate: access.created_at ? new Date(access.created_at).toLocaleDateString() : "",
          expiresAt: invitation?.expires_at || null,
          source: invitation?.source || buyer?.signup_source || "FDDHub",
          timeline: buyerTimeline,
          intent: engagement ? (engagement.questions_asked > 3 ? "High" : "Medium") : "Low",
          isNew: false,
          qualityScore: calculateQualityScore(access, engagement),
          stage: invitation?.status === "signed_up" ? "engaged" : "inquiry",
          daysInStage: 0,
          verificationStatus: "unverified" as const,
          location: buyerCity && buyerState ? `${buyerCity}, ${buyerState}` : "",
          city: buyerCity,
          state: buyerState,
          totalViews: access.total_views || 0,
          totalTimeSpent: access.total_time_spent_seconds || 0,
          lastActivity: engagement?.last_activity || access.updated_at,
          sectionsViewed: engagement?.sections_viewed || [],
          questionsAsked: engagement?.questions_asked || 0,
          buyerId: access.buyer_id,
          franchiseId: access.franchise_id,
        }
      }) || []

    // The leads table only has relationship IDs, actual lead data is in lead_invitations
    const pendingLeads = (invitations || [])
      .filter((inv: any) => {
        const emailNotInAccess = !fddAccessEmails.has(inv.lead_email)
        const notSignedUp = inv.status !== "signed_up"
        return emailNotInAccess && notSignedUp
      })
      .map((inv: any) => {
        const franchise = franchiseMap.get(inv.franchise_id)

        // Determine FDD status based on invitation status
        let invitationStatus = "sent"
        if (inv.status === "signed" || inv.status === "signed_up") {
          invitationStatus = "signed"
        } else if (inv.status === "viewed" || inv.status === "opened") {
          invitationStatus = "viewed"
        } else if (inv.status === "sent" || inv.status === "pending") {
          invitationStatus = "sent"
        }

        const invCity = inv.city || ""
        const invState = inv.state || ""
        const invLocation = invCity && invState ? `${invCity}, ${invState}` : invCity || invState || ""

        return {
          id: inv.id,
          name: inv.lead_name || "Unknown",
          email: inv.lead_email || "",
          phone: inv.lead_phone || "",
          brand: inv.brand || franchise?.name || "",
          franchiseSlug: franchise?.slug || "",
          fddSendDate: inv.sent_at ? new Date(inv.sent_at).toLocaleDateString() : undefined,
          item23SignedAt: null,
          consentGivenAt: null,
          disclosureExpiresDate: inv.expires_at ? new Date(inv.expires_at).toLocaleDateString() : undefined,
          invitationStatus: invitationStatus,
          invitationSentDate: inv.sent_at ? new Date(inv.sent_at).toLocaleDateString() : "",
          fddAccessDate: "",
          expiresAt: inv.expires_at || null,
          source: inv.source || "Direct Inquiry",
          timeline: inv.timeline || "3-6",
          intent: "Medium",
          isNew: true,
          qualityScore: 50,
          stage: "inquiry",
          daysInStage: 0,
          verificationStatus: "unverified" as "unverified" | "verified" | "rejected",
          location: invLocation,
          city: invCity,
          state: invState,
          targetLocation: inv.target_location || "",
          totalViews: 0,
          totalTimeSpent: 0,
          lastActivity: inv.sent_at || inv.created_at,
          sectionsViewed: [],
          questionsAsked: 0,
          buyerId: null,
          franchiseId: inv.franchise_id,
        }
      })

    const allLeads = [...accessLeads, ...pendingLeads]

    return NextResponse.json(allLeads)
  } catch (error: any) {
    console.error("Error in leads API:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

function calculateQualityScore(access: any, engagement: any): number {
  let score = 50 // Base score

  // Engagement scoring (40 points)
  if (engagement) {
    const timeSpentMinutes = engagement.time_spent / 60
    score += Math.min(timeSpentMinutes * 2, 20) // Up to 20 points for time spent
    score += Math.min(engagement.questions_asked * 4, 15) // Up to 15 points for questions
    score += Math.min((engagement.sections_viewed?.length || 0) * 1, 5) // Up to 5 points for sections viewed
  }

  // Access frequency scoring (10 points)
  score += Math.min((access.total_views || 0) * 2, 10)

  return Math.min(Math.round(score), 100)
}
