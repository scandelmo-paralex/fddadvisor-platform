-- ============================================================================
-- FRANCHISES SCHEMA FOR ITEM-BY-ITEM PIPELINE
-- This schema matches the comprehensive analysis.json output
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing franchises table if it exists
DROP TABLE IF EXISTS franchises CASCADE;

-- Create franchises table with comprehensive Item-by-Item analysis fields
CREATE TABLE franchises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Info (from Item 1)
  franchise_name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  parent_company TEXT,
  year_founded INTEGER,
  
  -- FranchiseScore (0-600 points)
  franchise_score INTEGER,
  franchise_score_breakdown JSONB, -- Full breakdown with 4 categories and metrics
  
  -- Opportunities and Concerns (exactly 3 each)
  opportunities JSONB DEFAULT '[]'::jsonb,
  concerns JSONB DEFAULT '[]'::jsonb,
  
  -- Analytical Summary
  analytical_summary TEXT,
  
  -- Investment Details (from Item 7)
  initial_investment_low INTEGER,
  initial_investment_high INTEGER,
  investment_breakdown JSONB, -- Detailed line items
  
  -- Fees (from Item 5 & 6)
  franchise_fee INTEGER,
  royalty_fee TEXT,
  marketing_fee TEXT,
  
  -- Financial Performance (from Item 19)
  has_item19 BOOLEAN DEFAULT FALSE,
  average_revenue INTEGER,
  revenue_data JSONB, -- Full Item 19 data with tables, quartiles
  
  -- Unit Counts (from Item 20)
  total_units INTEGER,
  franchised_units INTEGER,
  company_owned_units INTEGER,
  units_opened_last_year INTEGER,
  units_closed_last_year INTEGER,
  states JSONB, -- Array of states
  
  -- Support & Training (from Item 11)
  support_training JSONB,
  
  -- Renewal & Termination (from Item 17)
  renewal_termination JSONB,
  
  -- All 23 Items (complete extraction)
  all_items JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_franchises_name ON franchises(franchise_name);
CREATE INDEX IF NOT EXISTS idx_franchises_score ON franchises(franchise_score DESC);
CREATE INDEX IF NOT EXISTS idx_franchises_industry ON franchises(industry);

-- Enable Row Level Security
ALTER TABLE franchises ENABLE ROW LEVEL SECURITY;

-- Public read access policy
CREATE POLICY "Anyone can view franchises" ON franchises
  FOR SELECT USING (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_franchises_updated_at BEFORE UPDATE ON franchises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SCHEMA READY!
-- Now run the Python upload script to insert Drybar data
-- ============================================================================
