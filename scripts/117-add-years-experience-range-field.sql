-- Migration: Add years_of_experience_range field to buyer_profiles
-- This stores the original dropdown selection (e.g., "6-10", "20+") for proper display
-- The years_of_experience field stores the numeric value for calculations

-- Add the new column
ALTER TABLE buyer_profiles
ADD COLUMN IF NOT EXISTS years_of_experience_range TEXT DEFAULT NULL;

-- Add a comment explaining the column
COMMENT ON COLUMN buyer_profiles.years_of_experience_range IS 'Original dropdown selection for years of experience (e.g., "6-10", "11-15", "20+")';

-- Backfill existing data: Convert numeric years_of_experience to range strings
-- This ensures existing profiles will display correctly
UPDATE buyer_profiles
SET years_of_experience_range = CASE
    WHEN years_of_experience = 0 THEN '0'
    WHEN years_of_experience = 1 THEN '1'
    WHEN years_of_experience = 2 THEN '2'
    WHEN years_of_experience = 3 THEN '3'
    WHEN years_of_experience = 4 THEN '4'
    WHEN years_of_experience = 5 THEN '5'
    WHEN years_of_experience >= 6 AND years_of_experience <= 10 THEN '6-10'
    WHEN years_of_experience >= 11 AND years_of_experience <= 15 THEN '11-15'
    WHEN years_of_experience >= 16 AND years_of_experience <= 20 THEN '16-20'
    WHEN years_of_experience > 20 THEN '20+'
    ELSE NULL
END
WHERE years_of_experience IS NOT NULL AND years_of_experience_range IS NULL;
