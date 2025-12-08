-- Add city, state, and zip_code fields to buyer_profiles table

ALTER TABLE buyer_profiles
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- Add index on state for faster location-based queries
CREATE INDEX IF NOT EXISTS idx_buyer_profiles_state ON buyer_profiles(state);
CREATE INDEX IF NOT EXISTS idx_buyer_profiles_zip_code ON buyer_profiles(zip_code);
