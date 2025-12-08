-- Check all records for Bob's auth user to find the mismatch

-- Bob's auth user ID
DO $$
DECLARE
    bob_auth_id uuid := 'de165357-43a9-401c-82d4-289060dd012d';
BEGIN
    RAISE NOTICE 'Checking all records for Bob auth user: %', bob_auth_id;
END $$;

-- Find ALL buyer profiles for Bob
SELECT 
    'Buyer Profiles' as record_type,
    id as buyer_profile_id,
    user_id,
    email,
    first_name,
    last_name,
    created_at
FROM buyer_profiles
WHERE user_id = 'de165357-43a9-401c-82d4-289060dd012d'
OR email = 'spcandelmo@gmail.com';

-- Find ALL FDD access records that might be Bob's
SELECT 
    'FDD Access Records' as record_type,
    id as access_id,
    buyer_id,
    franchise_id,
    invitation_id,
    created_at
FROM lead_fdd_access
WHERE buyer_id IN (
    SELECT id FROM buyer_profiles 
    WHERE user_id = 'de165357-43a9-401c-82d4-289060dd012d'
    OR email = 'spcandelmo@gmail.com'
);

-- Check if there's an orphaned buyer profile
SELECT 
    'Orphaned Buyer Profile?' as record_type,
    id as buyer_profile_id,
    user_id,
    email
FROM buyer_profiles
WHERE id = 'e4a3cd6f-0139-4058-98a4-fbdd2a68894d';
