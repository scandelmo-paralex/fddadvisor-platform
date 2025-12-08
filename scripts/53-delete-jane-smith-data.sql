-- Delete Jane Smith's data to allow fresh invitation flow testing
-- Buyer ID: 9d9a6ac1-2143-416b-8675-140898f08d5b

BEGIN;

-- Get Jane's auth user_id first
DO $$
DECLARE
  jane_buyer_id UUID := '9d9a6ac1-2143-416b-8675-140898f08d5b';
  jane_user_id UUID;
BEGIN
  -- Get the auth user_id from buyer_profiles
  SELECT user_id INTO jane_user_id 
  FROM buyer_profiles 
  WHERE id = jane_buyer_id;

  -- Delete in correct order to avoid foreign key violations
  
  -- 1. Delete engagement records (no foreign keys depend on this)
  DELETE FROM fdd_engagements 
  WHERE buyer_id = jane_buyer_id;
  RAISE NOTICE 'Deleted fdd_engagements records';

  -- 2. Delete FDD access records
  DELETE FROM lead_fdd_access 
  WHERE buyer_id = jane_buyer_id;
  RAISE NOTICE 'Deleted lead_fdd_access records';

  -- 3. Delete buyer profile
  DELETE FROM buyer_profiles 
  WHERE id = jane_buyer_id;
  RAISE NOTICE 'Deleted buyer_profiles record';

  -- 4. Reset invitation status back to 'sent' so it can be used again
  UPDATE lead_invitations 
  SET 
    status = 'sent',
    buyer_id = NULL,
    viewed_at = NULL
  WHERE email = 'scandelmo@pointonelegal.com'
    AND franchise_id = (SELECT id FROM franchises WHERE name = 'Drybar' LIMIT 1);
  RAISE NOTICE 'Reset invitation status to sent';

  -- 5. Delete auth user (if exists)
  IF jane_user_id IS NOT NULL THEN
    DELETE FROM auth.users WHERE id = jane_user_id;
    RAISE NOTICE 'Deleted auth.users record';
  END IF;

  RAISE NOTICE 'Successfully deleted all Jane Smith data';
END $$;

COMMIT;

-- Verify deletion
SELECT 
  'buyer_profiles' as table_name,
  COUNT(*) as remaining_records
FROM buyer_profiles 
WHERE id = '9d9a6ac1-2143-416b-8675-140898f08d5b'
UNION ALL
SELECT 
  'lead_fdd_access',
  COUNT(*)
FROM lead_fdd_access 
WHERE buyer_id = '9d9a6ac1-2143-416b-8675-140898f08d5b'
UNION ALL
SELECT 
  'fdd_engagements',
  COUNT(*)
FROM fdd_engagements 
WHERE buyer_id = '9d9a6ac1-2143-416b-8675-140898f08d5b'
UNION ALL
SELECT 
  'lead_invitations (sent status)',
  COUNT(*)
FROM lead_invitations 
WHERE email = 'scandelmo@pointonelegal.com'
  AND status = 'sent';
