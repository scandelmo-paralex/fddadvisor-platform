import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

type EngagementTier = "none" | "minimal" | "partial" | "meaningful" | "high"

function getEngagementTier(totalTimeSeconds: number, sessionCount: number): EngagementTier {
  if (sessionCount === 0 || totalTimeSeconds === 0) return "none"
  const totalMinutes = totalTimeSeconds / 60
  if (totalMinutes < 5) return "minimal"
  if (totalMinutes < 15) return "partial"
  if (totalMinutes < 45) return "meaningful"
  return "high"
}

// Helper to parse financial ranges into numeric values for comparison
function parseFinancialRange(range: string | null): { min: number; max: number } | null {
  if (!range) return null
  
  // Handle common patterns like "$100K - $250K", "$500,000+", "Under $100K"
  const cleanRange = range.replace(/,/g, '').toLowerCase()
  
  if (cleanRange.includes('under') || cleanRange.includes('less than')) {
    const match = cleanRange.match(/(\d+)k?/)
    if (match) {
      const value = parseInt(match[1]) * (cleanRange.includes('k') ? 1000 : 1)
      return { min: 0, max: value }
    }
  }
  
  if (cleanRange.includes('+') || cleanRange.includes('over') || cleanRange.includes('more than')) {
    const match = cleanRange.match(/(\d+)k?/)
    if (match) {
      const value = parseInt(match[1]) * (cleanRange.includes('k') ? 1000 : 1)
      return { min: value, max: value * 10 } // Assume upper bound is 10x
    }
  }
  
  // Range pattern: "$100K - $250K" or "100000 - 250000"
  const rangeMatch = cleanRange.match(/\$?(\d+)k?\s*[-–]\s*\$?(\d+)k?/i)
  if (rangeMatch) {
    let min = parseInt(rangeMatch[1])
    let max = parseInt(rangeMatch[2])
    // If values are small, assume they're in thousands
    if (min < 1000) min *= 1000
    if (max < 1000) max *= 1000
    return { min, max }
  }
  
  // Single value
  const singleMatch = cleanRange.match(/\$?(\d+)k?/)
  if (singleMatch) {
    let value = parseInt(singleMatch[1])
    if (value < 1000) value *= 1000
    return { min: value, max: value }
  }
  
  return null
}

