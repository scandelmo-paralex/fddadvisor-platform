-- Add buyer qualification fields for self-reported profile data
-- These fields are required before accessing my-fdds page

-- Add FICO score range
ALTER TABLE buyer_profiles 
ADD COLUMN IF NOT EXISTS fico_score_range TEXT;

-- Add liquid assets range
ALTER TABLE buyer_profiles 
ADD COLUMN IF NOT EXISTS liquid_assets_range TEXT;

-- Add net worth range
ALTER TABLE buyer_profiles 
ADD COLUMN IF NOT EXISTS net_worth_range TEXT;

-- Add funding plan
ALTER TABLE buyer_profiles 
ADD COLUMN IF NOT EXISTS funding_plan TEXT;

-- Add LinkedIn profile URL
ALTER TABLE buyer_profiles 
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Add background check attestations
ALTER TABLE buyer_profiles 
ADD COLUMN IF NOT EXISTS no_felony_attestation BOOLEAN DEFAULT FALSE;

ALTER TABLE buyer_profiles 
ADD COLUMN IF NOT EXISTS no_bankruptcy_attestation BOOLEAN DEFAULT FALSE;

-- Add profile completion timestamp (null = incomplete)
ALTER TABLE buyer_profiles 
ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN buyer_profiles.fico_score_range IS 'Self-reported FICO score range: Under 580, 580-619, 620-679, 680-719, 720-779, 780+';
COMMENT ON COLUMN buyer_profiles.liquid_assets_range IS 'Self-reported liquid assets: Under $25k, $25-50k, $50-100k, $100-250k, $250-500k, $500k+';
COMMENT ON COLUMN buyer_profiles.net_worth_range IS 'Self-reported net worth: Under $100k, $100-250k, $250-500k, $500k-1M, $1-2M, $2M+';
COMMENT ON COLUMN buyer_profiles.funding_plan IS 'Planned funding source: Cash, SBA, 401(k) Rollover, HELOC, Partner/Investors';
COMMENT ON COLUMN buyer_profiles.linkedin_url IS 'LinkedIn profile URL';
COMMENT ON COLUMN buyer_profiles.no_felony_attestation IS 'Self-attestation: No felony conviction in past 10 years';
COMMENT ON COLUMN buyer_profiles.no_bankruptcy_attestation IS 'Self-attestation: No bankruptcy in past 7 years';
COMMENT ON COLUMN buyer_profiles.profile_completed_at IS 'Timestamp when all required profile fields were completed';
