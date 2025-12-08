-- Add consent columns to buyer_profiles table
-- franchisescore_consent_accepted: For FranchiseScore disclaimer agreement
-- tos_privacy_accepted: For Terms of Service and Privacy Policy acceptance during signup
-- tos_privacy_accepted_at: Timestamp when TOS/Privacy was accepted

ALTER TABLE buyer_profiles 
ADD COLUMN IF NOT EXISTS franchisescore_consent_accepted BOOLEAN DEFAULT FALSE;

ALTER TABLE buyer_profiles 
ADD COLUMN IF NOT EXISTS franchisescore_consent_accepted_at TIMESTAMPTZ;

ALTER TABLE buyer_profiles 
ADD COLUMN IF NOT EXISTS tos_privacy_accepted BOOLEAN DEFAULT FALSE;

ALTER TABLE buyer_profiles 
ADD COLUMN IF NOT EXISTS tos_privacy_accepted_at TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN buyer_profiles.franchisescore_consent_accepted IS 'Whether buyer has accepted the FranchiseScore disclaimer';
COMMENT ON COLUMN buyer_profiles.franchisescore_consent_accepted_at IS 'Timestamp when FranchiseScore disclaimer was accepted';
COMMENT ON COLUMN buyer_profiles.tos_privacy_accepted IS 'Whether buyer has accepted Terms of Service and Privacy Policy';
COMMENT ON COLUMN buyer_profiles.tos_privacy_accepted_at IS 'Timestamp when TOS/Privacy was accepted';
