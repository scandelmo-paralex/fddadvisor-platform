-- Migration: Add skills and experience fields to buyer_profiles
-- Purpose: Enable AI-powered candidate fit scoring against franchise ideal profiles
-- Date: December 9, 2024

-- Add skills array for candidate matching
ALTER TABLE buyer_profiles 
ADD COLUMN IF NOT EXISTS skills TEXT[];

-- Add industries array (may already exist)
ALTER TABLE buyer_profiles 
ADD COLUMN IF NOT EXISTS industries TEXT[];

-- Add business experience years
ALTER TABLE buyer_profiles 
ADD COLUMN IF NOT EXISTS business_experience_years TEXT;

-- Add management experience flag
ALTER TABLE buyer_profiles 
ADD COLUMN IF NOT EXISTS management_experience BOOLEAN DEFAULT FALSE;

-- Add franchise experience flag
ALTER TABLE buyer_profiles 
ADD COLUMN IF NOT EXISTS has_franchise_experience BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN buyer_profiles.skills IS 'Array of self-reported skills: leadership, team_management, customer_service, marketing, operations, etc.';
COMMENT ON COLUMN buyer_profiles.industries IS 'Array of industries the buyer has experience in: hospitality, retail, healthcare, etc.';
COMMENT ON COLUMN buyer_profiles.business_experience_years IS 'Years of business ownership or management experience';
COMMENT ON COLUMN buyer_profiles.management_experience IS 'Has experience managing teams or businesses';
COMMENT ON COLUMN buyer_profiles.has_franchise_experience IS 'Has prior franchise ownership or employment experience';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'buyer_profiles'
AND column_name IN ('skills', 'industries', 'business_experience_years', 'management_experience', 'has_franchise_experience')
ORDER BY column_name;
