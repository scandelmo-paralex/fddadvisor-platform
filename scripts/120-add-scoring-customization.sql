-- Migration: Add Lead Scoring Customization to White Label Settings
-- Date: January 9, 2026
-- Feature: Franchisor-customizable lead scoring weights and ideal candidate profiles
-- Branch: feature/fdd-viewer-resources-tab

-- =============================================================================
-- STEP 1: Add scoring weights column
-- Allows franchisors to customize how lead quality scores are calculated
-- Weights must sum to 100
-- =============================================================================

ALTER TABLE white_label_settings 
ADD COLUMN IF NOT EXISTS scoring_weights JSONB DEFAULT '{
  "base": 20,
  "engagement": 35,
  "financial": 25,
  "experience": 20
}'::jsonb;

COMMENT ON COLUMN white_label_settings.scoring_weights IS 
'Custom weights for lead quality scoring. Keys: base, engagement, financial, experience. Must sum to 100.';

-- =============================================================================
-- STEP 2: Add temperature thresholds column
-- Allows franchisors to define what score qualifies as Hot, Warm, or Cold
-- =============================================================================

ALTER TABLE white_label_settings 
ADD COLUMN IF NOT EXISTS temperature_thresholds JSONB DEFAULT '{
  "hot": 80,
  "warm": 60
}'::jsonb;

COMMENT ON COLUMN white_label_settings.temperature_thresholds IS 
'Custom thresholds for Hot/Warm/Cold classification. Keys: hot (>= this is Hot), warm (>= this and < hot is Warm), below warm is Cold.';

-- =============================================================================
-- STEP 3: Add ideal candidate configuration column
-- Allows franchisors to define their ideal franchisee profile
-- Used for financial qualification and candidate matching
-- =============================================================================

ALTER TABLE white_label_settings 
ADD COLUMN IF NOT EXISTS ideal_candidate_config JSONB DEFAULT '{
  "financial_requirements": {
    "liquid_capital_min": null,
    "net_worth_min": null
  },
  "experience_requirements": {
    "management_experience_required": false,
    "business_ownership_preferred": false,
    "franchise_experience_required": false,
    "min_years_experience": null
  },
  "preferred_industries": [],
  "ownership_model": "either",
  "disqualifiers": {
    "require_felony_attestation": true,
    "require_bankruptcy_attestation": true
  }
}'::jsonb;

COMMENT ON COLUMN white_label_settings.ideal_candidate_config IS 
'Franchisor-defined criteria for ideal franchisee candidates. Used for lead scoring and qualification assessment.';

-- =============================================================================
-- STEP 4: Add resources video columns if they don't exist
-- (These may have been added manually in Supabase)
-- =============================================================================

ALTER TABLE white_label_settings 
ADD COLUMN IF NOT EXISTS resources_video_url TEXT;

ALTER TABLE white_label_settings 
ADD COLUMN IF NOT EXISTS resources_video_title TEXT;

ALTER TABLE white_label_settings 
ADD COLUMN IF NOT EXISTS resources_video_description TEXT;

-- =============================================================================
-- STEP 5: Add franchisor_id if missing (needed for RLS)
-- =============================================================================

ALTER TABLE white_label_settings 
ADD COLUMN IF NOT EXISTS franchisor_id UUID REFERENCES franchisor_profiles(id);

-- =============================================================================
-- VERIFICATION: Check the table structure
-- =============================================================================

-- Run this to verify columns were added:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'white_label_settings'
-- ORDER BY ordinal_position;

-- =============================================================================
-- EXAMPLE: Manually set scoring config for a franchise (for testing)
-- =============================================================================

-- UPDATE white_label_settings 
-- SET 
--   scoring_weights = '{
--     "base": 15,
--     "engagement": 40,
--     "financial": 30,
--     "experience": 15
--   }'::jsonb,
--   temperature_thresholds = '{
--     "hot": 85,
--     "warm": 65
--   }'::jsonb,
--   ideal_candidate_config = '{
--     "financial_requirements": {
--       "liquid_capital_min": 250000,
--       "net_worth_min": 750000
--     },
--     "experience_requirements": {
--       "management_experience_required": true,
--       "business_ownership_preferred": true,
--       "franchise_experience_required": false,
--       "min_years_experience": "5+"
--     },
--     "preferred_industries": ["Retail", "Hospitality", "Salon/Spa"],
--     "ownership_model": "semi_absentee",
--     "disqualifiers": {
--       "require_felony_attestation": true,
--       "require_bankruptcy_attestation": true
--     }
--   }'::jsonb
-- WHERE franchise_id = 'YOUR_FRANCHISE_UUID';
