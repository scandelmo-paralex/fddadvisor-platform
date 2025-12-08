-- Get complete schema for all invitation workflow tables

-- Lead Invitations table
SELECT 
  'lead_invitations' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'lead_invitations'
ORDER BY ordinal_position;

-- Buyer Profiles table
SELECT 
  'buyer_profiles' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'buyer_profiles'
ORDER BY ordinal_position;

-- Lead FDD Access table
SELECT 
  'lead_fdd_access' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'lead_fdd_access'
ORDER BY ordinal_position;

-- Franchises table
SELECT 
  'franchises' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'franchises'
ORDER BY ordinal_position;

-- Users table
SELECT 
  'users' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;
