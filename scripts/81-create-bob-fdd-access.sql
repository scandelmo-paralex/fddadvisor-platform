INSERT INTO lead_fdd_access (
  buyer_id,
  franchise_id,
  franchisor_id,
  invitation_id,
  granted_via,
  total_views,
  total_time_spent_seconds,
  created_at,
  updated_at
)
VALUES (
  'e4a3cd6f-0139-4058-98a4-fbdd2a68894d', -- Bob's correct buyer_id
  '96deab51-6be3-41b4-b478-5de164823cdd', -- Drybar franchise_id
  '1881ea8f-5b4b-47f5-82b3-7da85ce62ed7', -- Wellbiz franchisor_id
  '07b70e47-2674-4d59-ab11-9fc68f87afc7', -- Bob's invitation_id
  'invitation',
  0,
  0,
  NOW(),
  NOW()
);

-- Verify it was created
SELECT 
  'Bob FDD Access Created' as status,
  id,
  buyer_id,
  franchise_id,
  invitation_id
FROM lead_fdd_access
WHERE buyer_id = 'e4a3cd6f-0139-4058-98a4-fbdd2a68894d';
