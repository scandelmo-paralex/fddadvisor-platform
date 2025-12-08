-- Expand franchises table to support rich FDD data from Vertex AI processing

ALTER TABLE franchises
  -- Basic info (already exists, but adding missing fields)
  ADD COLUMN IF NOT EXISTS brand_description TEXT,
  ADD COLUMN IF NOT EXISTS year_founded INTEGER,
  ADD COLUMN IF NOT EXISTS franchising_since INTEGER,
  
  -- Investment details
  ADD COLUMN IF NOT EXISTS liquid_capital_required INTEGER,
  ADD COLUMN IF NOT EXISTS net_worth_required INTEGER,
  ADD COLUMN IF NOT EXISTS royalty_fee TEXT,
  ADD COLUMN IF NOT EXISTS marketing_fee TEXT,
  ADD COLUMN IF NOT EXISTS technology_fee TEXT,
  
  -- Item 19 (Financial Performance)
  ADD COLUMN IF NOT EXISTS item19_available BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS item19_summary TEXT,
  ADD COLUMN IF NOT EXISTS average_revenue INTEGER,
  ADD COLUMN IF NOT EXISTS average_profit INTEGER,
  
  -- Unit counts
  ADD COLUMN IF NOT EXISTS units_total INTEGER,
  ADD COLUMN IF NOT EXISTS units_franchised INTEGER,
  ADD COLUMN IF NOT EXISTS units_company_owned INTEGER,
  
  -- Territory
  ADD COLUMN IF NOT EXISTS territory_protected BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS territory_description TEXT,
  
  -- Training & Support
  ADD COLUMN IF NOT EXISTS training_duration TEXT,
  ADD COLUMN IF NOT EXISTS training_location TEXT,
  ADD COLUMN IF NOT EXISTS ongoing_support TEXT,
  
  -- Legal
  ADD COLUMN IF NOT EXISTS litigation_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bankruptcy_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS red_flags TEXT[],
  
  -- Competitive advantages
  ADD COLUMN IF NOT EXISTS competitive_advantages TEXT[],
  ADD COLUMN IF NOT EXISTS target_market TEXT,
  
  -- FDD metadata
  ADD COLUMN IF NOT EXISTS fdd_issue_date DATE,
  ADD COLUMN IF NOT EXISTS fdd_pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS fdd_analysis_text TEXT, -- Full narrative analysis
  
  -- Contact info
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_franchises_industry ON franchises(industry);
CREATE INDEX IF NOT EXISTS idx_franchises_investment_range ON franchises(initial_investment_min, initial_investment_max);
CREATE INDEX IF NOT EXISTS idx_franchises_item19 ON franchises(item19_available);
CREATE INDEX IF NOT EXISTS idx_franchises_active ON franchises(is_active);

-- Add full-text search on franchise names and descriptions
CREATE INDEX IF NOT EXISTS idx_franchises_search ON franchises USING gin(to_tsvector('english', name || ' ' || COALESCE(brand_description, '') || ' ' || COALESCE(description, '')));

COMMENT ON TABLE franchises IS 'Franchise listings with comprehensive FDD data from Vertex AI processing';
