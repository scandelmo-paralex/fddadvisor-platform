-- Two-Product Architecture: FDDAdvisor + FDDHub
-- New tables to support separate product flows

-- ============================================================================
-- USER PROFILES WITH DEMOGRAPHICS (for FDDAdvisor signup)
-- ============================================================================

-- Add demographics fields to buyer_profiles for FDDAdvisor signup
ALTER TABLE buyer_profiles 
ADD COLUMN IF NOT EXISTS investment_range_min INTEGER,
ADD COLUMN IF NOT EXISTS investment_range_max INTEGER,
ADD COLUMN IF NOT EXISTS industries_interested TEXT[],
ADD COLUMN IF NOT EXISTS buying_timeline TEXT, -- '0-3 months', '3-6 months', '6-12 months', '12+ months'
ADD COLUMN IF NOT EXISTS current_occupation TEXT,
ADD COLUMN IF NOT EXISTS business_experience_years INTEGER,
ADD COLUMN IF NOT EXISTS has_franchise_experience BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS preferred_location TEXT,
ADD COLUMN IF NOT EXISTS signup_source TEXT DEFAULT 'fddadvisor'; -- 'fddadvisor' or 'fddhub'

-- ============================================================================
-- LEAD INVITATIONS (FDDHub franchisor sends FDD to lead)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchisor_id UUID NOT NULL REFERENCES franchisor_profiles(id) ON DELETE CASCADE,
  franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
  
  -- Lead contact info (before they sign up)
  lead_email TEXT NOT NULL,
  lead_name TEXT,
  lead_phone TEXT,
  
  -- Invitation details
  invitation_token TEXT UNIQUE NOT NULL, -- Unique token for magic link
  invitation_message TEXT, -- Optional personal message from franchisor
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'viewed', 'signed_up', 'expired')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  viewed_at TIMESTAMPTZ,
  signed_up_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- After signup, link to buyer profile
  buyer_id UUID REFERENCES buyer_profiles(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- LEAD FDD ACCESS (tracks which FDDs a lead can view in FDDHub)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_fdd_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES buyer_profiles(id) ON DELETE CASCADE,
  franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
  franchisor_id UUID NOT NULL REFERENCES franchisor_profiles(id) ON DELETE CASCADE,
  
  -- Access details
  granted_via TEXT NOT NULL CHECK (granted_via IN ('invitation', 'fddadvisor_signup')),
  invitation_id UUID REFERENCES lead_invitations(id) ON DELETE SET NULL,
  
  -- Viewing tracking
  first_viewed_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,
  total_views INTEGER DEFAULT 0,
  total_time_spent_seconds INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(buyer_id, franchise_id)
);

-- ============================================================================
-- WHITE LABEL SETTINGS (customize FDD Viewer per franchise)
-- ============================================================================

CREATE TABLE IF NOT EXISTS white_label_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchise_id UUID UNIQUE NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
  franchisor_id UUID NOT NULL REFERENCES franchisor_profiles(id) ON DELETE CASCADE,
  
  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#2563eb', -- Hex color
  accent_color TEXT DEFAULT '#10b981', -- Hex color
  header_text TEXT, -- Custom header text (e.g., "Welcome to [Brand Name]")
  
  -- Contact info override (shown in white-labeled viewer)
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_lead_invitations_franchisor_id ON lead_invitations(franchisor_id);
CREATE INDEX idx_lead_invitations_franchise_id ON lead_invitations(franchise_id);
CREATE INDEX idx_lead_invitations_email ON lead_invitations(lead_email);
CREATE INDEX idx_lead_invitations_token ON lead_invitations(invitation_token);
CREATE INDEX idx_lead_invitations_status ON lead_invitations(status);

CREATE INDEX idx_lead_fdd_access_buyer_id ON lead_fdd_access(buyer_id);
CREATE INDEX idx_lead_fdd_access_franchise_id ON lead_fdd_access(franchise_id);
CREATE INDEX idx_lead_fdd_access_franchisor_id ON lead_fdd_access(franchisor_id);

CREATE INDEX idx_white_label_settings_franchise_id ON white_label_settings(franchise_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE lead_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_fdd_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_label_settings ENABLE ROW LEVEL SECURITY;

-- Franchisors can manage their own invitations
CREATE POLICY "Franchisors can view own invitations" ON lead_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE franchisor_profiles.id = lead_invitations.franchisor_id
      AND franchisor_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Franchisors can create invitations" ON lead_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE franchisor_profiles.id = lead_invitations.franchisor_id
      AND franchisor_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Franchisors can update own invitations" ON lead_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE franchisor_profiles.id = lead_invitations.franchisor_id
      AND franchisor_profiles.user_id = auth.uid()
    )
  );

-- Buyers can view their own FDD access
CREATE POLICY "Buyers can view own FDD access" ON lead_fdd_access
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM buyer_profiles
      WHERE buyer_profiles.id = lead_fdd_access.buyer_id
      AND buyer_profiles.user_id = auth.uid()
    )
  );

-- Franchisors can view FDD access for their franchises
CREATE POLICY "Franchisors can view FDD access for their franchises" ON lead_fdd_access
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE franchisor_profiles.id = lead_fdd_access.franchisor_id
      AND franchisor_profiles.user_id = auth.uid()
    )
  );

-- Franchisors can manage their own white label settings
CREATE POLICY "Franchisors can manage white label settings" ON white_label_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE franchisor_profiles.id = white_label_settings.franchisor_id
      AND franchisor_profiles.user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_lead_invitations_updated_at BEFORE UPDATE ON lead_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_fdd_access_updated_at BEFORE UPDATE ON lead_fdd_access
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_white_label_settings_updated_at BEFORE UPDATE ON white_label_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to auto-create FDD access when invitation is accepted
CREATE OR REPLACE FUNCTION create_fdd_access_from_invitation()
RETURNS TRIGGER AS $$
BEGIN
  -- When invitation status changes to 'signed_up' and buyer_id is set
  IF NEW.status = 'signed_up' AND NEW.buyer_id IS NOT NULL AND OLD.buyer_id IS NULL THEN
    INSERT INTO lead_fdd_access (
      buyer_id,
      franchise_id,
      franchisor_id,
      granted_via,
      invitation_id
    ) VALUES (
      NEW.buyer_id,
      NEW.franchise_id,
      NEW.franchisor_id,
      'invitation',
      NEW.id
    )
    ON CONFLICT (buyer_id, franchise_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_fdd_access
  AFTER UPDATE ON lead_invitations
  FOR EACH ROW
  EXECUTE FUNCTION create_fdd_access_from_invitation();
