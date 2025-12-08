-- ============================================================================
-- COMPLETE DATABASE SETUP FOR FDDADVISOR + FDDHUB
-- Run this script once in Supabase SQL Editor to set up everything
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('buyer', 'franchisor', 'lender');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposal_sent', 'closed_won', 'closed_lost');
CREATE TYPE engagement_type AS ENUM ('email', 'call', 'meeting', 'document_shared', 'note');

-- ============================================================================
-- PROFILES TABLES
-- ============================================================================

-- Buyer profiles (with demographics for FDDAdvisor)
CREATE TABLE buyer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  
  -- Demographics for FDDAdvisor signup
  investment_range_min INTEGER,
  investment_range_max INTEGER,
  industries_interested TEXT[],
  buying_timeline TEXT, -- '0-3 months', '3-6 months', '6-12 months', '12+ months'
  current_occupation TEXT,
  business_experience_years INTEGER,
  has_franchise_experience BOOLEAN DEFAULT FALSE,
  preferred_location TEXT,
  signup_source TEXT DEFAULT 'fddadvisor', -- 'fddadvisor' or 'fddhub'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Franchisor profiles
CREATE TABLE franchisor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  item_23_receipt_url TEXT, -- For disclosure tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lender profiles
CREATE TABLE lender_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FRANCHISE LISTINGS
-- ============================================================================

CREATE TABLE franchises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchisor_id UUID REFERENCES franchisor_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  description TEXT,
  initial_investment_min INTEGER,
  initial_investment_max INTEGER,
  franchise_fee INTEGER,
  royalty_percentage DECIMAL(5,2),
  territories_available INTEGER,
  website TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- LEADS & ENGAGEMENT
