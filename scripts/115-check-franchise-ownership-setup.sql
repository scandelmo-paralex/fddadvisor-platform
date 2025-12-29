-- ============================================================================
-- CHECK FRANCHISE OWNERSHIP SETUP
-- Run this in Supabase SQL Editor to understand current state
-- ============================================================================

-- 1. Check if franchises table has franchisor_id column
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'franchises'
  AND column_name = 'franchisor_id';

-- 2. Get your admin profile info
SELECT 
    id as franchisor_profile_id,
    user_id,
    company_name,
    is_admin,
    created_at
FROM franchisor_profiles
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'scandelmo@paralex.ai'
);

-- 3. List all franchises with their current ownership
SELECT 
    f.id as franchise_id,
    f.franchise_name,
    f.slug,
    f.franchisor_id,
    fp.company_name as owner_company
FROM franchises f
LEFT JOIN franchisor_profiles fp ON f.franchisor_id = fp.id
ORDER BY f.franchise_name;

-- 4. Check Ace Handyman specifically
SELECT 
    id,
    franchise_name,
    slug,
    franchisor_id,
    franchise_score,
    created_at
FROM franchises
WHERE LOWER(franchise_name) LIKE '%ace%handyman%'
   OR LOWER(slug) LIKE '%ace%handyman%';

-- 5. Check lead_invitations table structure (does it link to franchise or franchisor?)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'lead_invitations'
  AND column_name IN ('franchise_id', 'franchisor_id', 'created_by')
ORDER BY column_name;

-- 6. Check lead_fdd_access table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'lead_fdd_access'
  AND column_name IN ('franchise_id', 'franchisor_id', 'buyer_id')
ORDER BY column_name;