// Check if buyer meets financial requirements
function assessFinancialFit(
  buyerProfile: any,
  financialRequirements: { liquid_capital_min: number; net_worth_min: number }
): {
  meetsLiquidCapital: boolean | null
  meetsNetWorth: boolean | null
  liquidCapitalAssessment: string
  netWorthAssessment: string
  overallFit: 'qualified' | 'borderline' | 'not_qualified' | 'unknown'
  score: number
} {
  const liquidRange = parseFinancialRange(buyerProfile?.liquid_assets_range)
  const netWorthRange = parseFinancialRange(buyerProfile?.net_worth_range)
  
  let meetsLiquidCapital: boolean | null = null
  let meetsNetWorth: boolean | null = null
  let liquidCapitalAssessment = "Not provided"
  let netWorthAssessment = "Not provided"
  let score = 0
  
  // Assess liquid capital
  if (liquidRange) {
    const midpoint = (liquidRange.min + liquidRange.max) / 2
    const required = financialRequirements.liquid_capital_min
    
    if (liquidRange.min >= required) {
      meetsLiquidCapital = true
      liquidCapitalAssessment = `✅ MEETS: ${buyerProfile.liquid_assets_range} exceeds $${(required/1000).toFixed(0)}K requirement`
      score += 40
    } else if (midpoint >= required * 0.9) {
      meetsLiquidCapital = true
      liquidCapitalAssessment = `⚠️ BORDERLINE: ${buyerProfile.liquid_assets_range} is close to $${(required/1000).toFixed(0)}K requirement - verify assets`
      score += 25
    } else {
      meetsLiquidCapital = false
      liquidCapitalAssessment = `❌ SHORTFALL: ${buyerProfile.liquid_assets_range} below $${(required/1000).toFixed(0)}K requirement`
      score += 5
    }
  }
  
  // Assess net worth
  if (netWorthRange) {
    const midpoint = (netWorthRange.min + netWorthRange.max) / 2
    const required = financialRequirements.net_worth_min
    
    if (netWorthRange.min >= required) {
      meetsNetWorth = true
      netWorthAssessment = `✅ MEETS: ${buyerProfile.net_worth_range} exceeds $${(required/1000).toFixed(0)}K requirement`
      score += 40
    } else if (midpoint >= required * 0.9) {
      meetsNetWorth = true
      netWorthAssessment = `⚠️ BORDERLINE: ${buyerProfile.net_worth_range} is close to $${(required/1000).toFixed(0)}K requirement - verify assets`
      score += 25
    } else {
      meetsNetWorth = false
      netWorthAssessment = `❌ SHORTFALL: ${buyerProfile.net_worth_range} below $${(required/1000).toFixed(0)}K requirement`
      score += 5
    }
  }
  
  // Add points for funding plan
  if (buyerProfile?.funding_plans) {
    const fundingPlansStr = Array.isArray(buyerProfile.funding_plans) 
      ? buyerProfile.funding_plans.join(' ').toLowerCase() 
      : (buyerProfile.funding_plans || '').toLowerCase()
    if (fundingPlansStr.includes('cash')) {
      score += 20
    } else if (fundingPlansStr.includes('sba') || 
               fundingPlansStr.includes('401')) {
      score += 15
    } else {
      score += 10
    }
  }
  
  // Determine overall fit
  let overallFit: 'qualified' | 'borderline' | 'not_qualified' | 'unknown' = 'unknown'
  
  if (meetsLiquidCapital === null && meetsNetWorth === null) {
    overallFit = 'unknown'
  } else if (meetsLiquidCapital === false || meetsNetWorth === false) {
    overallFit = 'not_qualified'
  } else if (meetsLiquidCapital === true && meetsNetWorth === true) {
    overallFit = 'qualified'
  } else {
    overallFit = 'borderline'
  }
  
  return {
    meetsLiquidCapital,
    meetsNetWorth,
    liquidCapitalAssessment,
    netWorthAssessment,
    overallFit,
    score: Math.min(score, 100)
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get("lead_id")

    if (!leadId) {
      return NextResponse.json({ error: "lead_id is required" }, { status: 400 })
    }

    const { data: accessRecord } = await supabase
      .from("lead_fdd_access")
      .select("buyer_id, franchise_id")
      .eq("id", leadId)
      .single()

    let invitationRecord = null
    if (!accessRecord) {
      const { data: invitation } = await supabase.from("lead_invitations").select("*").eq("id", leadId).single()

      if (invitation) {
        invitationRecord = invitation
      }
    }

    if (invitationRecord && !accessRecord) {
      const tier: EngagementTier = "none"

      // Get franchise details for the invitation
      const { data: franchise } = await supabase
        .from("franchises")
        .select("name, slug, industry, total_investment_min, total_investment_max, ideal_candidate_profile")
        .eq("id", invitationRecord.franchise_id)
        .single()

      // Try to fetch buyer profile by email for pending invitations too
      let buyerQualification = null
      if (invitationRecord.lead_email) {
        const { data: buyerProfile } = await supabase
          .from("buyer_profiles")
          .select(`
            first_name, last_name, email, city_location, state_location, buying_timeline, signup_source,
            fico_score_range, liquid_assets_range, net_worth_range, funding_plans, linkedin_url,
            no_felony_attestation, no_bankruptcy_attestation, profile_completed_at,
            years_of_experience, management_experience, has_owned_business, industry_experience, relevant_skills
          `)
          .eq("email", invitationRecord.lead_email)
          .single()
        
        if (buyerProfile) {
          buyerQualification = {
            ficoScoreRange: buyerProfile.fico_score_range,
            liquidAssetsRange: buyerProfile.liquid_assets_range,
            netWorthRange: buyerProfile.net_worth_range,
            fundingPlans: buyerProfile.funding_plans,
            linkedInUrl: buyerProfile.linkedin_url,
            noFelonyAttestation: buyerProfile.no_felony_attestation,
            noBankruptcyAttestation: buyerProfile.no_bankruptcy_attestation,
            profileCompletedAt: buyerProfile.profile_completed_at,
            yearsOfExperience: buyerProfile.years_of_experience,
            managementExperience: buyerProfile.management_experience,
            hasOwnedBusiness: buyerProfile.has_owned_business,
            industryExperience: buyerProfile.industry_experience,
            relevantSkills: buyerProfile.relevant_skills,
          }
        }
      }

      // Pass buyerProfile to generate better insights
      const aiInsights = generatePendingLeadInsights(invitationRecord, franchise, buyerQualification ? {
        first_name: invitationRecord.lead_name?.split(' ')[0],
        last_name: invitationRecord.lead_name?.split(' ').slice(1).join(' '),
        years_of_experience: buyerQualification.yearsOfExperience,
        has_owned_business: buyerQualification.hasOwnedBusiness,
        industry_experience: buyerQualification.industryExperience,
        relevant_skills: buyerQualification.relevantSkills,
        funding_plans: buyerQualification.fundingPlans,
        liquid_assets_range: buyerQualification.liquidAssetsRange,
        net_worth_range: buyerQualification.netWorthRange,
        signup_source: invitationRecord.source,
        buying_timeline: invitationRecord.timeline,
      } : null)

      return NextResponse.json({
        totalTimeSpent: "0m",
        totalTimeSpentSeconds: 0,
        sectionsViewed: [],
        questionsAsked: [],
        fddFocusAreas: [],
        accessedDate: null,
        engagementCount: 0,
        engagementTier: tier,
        invitationStatus: invitationRecord.status,
        invitationSentAt: invitationRecord.sent_at,
        aiInsights,
        buyerQualification,
        buyerLocation: invitationRecord.city && invitationRecord.state 
          ? `${invitationRecord.city}, ${invitationRecord.state}` 
          : null,
      })
    }

    if (!accessRecord) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    const { data: buyerProfile } = await supabase
      .from("buyer_profiles")
      .select(`
        first_name, last_name, email, city_location, state_location, buying_timeline, signup_source,
        fico_score_range, liquid_assets_range, net_worth_range, funding_plans, linkedin_url,
        no_felony_attestation, no_bankruptcy_attestation, profile_completed_at,
        years_of_experience, management_experience, has_owned_business, industry_experience, relevant_skills
      `)
      .eq("id", accessRecord.buyer_id)
      .single()

    // Get franchise with ideal_candidate_profile
    const { data: franchise } = await supabase
      .from("franchises")
      .select("name, slug, industry, total_investment_min, total_investment_max, ideal_candidate_profile")
      .eq("id", accessRecord.franchise_id)
      .single()

    const { data: invitation } = await supabase
      .from("lead_invitations")
      .select("source, timeline, city, state, target_location, brand")
      .eq("franchise_id", accessRecord.franchise_id)
      .eq("lead_email", buyerProfile?.email)
      .single()

    const { data: engagements, error: engagementError } = await supabase
      .from("fdd_engagements")
      .select("*")
      .eq("buyer_id", accessRecord.buyer_id)
      .eq("franchise_id", accessRecord.franchise_id)
      .order("created_at", { ascending: false })

    if (engagementError) {
      console.error("Error fetching engagement data:", engagementError)
      return NextResponse.json({ error: engagementError.message }, { status: 500 })
    }

    const totalTimeSpent = engagements?.reduce((sum, eng) => sum + (eng.time_spent || 0), 0) || 0
    const sessionCount = engagements?.length || 0

    const tier = getEngagementTier(totalTimeSpent, sessionCount)

    const sectionsViewed = Array.from(new Set(engagements?.flatMap((eng) => eng.sections_viewed || []) || []))
    const itemsViewed = Array.from(new Set(engagements?.flatMap((eng) => eng.items_viewed || []) || []))

    const questions: string[] = []
    const totalQuestionsAsked = engagements?.reduce((sum, e) => sum + (e.questions_asked || 0), 0) || 0

    if (engagements && engagements.length > 0) {
      const viewedItem19 = engagements.some((e) => e.viewed_item19)
      const viewedItem7 = engagements.some((e) => e.viewed_item7)
      const hasSignificantTime = engagements.some((e) => e.spent_significant_time)

      if (viewedItem19) {
        questions.push(
          "What are the typical profit margins based on Item 19 data?",
          "Can you explain the variance between top performers and average performers?",
          "How long does it typically take to break even based on the financial performance data?",
        )
      }

      if (viewedItem7) {
        questions.push(
          "What is included in the initial franchise fee and what does it cover?",
          "Are there any hidden costs or fees not shown in the initial investment estimate?",
        )
      }

      if (sectionsViewed.some(s => s.includes("Item 12") || s.includes("Territory"))) {
        questions.push(
          "How is territory protection handled? What are the boundaries?",
          "Can I open multiple locations, and if so, what are the requirements?",
        )
      }

      if (sectionsViewed.some(s => s.includes("Item 11") || s.includes("Training"))) {
        questions.push(
          "What does the training program include and how long does it last?",
          "Is there ongoing support after the initial training period?",
        )
      }

      if (hasSignificantTime) {
        questions.push(
          "What are the key success factors for franchisees?",
          "What is the typical timeline from signing to opening?",
        )
      }
    }

    const fddFocusAreas = sectionsViewed.slice(0, 5).map((section, idx) => ({
      item: section,
      timeSpent: idx === 0 ? "45m" : idx === 1 ? "32m" : idx === 2 ? "28m" : "15m",
      interest: idx < 2 ? "High" : "Medium",
    }))

    const hours = Math.floor(totalTimeSpent / 3600)
    const minutes = Math.floor((totalTimeSpent % 3600) / 60)
    const formattedTimeSpent = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

    const accessedDate = engagements?.[0]?.created_at ? new Date(engagements[0].created_at).toLocaleDateString() : null

    // Generate AI insights with ideal candidate profile matching
    const aiInsights = await generateEnhancedAIInsights(
      engagements,
      sectionsViewed,
      itemsViewed,
      totalQuestionsAsked,
      totalTimeSpent,
      buyerProfile,
      franchise,
      invitation,
      tier,
    )

    const buyerQualification = buyerProfile
      ? {
          ficoScoreRange: buyerProfile.fico_score_range,
          liquidAssetsRange: buyerProfile.liquid_assets_range,
          netWorthRange: buyerProfile.net_worth_range,
          fundingPlans: buyerProfile.funding_plans,
          linkedInUrl: buyerProfile.linkedin_url,
          noFelonyAttestation: buyerProfile.no_felony_attestation,
          noBankruptcyAttestation: buyerProfile.no_bankruptcy_attestation,
          profileCompletedAt: buyerProfile.profile_completed_at,
          yearsOfExperience: buyerProfile.years_of_experience,
          managementExperience: buyerProfile.management_experience,
          hasOwnedBusiness: buyerProfile.has_owned_business,
          industryExperience: buyerProfile.industry_experience,
          relevantSkills: buyerProfile.relevant_skills,
        }
      : null

    return NextResponse.json({
      accessRecord,
      engagements,
      totalTimeSpent: formattedTimeSpent,
      totalTimeSpentSeconds: totalTimeSpent,
      averageSessionDuration: sessionCount > 0 ? Math.round(totalTimeSpent / sessionCount) : 0,
      sectionsViewed: sectionsViewed.slice(0, 10),
      itemsViewed: itemsViewed.slice(0, 10),
      questionsAsked: questions.slice(0, 5),
      fddFocusAreas,
      accessedDate,
      engagementCount: sessionCount,
      engagementTier: tier,
      aiInsights,
      buyerQualification,
      buyerLocation:
        buyerProfile?.city_location && buyerProfile?.state_location
          ? `${buyerProfile.city_location}, ${buyerProfile.state_location}`
          : null,
      invitationData: invitation
        ? {
            source: invitation.source,
            timeline: invitation.timeline,
            city: invitation.city,
            state: invitation.state,
            targetLocation: invitation.target_location,
            brand: invitation.brand,
          }
        : null,
    })
  } catch (error) {
    console.error("Error in engagement API:", error)
    return NextResponse.json(
      { error: "Failed to fetch engagement data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

function generatePendingLeadInsights(invitation: any, franchise: any, buyerProfile?: any) {
  const leadName = buyerProfile?.first_name 
    ? `${buyerProfile.first_name} ${buyerProfile.last_name || ""}`.trim()
    : invitation.lead_name || "This prospect"
  const franchiseName = franchise?.name || invitation.brand || "the franchise"
  const source = invitation.source || buyerProfile?.signup_source || "Direct"
  const timeline = invitation.timeline || buyerProfile?.buying_timeline || "Not specified"
  const location = invitation.city && invitation.state ? `${invitation.city}, ${invitation.state}` : null
  const targetLocation = invitation.target_location || null
  const sentDate = invitation.sent_at ? new Date(invitation.sent_at).toLocaleDateString() : "recently"

  // Check if franchise has financial requirements
  const idealProfile = franchise?.ideal_candidate_profile
  const financialReqs = idealProfile?.financial_requirements
  
  // Get buyer profile info
  const yearsExperience = buyerProfile?.years_of_experience
  const hasOwnedBusiness = buyerProfile?.has_owned_business
  const industryExperience = buyerProfile?.industry_experience
  const relevantSkills = buyerProfile?.relevant_skills
  const fundingPlans = buyerProfile?.funding_plans
  const liquidAssets = buyerProfile?.liquid_assets_range
  const netWorth = buyerProfile?.net_worth_range

  // Build experience summary
  let experienceSummary = ""
  if (yearsExperience || hasOwnedBusiness || industryExperience) {
    const parts = []
    if (yearsExperience) parts.push(`${yearsExperience} years of experience`)
    if (hasOwnedBusiness) parts.push("previous business owner")
    if (industryExperience && Array.isArray(industryExperience) && industryExperience.length > 0) {
      parts.push(`background in ${industryExperience.join(", ")}`)
    }
    experienceSummary = parts.length > 0 ? ` With ${parts.join(", ")}, they bring valuable experience.` : ""
  }

  const summary = `${leadName} received an FDD invitation on ${sentDate} but hasn't accessed it yet. They came through ${source}${timeline !== "Not specified" ? ` with a ${timeline} buying timeline` : ""}.${experienceSummary} This is an opportunity to follow up and encourage engagement.`

  const keyFindings = [
    `Lead source: ${source} - tailor your follow-up messaging accordingly`,
    timeline !== "Not specified"
      ? `Timeline: ${timeline} - ${timeline.includes("0-3") || timeline.includes("3-6") ? "Active buyer, prioritize follow-up" : "Longer timeline, nurture relationship"}`
      : "No timeline specified - qualify buying intent on follow-up call",
    location
      ? `Located in ${location}${targetLocation ? `, interested in ${targetLocation} territory` : ""}`
      : "Location not specified - clarify target market",
    `FDD sent but not opened - may need reminder or different approach`,
  ]

  // Add experience-based findings
  if (yearsExperience) {
    keyFindings.push(`Experience: ${yearsExperience} years${hasOwnedBusiness ? " with prior business ownership" : ""} - experienced candidate`)
  }
  if (industryExperience && Array.isArray(industryExperience) && industryExperience.length > 0) {
    keyFindings.push(`Industry background: ${industryExperience.join(", ")} - evaluate fit with franchise operations`)
  }
  if (relevantSkills && Array.isArray(relevantSkills) && relevantSkills.length > 0) {
    keyFindings.push(`Key skills: ${relevantSkills.join(", ")}`)
  }

  // Add financial findings
  if (liquidAssets && netWorth) {
    keyFindings.push(`Self-reported financials: ${liquidAssets} liquid assets, ${netWorth} net worth`)
  } else if (financialReqs) {
    keyFindings.push(`Financial requirements: ${(financialReqs.liquid_capital_min/1000).toFixed(0)}K liquid capital, ${(financialReqs.net_worth_min/1000).toFixed(0)}K net worth - qualify on first call`)
  } else {
    keyFindings.push("Verify financial qualification on first call")
  }

  if (fundingPlans) {
    const plans = Array.isArray(fundingPlans) ? fundingPlans.join(", ") : fundingPlans
    keyFindings.push(`Funding approach: ${plans}`)
  }

  const recommendations = [
    `Send a friendly follow-up email reminding ${leadName} about their FDD access`,
    source === "Trade Show"
      ? "Reference your conversation at the trade show to personalize outreach"
      : source === "Referral"
        ? "Mention the referral source to build trust and credibility"
        : source === "Website"
          ? "Highlight key benefits they likely saw on your website"
          : "Personalize your outreach based on how they found you",
    "Offer a quick call to walk them through the FDD highlights",
    "Address common hesitations: 'Many prospects find the FDD overwhelming at first - happy to guide you through the key sections'",
  ]

  const nextSteps = [
    `Send follow-up email within 24 hours if FDD hasn't been accessed`,
    `Call ${leadName} to confirm they received the invitation and offer assistance`,
    "Prepare a 'FDD highlights' one-pager to share as a conversation starter",
    targetLocation
      ? `Research territory availability in ${targetLocation} before your call`
      : "Have territory availability information ready for the call",
  ]

  return {
    summary,
    keyFindings,
    recommendations,
    nextSteps,
    engagementTier: "none" as EngagementTier,
    tierMessage: "Awaiting first FDD session",
    candidateFit: null, // No fit assessment until they engage
  }
}

async function generateEnhancedAIInsights(
  engagements: any[] | null,
  sectionsViewed: string[],
  itemsViewed: string[],
  totalQuestions: number,
  totalTimeSeconds: number,
  buyerProfile: any | null,
  franchise: any | null,
  invitation: any | null,
  tier: EngagementTier,
) {
  const sessionCount = engagements?.length || 0
  const totalMinutes = Math.floor(totalTimeSeconds / 60)
  
  // Get ideal candidate profile from franchise
  const idealProfile = franchise?.ideal_candidate_profile
  const financialReqs = idealProfile?.financial_requirements
  const idealCriteria = idealProfile?.ideal_criteria || []
  
  // Calculate financial fit if requirements exist
  let financialFit = null
  if (financialReqs && buyerProfile) {
    financialFit = assessFinancialFit(buyerProfile, financialReqs)
  }

  if (tier === "minimal") {
    return generateMinimalEngagementInsights(
      engagements,
      sectionsViewed,
      buyerProfile,
      franchise,
      invitation,
      totalMinutes,
      financialFit,
    )
  }

  if (tier === "partial") {
    return generatePartialEngagementInsights(
      engagements,
      sectionsViewed,
      buyerProfile,
      franchise,
      invitation,
      totalMinutes,
      sessionCount,
      financialFit,
    )
  }

  // Calculate engagement metrics for meaningful/high engagement
  const viewedItem19 = engagements?.some((e) => e.viewed_item19) || false
  const viewedItem7 = engagements?.some((e) => e.viewed_item7) || false
  const viewedItem12 = sectionsViewed.some((s) => s.includes("Item 12") || s.includes("Territory")) || itemsViewed.some((i) => i.includes("12"))
  const viewedItem20 = sectionsViewed.some((s) => s.includes("Item 20") || s.includes("Outlets")) || itemsViewed.some((i) => i.includes("20"))
  const viewedItem11 = sectionsViewed.some((s) => s.includes("Item 11") || s.includes("Training")) || itemsViewed.some((i) => i.includes("11"))

  // Calculate session span (days between first and last session)
  const sessionDates = engagements?.map((e) => new Date(e.created_at).getTime()) || []
  const sessionSpanDays =
    sessionDates.length > 1
      ? Math.ceil((Math.max(...sessionDates) - Math.min(...sessionDates)) / (1000 * 60 * 60 * 24))
      : 0

  const buyerName = buyerProfile?.first_name
    ? `${buyerProfile.first_name} ${buyerProfile.last_name || ""}`.trim()
    : "This prospect"

  // Prefer invitation data for location/timeline as it's more recent
  const buyerLocation =
    invitation?.city && invitation?.state
      ? `${invitation.city}, ${invitation.state}`
      : buyerProfile?.city_location && buyerProfile?.state_location
        ? `${buyerProfile.city_location}, ${buyerProfile.state_location}`
        : null

  const targetLocation = invitation?.target_location || null
  const buyerTimeline = invitation?.timeline || buyerProfile?.buying_timeline || null
  const buyerSource = invitation?.source || buyerProfile?.signup_source || null

  // Build franchise context
  const franchiseName = franchise?.name || invitation?.brand || "the franchise"
  const franchiseIndustry = franchise?.industry || null
  const investmentRange =
    franchise?.total_investment_min && franchise?.total_investment_max
      ? `$${(franchise.total_investment_min / 1000).toFixed(0)}K - $${(franchise.total_investment_max / 1000).toFixed(0)}K`
      : null

  // Try AI generation for meaningful/high engagement
  const googleApiKey = process.env.GOOGLE_API_KEY

  if (googleApiKey && (tier === "meaningful" || tier === "high")) {
    try {
      const genAI = new GoogleGenerativeAI(googleApiKey)
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

      const ficoScore = buyerProfile?.fico_score_range || null
      const liquidAssets = buyerProfile?.liquid_assets_range || null
      const netWorth = buyerProfile?.net_worth_range || null
      const fundingPlans = buyerProfile?.funding_plans || null
      const linkedIn = buyerProfile?.linkedin_url || null
      const yearsExperience = buyerProfile?.years_of_experience || null
      const hasOwnedBusiness = buyerProfile?.has_owned_business || false
      const managementExp = buyerProfile?.management_experience || false
      const industryExperience = buyerProfile?.industry_experience || null
      const relevantSkills = buyerProfile?.relevant_skills || null
      const profileComplete = buyerProfile?.profile_completed_at ? true : false
      const noFelony = buyerProfile?.no_felony_attestation || false
      const noBankruptcy = buyerProfile?.no_bankruptcy_attestation || false

      // Build the enhanced prompt with ideal candidate profile matching
      const prompt = `You are an expert franchise sales intelligence analyst. Your job is to help franchise development teams understand leads, assess candidate fit, and close deals. Analyze this lead against the franchise's SPECIFIC ideal candidate criteria and provide actionable sales intelligence.

## THE FRANCHISE: ${franchiseName}
Industry: ${franchiseIndustry || "Not specified"}
Investment Range: ${investmentRange || "Not specified"}

## FRANCHISE'S IDEAL CANDIDATE PROFILE
${idealProfile ? `
### Financial Requirements
- Minimum Liquid Capital: $${financialReqs?.liquid_capital_min ? (financialReqs.liquid_capital_min/1000).toFixed(0) + 'K' : 'Not specified'}
- Minimum Net Worth: $${financialReqs?.net_worth_min ? (financialReqs.net_worth_min/1000).toFixed(0) + 'K' : 'Not specified'}
- Total Investment Range: $${financialReqs?.total_investment_min ? (financialReqs.total_investment_min/1000).toFixed(0) + 'K' : '?'} - $${financialReqs?.total_investment_max ? (financialReqs.total_investment_max/1000).toFixed(0) + 'K' : '?'}

### Ideal Criteria (Score buyer against EACH of these):
${idealCriteria.map((c: any, i: number) => `${i+1}. **${c.name}** (Weight: ${c.weight}%): ${c.description}
   - Positive signals to look for: ${c.buyer_signals?.join(', ') || 'Not specified'}
   - Relevant industries: ${c.industry_signals?.join(', ') || 'Any'}
   - Engagement signals: ${c.engagement_signals?.join(', ') || 'Not specified'}`).join('\n')}

### Preferred Backgrounds
${idealProfile.preferred_backgrounds?.join(', ') || 'Not specified'}

### Ownership Model
${idealProfile.ownership_model || 'Not specified'}

### Notes from Franchisor
${idealProfile.notes || 'None'}
` : 'No ideal candidate profile configured for this franchise.'}

## THE LEAD: ${buyerName}
Location: ${buyerLocation || "Not provided"}
Target Territory: ${targetLocation || "Not specified"}
Buying Timeline: ${buyerTimeline || "Not specified"}
Lead Source: ${buyerSource || "Direct"}
Engagement Level: ${tier === "high" ? "HIGH - Very engaged prospect" : "MEANINGFUL - Solid engagement"}

### Financial Qualification (Self-Reported)
- FICO Score Range: ${ficoScore || "Not provided"}
- Liquid Assets: ${liquidAssets || "Not provided"}
- Net Worth: ${netWorth || "Not provided"}
- Funding Plan: ${fundingPlans ? (Array.isArray(fundingPlans) ? fundingPlans.join(', ') : fundingPlans) : "Not specified"}
- Felony Attestation: ${noFelony ? "✅ Passed" : "❓ Not completed"}
- Bankruptcy Attestation: ${noBankruptcy ? "✅ Passed" : "❓ Not completed"}
- Profile Completed: ${profileComplete ? "Yes" : "No"}

${financialFit ? `
### FINANCIAL FIT ASSESSMENT (Pre-calculated)
- Overall Status: ${financialFit.overallFit.toUpperCase()}
- Liquid Capital: ${financialFit.liquidCapitalAssessment}
- Net Worth: ${financialFit.netWorthAssessment}
- Financial Score: ${financialFit.score}/100
` : ''}

### Experience & Background
- Business Experience: ${yearsExperience ? `${yearsExperience} years` : "Not provided"}
- Management Experience: ${managementExp ? "Yes" : "No/Unknown"}
- Has Owned Business Before: ${hasOwnedBusiness ? "Yes" : "No"}
- Industry Background: ${industryExperience ? (Array.isArray(industryExperience) ? industryExperience.join(', ') : industryExperience) : "Not specified"}
- Skills: ${relevantSkills ? (Array.isArray(relevantSkills) ? relevantSkills.join(', ') : relevantSkills) : "Not specified"}
- LinkedIn: ${linkedIn ? "Available - research before call" : "Not provided"}

### FDD Engagement Behavior
- Total Sessions: ${sessionCount}
- Session Span: ${sessionSpanDays} days
- Total Time: ${totalMinutes} minutes
- Questions Asked: ${totalQuestions}
- Sections Viewed: ${sectionsViewed.join(", ") || "None recorded"}
- Items Viewed: ${itemsViewed.join(", ") || "None recorded"}

### Key Behavioral Signals
- Viewed Item 19 (Financial Performance): ${viewedItem19 ? "✅ Yes - ROI focused" : "❌ No"}
- Viewed Item 7 (Initial Investment): ${viewedItem7 ? "✅ Yes - Cost conscious" : "❌ No"}
- Viewed Item 12 (Territory): ${viewedItem12 ? "✅ Yes - Growth oriented" : "❌ No"}
- Viewed Item 20 (System Size/Outlets): ${viewedItem20 ? "✅ Yes - Due diligence" : "❌ No"}
- Viewed Item 11 (Training): ${viewedItem11 ? "✅ Yes - Operations focused" : "❌ No"}

---

## YOUR TASK

Analyze this lead against ${franchiseName}'s specific ideal candidate criteria. Provide a comprehensive sales intelligence report in the following JSON format.

IMPORTANT INSTRUCTIONS:
1. Score the candidate against EACH of the ideal criteria listed above
2. Be specific - reference actual data from their profile and engagement
3. If financial requirements are not met, clearly flag this as a BLOCKER
4. Provide actionable, specific recommendations (not generic advice)
5. Anticipate objections based on what they've viewed in the FDD
6. ${linkedIn ? "Note that LinkedIn is available - recommend researching before the call" : ""}

Return your analysis in this exact JSON structure:

{
  "summary": "2-3 sentence executive summary. Lead with financial qualification status (QUALIFIED/BORDERLINE/NOT QUALIFIED/UNKNOWN). Then summarize candidate fit and recommended approach.",
  
  "candidateFit": {
    "overallScore": <0-100 number>,
    "overallRating": "<Excellent|Good|Fair|Poor|Not Qualified>",
    "financialFit": {
      "status": "<qualified|borderline|not_qualified|unknown>",
      "score": <0-100>,
      "liquidCapitalAssessment": "<specific assessment with numbers>",
      "netWorthAssessment": "<specific assessment with numbers>",
      "fundingPlanNotes": "<assessment of their funding approach>",
      "recommendation": "<what to do about their financial status>"
    },
    "criteriaScores": [
      ${idealCriteria.map((c: any) => `{
        "criterion": "${c.name}",
        "weight": ${c.weight},
        "score": "<Strong Match|Partial Match|Weak Match|Unknown>",
        "evidence": ["<specific evidence from their profile/engagement>"],
        "gaps": ["<what's missing or unknown>"]
      }`).join(',\n      ')}
    ],
    "experienceFit": {
      "score": <0-100>,
      "strengths": ["<specific strengths based on their background>"],
      "gaps": ["<experience gaps relative to ideal candidate>"],
      "assessment": "<1-2 sentence assessment>"
    },
    "engagementFit": {
      "score": <0-100>,
      "buyingSignals": ["<positive signals from their FDD engagement>"],
      "hesitationSignals": ["<concerns or hesitations indicated by behavior>"],
      "assessment": "<1-2 sentence assessment>"
    }
  },
  
  "salesStrategy": {
    "recommendedApproach": "<Consultative|Urgency|Educational|Validation|Disqualify>",
    "approachRationale": "<why this approach for this specific lead>",
    "talkingPoints": ["<5-6 specific talking points tailored to this lead>"],
    "conversationStarters": ["<3-4 personalized conversation starters>"],
    "anticipatedObjections": [
      {"objection": "<likely objection based on their behavior>", "response": "<how to address it>"}
    ],
    "questionsToAsk": ["<5-6 qualifying questions to ask this lead>"]
  },
  
  "nextActions": {
    "immediate": ["<action items for today/tomorrow>"],
    "thisWeek": ["<action items for this week>"],
    "redFlags": ["<any red flags to watch for>"],
    "greenLights": ["<positive indicators to build on>"]
  },
  
  "keyFindings": ["<5-6 key insights about this lead>"],
  
  "recommendations": ["<5-6 specific recommendations>"],
  
  "engagementTier": "${tier}",
  "tierMessage": "${tier === "high" ? "🔥 Hot lead - prioritize immediate follow-up" : "🟢 Warm lead - ready for deeper conversation"}"
}

Return ONLY valid JSON, no markdown formatting or code blocks.`

      const result = await model.generateContent(prompt)
      const responseText = result.response.text()

      // Parse the JSON response
      const cleanedResponse = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim()
      
      try {
        const aiResponse = JSON.parse(cleanedResponse)
        
        // Merge in our pre-calculated financial fit if AI didn't provide complete data
        if (financialFit && aiResponse.candidateFit) {
          aiResponse.candidateFit.financialFit = {
            ...aiResponse.candidateFit.financialFit,
            preCalculated: financialFit
          }
        }
        
        return aiResponse
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError)
        // Fall through to template
      }
    } catch (aiError) {
      console.error("AI generation failed, falling back to template:", aiError)
      // Fall through to template-based generation
    }
  }

  // Template-based fallback for meaningful/high engagement
  return generateTemplateInsights(
    engagements,
    sectionsViewed,
    totalQuestions,
    totalTimeSeconds,
    buyerProfile,
    franchise,
    invitation,
    tier,
    sessionCount,
    sessionSpanDays,
    financialFit,
  )
}

function generateMinimalEngagementInsights(
  engagements: any[] | null,
  sectionsViewed: string[],
  buyerProfile: any | null,
  franchise: any | null,
  invitation: any | null,
  totalMinutes: number,
  financialFit: any | null,
) {
  const buyerName = buyerProfile?.first_name
    ? `${buyerProfile.first_name} ${buyerProfile.last_name || ""}`.trim()
    : "This prospect"
  const franchiseName = franchise?.name || invitation?.brand || "the franchise"
  const source = invitation?.source || buyerProfile?.signup_source || "Direct"
  
  const financialStatus = financialFit?.overallFit || 'unknown'
  const financialPrefix = financialStatus === 'qualified' ? '✅ FINANCIALLY QUALIFIED. ' :
                          financialStatus === 'not_qualified' ? '❌ DOES NOT MEET FINANCIAL REQUIREMENTS. ' :
                          financialStatus === 'borderline' ? '⚠️ BORDERLINE FINANCIAL FIT. ' : ''

  const summary = `${financialPrefix}${buyerName} has briefly accessed the ${franchiseName} FDD (${totalMinutes} minute${totalMinutes !== 1 ? "s" : ""}), suggesting initial interest but limited engagement so far. This is an early-stage lead that needs nurturing.`

  const keyFindings = [
    financialFit ? financialFit.liquidCapitalAssessment : "Financial qualification: Not yet provided",
    financialFit ? financialFit.netWorthAssessment : "Net worth: Not yet provided",
    `Limited engagement: Only ${totalMinutes} minute${totalMinutes !== 1 ? "s" : ""} of FDD review suggests they may be exploring options`,
    sectionsViewed.length > 0
      ? `Initial focus on: ${sectionsViewed.slice(0, 2).join(", ")}`
      : "No specific sections recorded yet",
    `Lead source: ${source} - consider how to re-engage based on this channel`,
  ]

  const recommendations = [
    financialStatus === 'not_qualified' 
      ? `Address financial gap early - ${buyerName} may need to explore financing options or other brands`
      : "Verify financial qualification on first call",
    "Send a personalized follow-up asking if they have any initial questions",
    "Offer a brief call to highlight the most relevant FDD sections for their situation",
    "Share a 'Getting Started' guide or FAQ document to encourage further exploration",
  ]

  const nextSteps = [
    "Send a friendly check-in email within 48 hours",
    "Prepare 2-3 talking points about the franchise's key differentiators",
    financialStatus === 'unknown' ? "Qualify financial situation on first call" : "",
    "Schedule a follow-up reminder if they haven't returned to the FDD in 5 days",
  ].filter(Boolean)

  return {
    summary,
    keyFindings,
    recommendations,
    nextSteps,
    engagementTier: "minimal" as EngagementTier,
    tierMessage: "Limited engagement - Early stage, needs nurturing",
    candidateFit: financialFit ? {
      financialFit: {
        status: financialFit.overallFit,
        score: financialFit.score,
        liquidCapitalAssessment: financialFit.liquidCapitalAssessment,
        netWorthAssessment: financialFit.netWorthAssessment,
      }
    } : null,
  }
}

function generatePartialEngagementInsights(
  engagements: any[] | null,
  sectionsViewed: string[],
  buyerProfile: any | null,
  franchise: any | null,
  invitation: any | null,
  totalMinutes: number,
  sessionCount: number,
  financialFit: any | null,
) {
  const buyerName = buyerProfile?.first_name
    ? `${buyerProfile.first_name} ${buyerProfile.last_name || ""}`.trim()
    : "This prospect"
  const franchiseName = franchise?.name || invitation?.brand || "the franchise"
  const source = invitation?.source || buyerProfile?.signup_source || "Direct"
  const timeline = invitation?.timeline || buyerProfile?.buying_timeline || null
  const location = invitation?.city && invitation?.state ? `${invitation.city}, ${invitation.state}` : null

  const viewedItem19 = engagements?.some((e) => e.viewed_item19) || sectionsViewed.some((s) => s.includes("Item 19"))
  const viewedItem7 = engagements?.some((e) => e.viewed_item7) || sectionsViewed.some((s) => s.includes("Item 7"))

  const financialStatus = financialFit?.overallFit || 'unknown'
  const financialPrefix = financialStatus === 'qualified' ? '✅ FINANCIALLY QUALIFIED. ' :
                          financialStatus === 'not_qualified' ? '❌ DOES NOT MEET FINANCIAL REQUIREMENTS. ' :
                          financialStatus === 'borderline' ? '⚠️ BORDERLINE FINANCIAL FIT. ' : ''

  const summary = `${financialPrefix}${buyerName} has shown moderate interest in ${franchiseName}, spending ${totalMinutes} minutes across ${sessionCount} session${sessionCount !== 1 ? "s" : ""}. ${viewedItem19 || viewedItem7 ? "Their focus on financial sections suggests they're evaluating the investment seriously." : "They appear to be in the exploration phase and may benefit from guided engagement."}`

  const keyFindings = [
    financialFit ? financialFit.liquidCapitalAssessment : "Financial qualification: Not yet provided",
    financialFit ? financialFit.netWorthAssessment : "Net worth: Not yet provided",
    `Moderate engagement: ${totalMinutes} minutes indicates genuine interest but not deep due diligence yet`,
    viewedItem19
      ? "Viewed financial performance data (Item 19) - interested in ROI potential"
      : "Hasn't viewed Item 19 yet - may need prompting to review financial performance",
    viewedItem7
      ? "Reviewed initial investment (Item 7) - evaluating affordability"
      : "Hasn't focused on investment details yet",
    timeline
      ? `Timeline: ${timeline} - ${timeline.includes("0-3") || timeline.includes("3-6") ? "relatively urgent" : "taking time to decide"}`
      : "Timeline not specified",
  ]

  const recommendations = [
    financialStatus === 'not_qualified' 
      ? `⚠️ Financial gap identified - discuss financing options or alternative paths before investing more time`
      : financialStatus === 'borderline'
        ? `Verify financial details - they're close to requirements but need confirmation`
        : "Confirm financial qualification early in discovery call",
    viewedItem19
      ? "Lead with financial success stories since they've shown interest in Item 19"
      : "Proactively share Item 19 highlights to spark financial interest",
    `Personalize outreach based on their ${source} lead source`,
    "Offer a discovery call to understand their specific goals and questions",
  ]

  const nextSteps = [
    `Schedule a discovery call with ${buyerName} within the next 3-5 days`,
    viewedItem19
      ? "Prepare specific ROI examples and franchisee success stories"
      : "Create a summary of Item 19 highlights to share",
    location ? `Research territory availability in ${location} area` : "Have territory availability information ready",
    "Prepare answers to common questions about training, support, and timeline to opening",
  ]

  return {
    summary,
    keyFindings,
    recommendations,
    nextSteps,
    engagementTier: "partial" as EngagementTier,
    tierMessage: "Partial engagement - Interested, needs encouragement",
    candidateFit: financialFit ? {
      financialFit: {
        status: financialFit.overallFit,
        score: financialFit.score,
        liquidCapitalAssessment: financialFit.liquidCapitalAssessment,
        netWorthAssessment: financialFit.netWorthAssessment,
      }
    } : null,
  }
}

function generateTemplateInsights(
  engagements: any[] | null,
  sectionsViewed: string[],
  totalQuestions: number,
  totalTimeSeconds: number,
  buyerProfile: any | null,
  franchise: any | null,
  invitation: any | null,
  tier: EngagementTier,
  sessionCount: number,
  sessionSpanDays: number,
  financialFit: any | null,
) {
  const totalMinutes = Math.floor(totalTimeSeconds / 60)
  const buyerName = buyerProfile?.first_name
    ? `${buyerProfile.first_name} ${buyerProfile.last_name || ""}`.trim()
    : "This prospect"
  const franchiseName = franchise?.name || invitation?.brand || "the franchise"
  const source = invitation?.source || buyerProfile?.signup_source || "Direct"
  const timeline = invitation?.timeline || buyerProfile?.buying_timeline || null
  const location = invitation?.city && invitation?.state ? `${invitation.city}, ${invitation.state}` : null
  const targetLocation = invitation?.target_location || null

  const viewedItem19 = engagements?.some((e) => e.viewed_item19) || false
  const viewedItem7 = engagements?.some((e) => e.viewed_item7) || false
  const viewedItem12 = sectionsViewed.some((s) => s.includes("Item 12") || s.includes("Territory"))
  const viewedItem11 = sectionsViewed.some((s) => s.includes("Item 11") || s.includes("Training"))

  const financialStatus = financialFit?.overallFit || 'unknown'
  const financialPrefix = financialStatus === 'qualified' ? '✅ FINANCIALLY QUALIFIED. ' :
                          financialStatus === 'not_qualified' ? '❌ DOES NOT MEET FINANCIAL REQUIREMENTS. ' :
                          financialStatus === 'borderline' ? '⚠️ BORDERLINE FINANCIAL FIT. ' : ''

  let summary = `${financialPrefix}${buyerName} has demonstrated ${tier === "high" ? "exceptional" : "strong"} engagement with the ${franchiseName} FDD over ${sessionCount} session${sessionCount > 1 ? "s" : ""}, spending ${totalMinutes} minutes reviewing key sections. `

  if (viewedItem19) {
    summary += "Their significant focus on financial performance data (Item 19) indicates serious ROI evaluation. "
  }

  if (source && source !== "Direct") {
    summary += `As a ${source} lead${timeline ? ` with a ${timeline} timeline` : ""}, they appear to be ${tier === "high" ? "a high-priority prospect ready for immediate follow-up" : "actively evaluating this opportunity"}.`
  }

  const keyFindings: string[] = []

  // Add financial findings first
  if (financialFit) {
    keyFindings.push(financialFit.liquidCapitalAssessment)
    keyFindings.push(financialFit.netWorthAssessment)
  }

  if (viewedItem19 && viewedItem7) {
    keyFindings.push(
      "Financial focus: Deep analysis of both investment requirements and financial performance projections - likely calculating ROI",
    )
  }

  if (sessionCount >= 3) {
    keyFindings.push(
      `Persistent interest: ${sessionCount} sessions over ${sessionSpanDays} days shows sustained commitment to due diligence`,
    )
  }

  if (viewedItem12 && targetLocation) {
    keyFindings.push(`Territory interest: Actively researching territories with specific interest in ${targetLocation}`)
  } else if (viewedItem12) {
    keyFindings.push("Territory concerns: Reviewing protected territories and expansion potential")
  }

  if (viewedItem11) {
    keyFindings.push("Operational readiness: Reviewing training and support systems indicates preparation mindset")
  }

  if (source) {
    keyFindings.push(`Lead source: ${source} - tailor your approach to this acquisition channel`)
  }

  const recommendations: string[] = []

  // Add financial-based recommendation first
  if (financialStatus === 'not_qualified') {
    recommendations.push(
      `⚠️ FINANCIAL BLOCKER: ${buyerName} does not meet financial requirements. Discuss financing options, partnerships, or alternative brands before investing significant time.`
    )
  } else if (financialStatus === 'borderline') {
    recommendations.push(
      `Verify financial details early - ${buyerName} is close to requirements but confirmation needed before proceeding to agreement stage.`
    )
  }

  if (viewedItem19) {
    recommendations.push(
      `Lead with financial success stories - ${buyerName} has invested significant time in Item 19, indicating they value data-driven ROI discussions`,
    )
  }

  if (source === "Trade Show") {
    recommendations.push(
      "Reference your trade show conversation to personalize the follow-up and build on existing rapport",
    )
  } else if (source === "Referral") {
    recommendations.push("Mention the referral source to build trust and credibility in your outreach")
  } else if (source === "Website") {
    recommendations.push("Highlight the key benefits and differentiators they likely saw on your website")
  }

  if (totalQuestions >= 5) {
    recommendations.push("They're detail-oriented - prepare comprehensive answers and be ready for in-depth questions")
  }

  if (sessionCount >= 3) {
    recommendations.push(
      "Multiple sessions indicate thorough research - respect their process while addressing any remaining concerns",
    )
  }

  recommendations.push("Strike while engagement is high - their recent activity suggests active decision-making")

  const nextSteps: string[] = [
    `Schedule a call with ${buyerName} within 24-48 hours to discuss their questions about ${viewedItem19 ? "financial performance" : "the opportunity"}`,
  ]

  if (financialStatus === 'not_qualified') {
    nextSteps.unshift("⚠️ Address financial gap before scheduling discovery call")
  }

  if (viewedItem19) {
    nextSteps.push("Share success stories from top-performing franchisees in similar markets")
  }

  if (targetLocation) {
    nextSteps.push(`Prepare territory availability maps and demographic data for ${targetLocation}`)
  } else if (location) {
    nextSteps.push(`Prepare territory availability maps and demographic data for ${location} area`)
  }

  if (timeline && (timeline.includes("0-3") || timeline.includes("3-6"))) {
    nextSteps.push("Prepare the franchise agreement for review - their timeline indicates readiness to move forward")
  }

  nextSteps.push("Send a personalized follow-up email summarizing your conversation and next steps")

  return {
    summary,
    keyFindings,
    recommendations,
    nextSteps,
    engagementTier: tier,
    tierMessage:
      tier === "high"
        ? "🔥 Hot lead - prioritize immediate follow-up"
        : "🟢 Warm lead - ready for deeper conversation",
    candidateFit: financialFit ? {
      financialFit: {
        status: financialFit.overallFit,
        score: financialFit.score,
        liquidCapitalAssessment: financialFit.liquidCapitalAssessment,
        netWorthAssessment: financialFit.netWorthAssessment,
      }
    } : null,
  }
}
