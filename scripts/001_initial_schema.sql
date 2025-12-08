-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('buyer', 'franchisor', 'lender', 'admin');
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'canceled');
CREATE TYPE subscription_tier AS ENUM ('starter', 'growth', 'enterprise');
CREATE TYPE lead_source AS ENUM ('FDDAdvisor', 'Broker', 'Website', 'Referral', 'Trade Show', 'Other');
CREATE TYPE lead_stage AS ENUM ('inquiry', 'researching', 'qualified', 'connected', 'negotiating', 'closing', 'closed', 'lost');
CREATE TYPE pre_approval_status AS ENUM ('not_started', 'pending', 'approved', 'declined');
CREATE TYPE lender_response_status AS ENUM ('pending', 'approved', 'declined');
CREATE TYPE verification_status AS ENUM ('not_started', 'pending', 'verified', 'failed');
CREATE TYPE credit_range AS ENUM ('Excellent', 'Good', 'Fair', 'Poor');
CREATE TYPE invoice_status AS ENUM ('pending', 'invoiced', 'paid');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buyer profiles
CREATE TABLE public.buyer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  location TEXT,
  
  -- Financial qualifications
  liquid_capital DECIMAL(12, 2),
  liquid_capital_verified BOOLEAN DEFAULT FALSE,
  capital_verified_at TIMESTAMPTZ,
  capital_verification_expiry TIMESTAMPTZ,
  plaid_access_token TEXT, -- encrypted
  
  net_worth DECIMAL(12, 2),
  
  credit_score INTEGER,
  credit_score_range credit_range,
  credit_score_verified BOOLEAN DEFAULT FALSE,
  credit_verified_at TIMESTAMPTZ,
  credit_verification_expiry TIMESTAMPTZ,
  
  background_check verification_status DEFAULT 'not_started',
  background_check_date TIMESTAMPTZ,
  
  -- Business experience
  years_experience INTEGER,
  industries TEXT[],
  management_experience BOOLEAN DEFAULT FALSE,
  
  -- Preferences
  industries_of_interest TEXT[],
  min_investment DECIMAL(12, 2),
  max_investment DECIMAL(12, 2),
  timeline TEXT,
  
  -- Privacy settings
  share_financial_info BOOLEAN DEFAULT TRUE,
  allow_contact BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Franchisor profiles
CREATE TABLE public.franchisor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  
  -- Contact details
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  
  -- Subscription
  subscription_status subscription_status DEFAULT 'trial',
  subscription_tier subscription_tier DEFAULT 'starter',
  subscription_start_date TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  stripe_customer_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lender profiles
CREATE TABLE public.lender_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  
  -- Lending criteria
  min_credit_score INTEGER,
  min_liquid_capital DECIMAL(12, 2),
  max_loan_amount DECIMAL(12, 2),
  industries_served TEXT[],
  
  -- Contact details
  loan_officer_name TEXT,
  loan_officer_email TEXT,
  loan_officer_phone TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Franchises
CREATE TABLE public.franchises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchisor_id UUID NOT NULL REFERENCES public.franchisor_profiles(id) ON DELETE CASCADE,
  
  -- Basic info
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  
  -- Investment details
  min_investment DECIMAL(12, 2) NOT NULL,
  max_investment DECIMAL(12, 2) NOT NULL,
  franchise_fee DECIMAL(12, 2) NOT NULL,
  royalty_rate DECIMAL(5, 2),
  
  -- Support
  training_provided TEXT,
  marketing_support TEXT,
  territory_protection BOOLEAN DEFAULT FALSE,
  
  -- Requirements
  experience_required TEXT,
  min_liquid_capital DECIMAL(12, 2),
  min_credit_score INTEGER,
  
  -- FDD
  fdd_url TEXT,
  fdd_upload_date TIMESTAMPTZ,
  fdd_expiration_date TIMESTAMPTZ,
  has_item_19 BOOLEAN DEFAULT FALSE,
  
  -- Status
  status TEXT DEFAULT 'draft', -- draft, active, archived
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES public.buyer_profiles(id) ON DELETE CASCADE,
  franchise_id UUID NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  franchisor_id UUID NOT NULL REFERENCES public.franchisor_profiles(id) ON DELETE CASCADE,
  
  -- Lead details
  lead_source lead_source NOT NULL,
  lead_stage lead_stage DEFAULT 'inquiry',
  quality_score INTEGER DEFAULT 0, -- 0-100
  
  -- Qualification tracking
  questions_asked INTEGER DEFAULT 0,
  item_19_viewed BOOLEAN DEFAULT FALSE,
  time_spent_seconds INTEGER DEFAULT 0,
  is_qualified BOOLEAN DEFAULT FALSE,
  qualified_at TIMESTAMPTZ,
  
  -- Connection
  connected BOOLEAN DEFAULT FALSE,
  connected_at TIMESTAMPTZ,
  
  -- Timestamps
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(buyer_id, franchise_id)
);

