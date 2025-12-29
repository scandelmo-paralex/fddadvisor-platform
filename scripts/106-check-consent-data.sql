-- =============================================
-- CHECK CONSENT DATA IN DATABASE
-- Run this in Supabase SQL Editor
-- =============================================

-- ===================
-- 1. ENGAGEMENT TRACKING CONSENTS (lead_fdd_access table)
-- ===================

SELECT 
  lfa.id,
  bp.first_name,
  bp.last_name,
  f.name as franchise_name,
  lfa.consent_given_at,
  lfa.item23_signed,
  lfa.item23_signed_at,
  lfa.status,
  lfa.first_viewed_at
FROM lead_fdd_access lfa
LEFT JOIN buyer_profiles bp ON lfa.buyer_id = bp.id
LEFT JOIN franchises f ON lfa.franchise_id = f.id
ORDER BY lfa.consent_given_at DESC NULLS LAST
LIMIT 20;

-- ===================
-- 2. FRANCHISESCORE DISCLAIMER CONSENTS (fdd_franchisescore_consents table)
-- ===================

-- First check if the table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'fdd_franchisescore_consents'
) as table_exists;

-- If it exists, show consent records
SELECT 
  fsc.id,
  u.email,
  fsc.fdd_id,
  fsc.consented,
  fsc.consented_at,
  fsc.ip_address,
  fsc.created_at
FROM fdd_franchisescore_consents fsc
LEFT JOIN auth.users u ON fsc.user_id = u.id
ORDER BY fsc.consented_at DESC NULLS LAST
LIMIT 20;

-- ===================
-- 3. SUMMARY COUNTS
-- ===================

-- Count of engagement tracking consents given
SELECT 
  COUNT(*) as total_fdd_access_records,
  COUNT(consent_given_at) as with_tracking_consent,
  COUNT(item23_signed_at) as with_item23_signed
FROM lead_fdd_access;

-- Count of FranchiseScore consents (if table exists)
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN consented = true THEN 1 END) as consented_count
FROM fdd_franchisescore_consents;
