-- ============================================================================
-- UPDATE ACE HANDYMAN SERVICES IDEAL CANDIDATE PROFILE
-- ============================================================================
-- Date: January 9, 2026
-- Purpose: Add financial requirements and ideal candidate criteria to enable
--          proper lead qualification scoring
-- 
-- IMPORTANT: This is a template that should be customized for EACH franchisor
-- during onboarding. Every franchisor should have their ideal_candidate_profile
-- configured to enable accurate lead scoring.
-- ============================================================================

-- First, let's see what we have currently
SELECT 
  id,
  name,
  ideal_candidate_profile,
  total_investment_min,
  total_investment_max
FROM franchises 
WHERE name ILIKE '%ace%handyman%';

-- Update Ace Handyman Services with ideal candidate profile
-- Adjust these values based on actual franchise requirements
UPDATE franchises 
SET ideal_candidate_profile = '{
  "financial_requirements": {
    "liquid_capital_min": 100000,
    "net_worth_min": 300000,
    "total_investment_min": 150000,
    "total_investment_max": 350000
  },
  "ideal_criteria": [
    {
      "name": "Business Acumen",
      "weight": 25,
      "description": "Strong business management and operational skills",
      "buyer_signals": ["management_experience", "has_owned_business"],
      "industry_signals": ["retail", "service", "construction", "home services"],
      "engagement_signals": ["viewed_item_7", "viewed_item_19"]
    },
    {
      "name": "Customer Service Orientation",
      "weight": 20,
      "description": "Dedication to customer satisfaction and service excellence",
      "buyer_signals": ["service_industry_experience"],
      "industry_signals": ["hospitality", "retail", "healthcare"],
      "engagement_signals": ["viewed_item_11"]
    },
    {
      "name": "Local Market Knowledge",
      "weight": 20,
      "description": "Understanding of local market and community connections",
      "buyer_signals": ["local_business_experience", "community_involvement"],
      "industry_signals": [],
      "engagement_signals": ["viewed_item_12"]
    },
    {
      "name": "Leadership & Team Management",
      "weight": 20,
      "description": "Ability to hire, train, and manage technicians",
      "buyer_signals": ["management_experience", "team_leadership"],
      "industry_signals": ["construction", "trades", "service"],
      "engagement_signals": ["viewed_item_11", "viewed_item_15"]
    },
    {
      "name": "Growth Mindset",
      "weight": 15,
      "description": "Commitment to following the system and growing the business",
      "buyer_signals": ["has_owned_business", "years_of_experience"],
      "industry_signals": [],
      "engagement_signals": ["viewed_item_19", "viewed_item_20"]
    }
  ],
  "preferred_backgrounds": [
    "Home services",
    "Construction",
    "Property management",
    "Retail management",
    "Military veterans",
    "Corporate executives seeking business ownership"
  ],
  "ownership_model": "Owner-operator or semi-absentee",
  "notes": "Ideal candidates have management experience and are looking to build a scalable home services business. Prior handyman or construction experience is NOT required - the system provides full training."
}'::jsonb,
updated_at = NOW()
WHERE name ILIKE '%ace%handyman%';

-- Verify the update
SELECT 
  id,
  name,
  ideal_candidate_profile->>'financial_requirements' as financial_requirements,
  ideal_candidate_profile->>'ownership_model' as ownership_model,
  jsonb_array_length(ideal_candidate_profile->'ideal_criteria') as num_criteria
FROM franchises 
WHERE name ILIKE '%ace%handyman%';

-- ============================================================================
-- ONBOARDING TEMPLATE: Copy and customize for each new franchisor
-- ============================================================================
/*
UPDATE franchises 
SET ideal_candidate_profile = '{
  "financial_requirements": {
    "liquid_capital_min": [AMOUNT],      -- e.g., 100000 for $100K
    "net_worth_min": [AMOUNT],           -- e.g., 300000 for $300K
    "total_investment_min": [AMOUNT],    -- From Item 7
    "total_investment_max": [AMOUNT]     -- From Item 7
  },
  "ideal_criteria": [
    {
      "name": "[CRITERION NAME]",
      "weight": [1-100],
      "description": "[What this means]",
      "buyer_signals": ["management_experience", "has_owned_business", etc.],
      "industry_signals": ["industry1", "industry2"],
      "engagement_signals": ["viewed_item_X"]
    }
    -- Add 4-6 criteria that sum to 100% weight
  ],
  "preferred_backgrounds": [
    "[Background 1]",
    "[Background 2]"
  ],
  "ownership_model": "[Owner-operator | Semi-absentee | Absentee]",
  "notes": "[Any special notes about ideal candidates]"
}'::jsonb,
updated_at = NOW()
WHERE id = '[FRANCHISE_UUID]';
*/
