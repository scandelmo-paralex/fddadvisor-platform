-- Get actual column names for all tables in the invitation workflow
-- This will help us verify the code matches the database

-- 1. lead_invitations table
SELECT 
  'lead_invitations' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'lead_invitations'
ORDER BY ordinal_position;

-- 2. buyer_profiles table
SELECT 
  'buyer_profiles' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'buyer_profiles'
ORDER BY ordinal_position;

-- 3. lead_fdd_access table
SELECT 
  'lead_fdd_access' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'lead_fdd_access'
ORDER BY ordinal_position;

-- 4. fdd_engagements table
SELECT 
  'fdd_engagements' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'fdd_engagements'
ORDER BY ordinal_position;

-- 5. franchises table
SELECT 
  'franchises' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'franchises'
ORDER BY ordinal_position;

-- 6. users table (public schema)
SELECT 
  'users' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;
