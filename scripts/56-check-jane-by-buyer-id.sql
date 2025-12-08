-- Check all data for Jane Smith using her actual buyer_id from lead_invitations

-- 1. Check buyer_profiles
SELECT 'buyer_profiles' as table_name, *
FROM buyer_profiles
WHERE id = 'bc8397b1-c1b7-436c-bdb4-e052248b36b5';

-- 2. Check lead_fdd_access
SELECT 'lead_fdd_access' as table_name, *
FROM lead_fdd_access
WHERE buyer_id = 'bc8397b1-c1b7-436c-bdb4-e052248b36b5';

-- 3. Check fdd_engagements
SELECT 'fdd_engagements' as table_name, *
FROM fdd_engagements
WHERE buyer_id = 'bc8397b1-c1b7-436c-bdb4-e052248b36b5';

-- 4. Check lead_invitations details
SELECT 'lead_invitations' as table_name, *
FROM lead_invitations
WHERE buyer_id = 'bc8397b1-c1b7-436c-bdb4-e052248b36b5';
