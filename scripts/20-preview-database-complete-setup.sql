-- ============================================================================
-- COMPLETE PREVIEW DATABASE SETUP
-- This script sets up the entire database for the v0 preview environment
-- Run this once in the Supabase SQL Editor
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 1: CREATE BASE SCHEMA
-- ============================================================================

-- Create enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('buyer', 'franchisor', 'lender');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposal_sent', 'closed_won', 'closed_lost');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE engagement_type AS ENUM ('email', 'call', 'meeting', 'document_shared', 'note');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create users table (links to auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'buyer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buyer profiles
CREATE TABLE IF NOT EXISTS buyer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  investment_range_min INTEGER,
  investment_range_max INTEGER,
  industries_interested TEXT[],
  buying_timeline TEXT,
  current_occupation TEXT,
  business_experience_years INTEGER,
  has_franchise_experience BOOLEAN DEFAULT FALSE,
  preferred_location TEXT,
  signup_source TEXT DEFAULT 'fddadvisor',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Franchisor profiles
CREATE TABLE IF NOT EXISTS franchisor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  phone TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lender profiles
CREATE TABLE IF NOT EXISTS lender_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  loan_officer_name TEXT,
  loan_officer_email TEXT,
  phone TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: CREATE FRANCHISES TABLE WITH DEEPSEEK SCHEMA
-- ============================================================================

-- Drop existing franchises table if it exists
DROP TABLE IF EXISTS franchises CASCADE;

-- Create franchises table with DeepSeek R1 analysis fields
CREATE TABLE franchises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  
  -- FranchiseScore components
  franchise_score INTEGER,
  score_financial_performance INTEGER,
  score_business_model INTEGER,
  score_support_training INTEGER,
  score_legal_compliance INTEGER,
  score_franchisee_satisfaction INTEGER,
  
  -- Opportunities and Concerns (JSONB arrays)
  opportunities JSONB DEFAULT '[]'::jsonb,
  concerns JSONB DEFAULT '[]'::jsonb,
  
  -- Investment Details
  initial_investment_low INTEGER,
  initial_investment_high INTEGER,
  franchise_fee INTEGER,
  royalty_fee TEXT,
  marketing_fee TEXT,
  
  -- Item 19 Financial Data
  item19_revenue_low INTEGER,
  item19_revenue_high INTEGER,
  item19_revenue_median INTEGER,
  item19_profit_margin DECIMAL(5,2),
  item19_sample_size INTEGER,
  item19_disclosure_quality TEXT,
  
  -- Unit Counts
  total_units INTEGER,
  franchised_units INTEGER,
  company_owned_units INTEGER,
  units_opened_last_year INTEGER,
  units_closed_last_year INTEGER,
  
  -- Legal History
  litigation_count INTEGER DEFAULT 0,
  bankruptcy_count INTEGER DEFAULT 0,
  
  -- Additional Data
  competitive_advantages JSONB DEFAULT '[]'::jsonb,
  training_details TEXT,
  territory_info TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_franchises_name ON franchises(name);
CREATE INDEX IF NOT EXISTS idx_franchises_score ON franchises(franchise_score DESC);
CREATE INDEX IF NOT EXISTS idx_buyer_profiles_user_id ON buyer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_franchisor_profiles_user_id ON franchisor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_lender_profiles_user_id ON lender_profiles(user_id);

-- ============================================================================
-- STEP 3: INSERT TEST FRANCHISES
-- ============================================================================

