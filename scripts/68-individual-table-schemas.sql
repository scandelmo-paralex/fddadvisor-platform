-- Get actual columns from each table by selecting from them
-- This will show us exactly what columns exist

-- 1. lead_invitations columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'lead_invitations'
ORDER BY ordinal_position;

-- 2. buyer_profiles columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'buyer_profiles'
ORDER BY ordinal_position;

-- 3. lead_fdd_access columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'lead_fdd_access'
ORDER BY ordinal_position;

-- 4. franchises columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'franchises'
ORDER BY ordinal_position;

-- 5. fdd_engagements columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'fdd_engagements'
ORDER BY ordinal_position;
