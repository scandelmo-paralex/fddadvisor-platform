-- Query to list all tables in the public schema
SELECT 
  table_name,
  table_type
FROM 
  information_schema.tables
WHERE 
  table_schema = 'public'
ORDER BY 
  table_name;

-- Query to show columns for profile-related tables
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public'
  AND table_name LIKE '%profile%'
ORDER BY 
  table_name, ordinal_position;

-- Query to show columns for franchise-related tables
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public'
  AND table_name LIKE '%franchise%'
ORDER BY 
  table_name, ordinal_position;

-- Query to show columns for invitation-related tables
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public'
  AND table_name LIKE '%invitation%'
ORDER BY 
  table_name, ordinal_position;
