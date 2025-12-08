-- =====================================================
-- Buyer Profile Enhancement Migration
-- Adds fields for simplified self-reported profile
-- Date: December 8, 2025
-- =====================================================

-- Add new personal info fields
ALTER TABLE public.buyer_profiles
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS desired_territories text,
  ADD COLUMN IF NOT EXISTS profile_photo_url text;

-- Add business experience fields
ALTER TABLE public.buyer_profiles
  ADD COLUMN IF NOT EXISTS years_of_experience integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS industry_experience text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS has_owned_business boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS management_experience boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS current_employment_status text DEFAULT 'Employed Full-Time',
  ADD COLUMN IF NOT EXISTS relevant_skills text[] DEFAULT '{}';

-- Update funding_plan to funding_plans (array for multiple selection)
ALTER TABLE public.buyer_profiles
  ADD COLUMN IF NOT EXISTS funding_plans text[] DEFAULT '{}';

-- Add background attestation timestamp
ALTER TABLE public.buyer_profiles
  ADD COLUMN IF NOT EXISTS background_attested_at timestamptz;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_buyer_profiles_state ON public.buyer_profiles(state);
CREATE INDEX IF NOT EXISTS idx_buyer_profiles_city ON public.buyer_profiles(city);
CREATE INDEX IF NOT EXISTS idx_buyer_profiles_current_employment_status ON public.buyer_profiles(current_employment_status);

-- Add comments for documentation
COMMENT ON COLUMN public.buyer_profiles.city IS 'City where buyer is located';
COMMENT ON COLUMN public.buyer_profiles.state IS 'State where buyer is located (2-letter abbreviation)';
COMMENT ON COLUMN public.buyer_profiles.desired_territories IS 'Geographic territories buyer is interested in (free text)';
COMMENT ON COLUMN public.buyer_profiles.profile_photo_url IS 'URL to uploaded profile photo';
COMMENT ON COLUMN public.buyer_profiles.years_of_experience IS 'Years of business experience';
COMMENT ON COLUMN public.buyer_profiles.industry_experience IS 'Array of industries buyer has experience in';
COMMENT ON COLUMN public.buyer_profiles.has_owned_business IS 'Has buyer owned or operated a business before';
COMMENT ON COLUMN public.buyer_profiles.management_experience IS 'Has buyer managed teams or operations';
COMMENT ON COLUMN public.buyer_profiles.current_employment_status IS 'Current employment status (Employed Full-Time, Part-Time, Self-Employed, Unemployed, Retired)';
COMMENT ON COLUMN public.buyer_profiles.relevant_skills IS 'Array of relevant skills (e.g., Sales, Operations, Marketing)';
COMMENT ON COLUMN public.buyer_profiles.funding_plans IS 'Array of funding plans buyer plans to use (e.g., Cash, SBA Loan, 401k Rollover)';
COMMENT ON COLUMN public.buyer_profiles.background_attested_at IS 'Timestamp when background attestations were completed';

-- Migrate existing data from funding_plan (singular) to funding_plans (array)
-- Only if funding_plan exists and has data
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'buyer_profiles' 
    AND column_name = 'funding_plan'
  ) THEN
    UPDATE public.buyer_profiles
    SET funding_plans = ARRAY[funding_plan]::text[]
    WHERE funding_plan IS NOT NULL 
      AND funding_plan != ''
      AND (funding_plans IS NULL OR array_length(funding_plans, 1) IS NULL);
  END IF;
END $$;

-- Migrate city_location to city
UPDATE public.buyer_profiles
SET city = city_location
WHERE city IS NULL 
  AND city_location IS NOT NULL 
  AND city_location != '';

-- Migrate state_location to state  
UPDATE public.buyer_profiles
SET state = state_location
WHERE state IS NULL
  AND state_location IS NOT NULL
  AND state_location != '';

-- Success message
SELECT 
  'Migration completed successfully!' as status,
  COUNT(*) as total_buyer_profiles,
  COUNT(CASE WHEN city IS NOT NULL THEN 1 END) as profiles_with_city,
  COUNT(CASE WHEN state IS NOT NULL THEN 1 END) as profiles_with_state,
  COUNT(CASE WHEN funding_plans IS NOT NULL AND array_length(funding_plans, 1) > 0 THEN 1 END) as profiles_with_funding_plans
FROM public.buyer_profiles;

-- =====================================================
-- VALIDATION QUERIES (run these to verify migration)
-- =====================================================

-- Check new columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'buyer_profiles'
  AND column_name IN (
    'city', 'state', 'desired_territories', 'profile_photo_url',
    'years_of_experience', 'industry_experience', 'has_owned_business',
    'management_experience', 'current_employment_status', 'relevant_skills',
    'funding_plans', 'background_attested_at'
  )
ORDER BY column_name;

-- Check indexes created
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE tablename = 'buyer_profiles'
  AND indexname LIKE 'idx_buyer_profiles_%'
ORDER BY indexname;