INSERT INTO franchises (
  name, description, industry, franchise_score,
  score_financial_performance, score_business_model, score_support_training,
  score_legal_compliance, score_franchisee_satisfaction,
  opportunities, concerns,
  initial_investment_low, initial_investment_high, franchise_fee,
  royalty_fee, marketing_fee,
  total_units, franchised_units, company_owned_units,
  units_opened_last_year, units_closed_last_year,
  litigation_count, bankruptcy_count,
  competitive_advantages
) VALUES
-- 7-Eleven
(
  '7-Eleven',
  'Convenience store chain operating 24/7',
  'Convenience Store / Retail',
  320,
  64, 56, 60, 80, 60,
  '[
    {"title": "Strong Brand Recognition and Market Position", "description": "7-Eleven is the largest convenience store chain", "rating": "High", "citations": ["Page 1"]},
    {"title": "Comprehensive Training and Support", "description": "Extensive training program for franchisees", "rating": "High", "citations": ["Page 15"]},
    {"title": "Flexible Franchise Models", "description": "Multiple franchise options available", "rating": "Medium", "citations": ["Page 6"]}
  ]'::jsonb,
  '[
    {"title": "No Item 19 Financial Performance Disclosure", "description": "7-Eleven does not provide financial performance representations", "rating": "High", "citations": ["Page 19"]},
    {"title": "High Initial Investment", "description": "Total investment ranges from $50,000 to $1,600,000", "rating": "High", "citations": ["Page 7"]},
    {"title": "Significant Litigation History", "description": "Multiple litigation cases disclosed", "rating": "Medium", "citations": ["Page 2-3"]}
  ]'::jsonb,
  50000, 1600000, 0,
  'Varies by store type', 'Varies',
  13000, 9800, 3200,
  NULL, NULL,
  45, 0,
  '[
    "Largest convenience store chain with strong brand recognition",
    "24/7 operating model provides consistent revenue stream",
    "Comprehensive support and training programs"
  ]'::jsonb
),
-- Burger King
(
  'Burger King',
  'Global fast-food chain specializing in flame-grilled burgers',
  'Quick Service Restaurant (QSR)',
  312,
  60, 52, 60, 80, 60,
  '[
    {"title": "Strong Brand Recognition", "description": "Burger King is the second-largest hamburger chain globally", "rating": "High", "citations": ["Page 1"]},
    {"title": "Comprehensive Training Program", "description": "Franchisees receive extensive training", "rating": "High", "citations": ["Page 15"]},
    {"title": "Flexible Restaurant Formats", "description": "Multiple restaurant formats available", "rating": "Medium", "citations": ["Page 8"]}
  ]'::jsonb,
  '[
    {"title": "No Item 19 Financial Performance Disclosure", "description": "Burger King does not provide financial performance representations", "rating": "High", "citations": ["Page 19"]},
    {"title": "High Initial Investment", "description": "Total investment ranges from $333,100 to $3,595,600", "rating": "High", "citations": ["Page 7"]},
    {"title": "Significant Litigation History", "description": "98 litigation cases in the past fiscal year", "rating": "Medium", "citations": ["Page 2"]}
  ]'::jsonb,
  333100, 3595600, 50000,
  '4.5% of Gross Sales', '4% of Gross Sales',
  7167, 6817, 350,
  NULL, NULL,
  98, 0,
  '[
    "Second-largest hamburger chain globally with strong brand recognition",
    "Flame-grilling cooking method differentiates from competitors",
    "Comprehensive training and ongoing support programs"
  ]'::jsonb
),
-- KFC Non-Traditional
(
  'KFC Non-Traditional',
  'Non-traditional KFC locations in venues like airports, universities, and travel centers',
  'Quick Service Restaurant (QSR) - Non-Traditional',
  360,
  80, 60, 60, 80, 80,
  '[
    {"title": "Strong Brand Recognition", "description": "KFC is a globally recognized brand", "rating": "High", "citations": ["Page 1"]},
    {"title": "Item 19 Financial Performance Disclosure", "description": "KFC provides detailed financial performance data", "rating": "High", "citations": ["Page 19"]},
    {"title": "Flexible Non-Traditional Formats", "description": "Multiple venue options for non-traditional locations", "rating": "High", "citations": ["Page 6"]}
  ]'::jsonb,
  '[
    {"title": "Limited Territory Availability", "description": "Non-traditional locations depend on venue availability", "rating": "Medium", "citations": ["Page 8"]},
    {"title": "Venue-Specific Restrictions", "description": "Operating restrictions based on host venue requirements", "rating": "Medium", "citations": ["Page 9"]},
    {"title": "Higher Royalty Fees", "description": "5% royalty fee plus 5% advertising fee", "rating": "Low", "citations": ["Page 7"]}
  ]'::jsonb,
  200000, 1500000, 45000,
  '5% of Gross Sales', '5% of Gross Sales',
  4500, 4200, 300,
  250, 50,
  12, 0,
  '[
    "Globally recognized KFC brand with strong customer loyalty",
    "Captive audience in non-traditional venues",
    "Transparent financial performance disclosure (Item 19)"
  ]'::jsonb
),
-- McDonald's
(
  E'McDonald\'s',
  'Global fast-food chain known for burgers, fries, and breakfast items',
  'Quick Service Restaurant (QSR)',
  268,
  40, 48, 60, 80, 40,
  '[
    {"title": "Unparalleled Brand Recognition", "description": "McDonald''s is the world''s largest restaurant chain", "rating": "High", "citations": ["Page 1"]},
    {"title": "Comprehensive Training Program", "description": "Extensive training at Hamburger University", "rating": "High", "citations": ["Page 15"]},
    {"title": "Strong Supply Chain and Vendor Network", "description": "Established relationships with approved suppliers", "rating": "High", "citations": ["Page 11"]}
  ]'::jsonb,
  '[
    {"title": "No Item 19 Financial Performance Disclosure", "description": "McDonald''s does not provide financial performance representations", "rating": "High", "citations": ["Page 19"]},
    {"title": "Extremely High Initial Investment", "description": "Total investment ranges from $1,314,500 to $2,313,295", "rating": "High", "citations": ["Page 7"]},
    {"title": "Significant Litigation History", "description": "Multiple litigation cases disclosed", "rating": "Medium", "citations": ["Page 2-3"]}
  ]'::jsonb,
  1314500, 2313295, 45000,
  '4% of Gross Sales', '4% of Gross Sales',
  40275, 36059, 4216,
  NULL, NULL,
  67, 0,
  '[
    "World''s largest restaurant chain with unmatched brand recognition",
    "Proven business model with decades of success",
    "Comprehensive training and support infrastructure"
  ]'::jsonb
);

