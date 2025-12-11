-- ============================================================================
-- Migration 111: Fix Willie Nelson's Engagement buyer_id
-- ============================================================================
-- Purpose: The engagement tracking was using auth.users.id instead of 
--          buyer_profiles.id as the buyer_id. This script fixes any existing
--          engagement records for Willie (and other users if needed).
--
-- The issue was:
--   - /api/fdd/engagement POST was using user.id (auth.users.id)
--   - /api/leads/engagement GET was querying by buyer_profiles.id
--   - These are different IDs, so engagement data wasn't being found!
--
-- Run this in Supabase SQL Editor
-- ============================================================================

-- SECTION 1: Diagnose the issue - show the ID mismatch
-- =====================================================
SELECT 
    '🔍 ID Mismatch Analysis' as section,
    bp.id as buyer_profile_id,
    bp.user_id as auth_user_id,
    bp.first_name || ' ' || bp.last_name as buyer_name,
    bp.email,
    'These should match in fdd_engagements.buyer_id' as note
FROM buyer_profiles bp
WHERE bp.email ILIKE '%willie%' 
   OR bp.first_name ILIKE '%willie%'
   OR bp.email ILIKE '%spcandelmo%';


-- SECTION 2: Check current state of fdd_engagements for Willie
-- ============================================================
SELECT 
    '📊 Current Engagements (before fix)' as section,
    e.id as engagement_id,
    e.buyer_id as current_buyer_id,
    e.buyer_email,
    e.buyer_name,
    e.franchise_id,
    e.duration_seconds,
    e.viewed_items,
    e.questions_asked,
    e.created_at,
    CASE 
        WHEN e.buyer_id IN (SELECT id FROM buyer_profiles) THEN '✅ buyer_profiles.id (CORRECT)'
        WHEN e.buyer_id IN (SELECT user_id FROM buyer_profiles) THEN '❌ auth.users.id (WRONG)'
        ELSE '❓ Unknown ID source'
    END as id_source
FROM fdd_engagements e
WHERE e.buyer_email ILIKE '%willie%' 
   OR e.buyer_email ILIKE '%spcandelmo%'
   OR e.buyer_name ILIKE '%willie%';


-- SECTION 3: Fix engagements that used auth.users.id instead of buyer_profiles.id
-- ===============================================================================
-- This updates any engagement records where buyer_id = auth.users.id 
-- to instead use the correct buyer_profiles.id

UPDATE fdd_engagements e
SET buyer_id = bp.id
FROM buyer_profiles bp
WHERE e.buyer_id = bp.user_id  -- Currently using wrong ID (auth.users.id)
  AND e.buyer_id != bp.id;     -- And it's different from the correct ID

-- Log how many were updated
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Updated % engagement records with corrected buyer_id', updated_count;
END $$;


-- SECTION 4: Verify the fix worked
-- =================================
SELECT 
    '✅ Engagements After Fix' as section,
    e.id as engagement_id,
    e.buyer_id as fixed_buyer_id,
    e.buyer_email,
    e.buyer_name,
    e.franchise_id,
    e.duration_seconds,
    e.viewed_items,
    e.questions_asked,
    bp.id as expected_buyer_profile_id,
    CASE 
        WHEN e.buyer_id = bp.id THEN '✅ CORRECT'
        ELSE '❌ STILL WRONG'
    END as status
FROM fdd_engagements e
LEFT JOIN buyer_profiles bp ON bp.email = e.buyer_email OR bp.user_id = e.buyer_id
WHERE e.buyer_email ILIKE '%willie%' 
   OR e.buyer_email ILIKE '%spcandelmo%'
   OR e.buyer_name ILIKE '%willie%';


-- SECTION 5: Summary - All users' engagement status
-- ==================================================
SELECT 
    '📋 Engagement Summary by User' as section,
    bp.first_name || ' ' || bp.last_name as buyer_name,
    bp.email,
    bp.id as buyer_profile_id,
    COUNT(e.id) as engagement_count,
    SUM(COALESCE(e.duration_seconds, 0)) as total_seconds,
    ROUND(SUM(COALESCE(e.duration_seconds, 0)) / 60.0, 1) as total_minutes
FROM buyer_profiles bp
LEFT JOIN fdd_engagements e ON e.buyer_id = bp.id
WHERE bp.email IN (
    'bob.smith@example.com',
    'spcandelmo@gmail.com'
)
   OR bp.first_name ILIKE '%willie%'
   OR bp.first_name ILIKE '%bob%'
GROUP BY bp.id, bp.first_name, bp.last_name, bp.email
ORDER BY bp.first_name;
