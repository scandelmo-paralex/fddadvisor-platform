/**
 * Lead Scoring Utility
 * 
 * SINGLE SOURCE OF TRUTH for lead quality score calculation.
 * Used by both:
 * - /api/hub/leads (Dashboard)
 * - /api/leads/engagement (Lead Intelligence Report)
 * 
 * This ensures consistent scoring across the entire application.
 */

// =============================================================================
// TYPES
// =============================================================================

export type EngagementTier = 'none' | 'minimal' | 'partial' | 'meaningful' | 'high'
export type LeadTemperature = 'Hot' | 'Warm' | 'Cold'
export type FinancialStatus = 'qualified' | 'borderline' | 'not_qualified' | 'unknown'

export interface EngagementData {
  totalTimeSeconds: number
  sessionCount: number
  questionsAsked?: number
  sectionsViewed?: string[]
}

export interface BuyerProfile {
  liquid_assets_range?: string | null
  net_worth_range?: string | null
  funding_plans?: string | string[] | null
  profile_completed_at?: string | null
  management_experience?: boolean | null
  has_owned_business?: boolean | null
  years_of_experience?: string | number | null
}

export interface FinancialRequirements {
  liquid_capital_min?: number
  net_worth_min?: number
}

export interface QualityScoreResult {
  score: number
  temperature: LeadTemperature
  engagementTier: EngagementTier
  financialStatus: FinancialStatus
  breakdown: {
    base: number
    engagement: number
    financial: number
    experience: number
  }
}

// =============================================================================
// ENGAGEMENT TIER
// =============================================================================

/**
 * Determine engagement tier based on time spent and session count
 */
export function getEngagementTier(totalTimeSeconds: number, sessionCount: number): EngagementTier {
  if (sessionCount === 0 || totalTimeSeconds === 0) return 'none'
  
  const totalMinutes = totalTimeSeconds / 60
  
  if (totalMinutes < 5) return 'minimal'
  if (totalMinutes < 15) return 'partial'
  if (totalMinutes < 45) return 'meaningful'
  return 'high'
}

/**
 * Get engagement points based on tier
 * 
 * UPDATED: Engagement is now weighted more heavily (35 points max instead of 25)
 * because active engagement is the strongest signal of buyer intent.
 * 
 * Tier thresholds:
 * - high: 45+ minutes = serious due diligence
 * - meaningful: 15-45 minutes = active evaluation  
 * - partial: 5-15 minutes = initial exploration
 * - minimal: <5 minutes = just opened
 * - none: hasn't accessed yet
 */
export function getEngagementPoints(tier: EngagementTier): number {
  switch (tier) {
    case 'high': return 35       // 45+ minutes - max engagement points
    case 'meaningful': return 25 // 15-45 minutes
    case 'partial': return 15    // 5-15 minutes
    case 'minimal': return 5     // < 5 minutes
    case 'none': return 0
  }
}

// =============================================================================
// FINANCIAL QUALIFICATION
// =============================================================================

/**
 * Parse financial range string into numeric values
 * Handles formats like "$100K - $250K", "$2M+", "Under $100K"
 */
