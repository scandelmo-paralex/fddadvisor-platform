-- Split preferred_location into city_location and state_location
-- This migration will parse existing preferred_location data and split it into two columns

-- Add new columns to buyer_profiles table
ALTER TABLE buyer_profiles
ADD COLUMN IF NOT EXISTS city_location TEXT,
ADD COLUMN IF NOT EXISTS state_location TEXT;

-- Parse existing preferred_location data (format: "City, ST") and populate new columns
UPDATE buyer_profiles
SET 
  city_location = CASE 
    WHEN preferred_location IS NOT NULL AND preferred_location LIKE '%,%' 
    THEN TRIM(SPLIT_PART(preferred_location, ',', 1))
    ELSE NULL
  END,
  state_location = CASE 
    WHEN preferred_location IS NOT NULL AND preferred_location LIKE '%,%' 
    THEN TRIM(SPLIT_PART(preferred_location, ',', 2))
    ELSE NULL
  END
WHERE preferred_location IS NOT NULL;

-- Verify the migration
SELECT 
  id,
  first_name,
  last_name,
  preferred_location AS old_location,
  city_location,
  state_location
FROM buyer_profiles
WHERE preferred_location IS NOT NULL OR city_location IS NOT NULL;
