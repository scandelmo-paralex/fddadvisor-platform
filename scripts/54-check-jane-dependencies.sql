-- Safety Check: See all Jane Smith data before deleting
-- Run this first to understand what will be deleted

-- Jane's buyer_id
WITH jane_id AS (
  SELECT '9d9a6ac1-2143-416b-8675-140898f08d5b'::uuid AS buyer_id
)

-- Check buyer_profiles
SELECT 'buyer_profiles' AS table_name, COUNT(*) AS record_count
FROM buyer_profiles, jane_id
WHERE buyer_profiles.id = jane_id.buyer_id

UNION ALL

-- Check lead_fdd_access
SELECT 'lead_fdd_access' AS table_name, COUNT(*) AS record_count
FROM lead_fdd_access, jane_id
WHERE lead_fdd_access.buyer_id = jane_id.buyer_id

UNION ALL

-- Check fdd_engagements
SELECT 'fdd_engagements' AS table_name, COUNT(*) AS record_count
FROM fdd_engagements, jane_id
WHERE fdd_engagements.buyer_id = jane_id.buyer_id

UNION ALL

-- Check lead_invitations
SELECT 'lead_invitations' AS table_name, COUNT(*) AS record_count
FROM lead_invitations, jane_id
WHERE lead_invitations.buyer_id = jane_id.buyer_id

ORDER BY table_name;

-- Show the actual buyer profile
SELECT * FROM buyer_profiles WHERE id = '9d9a6ac1-2143-416b-8675-140898f08d5b';

-- Show the invitation record (selecting only columns we know exist)
-- Removed email column reference, using only basic columns
SELECT 
  id,
  status,
  buyer_id,
  created_at,
  updated_at
FROM lead_invitations
WHERE buyer_id = '9d9a6ac1-2143-416b-8675-140898f08d5b';