-- Engagement tracking
CREATE TABLE public.engagement_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL, -- fdd_opened, section_viewed, question_asked, note_created, item_19_viewed
  event_data JSONB, -- flexible storage for event-specific data
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.buyer_profiles(id) ON DELETE CASCADE,
  franchise_id UUID NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  
  question_text TEXT NOT NULL,
  answer_text TEXT,
  answered_by TEXT, -- 'ai' or 'franchisor'
  answered_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-approvals
CREATE TABLE public.pre_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES public.buyer_profiles(id) ON DELETE CASCADE,
  franchise_id UUID NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  
  overall_status pre_approval_status DEFAULT 'pending',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(buyer_id, franchise_id)
);

-- Pre-approval lender responses
CREATE TABLE public.pre_approval_lenders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pre_approval_id UUID NOT NULL REFERENCES public.pre_approvals(id) ON DELETE CASCADE,
  lender_id UUID NOT NULL REFERENCES public.lender_profiles(id) ON DELETE CASCADE,
  
  status lender_response_status DEFAULT 'pending',
  approved_amount DECIMAL(12, 2),
  terms TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(pre_approval_id, lender_id)
);

-- Closed deals
CREATE TABLE public.closed_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  franchise_id UUID NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  franchisor_id UUID NOT NULL REFERENCES public.franchisor_profiles(id) ON DELETE CASCADE,
  
  close_date DATE NOT NULL,
  franchise_fee DECIMAL(12, 2) NOT NULL,
  lead_source lead_source NOT NULL,
  commission_rate DECIMAL(5, 4) NOT NULL, -- 0.05 or 0.10
  commission_amount DECIMAL(12, 2) NOT NULL,
  
  invoice_status invoice_status DEFAULT 'pending',
  stripe_invoice_id TEXT,
  paid_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved franchises (buyer's saved list)
CREATE TABLE public.saved_franchises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES public.buyer_profiles(id) ON DELETE CASCADE,
  franchise_id UUID NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(buyer_id, franchise_id)
);

-- Create indexes for performance
CREATE INDEX idx_leads_buyer_id ON public.leads(buyer_id);
CREATE INDEX idx_leads_franchise_id ON public.leads(franchise_id);
CREATE INDEX idx_leads_franchisor_id ON public.leads(franchisor_id);
CREATE INDEX idx_leads_stage ON public.leads(lead_stage);
CREATE INDEX idx_leads_qualified ON public.leads(is_qualified);
CREATE INDEX idx_engagement_events_lead_id ON public.engagement_events(lead_id);
CREATE INDEX idx_questions_lead_id ON public.questions(lead_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_saved_franchises_buyer_id ON public.saved_franchises(buyer_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.franchisor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lender_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pre_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pre_approval_lenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.closed_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_franchises ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic - can be refined later)

-- Users can read their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Buyers can manage their own profile
CREATE POLICY "Buyers can view own profile" ON public.buyer_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Buyers can update own profile" ON public.buyer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Franchisors can manage their own profile
CREATE POLICY "Franchisors can view own profile" ON public.franchisor_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Franchisors can update own profile" ON public.franchisor_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Franchises are publicly viewable, but only franchisors can manage their own
CREATE POLICY "Anyone can view active franchises" ON public.franchises
  FOR SELECT USING (status = 'active');
CREATE POLICY "Franchisors can manage own franchises" ON public.franchises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.franchisor_profiles
      WHERE franchisor_profiles.id = franchises.franchisor_id
      AND franchisor_profiles.user_id = auth.uid()
    )
  );

-- Leads: Buyers see their own, franchisors see their franchise's leads
CREATE POLICY "Buyers can view own leads" ON public.leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.buyer_profiles
      WHERE buyer_profiles.id = leads.buyer_id
      AND buyer_profiles.user_id = auth.uid()
    )
  );
CREATE POLICY "Franchisors can view franchise leads" ON public.leads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.franchisor_profiles
      WHERE franchisor_profiles.id = leads.franchisor_id
      AND franchisor_profiles.user_id = auth.uid()
    )
  );

-- Notifications: Users can only see their own
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Saved franchises: Buyers can manage their own
CREATE POLICY "Buyers can manage saved franchises" ON public.saved_franchises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.buyer_profiles
      WHERE buyer_profiles.id = saved_franchises.buyer_id
      AND buyer_profiles.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_buyer_profiles_updated_at BEFORE UPDATE ON public.buyer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_franchisor_profiles_updated_at BEFORE UPDATE ON public.franchisor_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lender_profiles_updated_at BEFORE UPDATE ON public.lender_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_franchises_updated_at BEFORE UPDATE ON public.franchises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
