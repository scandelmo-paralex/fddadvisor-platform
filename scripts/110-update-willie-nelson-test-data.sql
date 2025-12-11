-- ============================================================================
-- Migration 110: Update Willie Nelson for AI Sales Intelligence Testing
-- ============================================================================
-- Purpose: Willie Nelson ALREADY EXISTS with completed profile and is QUALIFIED.
--          This script only adds the NEW fields from migration 108 (skills, 
--          industries, experience) WITHOUT overwriting his existing financial data.
--
-- Willie tests: ✅ QUALIFIED + ⏳ NO ENGAGEMENT scenario
-- Bob tests:    ✅ QUALIFIED + 🔥 HIGH ENGAGEMENT scenario
--
-- Run this in Supabase SQL Editor
-- ============================================================================

-- SECTION 1: Check Willie Nelson's current data (preserve this!)
-- ==============================================================
SELECT 
    '🔍 Current Willie Nelson Data (will preserve financial data)' as section,
    bp.id as buyer_profile_id,
    bp.full_name,
    bp.email,
    bp.location,
    bp.liquid_assets_range as "liquid_assets (KEEP)",
    bp.net_worth_range as "net_worth (KEEP)",
    bp.funding_plan as "funding_plan (KEEP)",
    bp.fico_score_range,
    bp.skills as "skills (WILL UPDATE)",
    bp.industries as "industries (WILL UPDATE)",
    bp.business_experience_years as "experience_years (WILL UPDATE)",
    bp.management_experience,
    bp.has_franchise_experience,
    l.id as lead_id,
    f.name as franchise_name,
    (SELECT COUNT(*) FROM fdd_engagements e WHERE e.lead_id = l.id) as current_engagement_count
FROM buyer_profiles bp
LEFT JOIN leads l ON l.buyer_id = bp.id
LEFT JOIN franchises f ON l.franchise_id = f.id
WHERE bp.email ILIKE '%willie%' OR bp.full_name ILIKE '%willie%';


-- SECTION 2: Add ONLY the new experience fields (preserve financial data!)
-- ========================================================================
-- Willie Nelson's background: Music legend, entrepreneur, brand builder
UPDATE buyer_profiles
SET 
    -- ONLY update the NEW fields from migration 108
    skills = ARRAY['Brand Building', 'Entertainment Management', 'Public Relations', 'Business Development', 'Leadership', 'Investor Relations'],
    industries = ARRAY['Entertainment', 'Music', 'Hospitality', 'Cannabis', 'Biofuels'],
    business_experience_years = '50+ years',                    -- Legend status!
    management_experience = true,
    has_franchise_experience = true,                            -- He's been involved in many business ventures
    
    -- Ensure attestations are set
    no_felony_attestation = COALESCE(no_felony_attestation, true),
    no_bankruptcy_attestation = COALESCE(no_bankruptcy_attestation, true),
    
    -- Add LinkedIn if missing
    linkedin_url = COALESCE(linkedin_url, 'https://linkedin.com/in/willienelson'),
    
    -- Update timestamp
    updated_at = NOW()
WHERE email ILIKE '%willie%' OR full_name ILIKE '%willie%';


-- SECTION 3: Ensure Willie has NO engagement data (tests awaiting scenario)
-- =========================================================================
DELETE FROM fdd_engagements 
WHERE lead_id IN (
    SELECT l.id 
    FROM leads l
    JOIN buyer_profiles bp ON l.buyer_id = bp.id
    WHERE bp.email ILIKE '%willie%' OR bp.full_name ILIKE '%willie%'
);


-- SECTION 4: Verify the updated data
-- ===================================
SELECT 
    '✅ Willie Nelson Ready for Testing' as status,
    bp.full_name,
    bp.email,
    bp.location,
    bp.liquid_assets_range,
    bp.net_worth_range,
    bp.funding_plan,
    bp.skills,
    bp.industries,
    bp.business_experience_years,
    bp.management_experience,
    bp.has_franchise_experience,
    l.id as lead_id,
    f.name as franchise_name,
    (f.ideal_candidate_profile->'financial_requirements'->>'liquid_capital_min')::int / 1000 || 'K' as required_liquid,
    (f.ideal_candidate_profile->'financial_requirements'->>'net_worth_min')::int / 1000 || 'K' as required_net_worth,
    (SELECT COUNT(*) FROM fdd_engagements e WHERE e.lead_id = l.id) as engagement_count,
    '⏳ Awaiting First FDD Access' as engagement_status
FROM buyer_profiles bp
LEFT JOIN leads l ON l.buyer_id = bp.id
LEFT JOIN franchises f ON l.franchise_id = f.id
WHERE bp.email ILIKE '%willie%' OR bp.full_name ILIKE '%willie%';


-- SECTION 5: Compare Bob Smith vs Willie Nelson test scenarios
-- ============================================================
SELECT 
    '📊 Test Scenarios Comparison' as section,
    bp.full_name,
    bp.liquid_assets_range,
    bp.net_worth_range,
    bp.has_franchise_experience,
    COALESCE(e.time_spent / 60, 0) || ' min' as engagement_time,
    COALESCE(e.questions_asked, 0) as questions,
    CASE 
        WHEN bp.full_name ILIKE '%bob%' THEN '✅ QUALIFIED + 🔥 HIGH ENGAGEMENT'
        WHEN bp.full_name ILIKE '%willie%' THEN '✅ QUALIFIED + ⏳ NO ENGAGEMENT'
        ELSE 'Unknown'
    END as test_scenario,
    CASE 
        WHEN bp.full_name ILIKE '%bob%' THEN 'Tests full AI analysis with criteria scoring'
        WHEN bp.full_name ILIKE '%willie%' THEN 'Tests "Profile Complete, Awaiting FDD Access" flow'
        ELSE ''
    END as what_it_tests
FROM buyer_profiles bp
LEFT JOIN leads l ON l.buyer_id = bp.id
LEFT JOIN franchises f ON l.franchise_id = f.id
LEFT JOIN fdd_engagements e ON e.lead_id = l.id
WHERE bp.email IN ('bob.smith@example.com')
   OR bp.email ILIKE '%willie%' 
   OR bp.full_name ILIKE '%willie%'
ORDER BY bp.full_name;
