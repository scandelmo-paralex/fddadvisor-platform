-- ============================================================================
-- Migration 109: Insert Bob Smith Test Data for AI Sales Intelligence Testing
-- ============================================================================
-- Purpose: Create realistic test data to verify the complete Lead Intelligence
--          workflow including financial qualification, candidate fit scoring,
--          and AI-generated sales recommendations.
--
-- Run this in Supabase SQL Editor (run each section separately if needed)
-- ============================================================================

-- SECTION 1: Clean up any existing Bob Smith data
-- ================================================
DELETE FROM fdd_engagements WHERE lead_id IN (
    SELECT id FROM leads WHERE email = 'bob.smith@example.com'
);
DELETE FROM leads WHERE email = 'bob.smith@example.com';
DELETE FROM buyer_profiles WHERE email = 'bob.smith@example.com';


-- SECTION 2: Create Bob Smith's buyer profile
-- ===========================================
-- Financial data is set to QUALIFY for Drybar:
-- - Drybar requires: $250K liquid capital, $750K net worth
-- - Bob has: $300K-$500K liquid, $750K-$1M net worth
-- This should trigger "✅ FINANCIALLY QUALIFIED" status

INSERT INTO buyer_profiles (
    id,
    email,
    full_name,
    phone,
    location,
    -- Financial qualification fields
    fico_score_range,
    liquid_assets_range,
    net_worth_range,
    funding_plan,
    -- Experience fields (from migration 108)
    skills,
    industries,
    business_experience_years,
    management_experience,
    has_franchise_experience,
    -- Background attestations
    no_felony_attestation,
    no_bankruptcy_attestation,
    -- Profile metadata
    linkedin_url,
    profile_completed_at,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'bob.smith@example.com',
    'Bob Smith',
    '(555) 123-4567',
    'Denver, CO',
    -- Financial - QUALIFIED for Drybar ($250K liquid, $750K net worth required)
    '720-779',                          -- Good credit score
    '$300,000 - $500,000',              -- Exceeds $250K liquid requirement ✅
    '$750,000 - $1,000,000',            -- Meets $750K net worth requirement ✅
    'SBA Loan',                         -- Common funding approach
    -- Skills that match Drybar ideal criteria (Business-Minded, Customer-Focused, etc.)
    ARRAY['Sales Management', 'Team Leadership', 'Customer Service', 'Operations', 'Marketing'],
    ARRAY['Retail', 'Hospitality', 'Beauty Services'],
    '10+ years',
    true,                               -- Has management experience ✅
    false,                              -- No prior franchise experience (gap to identify)
    -- Background
    true,                               -- No felony ✅
    true,                               -- No bankruptcy ✅
    -- LinkedIn
    'https://linkedin.com/in/bobsmith-demo',
    NOW() - INTERVAL '2 days',          -- Completed profile 2 days ago
    NOW() - INTERVAL '7 days',
    NOW()
);


