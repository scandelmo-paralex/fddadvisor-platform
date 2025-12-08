-- Check if Jane has a buyer_profile with user_id set
SELECT 
  id,
  user_id,
  created_at
FROM buyer_profiles
WHERE id = 'bc8397b1-c1b7-436c-bdb4-e052248b36b5';

-- Check if Jane has FDD access to this specific franchise
SELECT 
  id,
  buyer_id,
  franchise_id,
  consent_given_at,
  receipt_signed_at,
  created_at
FROM lead_fdd_access
WHERE buyer_id = 'bc8397b1-c1b7-436c-bdb4-e052248b36b5'
  AND franchise_id = '96deab51-6be3-41b4-b478-5de164823cdd';

-- Check all users with Jane's email
SELECT 
  id,
  email,
  role,
  created_at
FROM users
WHERE email = 'scandelmo@pointonelegal.com';
