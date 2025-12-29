-- Migration: Add ideal_candidate_profile to franchises table
-- Purpose: Store franchisor ideal candidate criteria for AI-powered lead qualification
-- Date: December 9, 2024
-- WellBiz Brands: Drybar, Elements Massage, Fitness Together, Radiant Waxing, Amazing Lash Studio

-- Add the JSONB column for ideal candidate profile
ALTER TABLE franchises 
ADD COLUMN IF NOT EXISTS ideal_candidate_profile JSONB;

-- Add comment for documentation
COMMENT ON COLUMN franchises.ideal_candidate_profile IS 'Stores franchisor ideal candidate criteria including financial requirements, experience preferences, and personality traits for AI-powered lead scoring';

-- =====================================================
-- DRYBAR IDEAL CANDIDATE PROFILE
-- Source: https://www.drybarfranchise.com/about-us/faqs/
-- =====================================================

UPDATE franchises
SET ideal_candidate_profile = '{
  "brand_name": "Drybar",
  "source_url": "https://www.drybarfranchise.com/about-us/faqs/",
  "last_updated": "2024-12-09",
  
  "financial_requirements": {
    "liquid_capital_min": 250000,
    "net_worth_min": 750000,
    "total_investment_min": 350000,
    "total_investment_max": 600000
  },
  
  "ideal_criteria": [
    {
      "name": "Business-Minded",
      "description": "Strong leadership skills with an entrepreneurial mindset and a drive for success that never quits",
      "weight": 20,
      "buyer_signals": ["management_experience", "business_ownership", "entrepreneurial", "leadership", "strategic_thinking"],
      "industry_signals": ["retail", "hospitality", "service", "multi-unit"],
      "engagement_signals": ["viewed_item19", "viewed_item7", "financial_questions"]
    },
    {
      "name": "Customer-Focused",
      "description": "Committed to delivering blow-away guest experiences and building unshakeable brand loyalty",
      "weight": 15,
      "buyer_signals": ["customer_service", "hospitality", "guest_experience", "retail", "service_excellence"],
      "industry_signals": ["hospitality", "retail", "spa", "salon", "restaurant", "hotel"]
    },
    {
      "name": "Growth-Oriented",
      "description": "Motivated to scale and expand within our proven, high-demand business model that keeps growing",
      "weight": 20,
      "buyer_signals": ["multi_unit_interest", "expansion_mindset", "scaling", "growth", "ambitious"],
      "engagement_signals": ["viewed_item12", "territory_questions", "multi_location_interest"]
    },
    {
      "name": "People Leaders",
      "description": "Ability to recruit, train, and inspire a team of expert stylists who create hair magic daily",
      "weight": 20,
      "buyer_signals": ["team_management", "hiring", "training", "hr", "staff_development", "coaching"],
      "engagement_signals": ["viewed_item11", "staffing_questions", "training_questions"]
    },
    {
      "name": "Brand Ambassadors",
      "description": "Passionate about the Drybar mission and maintaining our signature standards that set us apart",
      "weight": 15,
      "buyer_signals": ["brand_enthusiasm", "marketing", "quality_focus", "attention_to_detail"],
      "engagement_signals": ["high_time_spent", "return_visits", "thorough_fdd_review"]
    },
    {
      "name": "Community-Driven",
      "description": "Invested in making a positive impact and building long-term relationships that flourish beyond the salon chair",
      "weight": 10,
      "buyer_signals": ["community_involvement", "local_business", "networking", "relationship_building"],
      "engagement_signals": ["territory_specific_questions", "local_market_interest"]
    }
  ],
  
  "disqualifying_factors": [
    "insufficient_liquid_capital",
    "insufficient_net_worth",
    "bankruptcy_attestation_failed",
    "felony_attestation_failed"
  ],
  
  "preferred_backgrounds": [
    "Multi-unit franchise experience",
    "Retail management",
    "Hospitality industry",
    "Salon/spa industry",
    "Service business ownership"
  ],
  
  "ownership_model": "Semi-absentee or owner-operator models supported",
  
  "notes": "Drybar emphasizes passion for making people look and feel amazing. Beauty industry experience is a plus but not required - strong business acumen and people leadership are priorities."
}'::jsonb
WHERE LOWER(name) LIKE '%drybar%' OR LOWER(slug) LIKE '%drybar%';


-- =====================================================
-- ELEMENTS MASSAGE IDEAL CANDIDATE PROFILE
-- Source: WellBiz Brands franchising information
-- =====================================================

