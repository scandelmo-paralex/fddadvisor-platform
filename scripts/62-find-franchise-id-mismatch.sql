-- Check what franchise ID Jane actually has access to vs what's in the URL
-- URL has: 96deab51-6be3-41b4-b478-5de164823cdd

SELECT 
  'Jane Buyer Profile' as check_name,
  id as buyer_id,
  user_id,
  email
FROM buyer_profiles
WHERE id = 'bc8397b1-c1b7-436c-bdb4-e052248b36b5';

SELECT 
  'Jane FDD Access' as check_name,
  buyer_id,
  franchise_id,
  franchisor_id,
  granted_via
FROM lead_fdd_access
WHERE buyer_id = 'bc8397b1-c1b7-436c-bdb4-e052248b36b5';

SELECT 
  'Drybar Franchise ID' as check_name,
  id as franchise_id,
  name,
  slug
FROM franchises
WHERE name ILIKE '%drybar%' OR slug ILIKE '%drybar%';

SELECT 
  'URL Franchise Check' as check_name,
  id,
  name,
  slug
FROM franchises
WHERE id = '96deab51-6be3-41b4-b478-5de164823cdd';
