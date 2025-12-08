-- First show actual columns to avoid guessing
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'buyer_profiles'
ORDER BY ordinal_position;

-- Use SELECT * to get all columns without guessing names
SELECT 
    'Buyer Profile Data' AS check_type,
    *
FROM buyer_profiles
WHERE id = 'bc8397b1-c1b7-436c-bdb4-e052248b36b5';

-- Check auth users table for Jane
SELECT 
    'Auth Users' AS check_type,
    id,
    email,
    created_at
FROM auth.users
WHERE email = 'scandelmo@pointonelegal.com';

-- Simplified check using SELECT * to avoid column name errors
SELECT 
    'User Link Check' AS check_type,
    bp.user_id AS profile_user_id,
    au.id AS auth_user_id,
    CASE 
        WHEN bp.user_id IS NULL THEN 'ERROR: buyer_profile has NULL user_id'
        WHEN au.id IS NULL THEN 'ERROR: No auth user found'
        WHEN bp.user_id != au.id THEN 'ERROR: user_id mismatch'
        ELSE 'OK: user_id matches'
    END AS status
FROM buyer_profiles bp
FULL OUTER JOIN auth.users au ON au.email = 'scandelmo@pointonelegal.com'
WHERE bp.id = 'bc8397b1-c1b7-436c-bdb4-e052248b36b5';