UPDATE franchises
SET ideal_candidate_profile = '{
  "brand_name": "Elements Massage",
  "source_url": "https://elementsmassage.com/franchise",
  "last_updated": "2024-12-09",
  
  "financial_requirements": {
    "liquid_capital_min": 150000,
    "net_worth_min": 350000,
    "total_investment_min": 250000,
    "total_investment_max": 450000
  },
  
  "ideal_criteria": [
    {
      "name": "Owner-Operator Mindset",
      "description": "Hands-on approach to business management with direct involvement in daily operations",
      "weight": 20,
      "buyer_signals": ["hands_on", "operational", "owner_operator", "active_management"],
      "engagement_signals": ["viewed_item11", "operations_questions", "staffing_questions"]
    },
    {
      "name": "Wellness Passionate",
      "description": "Passionate about wellness and helping others improve their lives through therapeutic massage and skincare",
      "weight": 20,
      "buyer_signals": ["wellness", "health", "massage", "therapeutic", "skincare", "self_care"],
      "industry_signals": ["wellness", "health", "fitness", "spa", "medical"]
    },
    {
      "name": "Strong Leadership",
      "description": "Demonstrated leadership skills with ability to build and manage high-performing teams",
      "weight": 20,
      "buyer_signals": ["management_experience", "leadership", "team_building", "coaching"],
      "engagement_signals": ["viewed_item11", "training_questions"]
    },
    {
      "name": "Customer-First Orientation",
      "description": "Commitment to exceptional client experiences and building lasting relationships",
      "weight": 15,
      "buyer_signals": ["customer_service", "client_relations", "hospitality", "service_excellence"],
      "industry_signals": ["hospitality", "retail", "service", "healthcare"]
    },
    {
      "name": "Community-Focused",
      "description": "Invested in local community engagement and building neighborhood presence",
      "weight": 15,
      "buyer_signals": ["community_involvement", "local_marketing", "networking", "grassroots"],
      "engagement_signals": ["territory_questions", "local_market_interest"]
    },
    {
      "name": "System-Follower",
      "description": "Committed to following proven systems and processes for long-term success",
      "weight": 10,
      "buyer_signals": ["process_oriented", "systems_focused", "coachable", "franchise_experience"],
      "engagement_signals": ["thorough_fdd_review", "operations_questions"]
    }
  ],
  
  "disqualifying_factors": [
    "insufficient_liquid_capital",
    "insufficient_net_worth",
    "bankruptcy_attestation_failed",
    "felony_attestation_failed"
  ],
  
  "preferred_backgrounds": [
    "Healthcare or wellness industry",
    "Service business management",
    "Retail management",
    "Hospitality industry",
    "Owner-operator experience"
  ],
  
  "ideal_age_range": "30-60 years old, established in career",
  "ownership_model": "Owner-operator preferred, semi-absentee considered for experienced multi-unit operators",
  
  "notes": "Elements Massage values candidates who are passionate about wellness and genuinely want to help people improve their lives. Resilience and commitment to proven systems are key success factors."
}'::jsonb
WHERE LOWER(name) LIKE '%elements%massage%' OR LOWER(slug) LIKE '%elements%';


-- =====================================================
-- FITNESS TOGETHER IDEAL CANDIDATE PROFILE
-- Source: WellBiz Brands franchising information
-- =====================================================

UPDATE franchises
SET ideal_candidate_profile = '{
  "brand_name": "Fitness Together",
  "source_url": "https://fitnesstogether.com/franchise",
  "last_updated": "2024-12-09",
  
  "financial_requirements": {
    "liquid_capital_min": 150000,
    "net_worth_min": 350000,
    "total_investment_min": 200000,
    "total_investment_max": 400000
  },
  
  "ideal_criteria": [
    {
      "name": "Fitness Passionate",
      "description": "Passionate about fitness and helping others achieve their health and wellness goals",
      "weight": 25,
      "buyer_signals": ["fitness", "health", "wellness", "personal_training", "athletics", "sports"],
      "industry_signals": ["fitness", "health", "wellness", "sports", "athletics"]
    },
    {
      "name": "People-Oriented",
      "description": "Strong interpersonal skills with genuine interest in building relationships and helping clients succeed",
      "weight": 20,
      "buyer_signals": ["interpersonal_skills", "relationship_building", "coaching", "mentoring", "people_person"],
      "engagement_signals": ["viewed_item11", "client_experience_questions"]
    },
    {
      "name": "Community Builder",
      "description": "Ready to build meaningful local connections through grassroots engagement and quality service",
      "weight": 20,
      "buyer_signals": ["community_involvement", "local_marketing", "networking", "grassroots", "local_business"],
      "engagement_signals": ["territory_questions", "local_market_interest", "marketing_questions"]
    },
    {
      "name": "Competitively Driven",
      "description": "Achievement-oriented with drive to build a successful, growing business",
      "weight": 15,
      "buyer_signals": ["competitive", "achievement_oriented", "goal_driven", "ambitious", "results_focused"],
      "engagement_signals": ["viewed_item19", "performance_questions", "growth_questions"]
    },
    {
      "name": "System-Focused",
      "description": "Committed to following proven franchise systems while working on the business",
      "weight": 10,
      "buyer_signals": ["process_oriented", "systems_focused", "franchise_experience", "coachable"],
      "engagement_signals": ["thorough_fdd_review", "operations_questions"]
    },
    {
      "name": "Personalized Service Champion",
      "description": "Committed to delivering personalized attention and customized fitness solutions",
      "weight": 10,
      "buyer_signals": ["attention_to_detail", "customization", "personalization", "quality_focus"],
      "industry_signals": ["personal_training", "coaching", "consulting", "healthcare"]
    }
  ],
  
  "disqualifying_factors": [
    "insufficient_liquid_capital",
    "insufficient_net_worth",
    "bankruptcy_attestation_failed",
    "felony_attestation_failed"
  ],
  
  "preferred_backgrounds": [
    "Fitness or personal training industry",
    "Health and wellness sector",
    "Sales and relationship-based businesses",
    "Coaching or mentoring roles",
    "Local service business ownership"
  ],
  
  "ownership_model": "Owner-operator model with hands-on community engagement",
  
  "notes": "Fitness Together values franchisees who genuinely care about helping clients achieve their health goals. Community impact through grassroots engagement is a key success factor. Being business-minded AND people-oriented is essential."
}'::jsonb
WHERE LOWER(name) LIKE '%fitness%together%' OR LOWER(slug) LIKE '%fitness%together%';


