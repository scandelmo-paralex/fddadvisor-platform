-- Check all FDD access records for spcandelmo@gmail.com

-- All FDD access records
SELECT 
  'All FDD Access' as check_type,
  id,
  buyer_id,
  franchise_id,
  franchisor_id,
  invitation_id,
  granted_via,
  created_at
FROM lead_fdd_access
ORDER BY created_at DESC;

-- All buyer profiles for Bob
SELECT 
  'All Buyer Profiles' as check_type,
  id as buyer_id,
  user_id,
  email,
  first_name,
  last_name
FROM buyer_profiles
WHERE user_id IN (
  SELECT id FROM users WHERE email = 'spcandelmo@gmail.com'
);
