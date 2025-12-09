-- =============================================
-- ADD TITLE COLUMN TO FRANCHISOR PROFILES
-- Run this in Supabase SQL Editor
-- =============================================

-- First, check existing columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'franchisor_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add title column if it doesn't exist
ALTER TABLE franchisor_profiles 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Also ensure contact_name exists (in case the schema uses this instead of primary_contact_name)
ALTER TABLE franchisor_profiles 
ADD COLUMN IF NOT EXISTS contact_name TEXT;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'franchisor_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;