-- =====================================================
-- RADIANT WAXING IDEAL CANDIDATE PROFILE
-- Source: WellBiz Brands franchising information
-- =====================================================

UPDATE franchises
SET ideal_candidate_profile = '{
  "brand_name": "Radiant Waxing",
  "source_url": "https://radiantwaxing.com/franchise",
  "last_updated": "2024-12-09",
  
  "financial_requirements": {
    "liquid_capital_min": 100000,
    "net_worth_min": 600000,
    "total_investment_min": 200000,
    "total_investment_max": 400000
  },
  
  "ideal_criteria": [
    {
      "name": "Business Savvy",
      "description": "Smart, driven business operators who understand fundamentals of running a successful retail service business",
      "weight": 25,
      "buyer_signals": ["business_acumen", "strategic_thinking", "financial_analysis", "operations", "management_experience"],
      "engagement_signals": ["viewed_item19", "viewed_item7", "financial_questions"]
    },
    {
      "name": "People-Focused",
      "description": "Strong commitment to team culture, employee development, and creating a positive work environment",
      "weight": 20,
      "buyer_signals": ["team_management", "people_person", "coaching", "hr", "culture_building"],
      "engagement_signals": ["viewed_item11", "staffing_questions", "training_questions"]
    },
    {
      "name": "Customer Experience Champion",
      "description": "Passionate about delivering exceptional guest experiences that build loyalty and referrals",
      "weight": 20,
      "buyer_signals": ["customer_service", "hospitality", "guest_experience", "service_excellence", "retail"],
      "industry_signals": ["hospitality", "retail", "spa", "salon", "service"]
    },
    {
      "name": "Local Marketing Driver",
      "description": "Energized by local marketing and building brand presence in the community",
      "weight": 15,
      "buyer_signals": ["marketing", "local_marketing", "community_involvement", "networking", "brand_building"],
      "engagement_signals": ["territory_questions", "marketing_questions", "local_market_interest"]
    },
    {
      "name": "Beauty/Self-Care Enthusiast",
      "description": "Energized by beauty and passionate about helping people feel confident",
      "weight": 10,
      "buyer_signals": ["beauty", "self_care", "wellness", "confidence", "aesthetics"],
      "industry_signals": ["beauty", "spa", "salon", "aesthetics", "wellness"]
    },
    {
      "name": "Hands-On Leader",
      "description": "Ready to be actively involved in building and growing the business",
      "weight": 10,
      "buyer_signals": ["hands_on", "active_management", "owner_operator", "entrepreneurial"],
      "engagement_signals": ["thorough_fdd_review", "operations_questions"]
    }
  ],
  
  "disqualifying_factors": [
    "insufficient_liquid_capital",
    "insufficient_net_worth",
    "bankruptcy_attestation_failed",
    "felony_attestation_failed"
  ],
  
  "preferred_backgrounds": [
    "Retail management",
    "Service business ownership",
    "Hospitality industry",
    "Sales and marketing",
    "Multi-unit management"
  ],
  
  "ownership_model": "Hands-on owner preferred, especially for first location",
  
  "notes": "No waxing or salon industry experience required! Top-performing Radiant Waxing franchisees are savvy business operators who focus on team culture and customer experience. Beauty passion is a plus but business acumen is the priority."
}'::jsonb
WHERE LOWER(name) LIKE '%radiant%wax%' OR LOWER(slug) LIKE '%radiant%';


