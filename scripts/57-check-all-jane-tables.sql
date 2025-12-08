-- Check all data for Jane Smith using her buyer_id
-- buyer_id: bc8397b1-c1b7-436c-bdb4-e052248b36b5

-- Check buyer_profiles
SELECT 'buyer_profiles' as table_name, *
FROM buyer_profiles
WHERE id = 'bc8397b1-c1b7-436c-bdb4-e052248b36b5';

-- Check lead_fdd_access
SELECT 'lead_fdd_access' as table_name, *
FROM lead_fdd_access
WHERE buyer_id = 'bc8397b1-c1b7-436c-bdb4-e052248b36b5';

-- Check fdd_engagements
SELECT 'fdd_engagements' as table_name, *
FROM fdd_engagements
WHERE buyer_id = 'bc8397b1-c1b7-436c-bdb4-e052248b36b5';

-- Check users table (to see auth user)
SELECT 'users' as table_name, id, email, role, created_at
FROM users
WHERE id = 'bc8397b1-c1b7-436c-bdb4-e052248b36b5';
