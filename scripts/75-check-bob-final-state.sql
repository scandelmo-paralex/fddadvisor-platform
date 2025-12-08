-- Using Bob's exact email: spcandelmo@gmail.com
-- Check if Bob's auth user, public user, and buyer profile exist

-- Cast all columns to text for UNION compatibility
SELECT 
  'Auth User' as record_type,
  id::text,
  email,
  created_at::text
FROM auth.users
WHERE email = 'spcandelmo@gmail.com'

UNION ALL

SELECT 
  'Public User' as record_type,
  id::text,
  email,
  created_at::text
FROM users
WHERE email = 'spcandelmo@gmail.com'

UNION ALL

SELECT 
  'Buyer Profile' as record_type,
  id::text,
  email,
  created_at::text
FROM buyer_profiles
WHERE email = 'spcandelmo@gmail.com';
