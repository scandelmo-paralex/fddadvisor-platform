-- Create franchises table with schema matching DeepSeek R1 output
-- Run this script in Supabase SQL Editor

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.franchises CASCADE;

-- Create franchises table
CREATE TABLE public.franchises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  franchise_name TEXT NOT NULL,
  brand_description TEXT,
  industry TEXT,
  
  -- FranchiseScore
  franchise_score INTEGER,
  score_financial_performance INTEGER,
  score_business_model INTEGER,
  score_support_training INTEGER,
  score_legal_compliance INTEGER,
  score_franchisee_satisfaction INTEGER,
  
  -- Opportunities (stored as JSONB array)
  opportunities JSONB DEFAULT '[]'::jsonb,
  
  -- Concerns (stored as JSONB array)
  concerns JSONB DEFAULT '[]'::jsonb,
  
  -- Investment Details
  initial_investment_low INTEGER,
  initial_investment_high INTEGER,
  franchise_fee TEXT,
  liquid_capital_required INTEGER,
  net_worth_required INTEGER,
  royalty_fee TEXT,
  marketing_fee TEXT,
  technology_fee TEXT,
  
  -- Item 19 Financial Performance
  item19_available BOOLEAN DEFAULT false,
  item19_summary TEXT,
  average_revenue NUMERIC,
  revenue_range_low NUMERIC,
  revenue_range_high NUMERIC,
  
  -- Unit Counts
  units_total INTEGER,
  units_franchised INTEGER,
  units_company_owned INTEGER,
  units_opened_last_year INTEGER,
  units_closed_last_year INTEGER,
  
  -- Company History
  year_founded INTEGER,
  franchising_since INTEGER,
  
  -- Territory
  territory_protected BOOLEAN,
  territory_description TEXT,
  
  -- Training & Support
  training_duration TEXT,
  training_location TEXT,
  ongoing_support TEXT,
  
  -- Legal
  litigation_count INTEGER DEFAULT 0,
  bankruptcy_count INTEGER DEFAULT 0,
  
  -- Competitive Advantages (stored as JSONB array)
  competitive_advantages JSONB DEFAULT '[]'::jsonb,
  
  -- Target Market
  target_market TEXT,
  
  -- FDD Metadata
  fdd_issue_date DATE,
  
  -- Contact Info
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  franchisor_id UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_franchises_industry ON public.franchises(industry);
CREATE INDEX idx_franchises_franchise_score ON public.franchises(franchise_score DESC);
CREATE INDEX idx_franchises_is_active ON public.franchises(is_active);
CREATE INDEX idx_franchises_franchisor_id ON public.franchises(franchisor_id);

-- Enable Row Level Security
ALTER TABLE public.franchises ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow public read access to active franchises
CREATE POLICY "Public can view active franchises"
  ON public.franchises
  FOR SELECT
  USING (is_active = true);

-- Allow franchisors to update their own franchises
CREATE POLICY "Franchisors can update own franchises"
  ON public.franchises
  FOR UPDATE
  USING (auth.uid() = franchisor_id);

-- Allow service role to insert/update/delete
CREATE POLICY "Service role can manage all franchises"
  ON public.franchises
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_franchises_updated_at
  BEFORE UPDATE ON public.franchises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.franchises IS 'Franchise listings with comprehensive FDD data processed by DeepSeek R1';
