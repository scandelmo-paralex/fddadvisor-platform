-- Run this script in Supabase SQL Editor to get complete database schema
-- Copy and paste the results to share with v0

-- 1. Get all tables and their columns with types
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    c.character_maximum_length
FROM information_schema.tables t
JOIN information_schema.columns c 
    ON t.table_name = c.table_name 
    AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

-- 2. Get all foreign key relationships
SELECT
    tc.table_name AS source_table,
    kcu.column_name AS source_column,
    ccu.table_name AS target_table,
    ccu.column_name AS target_column,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 3. Get all RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Get all indexes
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 5. Get all enums/custom types
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;
