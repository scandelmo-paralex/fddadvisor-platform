-- Manually sync Bob's auth user to public.users and create buyer profile
-- This fixes the issue where the trigger didn't fire

-- Step 1: Insert Bob's auth user into public.users table
INSERT INTO public.users (id, email, role, created_at)
VALUES (
  'de165357-43a9-401c-82d4-289060dd012d',
  'spcandelmo@gmail.com',
  'buyer',
  '2025-11-11 15:40:00.285945+00'
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create Bob's buyer profile
INSERT INTO public.buyer_profiles (id, user_id, first_name, last_name, email, phone, preferred_location, buying_timeline, created_at)
VALUES (
  gen_random_uuid(),
  'de165357-43a9-401c-82d4-289060dd012d',
  'Bob',
  'Smith',
  'spcandelmo@gmail.com',
  NULL, -- phone from invitation if available
  NULL, -- will be updated with invitation data
  NULL, -- will be updated with invitation data
  NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email;

-- Step 3: Get Bob's buyer_id for FDD access grant
DO $$
DECLARE
  bob_buyer_id UUID;
  drybar_franchise_id UUID := '96deab51-6be3-41b4-b478-5de164823cdd';
  bob_invitation_id UUID;
  drybar_franchisor_id UUID;
BEGIN
  -- Get Bob's buyer_id
  SELECT id INTO bob_buyer_id
  FROM buyer_profiles
  WHERE user_id = 'de165357-43a9-401c-82d4-289060dd012d';

  -- Get Bob's invitation_id
  SELECT id INTO bob_invitation_id
  FROM lead_invitations
  WHERE lead_email = 'spcandelmo@gmail.com'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Get Drybar's franchisor_id
  SELECT franchisor_id INTO drybar_franchisor_id
  FROM franchises
  WHERE id = drybar_franchise_id;

  -- Grant FDD access to Bob with franchisor_id
  INSERT INTO lead_fdd_access (
    buyer_id,
    franchise_id,
    franchisor_id,
    invitation_id,
    granted_via,
    created_at,
    updated_at
  )
  VALUES (
    bob_buyer_id,
    drybar_franchise_id,
    drybar_franchisor_id,
    bob_invitation_id,
    'invitation',
    NOW(),
    NOW()
  )
  ON CONFLICT (buyer_id, franchise_id) DO NOTHING;

  -- Update invitation status
  UPDATE lead_invitations
  SET 
    status = 'signed_up',
    buyer_id = bob_buyer_id,
    signed_up_at = NOW()
  WHERE id = bob_invitation_id;

  RAISE NOTICE 'Successfully synced Bob Smith (buyer_id: %)', bob_buyer_id;
END $$;

-- Verify the sync
SELECT 'Auth User' as type, id::text, email FROM public.users WHERE id = 'de165357-43a9-401c-82d4-289060dd012d'
UNION ALL
SELECT 'Buyer Profile' as type, id::text, email FROM buyer_profiles WHERE user_id = 'de165357-43a9-401c-82d4-289060dd012d'
UNION ALL
SELECT 'FDD Access' as type, id::text, franchise_id::text as email FROM lead_fdd_access WHERE buyer_id IN (SELECT id FROM buyer_profiles WHERE user_id = 'de165357-43a9-401c-82d4-289060dd012d');