export function parseFinancialRange(range: string | null | undefined): { min: number; max: number } | null {
  if (!range) return null
  
  const cleanRange = range.replace(/,/g, '').toLowerCase()
  
  const getMultiplier = (str: string, numberStr: string): number => {
    const afterNumber = str.substring(str.indexOf(numberStr) + numberStr.length)
    if (afterNumber.startsWith('m') || str.includes('million')) return 1000000
    if (afterNumber.startsWith('k') || str.includes('thousand')) return 1000
    const num = parseInt(numberStr)
    if (num < 1000) return 1000
    return 1
  }
  
  // "Under $100K" or "Less than $100K"
  if (cleanRange.includes('under') || cleanRange.includes('less than')) {
    const match = cleanRange.match(/(\d+)/)
    if (match) {
      const value = parseInt(match[1]) * getMultiplier(cleanRange, match[1])
      return { min: 0, max: value }
    }
  }
  
  // "$2M+" or "Over $500K"
  if (cleanRange.includes('+') || cleanRange.includes('over') || cleanRange.includes('more than')) {
    const match = cleanRange.match(/(\d+)/)
    if (match) {
      const value = parseInt(match[1]) * getMultiplier(cleanRange, match[1])
      return { min: value, max: value * 10 }
    }
  }
  
  // Range: "$100K - $250K"
  const rangeMatch = cleanRange.match(/\$?(\d+)([km])?\s*[-–]\s*\$?(\d+)([km])?/i)
  if (rangeMatch) {
    let min = parseInt(rangeMatch[1])
    let max = parseInt(rangeMatch[3])
    
    if (rangeMatch[2] === 'm') min *= 1000000
    else if (rangeMatch[2] === 'k') min *= 1000
    else if (min < 1000) min *= 1000
    
    if (rangeMatch[4] === 'm') max *= 1000000
    else if (rangeMatch[4] === 'k') max *= 1000
    else if (max < 1000) max *= 1000
    
    return { min, max }
  }
  
  // Single value: "$500K"
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

/**
 * Assess financial fit against franchise requirements
 * 
 * UPDATED: Financial scoring reduced to 25 points max (was 30)
 * because engagement is a stronger signal of active buyer intent.
 * 
 * Scoring:
 * - Both meet requirements: 25 points (qualified)
 * - One meets, one borderline: 20 points (borderline)
 * - Both borderline: 15 points (borderline)
 * - One doesn't meet: 5 points (not qualified)
 * - Unknown/no data: 10-15 points (benefit of doubt)
 */
export function assessFinancialFit(
  buyerProfile: BuyerProfile | null | undefined,
  requirements: FinancialRequirements | null | undefined
): { status: FinancialStatus; score: number; details: { liquidCapital: string; netWorth: string } } {
  
  if (!buyerProfile) {
    return {
      status: 'unknown',
      score: 10, // Reduced benefit of doubt
      details: {
        liquidCapital: 'No profile data',
        netWorth: 'No profile data'
      }
    }
  }
  
  const liquidRange = parseFinancialRange(buyerProfile.liquid_assets_range)
  const netWorthRange = parseFinancialRange(buyerProfile.net_worth_range)
  
  // If no financial requirements to compare against, score based on data presence
  // But cap the score lower since we can't verify qualification
  if (!requirements || (!requirements.liquid_capital_min && !requirements.net_worth_min)) {
    const hasLiquid = liquidRange !== null
    const hasNetWorth = netWorthRange !== null
    
    if (hasLiquid && hasNetWorth) {
      return {
        status: 'unknown', // Can't assess without requirements
        score: 20, // Has financial data but can't verify - reduced from 30
        details: {
          liquidCapital: buyerProfile.liquid_assets_range || 'Not provided',
          netWorth: buyerProfile.net_worth_range || 'Not provided'
        }
      }
    } else if (hasLiquid || hasNetWorth) {
      return {
        status: 'unknown',
        score: 12, // Partial data - reduced from 15
        details: {
          liquidCapital: buyerProfile.liquid_assets_range || 'Not provided',
          netWorth: buyerProfile.net_worth_range || 'Not provided'
        }
      }
    } else if (buyerProfile.profile_completed_at) {
      return {
        status: 'unknown',
        score: 8, // Profile complete but no financial data - reduced from 10
        details: {
          liquidCapital: 'Not provided',
          netWorth: 'Not provided'
        }
      }
    }
    
    return {
      status: 'unknown',
      score: 10, // Benefit of doubt for no data - reduced from 15
      details: {
        liquidCapital: 'Not provided',
        netWorth: 'Not provided'
      }
    }
  }
  
  // Assess against requirements
  let meetsLiquid: boolean | null = null
  let meetsNetWorth: boolean | null = null
  let liquidAssessment = 'Not provided'
  let netWorthAssessment = 'Not provided'
  let score = 0
  
  // Check liquid capital (up to 12.5 points)
  if (liquidRange && requirements.liquid_capital_min) {
    const midpoint = (liquidRange.min + liquidRange.max) / 2
    const required = requirements.liquid_capital_min
    
    if (liquidRange.min >= required) {
      meetsLiquid = true
      liquidAssessment = `✅ MEETS: ${buyerProfile.liquid_assets_range} exceeds ${(required/1000).toFixed(0)}K requirement`
      score += 12 // Reduced from 15
    } else if (midpoint >= required * 0.9) {
      meetsLiquid = true
      liquidAssessment = `⚠️ BORDERLINE: ${buyerProfile.liquid_assets_range} is close to ${(required/1000).toFixed(0)}K requirement`
      score += 8 // Reduced from 10
    } else {
      meetsLiquid = false
      liquidAssessment = `❌ SHORTFALL: ${buyerProfile.liquid_assets_range} below ${(required/1000).toFixed(0)}K requirement`
      score += 2
    }
  } else if (liquidRange) {
    liquidAssessment = buyerProfile.liquid_assets_range || 'Not provided'
    score += 8 // Has data but no requirement to compare - reduced from 10
  }
  
  // Check net worth (up to 12.5 points)
  if (netWorthRange && requirements.net_worth_min) {
    const midpoint = (netWorthRange.min + netWorthRange.max) / 2
    const required = requirements.net_worth_min
    
    if (netWorthRange.min >= required) {
      meetsNetWorth = true
      netWorthAssessment = `✅ MEETS: ${buyerProfile.net_worth_range} exceeds ${(required/1000).toFixed(0)}K requirement`
      score += 13 // 12 + 13 = 25 max for fully qualified
    } else if (midpoint >= required * 0.9) {
      meetsNetWorth = true
      netWorthAssessment = `⚠️ BORDERLINE: ${buyerProfile.net_worth_range} is close to ${(required/1000).toFixed(0)}K requirement`
      score += 8 // Reduced from 10
    } else {
      meetsNetWorth = false
      netWorthAssessment = `❌ SHORTFALL: ${buyerProfile.net_worth_range} below ${(required/1000).toFixed(0)}K requirement`
      score += 2
    }
  } else if (netWorthRange) {
    netWorthAssessment = buyerProfile.net_worth_range || 'Not provided'
    score += 8 // Has data but no requirement to compare - reduced from 10
  }
  
  // Determine overall status
  let status: FinancialStatus = 'unknown'
  
  if (meetsLiquid === null && meetsNetWorth === null) {
    status = 'unknown'
  } else if (meetsLiquid === false || meetsNetWorth === false) {
    status = 'not_qualified'
  } else if (meetsLiquid === true && meetsNetWorth === true) {
    status = 'qualified'
  } else {
    status = 'borderline'
  }
  
  return {
    status,
    score: Math.min(score, 25), // Cap at 25 (reduced from 30)
    details: {
      liquidCapital: liquidAssessment,
      netWorth: netWorthAssessment
    }
  }
}

// =============================================================================
// EXPERIENCE SCORING
// =============================================================================

/**
 * Calculate experience points from buyer profile
 * 
 * UPDATED: Experience scoring increased to 20 points max (was 15)
 * to better reflect the importance of background/skills in franchise success.
 * 
 * Scoring:
 * - Management experience: 7 points
 * - Prior business ownership: 7 points  
 * - Years of experience: up to 6 points (10+ yrs = 6, 5-9 yrs = 4, <5 yrs = 2)
 */
export function getExperiencePoints(buyerProfile: BuyerProfile | null | undefined): number {
  if (!buyerProfile) return 0
  
  let points = 0
  
  if (buyerProfile.management_experience) points += 7  // Increased from 5
  if (buyerProfile.has_owned_business) points += 7     // Increased from 5
  
  if (buyerProfile.years_of_experience) {
    const years = typeof buyerProfile.years_of_experience === 'string' 
      ? parseInt(buyerProfile.years_of_experience) 
      : buyerProfile.years_of_experience
    
    if (years >= 10) points += 6    // Increased from 5
    else if (years >= 5) points += 4 // Increased from 3
    else if (years >= 1) points += 2 // Added tier for 1-4 years
  }
  
  return Math.min(points, 20) // Increased cap from 15 to 20
}

// =============================================================================
// MAIN SCORING FUNCTION
// =============================================================================

/**
 * Calculate comprehensive quality score for a lead
 * 
 * UPDATED WEIGHTS (v2 - January 2026):
 * - Base: 20 points (was 30) - just for being a verified lead
 * - Engagement: up to 35 points (was 25) - PRIMARY signal of buyer intent
 * - Financial: up to 25 points (was 30) - important but binary qualifier
 * - Experience: up to 20 points (was 15) - skills/background matter
 * 
 * Total: 100 points max
 * 
 * Temperature Thresholds:
 * - Hot: 80+ (🔥 prioritize immediate follow-up)
 * - Warm: 60-79 (ready for engagement)  
 * - Cold: <60 (needs nurturing)
 * 
 * Example Scenarios:
 * - Glenn (8 min, great financials, mgmt exp): 20 + 15 + 20 + 7 = 62 (WARM) 
 * - Houston (87 min, great financials, all exp): 20 + 35 + 25 + 20 = 100 (HOT)
 * - DeDe (6 min, good financials, some exp): 20 + 15 + 20 + 7 = 62 (WARM)
 * - New lead (0 min, no data): 20 + 0 + 10 + 0 = 30 (COLD)
 * 
 * @param engagement - Engagement data (time, sessions, etc.)
 * @param buyerProfile - Buyer's profile data
 * @param financialRequirements - Franchise's financial requirements (optional)
 */
export function calculateQualityScore(
  engagement: EngagementData,
  buyerProfile: BuyerProfile | null | undefined,
  financialRequirements?: FinancialRequirements | null
): QualityScoreResult {
  const BASE_SCORE = 20  // Reduced from 30
  
  // Engagement component (35 points max) - PRIMARY SIGNAL
  const engagementTier = getEngagementTier(engagement.totalTimeSeconds, engagement.sessionCount)
  const engagementPoints = getEngagementPoints(engagementTier)
  
  // Financial component (25 points max)
  const financialAssessment = assessFinancialFit(buyerProfile, financialRequirements)
  const financialPoints = financialAssessment.score
  
  // Experience component (20 points max)
  const experiencePoints = getExperiencePoints(buyerProfile)
  
  // Total score
  const totalScore = Math.min(BASE_SCORE + engagementPoints + financialPoints + experiencePoints, 100)
  
  // Determine temperature
  const temperature = getLeadTemperature(totalScore)
  
  return {
    score: totalScore,
    temperature,
    engagementTier,
    financialStatus: financialAssessment.status,
    breakdown: {
      base: BASE_SCORE,
      engagement: engagementPoints,
      financial: financialPoints,
      experience: experiencePoints
    }
  }
}

// =============================================================================
// TEMPERATURE
// =============================================================================

/**
 * Convert quality score to temperature label
 * 
 * UPDATED Thresholds (v2 - January 2026):
 * - Hot: 80+ (🔥 prioritize immediate follow-up)
 *   Requires significant engagement (meaningful/high tier) + good qualifications
 * - Warm: 60-79 (ready for engagement)
 *   Good engagement OR strong qualifications
 * - Cold: <60 (needs nurturing)
 *   Early stage or minimal engagement
 * 
 * Threshold reasoning:
 * - To be "Hot", a lead should have at least meaningful engagement (25 pts)
 *   OR high engagement (35 pts). With base 20, that's 45-55 minimum.
 *   Add financial qualification (20-25) and you get 65-80.
 *   Need both engagement AND qualification to hit 80+.
 * 
 * - To be "Warm", a lead should show some activity (partial+ engagement)
 *   With base 20 + partial 15 + some financial 15+ = 50-60+
 */
export function getLeadTemperature(qualityScore: number): LeadTemperature {
  if (qualityScore >= 80) return 'Hot'    // Lowered from 85 to 80
  if (qualityScore >= 60) return 'Warm'   // Lowered from 70 to 60
  return 'Cold'
}

/**
 * Get tier message for display
 */
export function getTierMessage(tier: EngagementTier): string {
  switch (tier) {
    case 'high': return '🔥 Hot lead - prioritize immediate follow-up'
    case 'meaningful': return '🟢 Warm lead - ready for deeper conversation'
    case 'partial': return '🟡 Interested - needs encouragement'
    case 'minimal': return '⚪ Early stage - needs nurturing'
    case 'none': return 'Awaiting first FDD session'
  }
}