-- ============================================================================
-- STEP 4: CREATE AUTH TRIGGER
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get role from user metadata, default to 'buyer'
  user_role := COALESCE(new.raw_user_meta_data ->> 'role', 'buyer');

  -- Insert into users table
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, user_role::user_role)
  ON CONFLICT (id) DO NOTHING;

  -- Create buyer profile for buyer role
  IF user_role = 'buyer' THEN
    INSERT INTO public.buyer_profiles (
      user_id,
      first_name,
      last_name,
      email
    )
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
      COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
      new.email
    )
    ON CONFLICT (user_id) DO NOTHING;
    
  -- Create franchisor profile for franchisor role
  ELSIF user_role = 'franchisor' THEN
    INSERT INTO public.franchisor_profiles (
      user_id,
      company_name,
      primary_contact_name,
      primary_contact_email
    )
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data ->> 'company_name', ''),
      COALESCE(new.raw_user_meta_data ->> 'first_name', '') || ' ' || COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
      new.email
    )
    ON CONFLICT (user_id) DO NOTHING;
    
  -- Create lender profile for lender role
  ELSIF user_role = 'lender' THEN
    INSERT INTO public.lender_profiles (
      user_id,
      company_name,
      loan_officer_name,
      loan_officer_email
    )
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data ->> 'company_name', ''),
      COALESCE(new.raw_user_meta_data ->> 'first_name', '') || ' ' || COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
      new.email
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchisor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lender_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchises ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own record" ON users
  FOR SELECT USING (auth.uid() = id);

-- Buyer profiles policies
CREATE POLICY "Buyers can view own profile" ON buyer_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Buyers can update own profile" ON buyer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Buyers can insert own profile" ON buyer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Franchisor profiles policies
CREATE POLICY "Franchisors can view own profile" ON franchisor_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Franchisors can update own profile" ON franchisor_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Franchisors can insert own profile" ON franchisor_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Lender profiles policies
CREATE POLICY "Lenders can view own profile" ON lender_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Lenders can update own profile" ON lender_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Lenders can insert own profile" ON lender_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Franchises policies (public read access)
CREATE POLICY "Anyone can view franchises" ON franchises
  FOR SELECT USING (true);

-- ============================================================================
-- STEP 6: GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- ============================================================================
-- STEP 7: CREATE UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buyer_profiles_updated_at BEFORE UPDATE ON buyer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_franchisor_profiles_updated_at BEFORE UPDATE ON franchisor_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lender_profiles_updated_at BEFORE UPDATE ON lender_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_franchises_updated_at BEFORE UPDATE ON franchises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify franchises were inserted
SELECT 
  name, 
  franchise_score, 
  total_units,
  initial_investment_low,
  initial_investment_high
FROM franchises 
ORDER BY franchise_score DESC;

-- ============================================================================
-- SETUP COMPLETE!
-- Your preview database now has:
-- - User authentication with auto-profile creation
-- - 4 franchises with DeepSeek analysis (7-Eleven, Burger King, KFC, McDonald's)
-- - Row-level security policies
-- - All necessary indexes and triggers
-- ============================================================================
