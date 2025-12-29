-- ============================================================================
-- Migration 111: Documentation - fdd_engagements.buyer_id uses auth.users.id
-- ============================================================================
-- Purpose: This script documents and verifies the FK relationship.
--
-- CONFIRMED: fdd_engagements.buyer_id references auth.users(id), NOT buyer_profiles(id)
-- 
-- Data Flow:
--   SAVE (/api/fdd/engagement POST):
--     - Uses user.id (auth.users.id) as buyer_id ✅
--   
--   FETCH (/api/leads/engagement GET):
--     - Needs to use buyer_profiles.user_id to query engagements ✅
--     - Because lead_fdd_access.buyer_id = buyer_profiles.id
--     - But fdd_engagements.buyer_id = auth.users.id = buyer_profiles.user_id
--
-- Run this in Supabase SQL Editor to verify
-- ============================================================================

-- SECTION 1: Verify FK constraint on fdd_engagements.buyer_id
-- ============================================================
SELECT 
    '🔍 FK Constraint Analysis' as section,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'fdd_engagements'
    AND kcu.column_name = 'buyer_id';


-- SECTION 2: Show ID mapping for test users
-- ==========================================
SELECT 
    '📊 User ID Mapping' as section,
    bp.first_name || ' ' || bp.last_name as buyer_name,
    bp.email,
    bp.id as buyer_profiles_id,
    bp.user_id as auth_users_id,
    '↑ fdd_engagements.buyer_id should match auth_users_id' as note
FROM buyer_profiles bp
WHERE bp.email IN ('bob.smith@example.com', 'spcandelmo@gmail.com')
   OR bp.first_name ILIKE '%willie%'
   OR bp.first_name ILIKE '%bob%'
ORDER BY bp.first_name;


-- SECTION 3: Check current engagements and their buyer_id source
-- ==============================================================
SELECT 
    '📋 Current Engagements' as section,
    e.id as engagement_id,
    e.buyer_id,
    e.buyer_email,
    e.buyer_name,
    e.duration_seconds,
    e.viewed_items,
    bp.id as buyer_profiles_id,
    bp.user_id as auth_users_id,
    CASE 
        WHEN e.buyer_id = bp.user_id THEN '✅ Correct (auth.users.id)'
        WHEN e.buyer_id = bp.id THEN '❌ Wrong (buyer_profiles.id)'
        ELSE '❓ Unknown'
    END as buyer_id_source
FROM fdd_engagements e
LEFT JOIN buyer_profiles bp ON bp.email = e.buyer_email OR bp.user_id = e.buyer_id OR bp.id = e.buyer_id
WHERE e.buyer_email ILIKE '%willie%' 
   OR e.buyer_email ILIKE '%spcandelmo%'
   OR e.buyer_email ILIKE '%bob%'
   OR e.buyer_name ILIKE '%willie%'
   OR e.buyer_name ILIKE '%bob%'
ORDER BY e.created_at DESC;


-- SECTION 4: Verify lead_fdd_access mapping
-- ==========================================
SELECT 
    '🔗 lead_fdd_access Mapping' as section,
    lfa.id as access_id,
    lfa.buyer_id as access_buyer_id,
    bp.id as buyer_profiles_id,
    bp.user_id as auth_users_id,
    bp.first_name || ' ' || bp.last_name as buyer_name,
    'lead_fdd_access.buyer_id = buyer_profiles.id' as relationship
FROM lead_fdd_access lfa
JOIN buyer_profiles bp ON lfa.buyer_id = bp.id
WHERE bp.email IN ('bob.smith@example.com', 'spcandelmo@gmail.com')
   OR bp.first_name ILIKE '%willie%'
   OR bp.first_name ILIKE '%bob%';
