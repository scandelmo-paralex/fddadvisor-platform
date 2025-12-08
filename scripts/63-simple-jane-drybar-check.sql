-- Check if Jane has access to Drybar franchise
-- Jane's buyer_id: bc8397b1-c1b7-436c-bdb4-e052248b36b5
-- Drybar franchise_id: 96deab51-6be3-41b4-b478-5de164823cdd

SELECT 
  'Jane FDD Access' as check_name,
  *
FROM lead_fdd_access
WHERE buyer_id = 'bc8397b1-c1b7-436c-bdb4-e052248b36b5';

SELECT 
  'All Drybar Access' as check_name,
  *
FROM lead_fdd_access
WHERE franchise_id = '96deab51-6be3-41b4-b478-5de164823cdd';
