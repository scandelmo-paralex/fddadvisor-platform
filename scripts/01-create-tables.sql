-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USER PROFILES
-- =============================================

-- Franchisor profiles (can have multiple franchises/brands)
CREATE TABLE franchisor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Buyer profiles
CREATE TABLE buyer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Verification data (collected after FDD viewing)
  fico_score INTEGER,
  fico_verified_at TIMESTAMPTZ,
  liquid_capital INTEGER,
  net_worth INTEGER,
  plaid_connected BOOLEAN DEFAULT FALSE,
  plaid_verified_at TIMESTAMPTZ,
  background_check_completed BOOLEAN DEFAULT FALSE,
  background_check_verified_at TIMESTAMPTZ,
  
  -- Calculated field
  is_verified BOOLEAN GENERATED ALWAYS AS (
    fico_score IS NOT NULL AND 
    plaid_connected = TRUE AND 
    background_check_completed = TRUE
  ) STORED,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Lender profiles
CREATE TABLE lender_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  min_fico_score INTEGER DEFAULT 650,
  min_liquid_capital INTEGER DEFAULT 50000,
  max_loan_amount INTEGER,
  specialties TEXT[], -- e.g., ['QSR', 'Fitness', 'Retail']
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =============================================
-- FRANCHISES (FDD DATA)
-- =============================================

CREATE TABLE franchises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchisor_id UUID NOT NULL REFERENCES franchisor_profiles(id) ON DELETE CASCADE,
  
  -- Basic info
  brand_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  description TEXT,
  
  -- FDD document
  fdd_url TEXT NOT NULL, -- URL to PDF in storage
  fdd_uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Financial data
  franchise_fee INTEGER,
  total_investment_min INTEGER,
  total_investment_max INTEGER,
  liquid_capital_required INTEGER,
  net_worth_required INTEGER,
  royalty_percentage DECIMAL(5,2),
  
  -- System data
  total_units INTEGER,
  franchised_units INTEGER,
  company_owned_units INTEGER,
  year_founded INTEGER,
  
  -- Item 19 data (earnings)
  has_item_19 BOOLEAN DEFAULT FALSE,
  avg_revenue INTEGER,
  avg_ebitda INTEGER,
  
  -- FranchiseScore data
  franchise_score_total INTEGER,
  franchise_score_max INTEGER DEFAULT 200,
  system_stability_score INTEGER,
  support_quality_score INTEGER,
  growth_trajectory_score INTEGER,
  financial_disclosure_score INTEGER,
  industry_percentile INTEGER,
  
  -- AI-generated content
  quick_summary TEXT,
  opportunities TEXT[], -- Array of 3 opportunities
  concerns TEXT[], -- Array of 3 concerns
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LEADS (Buyer-Franchise Connections)
-- =============================================

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
  buyer_profile_id UUID REFERENCES buyer_profiles(id) ON DELETE CASCADE,
  franchisor_id UUID NOT NULL REFERENCES franchisor_profiles(id) ON DELETE CASCADE,
  
  -- Lead info (before signup)
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  
  -- FDD link
  fdd_link_id TEXT UNIQUE NOT NULL, -- Unique link for this lead
  
  -- Source and type
  source TEXT NOT NULL CHECK (source IN ('broker', 'website', 'referral', 'trade_show', 'other')),
  connection_type TEXT NOT NULL DEFAULT 'franchisor_initiated' CHECK (connection_type IN ('franchisor_initiated', 'buyer_initiated')),
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN (
    'invited',      -- FDD link sent, not signed up yet
    'signed_up',    -- Created account
    'viewing',      -- Viewing FDD
    'engaged',      -- Met engagement criteria
    'qualified',    -- Met engagement + verification criteria
    'negotiating',  -- In talks with franchisor
    'closed_won',   -- Deal closed
    'closed_lost'   -- Deal lost
  )),
  
  -- Engagement tracking
  total_time_spent INTEGER DEFAULT 0, -- seconds
  viewed_item_19 BOOLEAN DEFAULT FALSE,
  item_19_time_spent INTEGER DEFAULT 0, -- seconds
  answered_questions BOOLEAN DEFAULT FALSE,
  pdf_downloaded BOOLEAN DEFAULT FALSE,
  
  -- Qualification flags
  engagement_qualified BOOLEAN DEFAULT FALSE,
  verification_qualified BOOLEAN DEFAULT FALSE,
  is_qualified BOOLEAN GENERATED ALWAYS AS (
    engagement_qualified = TRUE AND verification_qualified = TRUE
  ) STORED,
  
  -- Timestamps
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  signed_up_at TIMESTAMPTZ,
  first_viewed_at TIMESTAMPTZ,
  qualified_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ENGAGEMENT EVENTS
-- =============================================

CREATE TABLE engagement_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL CHECK (event_type IN (
    'fdd_viewed',
    'section_viewed',
    'item_19_viewed',
    'question_asked',
    'pdf_downloaded',
    'verification_started',
    'verification_completed'
  )),
  
  metadata JSONB, -- Flexible data for each event type
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_engagement_events_lead_id ON engagement_events(lead_id);
CREATE INDEX idx_engagement_events_created_at ON engagement_events(created_at DESC);

-- =============================================
-- QUALIFICATION QUESTIONS
-- =============================================

CREATE TABLE qualification_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PRE-APPROVAL SYSTEM
-- =============================================

CREATE TABLE pre_approval_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  buyer_profile_id UUID NOT NULL REFERENCES buyer_profiles(id) ON DELETE CASCADE,
  lender_id UUID NOT NULL REFERENCES lender_profiles(id) ON DELETE CASCADE,
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
  
  -- Request data
  requested_amount INTEGER NOT NULL,
  message TEXT, -- Optional message from buyer
  
  -- Lender response
  lender_notes TEXT,
  approved_amount INTEGER,
  interest_rate DECIMAL(5,2),
  terms TEXT,
  
  -- Timestamps
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CLOSED DEALS (Commission Tracking)
-- =============================================

CREATE TABLE closed_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
  franchisor_id UUID NOT NULL REFERENCES franchisor_profiles(id) ON DELETE CASCADE,
  buyer_profile_id UUID NOT NULL REFERENCES buyer_profiles(id) ON DELETE CASCADE,
  
  -- Deal details
  franchise_fee INTEGER NOT NULL,
  total_investment INTEGER,
  
  -- Commission
  commission_percentage DECIMAL(5,2) DEFAULT 3.00, -- Default 3% of franchise fee
  commission_amount INTEGER GENERATED ALWAYS AS (
    CAST(franchise_fee * commission_percentage / 100 AS INTEGER)
  ) STORED,
  
  -- Payment tracking
  commission_paid BOOLEAN DEFAULT FALSE,
  commission_paid_at TIMESTAMPTZ,
  
  -- Timestamps
  closed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- NOTES (Buyer notes on franchises)
-- =============================================

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  buyer_profile_id UUID NOT NULL REFERENCES buyer_profiles(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_leads_franchise_id ON leads(franchise_id);
CREATE INDEX idx_leads_buyer_profile_id ON leads(buyer_profile_id);
CREATE INDEX idx_leads_franchisor_id ON leads(franchisor_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_fdd_link_id ON leads(fdd_link_id);

CREATE INDEX idx_franchises_franchisor_id ON franchises(franchisor_id);

CREATE INDEX idx_pre_approval_requests_lead_id ON pre_approval_requests(lead_id);
CREATE INDEX idx_pre_approval_requests_lender_id ON pre_approval_requests(lender_id);
CREATE INDEX idx_pre_approval_requests_status ON pre_approval_requests(status);
