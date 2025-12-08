-- Fix Bob's FDD Access to point to the correct buyer profile
-- The profile linked to his user_id is e4a3cd6f-0139-4058-98a4-fbdd2a68894d
-- But we granted access to 5e9ab8b1-6b1c-4a74-bb28-f0c31e45201f

-- Step 1: Delete the orphaned buyer profile that has no user_id link
DELETE FROM buyer_profiles 
WHERE id = '5e9ab8b1-6b1c-4a74-bb28-f0c31e45201f';

-- Step 2: Update the FDD access record to use the correct buyer_id
UPDATE lead_fdd_access
SET buyer_id = 'e4a3cd6f-0139-4058-98a4-fbdd2a68894d'
WHERE buyer_id = '5e9ab8b1-6b1c-4a74-bb28-f0c31e45201f';

-- Step 3: Verify the fix
SELECT 
  'Verification' as type,
  bp.id as buyer_profile_id,
  bp.user_id,
  lfa.franchise_id,
  f.name as franchise_name
FROM buyer_profiles bp
JOIN lead_fdd_access lfa ON lfa.buyer_id = bp.id
JOIN franchises f ON f.id = lfa.franchise_id
WHERE bp.user_id = 'de165357-43a9-401c-82d4-289060dd012d';
