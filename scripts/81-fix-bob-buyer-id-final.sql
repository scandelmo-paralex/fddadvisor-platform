-- Fix Bob's FDD access to point to the correct buyer profile

UPDATE lead_fdd_access
SET buyer_id = 'e4a3cd6f-0139-4058-98a4-fbdd2a68894d'
WHERE buyer_id = '5e9ab8b1-6b1c-4a74-bb28-f0c31e45201f'
  AND franchise_id = '96deab51-6be3-41b4-b478-5de164823cdd';

-- Verify the fix
SELECT 
  'Updated FDD Access' as status,
  id,
  buyer_id,
  franchise_id,
  invitation_id
FROM lead_fdd_access
WHERE franchise_id = '96deab51-6be3-41b4-b478-5de164823cdd';
