-- Add consent and Item 23 signature tracking to lead_fdd_access table
-- This tracks buyer compliance before viewing FDD

ALTER TABLE lead_fdd_access
ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS consent_given_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS consent_ip_address TEXT,
ADD COLUMN IF NOT EXISTS consent_user_agent TEXT,
ADD COLUMN IF NOT EXISTS item23_signed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS item23_signature_url TEXT,
ADD COLUMN IF NOT EXISTS item23_signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS item23_signature_ip_address TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'consent_given', 'signed', 'active'));

-- Update existing records to 'active' status if they have views
UPDATE lead_fdd_access 
SET status = 'active' 
WHERE first_viewed_at IS NOT NULL;

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_lead_fdd_access_status ON lead_fdd_access(status);

COMMENT ON COLUMN lead_fdd_access.consent_given IS 'Whether buyer consented to engagement tracking';
COMMENT ON COLUMN lead_fdd_access.item23_signed IS 'Whether buyer signed Item 23 receipt';
COMMENT ON COLUMN lead_fdd_access.status IS 'pending -> consent_given -> signed -> active';
