/**
 * Lead Scoring Utility
 * 
 * SINGLE SOURCE OF TRUTH for lead quality score calculation.
 * Used by both:
 * - /api/hub/leads (Dashboard)
 * - /api/leads/engagement (Lead Intelligence Report)
 * 
 * This ensures consistent scoring across the entire application.
 * 
 * VERSION 2.1 (January 2026): Added support for custom scoring weights
 * and temperature thresholds per franchise via white_label_settings.
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
  has_franchise_experience?: boolean | null
  industry_expertise?: string[] | null
  no_felony_attestation?: boolean | null
  no_bankruptcy_attestation?: boolean | null
  operational_involvement?: string | null
  years_experience_range?: string | null
}

export interface FinancialRequirements {
  liquid_capital_min?: number | null
  net_worth_min?: number | null
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
// NEW: Custom Scoring Configuration Types
// =============================================================================

export interface ScoringWeights {
  base: number      // Points just for being a verified lead
  engagement: number // Points based on FDD viewing activity
  financial: number  // Points based on financial qualification
  experience: number // Points based on background/skills
}

export interface TemperatureThresholds {
  hot: number  // Score >= this = Hot
  warm: number // Score >= this (and < hot) = Warm
}

export interface ExperienceRequirements {
  management_experience_required: boolean
  business_ownership_preferred: boolean
  franchise_experience_required: boolean
  min_years_experience: string | null // e.g., "5+", "10+", "1-3"
}

export interface IdealCandidateConfig {
  financial_requirements: FinancialRequirements
  experience_requirements: ExperienceRequirements
  preferred_industries: string[]
  ownership_model: 'owner_operator' | 'semi_absentee' | 'either'
  disqualifiers: {
    require_felony_attestation: boolean
    require_bankruptcy_attestation: boolean
  }
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  base: 20,
  engagement: 35,
  financial: 25,
  experience: 20
}

export const DEFAULT_TEMPERATURE_THRESHOLDS: TemperatureThresholds = {
  hot: 80,
  warm: 60
}

export const DEFAULT_IDEAL_CANDIDATE_CONFIG: IdealCandidateConfig = {
  financial_requirements: {
    liquid_capital_min: null,
    net_worth_min: null
  },
  experience_requirements: {
    management_experience_required: false,
    business_ownership_preferred: false,
    franchise_experience_required: false,
    min_years_experience: null
  },
  preferred_industries: [],
  ownership_model: 'either',
  disqualifiers: {
    require_felony_attestation: true,
    require_bankruptcy_attestation: true
  }
}

// Preset configurations for quick selection
export const SCORING_PRESETS = {
  default: {
    name: 'Default',
    description: 'Balanced scoring across all factors',
    weights: { base: 20, engagement: 35, financial: 25, experience: 20 },
    thresholds: { hot: 80, warm: 60 }
  },
  premium_brand: {
    name: 'Premium Brand',
    description: 'Emphasizes financial qualification and experience',
    weights: { base: 15, engagement: 25, financial: 35, experience: 25 },
    thresholds: { hot: 85, warm: 70 }
  },
  growth_focus: {
    name: 'Growth Focus',
    description: 'Prioritizes engagement and active interest',
    weights: { base: 20, engagement: 45, financial: 20, experience: 15 },
    thresholds: { hot: 75, warm: 55 }
  },
  experienced_operators: {
    name: 'Experienced Operators',
    description: 'Values business experience most highly',
    weights: { base: 15, engagement: 30, financial: 25, experience: 30 },
    thresholds: { hot: 80, warm: 65 }
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
 * Points are scaled proportionally based on the configured engagement weight.
 * Default max is 35 points for 'high' tier.
 * 
 * Tier thresholds:
 * - high: 45+ minutes = serious due diligence (100% of weight)
 * - meaningful: 15-45 minutes = active evaluation (71% of weight)
 * - partial: 5-15 minutes = initial exploration (43% of weight)
 * - minimal: <5 minutes = just opened (14% of weight)
 * - none: hasn't accessed yet (0%)
 */
