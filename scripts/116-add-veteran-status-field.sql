-- Migration: Add veteran status field to buyer_profiles
-- Purpose: Track whether lead/prospect is a veteran (Yes/No)
-- Date: December 22, 2025

-- Add is_veteran boolean column
ALTER TABLE buyer_profiles 
ADD COLUMN IF NOT EXISTS is_veteran BOOLEAN DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN buyer_profiles.is_veteran IS 'Whether the buyer is a military veteran (true = yes, false = no, null = not answered)';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'buyer_profiles'
AND column_name = 'is_veteran';
