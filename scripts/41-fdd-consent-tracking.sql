-- Create table for tracking FranchiseScore consent per FDD
-- Each buyer must consent to the disclaimer for each FDD they view

CREATE TABLE IF NOT EXISTS fdd_franchisescore_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fdd_id TEXT NOT NULL, -- The franchise slug or FDD identifier
  consented BOOLEAN DEFAULT FALSE,
  consented_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one consent record per user per FDD
  UNIQUE(user_id, fdd_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_fdd_consents_user_fdd ON fdd_franchisescore_consents(user_id, fdd_id);
CREATE INDEX IF NOT EXISTS idx_fdd_consents_fdd ON fdd_franchisescore_consents(fdd_id);

-- Enable RLS
ALTER TABLE fdd_franchisescore_consents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own consents"
  ON fdd_franchisescore_consents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consents"
  ON fdd_franchisescore_consents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consents"
  ON fdd_franchisescore_consents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_fdd_consent_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_fdd_consent_timestamp ON fdd_franchisescore_consents;
CREATE TRIGGER update_fdd_consent_timestamp
  BEFORE UPDATE ON fdd_franchisescore_consents
  FOR EACH ROW
  EXECUTE FUNCTION update_fdd_consent_updated_at();
