-- Check all data for Jane Smith
-- buyer_id: 9d9a6ac1-2143-416b-8675-140898f08d5b

-- 1. Check buyer_profiles
SELECT 'buyer_profiles' as table_name, bp.*
FROM buyer_profiles bp
WHERE bp.id = '9d9a6ac1-2143-416b-8675-140898f08d5b';

-- 2. Check lead_fdd_access
SELECT 'lead_fdd_access' as table_name, lfa.*
FROM lead_fdd_access lfa
WHERE lfa.buyer_id = '9d9a6ac1-2143-416b-8675-140898f08d5b';

-- 3. Check fdd_engagements
SELECT 'fdd_engagements' as table_name, fe.*
FROM fdd_engagements fe
WHERE fe.buyer_id = '9d9a6ac1-2143-416b-8675-140898f08d5b'
ORDER BY fe.created_at DESC;

-- 4. Check lead_invitations
SELECT 'lead_invitations' as table_name, *
FROM lead_invitations
WHERE buyer_id = '9d9a6ac1-2143-416b-8675-140898f08d5b'
ORDER BY created_at DESC;

-- 5. Summary counts
SELECT 
  'Summary' as info,
  (SELECT COUNT(*) FROM buyer_profiles WHERE id = '9d9a6ac1-2143-416b-8675-140898f08d5b') as buyer_profile_count,
  (SELECT COUNT(*) FROM lead_fdd_access WHERE buyer_id = '9d9a6ac1-2143-416b-8675-140898f08d5b') as fdd_access_count,
  (SELECT COUNT(*) FROM fdd_engagements WHERE buyer_id = '9d9a6ac1-2143-416b-8675-140898f08d5b') as engagement_count,
  (SELECT COUNT(*) FROM lead_invitations WHERE buyer_id = '9d9a6ac1-2143-416b-8675-140898f08d5b') as invitation_count;