-- ============================================================================

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchisor_id UUID REFERENCES franchisor_profiles(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES buyer_profiles(id) ON DELETE CASCADE,
  franchise_id UUID REFERENCES franchises(id) ON DELETE SET NULL,
  status lead_status DEFAULT 'new',
  source TEXT,
  notes TEXT,
  
  -- Disclosure tracking
  disclosure_status TEXT DEFAULT 'sent' CHECK (disclosure_status IN ('sent', 'received')),
  item_23_signed_at TIMESTAMPTZ,
  item_23_complete_copy_url TEXT,
  item_23_franchisor_copy_url TEXT,
  item_23_buyer_copy_url TEXT,
  item_23_signature_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE engagement_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  event_type engagement_type NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FDD DISCLOSURES
-- ============================================================================

CREATE TABLE fdd_disclosures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL,
  franchise_id UUID NOT NULL,
  franchisor_id UUID NOT NULL,
  disclosure_status TEXT NOT NULL DEFAULT 'sent' CHECK (disclosure_status IN ('sent', 'received')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  item_23_signed_at TIMESTAMPTZ,
  item_23_complete_copy_url TEXT,
  item_23_franchisor_copy_url TEXT,
  item_23_buyer_copy_url TEXT,
  item_23_signature_id TEXT,
  unique_link_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SHARED ACCESS (team collaboration)
-- ============================================================================

CREATE TABLE shared_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchisor_id UUID NOT NULL REFERENCES franchisor_profiles(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  shared_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(franchisor_id, shared_with_email)
);

-- ============================================================================
-- TWO-PRODUCT ARCHITECTURE: LEAD INVITATIONS (FDDHub)
-- ============================================================================

CREATE TABLE lead_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchisor_id UUID NOT NULL REFERENCES franchisor_profiles(id) ON DELETE CASCADE,
  franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
  
  -- Lead contact info (before they sign up)
  lead_email TEXT NOT NULL,
  lead_name TEXT,
  lead_phone TEXT,
  
  -- Invitation details
  invitation_token TEXT UNIQUE NOT NULL,
  invitation_message TEXT,
  
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
-- LEAD FDD ACCESS (tracks which FDDs a lead can view)
-- ============================================================================

CREATE TABLE lead_fdd_access (
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

CREATE TABLE white_label_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchise_id UUID UNIQUE NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
  franchisor_id UUID NOT NULL REFERENCES franchisor_profiles(id) ON DELETE CASCADE,
  
  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#2563eb',
  accent_color TEXT DEFAULT '#10b981',
  header_text TEXT,
  
  -- Contact info override
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- LENDER FEATURES
-- ============================================================================

CREATE TABLE pre_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lender_id UUID REFERENCES lender_profiles(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES buyer_profiles(id) ON DELETE CASCADE,
  approved_amount INTEGER NOT NULL,
  interest_rate DECIMAL(5,2),
  term_months INTEGER,
  conditions TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_buyer_profiles_user_id ON buyer_profiles(user_id);
CREATE INDEX idx_franchisor_profiles_user_id ON franchisor_profiles(user_id);
CREATE INDEX idx_lender_profiles_user_id ON lender_profiles(user_id);
CREATE INDEX idx_franchises_franchisor_id ON franchises(franchisor_id);
CREATE INDEX idx_leads_franchisor_id ON leads(franchisor_id);
CREATE INDEX idx_leads_buyer_id ON leads(buyer_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_engagement_events_lead_id ON engagement_events(lead_id);
CREATE INDEX idx_fdd_disclosures_lead_id ON fdd_disclosures(lead_id);
CREATE INDEX idx_fdd_disclosures_franchisor_id ON fdd_disclosures(franchisor_id);
CREATE INDEX idx_fdd_disclosures_token ON fdd_disclosures(unique_link_token);
CREATE INDEX idx_shared_access_email ON shared_access(shared_with_email);
CREATE INDEX idx_shared_access_franchisor ON shared_access(franchisor_id);
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
-- UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_buyer_profiles_updated_at BEFORE UPDATE ON buyer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_franchisor_profiles_updated_at BEFORE UPDATE ON franchisor_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lender_profiles_updated_at BEFORE UPDATE ON lender_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_franchises_updated_at BEFORE UPDATE ON franchises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fdd_disclosures_updated_at BEFORE UPDATE ON fdd_disclosures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_invitations_updated_at BEFORE UPDATE ON lead_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_fdd_access_updated_at BEFORE UPDATE ON lead_fdd_access
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_white_label_settings_updated_at BEFORE UPDATE ON white_label_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchisor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lender_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fdd_disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_fdd_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_label_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_approvals ENABLE ROW LEVEL SECURITY;

-- Buyer Profiles
CREATE POLICY "Buyers can view own profile" ON buyer_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Buyers can update own profile" ON buyer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Buyers can insert own profile" ON buyer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Franchisor Profiles
CREATE POLICY "Franchisors can view own profile" ON franchisor_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Franchisors can update own profile" ON franchisor_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Franchisors can insert own profile" ON franchisor_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Franchises
CREATE POLICY "Franchisors can manage own franchises" ON franchises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE id = franchises.franchisor_id
      AND user_id = auth.uid()
    )
  );

-- Leads
CREATE POLICY "Franchisors can manage own leads" ON leads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE id = leads.franchisor_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can view own leads" ON leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM buyer_profiles
      WHERE id = leads.buyer_id
      AND user_id = auth.uid()
    )
  );

-- FDD Disclosures
CREATE POLICY "Franchisors can view own disclosures" ON fdd_disclosures
  FOR SELECT USING (
    franchisor_id IN (SELECT id FROM franchisor_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Buyers can view own disclosures" ON fdd_disclosures
  FOR SELECT USING (
    lead_id IN (SELECT id FROM buyer_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Buyers can update own disclosure status" ON fdd_disclosures
  FOR UPDATE USING (
    lead_id IN (SELECT id FROM buyer_profiles WHERE user_id = auth.uid())
  );

-- Shared Access
CREATE POLICY "Franchisors can manage own shared access" ON shared_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE franchisor_profiles.id = shared_access.franchisor_id
      AND franchisor_profiles.user_id = auth.uid()
    )
  );

-- Lead Invitations
CREATE POLICY "Franchisors can manage own invitations" ON lead_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE franchisor_profiles.id = lead_invitations.franchisor_id
      AND franchisor_profiles.user_id = auth.uid()
    )
  );

-- Lead FDD Access
CREATE POLICY "Buyers can view own FDD access" ON lead_fdd_access
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM buyer_profiles
      WHERE buyer_profiles.id = lead_fdd_access.buyer_id
      AND buyer_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Franchisors can view FDD access for their franchises" ON lead_fdd_access
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE franchisor_profiles.id = lead_fdd_access.franchisor_id
      AND franchisor_profiles.user_id = auth.uid()
    )
  );

-- White Label Settings
CREATE POLICY "Franchisors can manage white label settings" ON white_label_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE franchisor_profiles.id = white_label_settings.franchisor_id
      AND franchisor_profiles.user_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Auto-create FDD access when invitation is accepted
CREATE OR REPLACE FUNCTION create_fdd_access_from_invitation()
RETURNS TRIGGER AS $$
BEGIN
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

-- ============================================================================
-- COMPLETE! Your database is now ready for FDDAdvisor + FDDHub
-- ============================================================================
