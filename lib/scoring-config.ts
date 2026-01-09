/**
 * Utility to load custom scoring configuration for a franchise
 * 
 * This loads the custom scoring weights, temperature thresholds, and ideal candidate
 * config from the white_label_settings table for a specific franchise.
 */

import { createServerClient } from "@/lib/supabase/server"
import {
  DEFAULT_SCORING_WEIGHTS,
  DEFAULT_TEMPERATURE_THRESHOLDS,
  DEFAULT_IDEAL_CANDIDATE_CONFIG,
  type ScoringWeights,
  type TemperatureThresholds,
  type IdealCandidateConfig
} from "./lead-scoring"

export interface FranchiseScoringConfig {
  scoringWeights: ScoringWeights
  temperatureThresholds: TemperatureThresholds
  idealCandidateConfig: IdealCandidateConfig
}

/**
 * Load custom scoring configuration for a franchise from white_label_settings
 * 
 * @param franchiseId - The franchise UUID
 * @returns FranchiseScoringConfig with custom or default values
 */
export async function loadFranchiseScoringConfig(
  franchiseId: string
): Promise<FranchiseScoringConfig> {
  try {
    const supabase = await createServerClient()
    
    const { data: settings, error } = await supabase
      .from("white_label_settings")
      .select("scoring_weights, temperature_thresholds, ideal_candidate_config")
      .eq("franchise_id", franchiseId)
      .single()
    
    if (error || !settings) {
      // No custom settings, return defaults
      return {
        scoringWeights: DEFAULT_SCORING_WEIGHTS,
        temperatureThresholds: DEFAULT_TEMPERATURE_THRESHOLDS,
        idealCandidateConfig: DEFAULT_IDEAL_CANDIDATE_CONFIG
      }
    }
    
    // Merge with defaults to ensure all fields exist
    return {
      scoringWeights: {
        ...DEFAULT_SCORING_WEIGHTS,
        ...(settings.scoring_weights || {})
      },
      temperatureThresholds: {
        ...DEFAULT_TEMPERATURE_THRESHOLDS,
        ...(settings.temperature_thresholds || {})
      },
      idealCandidateConfig: {
        ...DEFAULT_IDEAL_CANDIDATE_CONFIG,
        ...(settings.ideal_candidate_config || {}),
        financial_requirements: {
          ...DEFAULT_IDEAL_CANDIDATE_CONFIG.financial_requirements,
          ...((settings.ideal_candidate_config as any)?.financial_requirements || {})
        },
        experience_requirements: {
          ...DEFAULT_IDEAL_CANDIDATE_CONFIG.experience_requirements,
          ...((settings.ideal_candidate_config as any)?.experience_requirements || {})
        },
        disqualifiers: {
          ...DEFAULT_IDEAL_CANDIDATE_CONFIG.disqualifiers,
          ...((settings.ideal_candidate_config as any)?.disqualifiers || {})
        }
      }
    }
  } catch (error) {
    console.error("[loadFranchiseScoringConfig] Error loading config:", error)
    // Return defaults on error
    return {
      scoringWeights: DEFAULT_SCORING_WEIGHTS,
      temperatureThresholds: DEFAULT_TEMPERATURE_THRESHOLDS,
      idealCandidateConfig: DEFAULT_IDEAL_CANDIDATE_CONFIG
    }
  }
}

/**
 * Load scoring configs for multiple franchises at once (batch operation)
 * 
 * @param franchiseIds - Array of franchise UUIDs
 * @returns Map of franchise_id -> FranchiseScoringConfig
 */
export async function loadFranchiseScoringConfigsBatch(
  franchiseIds: string[]
): Promise<Map<string, FranchiseScoringConfig>> {
  const configMap = new Map<string, FranchiseScoringConfig>()
  
  // Initialize all with defaults
  for (const id of franchiseIds) {
    configMap.set(id, {
      scoringWeights: DEFAULT_SCORING_WEIGHTS,
      temperatureThresholds: DEFAULT_TEMPERATURE_THRESHOLDS,
      idealCandidateConfig: DEFAULT_IDEAL_CANDIDATE_CONFIG
    })
  }
  
  if (franchiseIds.length === 0) {
    return configMap
  }
  
  try {
    const supabase = await createServerClient()
    
    const { data: settingsList, error } = await supabase
      .from("white_label_settings")
      .select("franchise_id, scoring_weights, temperature_thresholds, ideal_candidate_config")
      .in("franchise_id", franchiseIds)
    
    if (error || !settingsList) {
      console.error("[loadFranchiseScoringConfigsBatch] Error:", error)
      return configMap
    }
    
    // Override defaults with custom settings where they exist
    for (const settings of settingsList) {
      if (!settings.franchise_id) continue
      
      configMap.set(settings.franchise_id, {
        scoringWeights: {
          ...DEFAULT_SCORING_WEIGHTS,
          ...(settings.scoring_weights || {})
        },
        temperatureThresholds: {
          ...DEFAULT_TEMPERATURE_THRESHOLDS,
          ...(settings.temperature_thresholds || {})
        },
        idealCandidateConfig: {
          ...DEFAULT_IDEAL_CANDIDATE_CONFIG,
          ...(settings.ideal_candidate_config || {}),
          financial_requirements: {
            ...DEFAULT_IDEAL_CANDIDATE_CONFIG.financial_requirements,
            ...((settings.ideal_candidate_config as any)?.financial_requirements || {})
          },
          experience_requirements: {
            ...DEFAULT_IDEAL_CANDIDATE_CONFIG.experience_requirements,
            ...((settings.ideal_candidate_config as any)?.experience_requirements || {})
          },
          disqualifiers: {
            ...DEFAULT_IDEAL_CANDIDATE_CONFIG.disqualifiers,
            ...((settings.ideal_candidate_config as any)?.disqualifiers || {})
          }
        }
      })
    }
    
    return configMap
  } catch (error) {
    console.error("[loadFranchiseScoringConfigsBatch] Error:", error)
    return configMap
  }
}
