-- Check if Jane's buyer_profile has the correct user_id
SELECT 
  'Jane Auth User' as check_name,
  id as auth_user_id,
  email
FROM auth.users
WHERE email = 'scandelmo@pointonelegal.com';

-- Check Jane's buyer_profile user_id
SELECT 
  'Jane Buyer Profile' as check_name,
  id as buyer_id,
  user_id as linked_user_id
FROM buyer_profiles
WHERE id = 'bc8397b1-c1b7-436c-bdb4-e052248b36b5';