-- =====================================================
-- AMAZING LASH STUDIO IDEAL CANDIDATE PROFILE
-- Source: WellBiz Brands franchising information
-- =====================================================

UPDATE franchises
SET ideal_candidate_profile = '{
  "brand_name": "Amazing Lash Studio",
  "source_url": "https://amazinglashstudio.com/franchise",
  "last_updated": "2024-12-09",
  
  "financial_requirements": {
    "liquid_capital_min": 250000,
    "net_worth_min": 500000,
    "total_investment_min": 300000,
    "total_investment_max": 500000
  },
  
  "ideal_criteria": [
    {
      "name": "Strategic Operator",
      "description": "Focus on high-level oversight including marketing strategy and KPI management rather than day-to-day operations",
      "weight": 25,
      "buyer_signals": ["strategic_thinking", "kpi_management", "business_analysis", "executive_experience", "oversight"],
      "engagement_signals": ["viewed_item19", "performance_questions", "growth_questions"]
    },
    {
      "name": "Solid Management Skills",
      "description": "Proven ability to lead teams and manage through a studio manager",
      "weight": 20,
      "buyer_signals": ["management_experience", "leadership", "delegation", "team_building", "executive"],
      "engagement_signals": ["viewed_item11", "management_questions", "staffing_questions"]
    },
    {
      "name": "Customer Service Champion",
      "description": "Committed to providing great customer service and ensuring client satisfaction",
      "weight": 20,
      "buyer_signals": ["customer_service", "hospitality", "service_excellence", "client_relations"],
      "industry_signals": ["hospitality", "retail", "service", "spa", "salon"]
    },
    {
      "name": "Culture Builder",
      "description": "Ability to create a culture of positivity and performance-based motivation in the studio",
      "weight": 15,
      "buyer_signals": ["culture_building", "team_motivation", "positive_leadership", "performance_management"],
      "engagement_signals": ["training_questions", "culture_questions"]
    },
    {
      "name": "Beauty Passionate",
      "description": "Passion for helping others look and feel amazing through beauty services",
      "weight": 10,
      "buyer_signals": ["beauty", "aesthetics", "self_care", "wellness", "confidence"],
      "industry_signals": ["beauty", "spa", "salon", "aesthetics", "wellness"]
    },
    {
      "name": "Entrepreneurial Drive",
      "description": "Qualified, motivated entrepreneur ready to grow a business within a proven system",
      "weight": 10,
      "buyer_signals": ["entrepreneurial", "business_ownership", "growth_oriented", "ambitious"],
      "engagement_signals": ["viewed_item12", "expansion_questions", "multi_unit_interest"]
    }
  ],
  
  "disqualifying_factors": [
    "insufficient_liquid_capital",
    "insufficient_net_worth",
    "bankruptcy_attestation_failed",
    "felony_attestation_failed"
  ],
  
  "preferred_backgrounds": [
    "Executive or senior management",
    "Multi-unit franchise ownership",
    "Business ownership experience",
    "Retail or service management",
    "Marketing or sales leadership"
  ],
  
  "ownership_model": "Semi-absentee model supported - owner focuses on strategy while studio manager handles daily operations",
  
  "notes": "Amazing Lash Studio is well-suited for experienced business operators who want to focus on strategic oversight rather than daily operations. Strong management skills and ability to build a positive team culture are essential. The model supports semi-absentee ownership."
}'::jsonb
WHERE LOWER(name) LIKE '%amazing%lash%' OR LOWER(slug) LIKE '%amazing%lash%';


-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify all 5 WellBiz brands have profiles
SELECT 
    name,
    ideal_candidate_profile->>'brand_name' as profile_brand,
    ideal_candidate_profile->'financial_requirements'->>'liquid_capital_min' as liquid_min,
    ideal_candidate_profile->'financial_requirements'->>'net_worth_min' as net_worth_min,
    jsonb_array_length(ideal_candidate_profile->'ideal_criteria') as criteria_count
FROM franchises 
WHERE ideal_candidate_profile IS NOT NULL
ORDER BY name;

-- Summary of financial requirements
SELECT 
    ideal_candidate_profile->>'brand_name' as brand,
    (ideal_candidate_profile->'financial_requirements'->>'liquid_capital_min')::int / 1000 || 'K' as liquid_capital,
    (ideal_candidate_profile->'financial_requirements'->>'net_worth_min')::int / 1000 || 'K' as net_worth
FROM franchises 
WHERE ideal_candidate_profile IS NOT NULL
ORDER BY (ideal_candidate_profile->'financial_requirements'->>'liquid_capital_min')::int DESC;
