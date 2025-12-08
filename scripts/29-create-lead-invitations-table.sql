-- Create lead_invitations table for FDD invitation tracking
CREATE TABLE IF NOT EXISTS lead_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchisor_id UUID NOT NULL REFERENCES franchisor_profiles(id) ON DELETE CASCADE,
  franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
  lead_email TEXT NOT NULL,
  lead_name TEXT NOT NULL,
  lead_phone TEXT,
  invitation_token TEXT UNIQUE NOT NULL,
  invitation_message TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'viewed', 'accepted', 'declined', 'expired')),
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_invitations_franchisor_id ON lead_invitations(franchisor_id);
CREATE INDEX IF NOT EXISTS idx_lead_invitations_franchise_id ON lead_invitations(franchise_id);
CREATE INDEX IF NOT EXISTS idx_lead_invitations_email ON lead_invitations(lead_email);
CREATE INDEX IF NOT EXISTS idx_lead_invitations_token ON lead_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_lead_invitations_status ON lead_invitations(status);

-- Enable RLS
ALTER TABLE lead_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Franchisors can manage their own invitations
CREATE POLICY "Franchisors can manage own invitations" ON lead_invitations
FOR ALL
USING (
  franchisor_id IN (
    SELECT id FROM franchisor_profiles WHERE user_id = auth.uid()
  )
);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lead_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lead_invitations_updated_at 
BEFORE UPDATE ON lead_invitations
FOR EACH ROW
EXECUTE FUNCTION update_lead_invitations_updated_at();
