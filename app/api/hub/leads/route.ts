import { getSupabaseRouteClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { calculateQualityScore, getLeadTemperature, type EngagementData, type BuyerProfile } from "@/lib/lead-scoring"

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

    // First, check if user is a franchisor owner
    const { data: profile, error: profileError } = await supabase
      .from("franchisor_profiles")
      .select("id, is_admin")
      .eq("user_id", user.id)
      .single()

    let franchisorId: string
    let isAdmin = false
    let isRecruiter = false
    let teamMemberId: string | null = null

    if (profile) {
      // User is a franchisor owner
      franchisorId = profile.id
      isAdmin = profile.is_admin || false
    } else {
      // Check if user is a team member
      const { data: teamMember, error: tmError } = await supabase
        .from("franchisor_team_members")
        .select("id, franchisor_id, role")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single()

      if (tmError || !teamMember) {
        return NextResponse.json({ error: "Not associated with any franchisor" }, { status: 403 })
      }

      franchisorId = teamMember.franchisor_id
      teamMemberId = teamMember.id
      isRecruiter = teamMember.role === "recruiter"
      // Admins and owners see all leads
      isAdmin = teamMember.role === "owner" || teamMember.role === "admin"
    }

    // Get franchises with their ideal_candidate_profile for financial requirements
    let franchisesQuery = supabase.from("franchises").select("id, name, slug, ideal_candidate_profile")
    
    if (!isAdmin) {
      franchisesQuery = franchisesQuery.eq("franchisor_id", franchisorId)
    }
    
    const { data: franchises } = await franchisesQuery

    const franchiseIds = franchises?.map((f) => f.id) || []
    const franchiseMap = new Map(franchises?.map((f) => [f.id, f]) || [])

    // Get leads - admin sees all, regular franchisor sees only their own
    let leadsQuery = supabase.from("leads").select("*").order("created_at", { ascending: false })
    
    if (!isAdmin) {
      leadsQuery = leadsQuery.eq("franchisor_id", franchisorId)
    }
    
    const { data: leadsRecords, error: leadsError } = await leadsQuery

    // Get all FDD access records for this franchisor's franchises
    // Include buyer profile fields needed for comprehensive quality score calculation
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
          updated_at,
          liquid_assets_range,
          net_worth_range,
          funding_plans,
          profile_completed_at,
          management_experience,
          has_owned_business,
          years_of_experience
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
    // IMPORTANT: fdd_engagements.buyer_id stores auth.users.id (user_id), NOT buyer_profiles.id
    // So we need to use buyer.user_id from the joined buyer_profiles data
    const buyerUserIds = fddAccessRecords?.map((r: any) => r.buyer?.user_id).filter(Boolean) || []

    const { data: engagements } = await supabase.from("fdd_engagements").select("*").in("buyer_id", buyerUserIds)

    // Create engagement map: user_id + franchise_id -> engagement data
    // Note: Using user_id (auth.users.id) as the key since that's what fdd_engagements stores
    const engagementMap = new Map()
    engagements?.forEach((eng: any) => {
      const key = `${eng.buyer_id}_${eng.franchise_id}`
      if (!engagementMap.has(key)) {
        engagementMap.set(key, {
          time_spent: 0,
          questions_asked: 0,
          sections_viewed: [],
          last_activity: eng.created_at,
          session_count: 0,
        })
      }
      const current = engagementMap.get(key)
      current.time_spent += eng.duration_seconds || 0
      current.questions_asked += eng.questions_list?.length || 0
      current.session_count += 1
      if (eng.viewed_items) {
        current.sections_viewed = [...new Set([...current.sections_viewed, ...eng.viewed_items])]
      }
      if (new Date(eng.created_at) > new Date(current.last_activity)) {
        current.last_activity = eng.created_at
      }
    })

    // Get invitation data with stage information
    // - Admin/Owner: sees all invitations for the franchisor
    // - Recruiter: sees only invitations they created
    let invitationsQuery = supabase.from("lead_invitations").select(`
      *,
      pipeline_stage:stage_id(
        id,
        name,
        color,
        position,
        is_default,
        is_closed_won,
        is_closed_lost
      )
    `).order("sent_at", { ascending: false })
    
    if (isRecruiter && teamMemberId) {
      // Recruiters only see leads they created
      invitationsQuery = invitationsQuery.eq("created_by", teamMemberId)
    } else if (!isAdmin) {
      // Non-admin owners see all their franchisor's invitations
      invitationsQuery = invitationsQuery.eq("franchisor_id", franchisorId)
    }
    // Admin sees all (no filter)
    
    const { data: invitations, error: invError } = await invitationsQuery

    // Create invitation map by email (for matching with leads)
    const invitationByEmailMap = new Map(invitations?.map((inv: any) => [inv.lead_email, inv]) || [])

    // For recruiters, we need to filter FDD access records to only show buyers they invited
    const recruiterInvitedEmails = isRecruiter 
      ? new Set(invitations?.map((inv: any) => inv.lead_email).filter(Boolean) || [])
      : null

    const fddAccessEmails = new Set(fddAccessRecords?.map((access: any) => access.buyer?.email).filter(Boolean) || [])

    // Transform FDD access records into lead objects (buyers who have accessed)
    let accessLeads =
      fddAccessRecords?.map((access: any) => {
        const buyer = access.buyer
        const franchise = franchiseMap.get(access.franchise_id)
        const invitation = invitationByEmailMap.get(buyer?.email)
        // IMPORTANT: Use buyer.user_id (auth.users.id) as the key, not access.buyer_id (buyer_profiles.id)
        // This matches how fdd_engagements.buyer_id is stored
        const engagementKey = `${buyer?.user_id}_${access.franchise_id}`
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

        // Build engagement data for scoring
        const engagementData: EngagementData = {
          totalTimeSeconds: engagement?.time_spent || access?.total_time_spent_seconds || 0,
          sessionCount: engagement?.session_count || access?.total_views || 1,
          questionsAsked: engagement?.questions_asked || 0,
          sectionsViewed: engagement?.sections_viewed || [],
        }

        // Build buyer profile for scoring
        const buyerProfile: BuyerProfile | null = buyer ? {
          liquid_assets_range: buyer.liquid_assets_range,
          net_worth_range: buyer.net_worth_range,
          funding_plans: buyer.funding_plans,
          profile_completed_at: buyer.profile_completed_at,
          management_experience: buyer.management_experience,
          has_owned_business: buyer.has_owned_business,
          years_of_experience: buyer.years_of_experience,
        } : null

        // Get franchise financial requirements
        const financialRequirements = franchise?.ideal_candidate_profile?.financial_requirements || null

        // Calculate quality score using shared utility
        const scoreResult = calculateQualityScore(engagementData, buyerProfile, financialRequirements)

        return {
          id: access.id,
          invitation_id: invitation?.id || null, // ID in lead_invitations table for stage updates
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
          // Use shared scoring utility for consistent temperature/intent
          intent: scoreResult.temperature,
          temperature: scoreResult.temperature,
          isNew: false,
          qualityScore: scoreResult.score,
          engagementTier: scoreResult.engagementTier,
          financialStatus: scoreResult.financialStatus,
          scoreBreakdown: scoreResult.breakdown,
          stage: invitation?.pipeline_stage?.name?.toLowerCase() || (invitation?.status === "signed_up" ? "engaged" : "inquiry"),
          stage_id: invitation?.stage_id || null,
          pipeline_stage: invitation?.pipeline_stage || null,
          daysInStage: invitation?.stage_changed_at 
            ? Math.floor((Date.now() - new Date(invitation.stage_changed_at).getTime()) / (1000 * 60 * 60 * 24))
            : 0,
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

    // For recruiters, filter accessLeads to only include buyers they invited
    if (isRecruiter && recruiterInvitedEmails) {
      accessLeads = accessLeads.filter((lead: any) => 
        recruiterInvitedEmails.has(lead.email)
      )
    }

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
          invitation_id: inv.id, // For pending leads, id IS the invitation_id
          name: inv.lead_name || "Unknown",
          email: inv.lead_email || "",
          phone: inv.lead_phone || "",
          brand: franchise?.name || "",
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
          intent: "Cold",
          temperature: "Cold",
          isNew: true,
          qualityScore: 30, // Base score only for pending leads
          engagementTier: "none" as const,
          financialStatus: "unknown" as const,
          scoreBreakdown: { base: 30, engagement: 0, financial: 0, experience: 0 },
          stage: inv.pipeline_stage?.name?.toLowerCase() || "inquiry",
          stage_id: inv.stage_id || null,
          pipeline_stage: inv.pipeline_stage || null,
          daysInStage: inv.stage_changed_at 
            ? Math.floor((Date.now() - new Date(inv.stage_changed_at).getTime()) / (1000 * 60 * 60 * 24))
            : 0,
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
