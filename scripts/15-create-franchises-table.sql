-- Drop existing table if it exists
DROP TABLE IF EXISTS franchises CASCADE;

-- Create franchises table with all DeepSeek R1 output fields
CREATE TABLE franchises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  industry TEXT,
  website TEXT,
  
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
  franchise_fee INTEGER,
  royalty_fee TEXT,
  marketing_fee TEXT,
  
  -- Item 19 Financial Data
  item19_median_revenue INTEGER,
  item19_median_expenses INTEGER,
  item19_median_profit INTEGER,
  item19_top_quartile_revenue INTEGER,
  item19_sample_size INTEGER,
  item19_disclosure_level TEXT,
  revenue_range_low INTEGER,
  revenue_range_high INTEGER,
  
  -- Unit Counts
  total_units INTEGER,
  franchised_units INTEGER,
  company_owned_units INTEGER,
  units_opened_last_year INTEGER,
  units_closed_last_year INTEGER,
  
  -- Legal
  litigation_count INTEGER DEFAULT 0,
  bankruptcy_count INTEGER DEFAULT 0,
  
  -- Competitive Advantages (stored as JSONB array)
  competitive_advantages JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on name for faster lookups
CREATE INDEX idx_franchises_name ON franchises(name);

-- Create index on franchise_score for sorting
CREATE INDEX idx_franchises_score ON franchises(franchise_score DESC);

-- Create index on industry for filtering
CREATE INDEX idx_franchises_industry ON franchises(industry);

-- Enable Row Level Security
ALTER TABLE franchises ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON franchises
  FOR SELECT
  USING (true);

-- Create policy to allow authenticated users to insert/update
CREATE POLICY "Allow authenticated insert/update" ON franchises
  FOR ALL
  USING (auth.role() = 'authenticated');