-- SECTION 3: Create the lead record linking Bob to Drybar
-- =======================================================
INSERT INTO leads (
    id,
    franchise_id,
    franchisor_id,
    buyer_id,
    name,
    email,
    phone,
    source,
    status,
    timeline,
    notes,
    quality_score,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    f.id,                                                    -- Drybar franchise_id
    (SELECT user_id FROM franchisor_profiles LIMIT 1),       -- First available franchisor
    bp.id,                                                   -- Link to buyer profile
    'Bob Smith',
    'bob.smith@example.com',
    '(555) 123-4567',
    'Website',                                               -- Lead source
    'active',
    '3-6 months',                                            -- Timeline
    'High-quality prospect from Denver market. Strong interest in Drybar concept. Background in retail management.',
    85,                                                      -- Quality score
    NOW() - INTERVAL '5 days',
    NOW()
FROM franchises f
CROSS JOIN buyer_profiles bp
WHERE f.name = 'Drybar'
  AND bp.email = 'bob.smith@example.com';


-- SECTION 4: Create engagement data (47 minutes = "high" engagement tier)
-- =======================================================================
INSERT INTO fdd_engagements (
    id,
    lead_id,
    fdd_id,
    franchise_id,
    -- Engagement metrics
    time_spent,
    questions_asked,
    sections_viewed,
    items_viewed,
    -- Session tracking
    session_count,
    last_session_at,
    first_accessed_at,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    l.id,
    fd.id,
    f.id,
    -- 47 minutes of engagement = "high" tier (45+ minutes)
    2820,                                                    -- 47 minutes in seconds
    8,                                                       -- Asked 8 questions to AI chat
    ARRAY['Item 7', 'Item 19', 'Item 5', 'Item 6', 'Item 12', 'Item 20', 'Item 11'],
    ARRAY[7, 19, 5, 6, 12, 20, 11],                          -- Items viewed (financial focus)
    -- Sessions
    4,                                                       -- 4 separate sessions
    NOW() - INTERVAL '6 hours',                              -- Last session 6 hours ago
    NOW() - INTERVAL '3 days',                               -- First accessed 3 days ago
    NOW() - INTERVAL '3 days',
    NOW()
FROM leads l
JOIN franchises f ON l.franchise_id = f.id
JOIN fdds fd ON fd.franchise_id = f.id
WHERE l.email = 'bob.smith@example.com'
  AND f.name = 'Drybar';


-- SECTION 5: Verify the data was inserted correctly
-- =================================================
SELECT 
    '✅ Bob Smith Test Data Created' as status,
    l.id as lead_id,
    l.name,
    l.email,
    l.quality_score,
    l.source,
    l.timeline,
    f.name as franchise_name,
    bp.liquid_assets_range,
    bp.net_worth_range,
    bp.funding_plan,
    bp.skills,
    bp.industries,
    bp.management_experience,
    bp.has_franchise_experience,
    e.time_spent as engagement_seconds,
    ROUND(e.time_spent / 60.0, 1) as engagement_minutes,
    e.questions_asked,
    e.sections_viewed,
    e.session_count,
    CASE 
        WHEN f.ideal_candidate_profile IS NOT NULL THEN '✅ Has ideal_candidate_profile'
        ELSE '❌ Missing ideal_candidate_profile'
    END as profile_status
FROM leads l
JOIN franchises f ON l.franchise_id = f.id
LEFT JOIN buyer_profiles bp ON l.buyer_id = bp.id
LEFT JOIN fdd_engagements e ON e.lead_id = l.id
WHERE l.email = 'bob.smith@example.com';


-- SECTION 6: Show what the AI will see when analyzing Bob
-- =======================================================
SELECT 
    '📊 Data for AI Analysis' as section,
    jsonb_pretty(jsonb_build_object(
        'buyer', jsonb_build_object(
            'name', bp.full_name,
            'liquid_assets', bp.liquid_assets_range,
            'net_worth', bp.net_worth_range,
            'funding_plan', bp.funding_plan,
            'skills', bp.skills,
            'industries', bp.industries,
            'management_experience', bp.management_experience,
            'has_franchise_experience', bp.has_franchise_experience
        ),
        'franchise_requirements', jsonb_build_object(
            'brand', f.name,
            'liquid_capital_min', f.ideal_candidate_profile->'financial_requirements'->>'liquid_capital_min',
            'net_worth_min', f.ideal_candidate_profile->'financial_requirements'->>'net_worth_min'
        ),
        'engagement', jsonb_build_object(
            'time_spent_minutes', ROUND(e.time_spent / 60.0, 1),
            'questions_asked', e.questions_asked,
            'sections_viewed', e.sections_viewed,
            'session_count', e.session_count
        )
    )) as ai_input_data
FROM leads l
JOIN franchises f ON l.franchise_id = f.id
LEFT JOIN buyer_profiles bp ON l.buyer_id = bp.id
LEFT JOIN fdd_engagements e ON e.lead_id = l.id
WHERE l.email = 'bob.smith@example.com';
