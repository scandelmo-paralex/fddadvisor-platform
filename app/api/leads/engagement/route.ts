import { createServerClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
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

// Topic categories for question/engagement analysis
interface TopicCategory {
  name: string
  icon: string
  keywords: string[]
  fddItems: string[]
}

const TOPIC_CATEGORIES: TopicCategory[] = [
  {
    name: "Financial Performance",
    icon: "📊",
    keywords: ["item 19", "profit", "revenue", "earnings", "roi", "income", "performance", "gross sales", "average sales", "median", "financial data"],
    fddItems: ["19"],
  },
  {
    name: "Investment & Costs",
    icon: "💰",
    keywords: ["item 7", "item 5", "item 6", "investment", "cost", "fee", "royalty", "franchise fee", "marketing fee", "ongoing fee", "initial fee", "how much"],
    fddItems: ["5", "6", "7"],
  },
  {
    name: "Territory Protection",
    icon: "🗺️",
    keywords: ["item 12", "territory", "exclusive", "protected", "area", "location", "market", "competition"],
    fddItems: ["12"],
  },
  {
    name: "Training & Support",
    icon: "🎓",
    keywords: ["item 11", "training", "support", "assistance", "program", "help", "learn", "onboarding"],
    fddItems: ["11"],
  },
  {
    name: "System & Brand",
    icon: "🏢",
    keywords: ["item 20", "outlets", "locations", "system", "growth", "brand", "units", "opened", "closed", "how many", "franchisees"],
    fddItems: ["20"],
  },
  {
    name: "Obligations & Restrictions",
    icon: "📋",
    keywords: ["item 8", "item 9", "restrictions", "requirements", "obligation", "sources", "products", "suppliers", "purchase"],
    fddItems: ["8", "9"],
  },
  {
    name: "Franchisor Background",
    icon: "👥",
    keywords: ["item 1", "item 2", "item 3", "item 4", "management", "background", "litigation", "bankruptcy", "history", "experience", "leadership"],
    fddItems: ["1", "2", "3", "4"],
  },
  {
    name: "Renewal & Termination",
    icon: "📝",
    keywords: ["item 17", "renewal", "termination", "transfer", "exit", "sell", "leave", "end"],
    fddItems: ["17"],
  },
]

interface QuestionInsights {
  totalQuestions: number
  topicsExplored: { name: string; icon: string; count: number }[]
  narrativeSummary: string
  engagementSignals: string[]
}

function generateQuestionInsights(
  engagements: any[] | null,
  sectionsViewed: string[],
  itemsViewed: string[],
  totalQuestionsAsked: number,
  questionsList: string[],
  franchiseName: string
): QuestionInsights {
  // Track which topics were explored based on sections/items viewed, questions asked, and engagement data
  const topicCounts = new Map<string, { name: string; icon: string; count: number }>()

  // Derive engagement flags from actual data (columns: section_name, viewed_items, duration_seconds)
  const allSections = sectionsViewed.map(s => String(s).toLowerCase())
  const allItems = itemsViewed.map(i => String(i).toLowerCase())
  const viewedItem19 = allSections.some(s => s.includes('item 19') || s.includes('financial')) ||
                       allItems.some(i => i.includes('19'))
  const viewedItem7 = allSections.some(s => s.includes('item 7') || s.includes('investment')) ||
                      allItems.some(i => i.includes('7'))
  const totalTime = engagements?.reduce((sum, e) => sum + (e.duration_seconds || 0), 0) || 0
  const hasSignificantTime = totalTime > 1800 // 30+ minutes

  // Process sections, items viewed, and actual questions to determine topics
  const allViewed = [...sectionsViewed, ...itemsViewed].map(s => String(s).toLowerCase())
  const allQuestions = questionsList.map(q => String(q || '').toLowerCase())

  for (const category of TOPIC_CATEGORIES) {
    let count = 0

    // Check if any keywords match viewed sections
    for (const keyword of category.keywords) {
      if (allViewed.some(v => v.includes(keyword))) {
        count++
      }
    }

    // Check if specific FDD items match
    for (const item of category.fddItems) {
      if (itemsViewed.some(v => String(v).includes(item) || String(v) === `Item ${item}`)) {
        count++
      }
    }

    // Check if any keywords match actual questions asked (higher weight)
    for (const keyword of category.keywords) {
      if (allQuestions.some(q => q.includes(keyword))) {
        count += 2 // Questions are stronger signal than just viewing
      }
    }

    // Add engagement flag bonuses
    if (category.name === "Financial Performance" && viewedItem19) count += 2
    if (category.name === "Investment & Costs" && viewedItem7) count += 2

    if (count > 0) {
      topicCounts.set(category.name, {
        name: category.name,
        icon: category.icon,
        count: Math.min(count, 5), // Cap at 5 for display purposes
      })
    }
  }

  // Sort by count (highest first) and take top topics
  const topicsExplored = Array.from(topicCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Generate narrative summary based on topics
  const narrativeSummary = generateTopicNarrative(
    topicsExplored,
    totalQuestionsAsked,
    franchiseName,
    hasSignificantTime
  )

  // Generate engagement signals
  const engagementSignals: string[] = []
  if (viewedItem19) {
    engagementSignals.push("Focused on financial performance data - likely evaluating ROI potential")
  }
  if (viewedItem7) {
    engagementSignals.push("Reviewed initial investment details - assessing affordability")
  }
  if (topicsExplored.some(t => t.name === "Territory Protection")) {
    engagementSignals.push("Explored territory information - interested in market exclusivity")
  }
  if (topicsExplored.some(t => t.name === "Training & Support")) {
    engagementSignals.push("Reviewed training programs - evaluating support structure")
  }
  if (hasSignificantTime) {
    engagementSignals.push("Spent significant time in due diligence - serious consideration")
  }

  return {
    totalQuestions: totalQuestionsAsked,
    topicsExplored,
    narrativeSummary,
    engagementSignals,
  }
}

function generateTopicNarrative(
  topics: { name: string; icon: string; count: number }[],
  totalQuestions: number,
  franchiseName: string,
  hasSignificantTime: boolean
): string {
  if (topics.length === 0 && totalQuestions === 0) {
    return "This prospect has not yet asked questions through the AI assistant or explored specific FDD sections in depth."
  }

  const topTopics = topics.slice(0, 3).map(t => t.name.toLowerCase())
  const questionContext = totalQuestions > 0 
    ? `asked ${totalQuestions} question${totalQuestions !== 1 ? "s" : ""}` 
    : "explored content"

  let narrative = `This prospect has ${questionContext} focusing primarily on `

  if (topTopics.length === 1) {
    narrative += `**${topTopics[0]}**`
  } else if (topTopics.length === 2) {
    narrative += `**${topTopics[0]}** and **${topTopics[1]}**`
  } else if (topTopics.length >= 3) {
    narrative += `**${topTopics[0]}**, **${topTopics[1]}**, and **${topTopics[2]}**`
  }

  narrative += "."

  // Add interpretation based on topic combination
  const hasFinancial = topics.some(t => t.name === "Financial Performance" || t.name === "Investment & Costs")
  const hasOperational = topics.some(t => t.name === "Training & Support" || t.name === "Obligations & Restrictions")
  const hasTerritory = topics.some(t => t.name === "Territory Protection")

  if (hasFinancial && hasOperational) {
    narrative += " Their interest in both financial returns and operational details suggests they're in **active due diligence** and evaluating whether this franchise fits their goals and capabilities."
  } else if (hasFinancial && hasTerritory) {
    narrative += " Their focus on financials combined with territory questions indicates they're **evaluating market opportunity** and investment potential in their area."
  } else if (hasFinancial) {
    narrative += " This financial focus suggests they're **ROI-oriented** and will likely want concrete data on franchisee performance."
  } else if (hasOperational) {
    narrative += " Their operational focus suggests they're **planning-minded** and want to understand day-to-day requirements before committing."
  } else if (hasTerritory) {
    narrative += " Their territory interest suggests they have a **specific location in mind** and want to ensure market protection."
  }

  if (hasSignificantTime && totalQuestions >= 5) {
    narrative += " The depth of their engagement indicates a **serious prospect** worth prioritizing."
  }

  return narrative
}

// Helper to parse financial ranges into numeric values for comparison
function parseFinancialRange(range: string | null): { min: number; max: number } | null {
  if (!range) return null
  
  // Handle common patterns like "$100K - $250K", "$2M+", "$500,000+", "Under $100K"
  const cleanRange = range.replace(/,/g, '').toLowerCase()
  
  // Helper to get multiplier based on suffix (k = thousands, m = millions)
  const getMultiplier = (str: string, numberStr: string): number => {
    // Check what comes right after the number
    const afterNumber = str.substring(str.indexOf(numberStr) + numberStr.length)
    if (afterNumber.startsWith('m') || str.includes('million')) return 1000000
    if (afterNumber.startsWith('k') || str.includes('thousand')) return 1000
    // If it's a small number without suffix, assume thousands
    const num = parseInt(numberStr)
    if (num < 1000) return 1000
    return 1
  }
  
  if (cleanRange.includes('under') || cleanRange.includes('less than')) {
    const match = cleanRange.match(/(\d+)/)
    if (match) {
      const value = parseInt(match[1]) * getMultiplier(cleanRange, match[1])
      return { min: 0, max: value }
    }
  }
  
  if (cleanRange.includes('+') || cleanRange.includes('over') || cleanRange.includes('more than')) {
    const match = cleanRange.match(/(\d+)/)
    if (match) {
      const value = parseInt(match[1]) * getMultiplier(cleanRange, match[1])
      return { min: value, max: value * 10 } // Assume upper bound is 10x
    }
  }
  
  // Range pattern: "$100K - $250K" or "$1M - $2M" or "100000 - 250000"
  const rangeMatch = cleanRange.match(/\$?(\d+)([km])?\s*[-–]\s*\$?(\d+)([km])?/i)
  if (rangeMatch) {
    let min = parseInt(rangeMatch[1])
    let max = parseInt(rangeMatch[3])
    // Apply multipliers
    if (rangeMatch[2] === 'm') min *= 1000000
    else if (rangeMatch[2] === 'k') min *= 1000
    else if (min < 1000) min *= 1000
    
    if (rangeMatch[4] === 'm') max *= 1000000
    else if (rangeMatch[4] === 'k') max *= 1000
    else if (max < 1000) max *= 1000
    
    return { min, max }
  }
  
  // Single value with suffix: "$2M", "$500K", "500000"
  const singleMatch = cleanRange.match(/\$?(\d+)([km])?/)
  if (singleMatch) {
    let value = parseInt(singleMatch[1])
    if (singleMatch[2] === 'm') value *= 1000000
    else if (singleMatch[2] === 'k') value *= 1000
    else if (value < 1000) value *= 1000
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
        questionInsights: {
          totalQuestions: 0,
          topicsExplored: [],
          narrativeSummary: "This prospect has not yet accessed the FDD.",
          engagementSignals: [],
        },
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
        id, user_id,
        first_name, last_name, email, city_location, state_location, buying_timeline, signup_source,
        fico_score_range, liquid_assets_range, net_worth_range, funding_plans, linkedin_url,
        no_felony_attestation, no_bankruptcy_attestation, profile_completed_at,
        years_of_experience, management_experience, has_owned_business, industry_experience, relevant_skills
      `)
      .eq("id", accessRecord.buyer_id)
      .single()

    // ==========================================
    // DEMO: Hardcoded data for Bob Smith to showcase Lead Intelligence
    // ==========================================
    if (buyerProfile?.first_name === "Bob" && buyerProfile?.last_name === "Smith") {
      return NextResponse.json({
        totalTimeSpent: "47m",
        totalTimeSpentSeconds: 2820,
        averageSessionDuration: 940,
        sectionsViewed: ["Item 19 - Financial Performance", "Item 7 - Initial Investment", "Item 12 - Territory", "Item 11 - Training"],
        itemsViewed: ["19", "7", "12", "11", "20"],
        questionInsights: {
          totalQuestions: 5,
          topicsExplored: [
            { name: "Financial Performance", icon: "📊", count: 5 },
            { name: "Investment & Costs", icon: "💰", count: 4 },
            { name: "Territory Protection", icon: "🗺️", count: 3 },
            { name: "Training & Support", icon: "🎓", count: 2 },
          ],
          narrativeSummary: "This prospect has asked 5 questions focusing primarily on **financial performance**, **investment & costs**, and **territory protection**. Their focus on financials combined with territory questions indicates they're **evaluating market opportunity** and investment potential in their area. The depth of their engagement indicates a **serious prospect** worth prioritizing.",
          engagementSignals: [
            "Focused on financial performance data - likely evaluating ROI potential",
            "Reviewed initial investment details - assessing affordability",
            "Explored territory information - interested in market exclusivity",
            "Reviewed training programs - evaluating support structure",
            "Spent significant time in due diligence - serious consideration"
          ],
        },
        fddFocusAreas: [
          { item: "Item 19 - Financial Performance", timeSpent: "18m", interest: "High" },
          { item: "Item 7 - Initial Investment", timeSpent: "12m", interest: "High" },
          { item: "Item 12 - Territory", timeSpent: "9m", interest: "Medium" },
          { item: "Item 11 - Training", timeSpent: "8m", interest: "Medium" },
        ],
        accessedDate: new Date().toLocaleDateString(),
        engagementCount: 3,
        engagementTier: "high",
        aiInsights: {
          summary: "✅ FINANCIALLY QUALIFIED. Bob Smith is a highly engaged prospect who has spent 47 minutes across 3 sessions conducting thorough due diligence on the Drybar FDD. His focus on Item 19 (financial performance) and Item 7 (investment details) indicates a data-driven decision-making approach typical of serious franchise buyers.",
          keyFindings: [
            "✅ MEETS: $250K - $500K liquid assets exceeds $100K requirement",
            "✅ MEETS: $500K - $1M net worth exceeds $300K requirement",
            "Financial focus: Deep analysis of both investment requirements and financial performance - likely calculating ROI",
            "Persistent interest: 3 sessions shows sustained commitment to due diligence",
            "Territory interest: Actively researching territories for Los Angeles area",
            "Lead source: Referral - high-quality lead channel with strong conversion rates"
          ],
          recommendations: [
            "Lead with financial success stories - Bob has invested significant time in Item 19, indicating he values data-driven ROI discussions",
            "Mention the referral source to build trust and credibility in your outreach",
            "He's detail-oriented with 5 questions asked - prepare comprehensive answers and be ready for in-depth questions",
            "Multiple sessions indicate thorough research - respect his process while addressing any remaining concerns",
            "Strike while engagement is high - his recent activity suggests active decision-making"
          ],
          nextSteps: [
            "Schedule a call with Bob within 24-48 hours to discuss his questions about financial performance",
            "Share success stories from top-performing franchisees in similar markets",
            "Prepare territory availability maps and demographic data for Los Angeles area",
            "Send a personalized follow-up email summarizing your conversation and next steps"
          ],
          salesStrategy: {
            recommendedApproach: "Urgency",
            approachRationale: "High engagement indicates strong interest - create urgency while addressing any remaining questions. Bob's thorough due diligence and financial qualification make him ready for next steps.",
            talkingPoints: [
              "Deep dive into Item 19 financial performance data - he's shown strong interest",
              "Address investment questions - he's reviewed costs carefully",
              "Discuss territory details for Los Angeles - he's evaluating market opportunity",
              "Expand on training details - he wants to understand support",
              "Reference his referral source to personalize conversation",
              "Align on his 3-6 month timeline"
            ],
            anticipatedObjections: [
              { objection: "Investment seems high", response: "Let's walk through the ROI data and financing options available - your financial profile positions you well for this investment" },
              { objection: "Concerned about competition", response: "Our territory protection ensures you have exclusive rights in your market - let me show you the Los Angeles availability" },
              { objection: "Need more time", response: "Completely understand - what specific information would help you feel confident in moving forward?" }
            ],
            questionsToAsk: [
              "What aspects of Drybar appeal most to you?",
              "Have you identified your preferred territory in Los Angeles?",
              "What's your funding plan for the investment?",
              "What questions do you have after reviewing the FDD?",
              "When are you hoping to open your location?"
            ]
          },
          engagementTier: "high",
          tierMessage: "🔥 Hot lead - prioritize immediate follow-up",
          candidateFit: {
            financialFit: {
              status: "qualified",
              score: 100,
              liquidCapitalAssessment: "✅ MEETS: $250K - $500K exceeds $100K requirement",
              netWorthAssessment: "✅ MEETS: $500K - $1M exceeds $300K requirement"
            }
          }
        },
        buyerQualification: {
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
        },
        buyerLocation: buyerProfile.city_location && buyerProfile.state_location
          ? `${buyerProfile.city_location}, ${buyerProfile.state_location}`
          : "Los Angeles, CA",
        invitationData: {
          source: "Referral",
          timeline: "3-6 months",
          city: "Los Angeles",
          state: "CA",
          targetLocation: "Los Angeles, CA",
          brand: "Drybar"
        }
      })
    }
    // ==========================================
    // END DEMO DATA
    // ==========================================

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

    // Query fdd_engagements using user_id (not buyer_profiles.id)
    // fdd_engagements.buyer_id references users.id, which is buyer_profiles.user_id
    const engagementBuyerId = buyerProfile?.user_id || accessRecord.buyer_id
    
    // DEBUG: Log which ID we're using for the engagements query
    console.log('[DEBUG v2] engagementBuyerId:', engagementBuyerId, 'from user_id:', buyerProfile?.user_id, 'fallback:', accessRecord.buyer_id)
    
    // Use service role client to bypass RLS - franchisor needs to read buyer engagement data
    const serviceClient = createServiceRoleClient()
    const { data: engagements, error: engagementError } = await serviceClient
      .from("fdd_engagements")
      .select("*")
      .eq("buyer_id", engagementBuyerId)
      .eq("franchise_id", accessRecord.franchise_id)
      .order("created_at", { ascending: false })

    if (engagementError) {
      console.error("Error fetching engagement data:", engagementError)
      return NextResponse.json({ error: engagementError.message }, { status: 500 })
    }

    // Map to correct column names: duration_seconds (not time_spent), section_name (not sections_viewed), viewed_items
    const totalTimeSpent = engagements?.reduce((sum, eng) => sum + (eng.duration_seconds || 0), 0) || 0
    const sessionCount = engagements?.length || 0

    const tier = getEngagementTier(totalTimeSpent, sessionCount)

    // section_name is a single value per engagement, not an array
    const sectionsViewed = Array.from(new Set(engagements?.map((eng) => eng.section_name).filter(Boolean) || []))
    // viewed_items may be an array or single value
    const itemsViewed = Array.from(new Set(engagements?.flatMap((eng) => {
      if (Array.isArray(eng.viewed_items)) return eng.viewed_items
      if (eng.viewed_items) return [eng.viewed_items]
      return []
    }) || []))

    const totalQuestionsAsked = engagements?.reduce((sum, e) => sum + (e.questions_asked || 0), 0) || 0
    
    // Collect all questions from questions_list across all engagement sessions
    const allQuestionsList = engagements?.flatMap((e) => e.questions_list || []) || []

    // Generate question themes and narrative summary (privacy-preserving)
    const questionInsights = generateQuestionInsights(
      engagements,
      sectionsViewed,
      itemsViewed,
      totalQuestionsAsked,
      allQuestionsList,
      franchise?.name || "the franchise"
    )

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
      questionInsights,
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
  const sentDate = invitation.sent_at ? new Date(invitation.sent_at).toLocaleDateString() : "recently"

  // Check if franchise has financial requirements for assessment
  const idealProfile = franchise?.ideal_candidate_profile
  const financialReqs = idealProfile?.financial_requirements
  
  // Calculate financial fit if we have requirements AND buyer financial data
  let financialFit = null
  if (financialReqs && buyerProfile?.liquid_assets_range) {
    financialFit = assessFinancialFit({
      liquid_assets_range: buyerProfile.liquid_assets_range,
      net_worth_range: buyerProfile.net_worth_range,
      funding_plans: buyerProfile.funding_plans,
    }, financialReqs)
  }

  // Simple, honest summary - no fake insights
  const summary = `${leadName} has not engaged with the ${franchiseName} FDD yet. Specific insights about their interests, concerns, and questions will be available once they begin reviewing the document.`

  return {
    summary,
    keyFindings: [],
    recommendations: [],
    nextSteps: [],
    engagementTier: "none" as EngagementTier,
    tierMessage: "Awaiting first FDD session",
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

  // Handle "none" tier - no engagement yet, simple honest message
  if (tier === "none") {
    const buyerName = buyerProfile?.first_name
      ? `${buyerProfile.first_name} ${buyerProfile.last_name || ""}`.trim()
      : "This prospect"
    const franchiseName = franchise?.name || "the franchise"
    
    return {
      summary: `${buyerName} has not engaged with the ${franchiseName} FDD yet. Specific insights about their interests, concerns, and questions will be available once they begin reviewing the document.`,
      keyFindings: [],
      recommendations: [],
      nextSteps: [],
      engagementTier: "none" as EngagementTier,
      tierMessage: "Awaiting first FDD session",
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
  // Derive from actual data: section_name and viewed_items columns
  const allSectionsLower = sectionsViewed.map(s => String(s).toLowerCase())
  const allItemsLower = itemsViewed.map(i => String(i).toLowerCase())
  const viewedItem19 = allSectionsLower.some((s) => s.includes("item 19") || s.includes("financial")) || allItemsLower.some((i) => i.includes("19"))
  const viewedItem7 = allSectionsLower.some((s) => s.includes("item 7") || s.includes("investment")) || allItemsLower.some((i) => i.includes("7"))
  const viewedItem12 = allSectionsLower.some((s) => s.includes("item 12") || s.includes("territory")) || allItemsLower.some((i) => i.includes("12"))
  const viewedItem20 = allSectionsLower.some((s) => s.includes("item 20") || s.includes("outlets")) || allItemsLower.some((i) => i.includes("20"))
  const viewedItem11 = allSectionsLower.some((s) => s.includes("item 11") || s.includes("training")) || allItemsLower.some((i) => i.includes("11"))

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

  // Build sales strategy for minimal engagement
  const salesStrategy = {
    recommendedApproach: financialStatus === 'not_qualified' ? 'Disqualify' : 'Educational',
    approachRationale: financialStatus === 'not_qualified'
      ? `Financial requirements not met - verify if they can secure additional funding before investing time`
      : `Early stage prospect with minimal engagement - focus on education and building interest`,
    talkingPoints: [
      "Introduce yourself and the franchise opportunity",
      "Ask about their interest in the industry",
      "Share 2-3 key differentiators of the franchise",
      "Offer to guide them through the most important FDD sections",
    ],
    anticipatedObjections: [
      { objection: "Just browsing/not ready", response: "No pressure - would it help if I shared a quick overview of what makes this opportunity unique?" },
    ],
    questionsToAsk: [
      "What sparked your interest in franchise ownership?",
      "Have you explored other franchise opportunities?",
      "What's your ideal timeline for making a decision?",
    ],
  }

  return {
    summary,
    keyFindings,
    recommendations,
    nextSteps,
    salesStrategy,
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

  // Derive from section_name data instead of non-existent viewed_item19/viewed_item7 columns
  const sectionsLower = sectionsViewed.map(s => String(s).toLowerCase())
  const viewedItem19 = sectionsLower.some((s) => s.includes("item 19") || s.includes("financial"))
  const viewedItem7 = sectionsLower.some((s) => s.includes("item 7") || s.includes("investment"))

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

  // Build sales strategy for the Recommended Approach section
  const salesStrategy = {
    recommendedApproach: financialStatus === 'not_qualified' ? 'Disqualify' :
                         financialStatus === 'borderline' ? 'Validation' :
                         viewedItem19 ? 'Consultative' : 'Educational',
    approachRationale: financialStatus === 'not_qualified' 
      ? `Financial requirements not met - verify financing options before investing time`
      : financialStatus === 'borderline'
        ? `Close to financial requirements - validate assets and funding plan early`
        : viewedItem19 
          ? `Their focus on Item 19 indicates ROI-driven decision making - lead with financial success stories`
          : `Still exploring - educate them on the opportunity and guide them to key FDD sections`,
    talkingPoints: [
      viewedItem19 ? "Walk through Item 19 financial performance data in detail" : "Highlight key Item 19 metrics and franchisee success stories",
      viewedItem7 ? "Address any investment concerns and discuss financing options" : "Present clear breakdown of investment requirements",
      "Discuss territory availability and protection",
      "Explain training and ongoing support programs",
      timeline ? `Align timeline expectations - they indicated ${timeline}` : "Understand their decision timeline",
    ],
    anticipatedObjections: [
      { objection: "Investment seems high", response: "Let's walk through the ROI data from Item 19 and successful franchisee case studies" },
      { objection: "Need more time to decide", response: "Completely understand - what specific information would help you move forward?" },
    ],
    questionsToAsk: [
      "What attracted you most to this franchise opportunity?",
      "What's your ideal timeline for opening?",
      location ? `Are you committed to the ${location} area, or open to other territories?` : "What locations are you considering?",
      "What's your funding plan for the investment?",
      "Have you owned a business before?",
    ],
  }

  return {
    summary,
    keyFindings,
    recommendations,
    nextSteps,
    salesStrategy,
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

  // Derive from section_name data instead of non-existent viewed_item19/viewed_item7 columns
  const sectionsLower = sectionsViewed.map(s => String(s).toLowerCase())
  const viewedItem19 = sectionsLower.some((s) => s.includes("item 19") || s.includes("financial"))
  const viewedItem7 = sectionsLower.some((s) => s.includes("item 7") || s.includes("investment"))
  const viewedItem12 = sectionsLower.some((s) => s.includes("item 12") || s.includes("territory"))
  const viewedItem11 = sectionsLower.some((s) => s.includes("item 11") || s.includes("training"))

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

  // Build sales strategy for template fallback
  const salesStrategy = {
    recommendedApproach: financialStatus === 'not_qualified' ? 'Disqualify' :
                         financialStatus === 'borderline' ? 'Validation' :
                         tier === 'high' ? 'Urgency' : 'Consultative',
    approachRationale: financialStatus === 'not_qualified'
      ? `Financial requirements not met - verify financing options before investing significant time`
      : financialStatus === 'borderline'
        ? `Close to financial requirements - validate assets and funding plan early in conversation`
        : tier === 'high'
          ? `High engagement indicates strong interest - create urgency while addressing any remaining questions`
          : `Meaningful engagement suggests active evaluation - take consultative approach to understand their specific needs`,
    talkingPoints: [
      viewedItem19 ? "Deep dive into Item 19 financial performance data - they've shown strong interest" : "Present Item 19 highlights and franchisee success stories",
      viewedItem7 ? "Address investment questions - they've reviewed costs carefully" : "Walk through investment breakdown clearly",
      viewedItem12 ? "Discuss territory details - they're evaluating market opportunity" : "Present territory options and exclusivity",
      viewedItem11 ? "Expand on training details - they want to understand support" : "Highlight training and ongoing support programs",
      `Reference their ${source} lead source to personalize conversation`,
      timeline ? `Align on their ${timeline} timeline` : "Understand their decision timeline",
    ].filter(Boolean),
    anticipatedObjections: [
      { objection: "Investment seems high", response: "Let's walk through the ROI data and financing options available" },
      { objection: "Concerned about competition", response: "Our territory protection ensures you have exclusive rights in your market" },
      { objection: "Need more time", response: "What specific information would help you feel confident in moving forward?" },
    ],
    questionsToAsk: [
      "What aspects of this franchise appeal most to you?",
      "Have you identified your preferred territory?",
      "What's your funding plan for the investment?",
      "What questions do you have after reviewing the FDD?",
      "When are you hoping to open your location?",
    ],
  }

  return {
    summary,
    keyFindings,
    recommendations,
    nextSteps,
    salesStrategy,
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
