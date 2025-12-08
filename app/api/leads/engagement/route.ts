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
        .select("name, slug, industry, total_investment_min, total_investment_max")
        .eq("id", invitationRecord.franchise_id)
        .single()

      const aiInsights = generatePendingLeadInsights(invitationRecord, franchise)

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
      })
    }

    if (!accessRecord) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    const { data: buyerProfile } = await supabase
      .from("buyer_profiles")
      .select(`
        first_name, last_name, email, city_location, state_location, buying_timeline, signup_source,
        fico_score_range, liquid_assets_range, net_worth_range, funding_plan, linkedin_url,
        no_felony_attestation, no_bankruptcy_attestation, profile_completed_at,
        business_experience_years, management_experience, has_franchise_experience, industries
      `)
      .eq("id", accessRecord.buyer_id)
      .single()

    const { data: franchise } = await supabase
      .from("franchises")
      .select("name, slug, industry, total_investment_min, total_investment_max")
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

    const questions: string[] = []
    const totalQuestionsAsked = engagements?.reduce((sum, e) => sum + (e.questions_asked || 0), 0) || 0

    if (engagements && engagements.length > 0) {
      const viewedItem19 = engagements.some((e) => e.viewed_item19)
      const viewedItem7 = engagements.some((e) => e.viewed_item7)
      const hasSignificantTime = engagements.some((e) => e.spent_significant_time)

      if (viewedItem19) {
        questions.push(
          "What are the typical profit margins for a Drybar franchise based on Item 19 data?",
          "Can you explain the variance between top performers and average performers in the system?",
          "How long does it typically take to break even based on the financial performance data?",
        )
      }

      if (viewedItem7) {
        questions.push(
          "What is included in the initial franchise fee and what does it cover?",
          "Are there any hidden costs or fees not shown in the initial investment estimate?",
        )
      }

      if (sectionsViewed.includes("Item 12 - Territory")) {
        questions.push(
          "How is territory protection handled? What are the boundaries?",
          "Can I open multiple locations, and if so, what are the requirements?",
        )
      }

      if (sectionsViewed.includes("Item 11 - Training")) {
        questions.push(
          "What does the training program include and how long does it last?",
          "Is there ongoing support after the initial training period?",
        )
      }

      if (hasSignificantTime) {
        questions.push(
          "What are the key success factors for Drybar franchisees?",
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

    const aiInsights = await generateAIInsights(
      engagements,
      sectionsViewed,
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
          fundingPlan: buyerProfile.funding_plan,
          linkedInUrl: buyerProfile.linkedin_url,
          noFelonyAttestation: buyerProfile.no_felony_attestation,
          noBankruptcyAttestation: buyerProfile.no_bankruptcy_attestation,
          profileCompletedAt: buyerProfile.profile_completed_at,
          businessExperienceYears: buyerProfile.business_experience_years,
          managementExperience: buyerProfile.management_experience,
          hasFranchiseExperience: buyerProfile.has_franchise_experience,
          industries: buyerProfile.industries,
        }
      : null

    return NextResponse.json({
      accessRecord,
      engagements,
      totalTimeSpent: formattedTimeSpent,
      totalTimeSpentSeconds: totalTimeSpent,
      averageSessionDuration: sessionCount > 0 ? Math.round(totalTimeSpent / sessionCount) : 0,
      sectionsViewed: sectionsViewed.slice(0, 10),
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

function generatePendingLeadInsights(invitation: any, franchise: any) {
  const leadName = invitation.lead_name || "This prospect"
  const franchiseName = franchise?.name || invitation.brand || "the franchise"
  const source = invitation.source || "Direct"
  const timeline = invitation.timeline || "Not specified"
  const location = invitation.city && invitation.state ? `${invitation.city}, ${invitation.state}` : null
  const targetLocation = invitation.target_location || null
  const sentDate = invitation.sent_at ? new Date(invitation.sent_at).toLocaleDateString() : "recently"

  const summary = `${leadName} received an FDD invitation on ${sentDate} but hasn't accessed it yet. They came through ${source}${timeline !== "Not specified" ? ` with a ${timeline} buying timeline` : ""}. This is an opportunity to follow up and encourage engagement.`

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
  }
}

async function generateAIInsights(
  engagements: any[] | null,
  sectionsViewed: string[],
  totalQuestions: number,
  totalTimeSeconds: number,
  buyerProfile: any | null,
  franchise: any | null,
  invitation: any | null,
  tier: EngagementTier,
) {
  const sessionCount = engagements?.length || 0
  const totalMinutes = Math.floor(totalTimeSeconds / 60)

  if (tier === "minimal") {
    return generateMinimalEngagementInsights(
      engagements,
      sectionsViewed,
      buyerProfile,
      franchise,
      invitation,
      totalMinutes,
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
    )
  }

  // Calculate engagement metrics for meaningful/high engagement
  const viewedItem19 = engagements?.some((e) => e.viewed_item19) || false
  const viewedItem7 = engagements?.some((e) => e.viewed_item7) || false
  const viewedItem12 = sectionsViewed.some((s) => s.includes("Item 12") || s.includes("Territory"))
  const viewedItem20 = sectionsViewed.some((s) => s.includes("Item 20") || s.includes("Outlets"))
  const viewedItem11 = sectionsViewed.some((s) => s.includes("Item 11") || s.includes("Training"))

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
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

      const ficoScore = buyerProfile?.fico_score_range || null
      const liquidAssets = buyerProfile?.liquid_assets_range || null
      const netWorth = buyerProfile?.net_worth_range || null
      const fundingPlan = buyerProfile?.funding_plan || null
      const linkedIn = buyerProfile?.linkedin_url || null
      const businessYears = buyerProfile?.business_experience_years || null
      const hasFranchiseExp = buyerProfile?.has_franchise_experience || false
      const managementExp = buyerProfile?.management_experience || false
      const industries = buyerProfile?.industries || null
      const profileComplete = buyerProfile?.profile_completed_at ? true : false

      const prompt = `You are a franchise sales intelligence analyst helping franchisors understand and convert prospective franchisees. Analyze this lead's FDD engagement data and provide actionable sales intelligence.

## Lead Profile
- Name: ${buyerName}
- Current Location: ${buyerLocation || "Not provided"}
- Target Territory: ${targetLocation || "Not specified"}
- Buying Timeline: ${buyerTimeline || "Not specified"}
- Lead Source: ${buyerSource || "Direct"}
- Engagement Level: ${tier === "high" ? "HIGH - Very engaged prospect" : "MEANINGFUL - Solid engagement"}
- LinkedIn Profile: ${linkedIn ? "Available" : "Not provided"}

## Buyer Financial Qualification (Self-Reported)
- FICO Score Range: ${ficoScore || "Not provided"}
- Liquid Assets: ${liquidAssets || "Not provided"}
- Net Worth: ${netWorth || "Not provided"}
- Funding Plan: ${fundingPlan || "Not specified"}
- Profile Completed: ${profileComplete ? "Yes" : "No"}

## Buyer Experience & Background
- Business Experience: ${businessYears ? `${businessYears} years` : "Not provided"}
- Management Experience: ${managementExp ? "Yes" : "No"}
- Prior Franchise Experience: ${hasFranchiseExp ? "Yes" : "No"}
- Industry Background: ${industries || "Not specified"}

## Franchise
- Brand: ${franchiseName}
- Industry: ${franchiseIndustry || "Not specified"}
- Investment Range: ${investmentRange || "Not specified"}

## Engagement Data
- Total Sessions: ${sessionCount}
- Session Span: ${sessionSpanDays} days
- Total Time: ${totalMinutes} minutes
- Questions Asked: ${totalQuestions}
- Sections Viewed: ${sectionsViewed.join(", ") || "None recorded"}

## Key Behaviors
- Viewed Item 19 (Financial Performance): ${viewedItem19 ? "Yes" : "No"}
- Viewed Item 7 (Initial Investment): ${viewedItem7 ? "Yes" : "No"}
- Viewed Item 12 (Territory): ${viewedItem12 ? "Yes" : "No"}
- Viewed Item 20 (Outlets/System Size): ${viewedItem20 ? "Yes" : "No"}
- Viewed Item 11 (Training): ${viewedItem11 ? "Yes" : "No"}

## Context for Personalization
${buyerSource ? `- They found you through ${buyerSource}, so reference this channel in your outreach` : ""}
${buyerTimeline ? `- Their ${buyerTimeline} timeline indicates ${buyerTimeline.includes("0-3") || buyerTimeline.includes("3-6") ? "urgency - they're ready to move" : "they're in research mode - focus on education"}` : ""}
${targetLocation ? `- They're specifically interested in ${targetLocation} - have territory info ready` : ""}
${viewedItem19 && viewedItem7 ? "- Viewing both financial performance AND initial investment suggests they're calculating ROI" : ""}
${ficoScore ? `- Their credit score (${ficoScore}) ${ficoScore.includes("720") || ficoScore.includes("780") ? "is excellent - financing should be straightforward" : ficoScore.includes("680") || ficoScore.includes("620") ? "is good - SBA lending is viable" : "may need discussion about financing options"}` : ""}
${liquidAssets && investmentRange ? `- Compare their liquid assets (${liquidAssets}) against the investment range (${investmentRange}) to assess financial fit` : ""}
${fundingPlan ? `- Their planned funding method is ${fundingPlan} - ${fundingPlan === "SBA" ? "be ready to discuss SBA loan process and requirements" : fundingPlan === "401(k) Rollover" ? "discuss ROBS program details and timing" : fundingPlan === "Cash" ? "they're well-capitalized, focus on ROI and business fundamentals" : fundingPlan === "HELOC" ? "discuss equity requirements and interest considerations" : "explore their partnership structure and decision-making process"}` : ""}
${hasFranchiseExp ? "- Prior franchise experience means they understand the model - focus on what differentiates your brand" : ""}
${businessYears && Number.parseInt(businessYears) > 10 ? "- Extensive business experience - they'll appreciate data-driven discussions and operational details" : ""}
${linkedIn ? "- LinkedIn available - research their background before the call for personalized conversation starters" : ""}

Provide your analysis in the following JSON format. Be specific, actionable, and reference the actual data. Use the lead's name when appropriate. Focus on what their behavior AND financial qualification MEANS for the sales conversation. Assess financial fit based on their self-reported data compared to the franchise investment requirements.

{
  "summary": "A 2-3 sentence executive summary that interprets what this engagement pattern reveals about the lead's buying intent, concerns, and readiness. Include an assessment of their financial qualification fit. Be specific to this lead's source (${buyerSource || "direct"}), timeline (${buyerTimeline || "unspecified"}), funding plan (${fundingPlan || "unspecified"}), and behavior patterns.",
  "keyFindings": [
    "5-6 specific insights about what their behavior and qualification data indicates. Each should connect a behavior or data point to what it means for the sale. Reference their financial qualification, funding plan, experience, and FDD engagement patterns."
  ],
  "recommendations": [
    "5-6 specific sales approach recommendations. Include actual talking points or conversation starters. Tailor recommendations based on their funding plan, experience level, and financial qualification. Reference specific items they viewed in the FDD."
  ],
  "nextSteps": [
    "5-6 time-bound action items with specific details. Include what to say, what to prepare, and what to watch for. Prioritize based on their timeline and engagement level."
  ],
  "financialFitAssessment": "${liquidAssets && netWorth ? "Include a brief assessment of financial fit based on their self-reported liquid assets and net worth compared to the franchise investment requirements" : "Note that financial qualification data is not yet available - recommend requesting profile completion"}",
  "engagementTier": "${tier}",
  "tierMessage": "${tier === "high" ? "High engagement - Hot lead, prioritize immediate follow-up" : "Meaningful engagement - Warm lead, ready for deeper conversation"}"
}

Return ONLY valid JSON, no markdown formatting.`

      const result = await model.generateContent(prompt)
      const responseText = result.response.text()

      // Parse the JSON response
      const cleanedResponse = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim()
      const aiResponse = JSON.parse(cleanedResponse)

      return aiResponse
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
  )
}

function generateMinimalEngagementInsights(
  engagements: any[] | null,
  sectionsViewed: string[],
  buyerProfile: any | null,
  franchise: any | null,
  invitation: any | null,
  totalMinutes: number,
) {
  const buyerName = buyerProfile?.first_name
    ? `${buyerProfile.first_name} ${buyerProfile.last_name || ""}`.trim()
    : "This prospect"
  const franchiseName = franchise?.name || invitation?.brand || "the franchise"
  const source = invitation?.source || buyerProfile?.signup_source || "Direct"

  const summary = `${buyerName} has briefly accessed the ${franchiseName} FDD (${totalMinutes} minute${totalMinutes !== 1 ? "s" : ""}), suggesting initial interest but limited engagement so far. This is an early-stage lead that needs nurturing.`

  const keyFindings = [
    `Limited engagement: Only ${totalMinutes} minute${totalMinutes !== 1 ? "s" : ""} of FDD review suggests they may be exploring options`,
    sectionsViewed.length > 0
      ? `Initial focus on: ${sectionsViewed.slice(0, 2).join(", ")}`
      : "No specific sections recorded yet",
    `Lead source: ${source} - consider how to re-engage based on this channel`,
    "Early stage in decision process - needs more information and encouragement",
  ]

  const recommendations = [
    "Send a personalized follow-up asking if they have any initial questions",
    "Offer a brief call to highlight the most relevant FDD sections for their situation",
    "Share a 'Getting Started' guide or FAQ document to encourage further exploration",
    `Don't push too hard - ${buyerName} may still be in early research mode`,
  ]

  const nextSteps = [
    "Send a friendly check-in email within 48 hours",
    "Prepare 2-3 talking points about the franchise's key differentiators",
    "Schedule a follow-up reminder if they haven't returned to the FDD in 5 days",
    "Have success stories ready to share if they express interest",
  ]

  return {
    summary,
    keyFindings,
    recommendations,
    nextSteps,
    engagementTier: "minimal" as EngagementTier,
    tierMessage: "Limited engagement - Early stage, needs nurturing",
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

  const summary = `${buyerName} has shown moderate interest in ${franchiseName}, spending ${totalMinutes} minutes across ${sessionCount} session${sessionCount !== 1 ? "s" : ""}. ${viewedItem19 || viewedItem7 ? "Their focus on financial sections suggests they're evaluating the investment seriously." : "They appear to be in the exploration phase and may benefit from guided engagement."}`

  const keyFindings = [
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
    location ? `Located in ${location}` : "Location not specified",
  ]

  const recommendations = [
    viewedItem19
      ? "Lead with financial success stories since they've shown interest in Item 19"
      : "Proactively share Item 19 highlights to spark financial interest",
    `Personalize outreach based on their ${source} lead source`,
    "Offer a discovery call to understand their specific goals and questions",
    "Send supplementary materials (success stories, market analysis) to encourage deeper engagement",
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

  let summary = `${buyerName} has demonstrated ${tier === "high" ? "exceptional" : "strong"} engagement with the ${franchiseName} FDD over ${sessionCount} session${sessionCount > 1 ? "s" : ""}, spending ${totalMinutes} minutes reviewing key sections. `

  if (viewedItem19) {
    summary += "Their significant focus on financial performance data (Item 19) indicates serious ROI evaluation. "
  }

  if (source && source !== "Direct") {
    summary += `As a ${source} lead${timeline ? ` with a ${timeline} timeline` : ""}, they appear to be ${tier === "high" ? "a high-priority prospect ready for immediate follow-up" : "actively evaluating this opportunity"}.`
  }

  const keyFindings: string[] = []

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

  if (location) {
    keyFindings.push(
      `Geographic intent: Located in ${location}${targetLocation ? `, interested in ${targetLocation} territory` : ""}`,
    )
  }

  const recommendations: string[] = []

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
        ? "High engagement - Hot lead, prioritize immediate follow-up"
        : "Meaningful engagement - Warm lead, ready for deeper conversation",
  }
}
