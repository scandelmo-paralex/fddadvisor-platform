-- Step 1: Check what actually exists for Bob
SELECT 
    'Auth User' as record_type,
    id::text,
    email,
    created_at::text
FROM auth.users 
WHERE email = 'spcandelmo@gmail.com';

-- Step 2: Check buyer profiles
SELECT 
    'Buyer Profile' as record_type,
    id::text,
    user_id::text,
    email
FROM buyer_profiles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'spcandelmo@gmail.com');

-- Step 3: If no buyer profile exists, create one
INSERT INTO buyer_profiles (
    id,
    user_id,
    email,
    first_name,
    last_name,
    created_at,
    updated_at
)
SELECT 
    'e4a3cd6f-0139-4058-98a4-fbdd2a68894d'::uuid,
    au.id,
    au.email,
    'Bob',
    'Smith',
    NOW(),
    NOW()
FROM auth.users au
WHERE au.email = 'spcandelmo@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- Step 4: Now create FDD access
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
    'e4a3cd6f-0139-4058-98a4-fbdd2a68894d'::uuid,
    '96deab51-6be3-41b4-b478-5de164823cdd'::uuid,
    (SELECT franchisor_id FROM franchises WHERE id = '96deab51-6be3-41b4-b478-5de164823cdd'),
    '07b70e47-2674-4d59-ab11-9fc68f87afc7'::uuid,
    'invitation',
    NOW(),
    NOW()
)
ON CONFLICT (buyer_id, franchise_id) DO NOTHING;

-- Step 5: Verify everything
SELECT 
    'Final Check' as status,
    bp.id::text as buyer_id,
    bp.email,
    lfa.franchise_id::text,
    lfa.invitation_id::text
FROM buyer_profiles bp
LEFT JOIN lead_fdd_access lfa ON lfa.buyer_id = bp.id
WHERE bp.user_id = (SELECT id FROM auth.users WHERE email = 'spcandelmo@gmail.com');
