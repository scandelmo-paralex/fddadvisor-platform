-- Add logo_url column to franchisor_profiles table
ALTER TABLE franchisor_profiles 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN franchisor_profiles.logo_url IS 'URL to the franchisor company logo stored in Vercel Blob storage';
