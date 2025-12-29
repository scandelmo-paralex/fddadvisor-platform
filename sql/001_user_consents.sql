-- ============================================================================
-- USER CONSENTS TABLE
-- Tracks user acceptance of Terms of Service and Privacy Policy
-- ============================================================================

-- Create the user_consents table
CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Terms of Service consent
  tos_accepted BOOLEAN DEFAULT FALSE,
  tos_accepted_at TIMESTAMPTZ,
  tos_version VARCHAR(20) DEFAULT '1.0',
  
  -- Privacy Policy consent
  privacy_accepted BOOLEAN DEFAULT FALSE,
  privacy_accepted_at TIMESTAMPTZ,
  privacy_version VARCHAR(20) DEFAULT '1.0',
  
  -- Metadata for audit trail
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one consent record per user
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);

-- Enable Row Level Security
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for clean re-run)
DROP POLICY IF EXISTS "Users can view own consents" ON user_consents;
DROP POLICY IF EXISTS "Users can insert own consents" ON user_consents;
DROP POLICY IF EXISTS "Users can update own consents" ON user_consents;

-- Policy: Users can view their own consent records
CREATE POLICY "Users can view own consents"
  ON user_consents
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own consent records  
-- Note: During signup, service role key is used which bypasses RLS
-- This policy is for any future client-side consent updates
CREATE POLICY "Users can insert own consents"
  ON user_consents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own consent records
-- For re-accepting updated ToS/Privacy Policy versions
CREATE POLICY "Users can update own consents"
  ON user_consents
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_consents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS user_consents_updated_at ON user_consents;

CREATE TRIGGER user_consents_updated_at
  BEFORE UPDATE ON user_consents
  FOR EACH ROW
  EXECUTE FUNCTION update_user_consents_updated_at();

-- Add comment for documentation
COMMENT ON TABLE user_consents IS 'Tracks user acceptance of Terms of Service and Privacy Policy with version tracking for re-acceptance after policy updates';

-- ============================================================================
-- USAGE NOTES:
-- ============================================================================
-- 1. During signup, consent records are inserted using service role key
--    (which bypasses RLS automatically in Supabase)
-- 2. Users can view/update their own consent via authenticated sessions
-- 3. Version tracking allows re-prompting users when ToS/Privacy updates
-- 4. ip_address and user_agent fields are optional audit trail data
-- ============================================================================