export function getEngagementPoints(tier: EngagementTier, maxPoints: number = 35): number {
  switch (tier) {
    case 'high': return maxPoints                    // 100% - 45+ minutes
    case 'meaningful': return Math.round(maxPoints * 0.71)  // 71% - 15-45 minutes
    case 'partial': return Math.round(maxPoints * 0.43)     // 43% - 5-15 minutes
    case 'minimal': return Math.round(maxPoints * 0.14)     // 14% - < 5 minutes
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
 * Points are scaled proportionally based on the configured financial weight.
 * Default max is 25 points.
 */
export function assessFinancialFit(
  buyerProfile: BuyerProfile | null | undefined,
  requirements: FinancialRequirements | null | undefined,
  maxPoints: number = 25
): { status: FinancialStatus; score: number; details: { liquidCapital: string; netWorth: string } } {
  
  if (!buyerProfile) {
    return {
      status: 'unknown',
      score: Math.round(maxPoints * 0.4), // 40% for no data
      details: {
        liquidCapital: 'No profile data',
        netWorth: 'No profile data'
      }
    }
  }
  
  const liquidRange = parseFinancialRange(buyerProfile.liquid_assets_range)
  const netWorthRange = parseFinancialRange(buyerProfile.net_worth_range)
  
  // If no financial requirements to compare against, score based on data presence
  if (!requirements || (!requirements.liquid_capital_min && !requirements.net_worth_min)) {
    const hasLiquid = liquidRange !== null
    const hasNetWorth = netWorthRange !== null
    
    if (hasLiquid && hasNetWorth) {
      return {
        status: 'unknown',
        score: Math.round(maxPoints * 0.8), // 80% - has data but can't verify
        details: {
          liquidCapital: buyerProfile.liquid_assets_range || 'Not provided',
          netWorth: buyerProfile.net_worth_range || 'Not provided'
        }
      }
    } else if (hasLiquid || hasNetWorth) {
      return {
        status: 'unknown',
        score: Math.round(maxPoints * 0.48), // 48% - partial data
        details: {
          liquidCapital: buyerProfile.liquid_assets_range || 'Not provided',
          netWorth: buyerProfile.net_worth_range || 'Not provided'
        }
      }
    } else if (buyerProfile.profile_completed_at) {
      return {
        status: 'unknown',
        score: Math.round(maxPoints * 0.32), // 32% - profile complete but no financial
        details: {
          liquidCapital: 'Not provided',
          netWorth: 'Not provided'
        }
      }
    }
    
    return {
      status: 'unknown',
      score: Math.round(maxPoints * 0.4), // 40% - benefit of doubt
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
  
  const halfPoints = maxPoints / 2
  
  // Check liquid capital (up to half of max points)
  if (liquidRange && requirements.liquid_capital_min) {
    const midpoint = (liquidRange.min + liquidRange.max) / 2
    const required = requirements.liquid_capital_min
    
    if (liquidRange.min >= required) {
      meetsLiquid = true
      liquidAssessment = `✅ MEETS: ${buyerProfile.liquid_assets_range} exceeds ${(required/1000).toFixed(0)}K requirement`
      score += halfPoints * 0.96 // 48% of total
    } else if (midpoint >= required * 0.9) {
      meetsLiquid = true
      liquidAssessment = `⚠️ BORDERLINE: ${buyerProfile.liquid_assets_range} is close to ${(required/1000).toFixed(0)}K requirement`
      score += halfPoints * 0.64 // 32% of total
    } else {
      meetsLiquid = false
      liquidAssessment = `❌ SHORTFALL: ${buyerProfile.liquid_assets_range} below ${(required/1000).toFixed(0)}K requirement`
      score += halfPoints * 0.16 // 8% of total
    }
  } else if (liquidRange) {
    liquidAssessment = buyerProfile.liquid_assets_range || 'Not provided'
    score += halfPoints * 0.64 // Has data but no requirement
  }
  
  // Check net worth (up to half of max points)
  if (netWorthRange && requirements.net_worth_min) {
    const midpoint = (netWorthRange.min + netWorthRange.max) / 2
    const required = requirements.net_worth_min
    
    if (netWorthRange.min >= required) {
      meetsNetWorth = true
      netWorthAssessment = `✅ MEETS: ${buyerProfile.net_worth_range} exceeds ${(required/1000).toFixed(0)}K requirement`
      score += halfPoints * 1.04 // 52% of total (slightly more weight on net worth)
    } else if (midpoint >= required * 0.9) {
      meetsNetWorth = true
      netWorthAssessment = `⚠️ BORDERLINE: ${buyerProfile.net_worth_range} is close to ${(required/1000).toFixed(0)}K requirement`
      score += halfPoints * 0.64
    } else {
      meetsNetWorth = false
      netWorthAssessment = `❌ SHORTFALL: ${buyerProfile.net_worth_range} below ${(required/1000).toFixed(0)}K requirement`
      score += halfPoints * 0.16
    }
  } else if (netWorthRange) {
    netWorthAssessment = buyerProfile.net_worth_range || 'Not provided'
    score += halfPoints * 0.64
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
    score: Math.min(Math.round(score), maxPoints),
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
 * Parse years experience string to numeric value
 */
function parseYearsExperience(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  
  const str = value.toLowerCase()
  
  // Handle "10+" or "10+ years"
  const plusMatch = str.match(/(\d+)\+/)
  if (plusMatch) return parseInt(plusMatch[1])
  
  // Handle "5-10" or "5-10 years"
  const rangeMatch = str.match(/(\d+)\s*[-–]\s*(\d+)/)
  if (rangeMatch) {
    return (parseInt(rangeMatch[1]) + parseInt(rangeMatch[2])) / 2
  }
  
  // Handle just a number
  const numMatch = str.match(/(\d+)/)
  if (numMatch) return parseInt(numMatch[1])
  
  return 0
}

/**
 * Check if buyer meets minimum years requirement
 */
function meetsYearsRequirement(buyerYears: string | number | null | undefined, requiredMin: string | null): boolean {
  if (!requiredMin) return true // No requirement
  
  const buyerValue = parseYearsExperience(buyerYears)
  const requiredValue = parseYearsExperience(requiredMin)
  
  return buyerValue >= requiredValue
}

/**
 * Calculate experience points from buyer profile
 * 
 * Points are scaled proportionally based on the configured experience weight.
 * Default max is 20 points.
 * 
 * Scoring:
 * - Management experience: 35% of max
 * - Prior business ownership: 35% of max  
 * - Years of experience: up to 30% of max
 */
export function getExperiencePoints(
  buyerProfile: BuyerProfile | null | undefined,
  maxPoints: number = 20,
  requirements?: ExperienceRequirements | null
): number {
  if (!buyerProfile) return 0
  
  let points = 0
  
  // Management experience (35% of max)
  if (buyerProfile.management_experience) {
    points += maxPoints * 0.35
  }
  
  // Business ownership (35% of max)
  if (buyerProfile.has_owned_business) {
    points += maxPoints * 0.35
  }
  
  // Years of experience (up to 30% of max)
  const yearsValue = parseYearsExperience(
    buyerProfile.years_of_experience || buyerProfile.years_experience_range
  )
  
  if (yearsValue >= 10) {
    points += maxPoints * 0.30      // 10+ years = full points
  } else if (yearsValue >= 5) {
    points += maxPoints * 0.20      // 5-9 years
  } else if (yearsValue >= 1) {
    points += maxPoints * 0.10      // 1-4 years
  }
  
  // Bonus points for franchise experience (if not required)
  if (buyerProfile.has_franchise_experience && !requirements?.franchise_experience_required) {
    points += maxPoints * 0.10 // 10% bonus
  }
  
  return Math.min(Math.round(points), maxPoints)
}

// =============================================================================
// DISQUALIFIER CHECKING
// =============================================================================

/**
 * Check if buyer passes disqualifier requirements
 * Returns true if buyer passes (is NOT disqualified)
 */
export function checkDisqualifiers(
  buyerProfile: BuyerProfile | null | undefined,
  disqualifiers?: IdealCandidateConfig['disqualifiers'] | null
): { passes: boolean; reasons: string[] } {
  if (!disqualifiers || !buyerProfile) {
    return { passes: true, reasons: [] }
  }
  
  const reasons: string[] = []
  
  if (disqualifiers.require_felony_attestation && !buyerProfile.no_felony_attestation) {
    reasons.push('Felony attestation not provided')
  }
  
  if (disqualifiers.require_bankruptcy_attestation && !buyerProfile.no_bankruptcy_attestation) {
    reasons.push('Bankruptcy attestation not provided')
  }
  
  return {
    passes: reasons.length === 0,
    reasons
  }
}

// =============================================================================
// MAIN SCORING FUNCTION
// =============================================================================

/**
 * Calculate comprehensive quality score for a lead
 * 
 * UPDATED VERSION 2.1: Supports custom weights and thresholds
 * 
 * @param engagement - Engagement data (time, sessions, etc.)
 * @param buyerProfile - Buyer's profile data
 * @param financialRequirements - Franchise's financial requirements (optional)
 * @param customWeights - Custom scoring weights (optional, uses defaults if not provided)
 * @param customThresholds - Custom temperature thresholds (optional, uses defaults if not provided)
 */
export function calculateQualityScore(
  engagement: EngagementData,
  buyerProfile: BuyerProfile | null | undefined,
  financialRequirements?: FinancialRequirements | null,
  customWeights?: ScoringWeights | null,
  customThresholds?: TemperatureThresholds | null
): QualityScoreResult {
  // Use custom weights or defaults
  const weights = customWeights || DEFAULT_SCORING_WEIGHTS
  const thresholds = customThresholds || DEFAULT_TEMPERATURE_THRESHOLDS
  
  // Validate weights sum to 100 (use defaults if not)
  const weightSum = weights.base + weights.engagement + weights.financial + weights.experience
  const validWeights = weightSum === 100 ? weights : DEFAULT_SCORING_WEIGHTS
  
  // Base score - just for being a verified lead
  const baseScore = validWeights.base
  
  // Engagement component - scaled to weight
  const engagementTier = getEngagementTier(engagement.totalTimeSeconds, engagement.sessionCount)
  const engagementPoints = getEngagementPoints(engagementTier, validWeights.engagement)
  
  // Financial component - scaled to weight
  const financialAssessment = assessFinancialFit(buyerProfile, financialRequirements, validWeights.financial)
  const financialPoints = financialAssessment.score
  
  // Experience component - scaled to weight
  const experiencePoints = getExperiencePoints(buyerProfile, validWeights.experience)
  
  // Total score (capped at 100)
  const totalScore = Math.min(baseScore + engagementPoints + financialPoints + experiencePoints, 100)
  
  // Determine temperature using custom thresholds
  const temperature = getLeadTemperatureWithThresholds(totalScore, thresholds)
  
  return {
    score: totalScore,
    temperature,
    engagementTier,
    financialStatus: financialAssessment.status,
    breakdown: {
      base: baseScore,
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
 * Convert quality score to temperature label using custom thresholds
 */
export function getLeadTemperatureWithThresholds(
  qualityScore: number, 
  thresholds: TemperatureThresholds = DEFAULT_TEMPERATURE_THRESHOLDS
): LeadTemperature {
  if (qualityScore >= thresholds.hot) return 'Hot'
  if (qualityScore >= thresholds.warm) return 'Warm'
  return 'Cold'
}

/**
 * Convert quality score to temperature label (uses default thresholds)
 * Kept for backward compatibility
 */
export function getLeadTemperature(qualityScore: number): LeadTemperature {
  return getLeadTemperatureWithThresholds(qualityScore, DEFAULT_TEMPERATURE_THRESHOLDS)
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

// =============================================================================
// UTILITY: Validate scoring weights
// =============================================================================

/**
 * Validate that scoring weights sum to 100
 */
export function validateScoringWeights(weights: ScoringWeights): { valid: boolean; sum: number; error?: string } {
  const sum = weights.base + weights.engagement + weights.financial + weights.experience
  
  if (sum !== 100) {
    return {
      valid: false,
      sum,
      error: `Weights must sum to 100, but sum is ${sum}`
    }
  }
  
  // Check for negative values
  if (weights.base < 0 || weights.engagement < 0 || weights.financial < 0 || weights.experience < 0) {
    return {
      valid: false,
      sum,
      error: 'Weights cannot be negative'
    }
  }
  
  return { valid: true, sum }
}

/**
 * Validate temperature thresholds
 */
export function validateTemperatureThresholds(thresholds: TemperatureThresholds): { valid: boolean; error?: string } {
  if (thresholds.hot <= thresholds.warm) {
    return {
      valid: false,
      error: 'Hot threshold must be greater than Warm threshold'
    }
  }
  
  if (thresholds.warm < 0 || thresholds.hot > 100) {
    return {
      valid: false,
      error: 'Thresholds must be between 0 and 100'
    }
  }
  
  return { valid: true }
}
