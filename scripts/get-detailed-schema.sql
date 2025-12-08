-- Run this in Supabase SQL Editor to get complete column definitions
-- Copy the results and share with v0

-- 1. ALL COLUMNS WITH FULL DETAILS
SELECT 
    table_name,
    column_name,
    data_type,
    udt_name as underlying_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 2. FOREIGN KEY RELATIONSHIPS
SELECT
    tc.table_name as from_table,
    kcu.column_name as from_column,
    ccu.table_name AS to_table,
    ccu.column_name AS to_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 3. ENUMS (Custom Types)
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;

-- 4. RLS POLICIES
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
