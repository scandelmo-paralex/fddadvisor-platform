-- FDDAdvisor Platform Database Schema v2
-- Fresh start with clean schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User roles enum
CREATE TYPE user_role AS ENUM ('buyer', 'franchisor', 'lender');

-- Lead status enum
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposal_sent', 'closed_won', 'closed_lost');

-- Engagement type enum
CREATE TYPE engagement_type AS ENUM ('email', 'call', 'meeting', 'document_shared', 'note');

-- ============================================================================
-- PROFILES TABLES
-- ============================================================================

-- Buyer profiles
CREATE TABLE buyer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  investment_range_min INTEGER,
  investment_range_max INTEGER,
  industries_of_interest TEXT[],
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
