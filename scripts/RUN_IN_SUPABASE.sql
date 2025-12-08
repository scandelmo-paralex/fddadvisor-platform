-- ============================================================================
-- COMPLETE FRANCHISES TABLE SETUP FOR SUPABASE
-- Run this entire script in Supabase SQL Editor
-- ============================================================================

-- Step 1: Drop existing table if it exists
DROP TABLE IF EXISTS franchises CASCADE;

-- Step 2: Create franchises table with ALL necessary columns
CREATE TABLE franchises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  
  -- FranchiseScore
  franchise_score INTEGER,
  score_financial_performance INTEGER,
  score_business_model INTEGER,
  score_support_training INTEGER,
  score_legal_compliance INTEGER,
  score_franchisee_satisfaction INTEGER,
  
  -- Risk and Percentile
  risk_level TEXT,
  industry_percentile INTEGER,
  
  -- Analytical Summary
  analytical_summary TEXT,
  
  -- Opportunities and Concerns (JSONB arrays)
  opportunities JSONB DEFAULT '[]'::jsonb,
  concerns JSONB DEFAULT '[]'::jsonb,
  
  -- Investment Details
  initial_investment_low INTEGER,
  initial_investment_high INTEGER,
  total_investment_min INTEGER,
  total_investment_max INTEGER,
  franchise_fee INTEGER,
  royalty_fee TEXT,
  marketing_fee TEXT,
  investment_breakdown JSONB DEFAULT '{}'::jsonb,
  
  -- Revenue Data
  average_revenue INTEGER,
  revenue_data JSONB DEFAULT '{}'::jsonb,
  
  -- FranchiseScore Breakdown
  franchise_score_breakdown JSONB DEFAULT '{}'::jsonb,
  
  -- Item 19 Financial Data
  has_item19 BOOLEAN DEFAULT false,
  item19_revenue_low INTEGER,
  item19_revenue_high INTEGER,
  item19_revenue_median INTEGER,
  item19_profit_margin DECIMAL(5,2),
  item19_sample_size INTEGER,
  item19_disclosure_quality TEXT,
  
  -- Unit Counts and Growth
  total_units INTEGER,
  franchised_units INTEGER,
  company_owned_units INTEGER,
  units_opened_last_year INTEGER,
  units_closed_last_year INTEGER,
  state_distribution JSONB DEFAULT '{}'::jsonb,
  
  -- Legal History
  litigation_count INTEGER DEFAULT 0,
  bankruptcy_count INTEGER DEFAULT 0,
  
  -- Additional Data
  competitive_advantages JSONB DEFAULT '[]'::jsonb,
  training_details TEXT,
  territory_info TEXT,
  roi_timeframe TEXT,
  
  -- Status
  status TEXT DEFAULT 'active',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create indexes for faster lookups
CREATE INDEX idx_franchises_name ON franchises(name);
CREATE INDEX idx_franchises_industry ON franchises(industry);
CREATE INDEX idx_franchises_score ON franchises(franchise_score);

-- Step 4: Insert franchise data
INSERT INTO franchises (
  name, description, industry, franchise_score,
  score_financial_performance, score_business_model, score_support_training,
  score_legal_compliance, score_franchisee_satisfaction,
  risk_level, industry_percentile, analytical_summary,
  opportunities, concerns,
  initial_investment_low, initial_investment_high,
  total_investment_min, total_investment_max,
  franchise_fee, royalty_fee, marketing_fee,
  has_item19, total_units, franchised_units, company_owned_units,
  litigation_count, bankruptcy_count,
  competitive_advantages, roi_timeframe, status,
  state_distribution
) VALUES
-- Burger King
(
  'Burger King',
  'Global fast-food chain specializing in flame-grilled burgers',
  'Quick Service Restaurant',
  312,
  60, 52, 60, 80, 60,
  'Medium',
  65,
  'Burger King is the second-largest hamburger chain globally with strong brand recognition. However, the lack of Item 19 financial performance disclosure makes it difficult to assess actual franchisee profitability.',
  '[
    {"title": "Strong Brand Recognition", "description": "Burger King is the second-largest hamburger chain globally with over 7,000 locations", "rating": "High", "citations": ["Page 1"]},
    {"title": "Comprehensive Training Program", "description": "Franchisees receive extensive training including operations, marketing, and management", "rating": "High", "citations": ["Page 15"]},
    {"title": "Flexible Restaurant Formats", "description": "Multiple restaurant formats available including traditional, non-traditional, and conversion opportunities", "rating": "Medium", "citations": ["Page 8"]}
  ]'::jsonb,
  '[
    {"title": "No Item 19 Financial Performance Disclosure", "description": "Burger King does not provide financial performance representations, making it difficult to assess potential profitability", "rating": "High", "citations": ["Page 19"]},
    {"title": "High Initial Investment", "description": "Total investment ranges from $333,100 to $3,595,600, requiring significant capital", "rating": "High", "citations": ["Page 7"]},
    {"title": "Significant Litigation History", "description": "98 litigation cases in the past fiscal year, indicating potential legal risks", "rating": "Medium", "citations": ["Page 2"]}
  ]'::jsonb,
  333100, 3595600, 333100, 3595600,
  50000, '4.5% of Gross Sales', '4% of Gross Sales',
  false, 7167, 6817, 350,
  98, 0,
  '["Second-largest hamburger chain globally", "Flame-grilling differentiates from competitors", "Comprehensive training and support"]'::jsonb,
  '3-5 years',
  'active',
  '{"California": 450, "Texas": 380, "Florida": 320, "New York": 280, "Illinois": 210}'::jsonb
),
-- 7-Eleven
(
  '7-Eleven',
  'World''s largest convenience store chain operating 24/7',
  'Convenience Store',
  320,
  64, 56, 60, 80, 60,
  'Medium',
  70,
  '7-Eleven is the largest convenience store chain with strong brand recognition and a proven business model. The lack of Item 19 disclosure is a concern for assessing franchisee profitability.',
  '[
    {"title": "Strong Brand Recognition", "description": "7-Eleven is the world''s largest convenience store chain with over 13,000 locations", "rating": "High", "citations": ["Page 1"]},
    {"title": "Comprehensive Training", "description": "Extensive training program covering all aspects of store operations", "rating": "High", "citations": ["Page 15"]},
    {"title": "Flexible Franchise Models", "description": "Multiple franchise options including new stores and conversions", "rating": "Medium", "citations": ["Page 6"]}
  ]'::jsonb,
  '[
    {"title": "No Item 19 Financial Performance Disclosure", "description": "7-Eleven does not provide financial performance representations", "rating": "High", "citations": ["Page 19"]},
    {"title": "Variable Initial Investment", "description": "Investment ranges from $50,000 to $1,600,000 depending on store type", "rating": "Medium", "citations": ["Page 7"]},
    {"title": "Litigation History", "description": "Multiple litigation cases disclosed in recent years", "rating": "Medium", "citations": ["Page 2-3"]}
  ]'::jsonb,
  50000, 1600000, 50000, 1600000,
  0, 'Varies by store', 'Varies',
  false, 13000, 9800, 3200,
  45, 0,
  '["Largest convenience store chain", "24/7 operating model", "Strong supply chain"]'::jsonb,
  '2-4 years',
  'active',
  '{"California": 850, "Texas": 720, "Florida": 580, "Virginia": 420, "New York": 390}'::jsonb
),
-- McDonald's
(
  'McDonald''s',
  'World''s largest restaurant chain known for burgers, fries, and breakfast',
  'Quick Service Restaurant',
  268,
  40, 48, 60, 80, 40,
  'Medium-High',
  55,
  'McDonald''s is the world''s most recognizable restaurant brand with an established business model. However, the extremely high investment and lack of Item 19 disclosure are significant concerns.',
  '[
    {"title": "Unparalleled Brand Recognition", "description": "McDonald''s is the world''s largest and most recognized restaurant chain", "rating": "High", "citations": ["Page 1"]},
    {"title": "Hamburger University Training", "description": "World-class training facility providing comprehensive franchisee education", "rating": "High", "citations": ["Page 15"]},
    {"title": "Strong Supply Chain", "description": "Established relationships with approved suppliers ensuring consistency", "rating": "High", "citations": ["Page 11"]}
  ]'::jsonb,
  '[
    {"title": "No Item 19 Financial Performance Disclosure", "description": "McDonald''s does not provide financial performance representations", "rating": "High", "citations": ["Page 19"]},
    {"title": "Extremely High Initial Investment", "description": "Total investment ranges from $1,314,500 to $2,313,295", "rating": "High", "citations": ["Page 7"]},
    {"title": "Significant Litigation", "description": "Multiple litigation cases disclosed", "rating": "Medium", "citations": ["Page 2-3"]}
  ]'::jsonb,
  1314500, 2313295, 1314500, 2313295,
  45000, '4% of Gross Sales', '4% of Gross Sales',
  false, 40275, 36059, 4216,
  67, 0,
  '["World''s largest restaurant chain", "Proven business model", "Comprehensive support infrastructure"]'::jsonb,
  '4-6 years',
  'active',
  '{"California": 1200, "Texas": 1050, "Florida": 850, "Illinois": 650, "Ohio": 580}'::jsonb
),
-- KFC Non-Traditional
(
  'KFC Non-Traditional',
  'Non-traditional KFC locations in airports, universities, and travel centers',
  'Quick Service Restaurant',
  360,
  80, 60, 60, 80, 80,
  'Low-Medium',
  85,
  'KFC Non-Traditional offers strong brand recognition with the advantage of Item 19 financial disclosure. The non-traditional format provides access to captive audiences in high-traffic venues.',
  '[
    {"title": "Strong Brand Recognition", "description": "KFC is a globally recognized brand with strong customer loyalty", "rating": "High", "citations": ["Page 1"]},
    {"title": "Item 19 Financial Disclosure", "description": "KFC provides detailed financial performance data for transparency", "rating": "High", "citations": ["Page 19"]},
    {"title": "Captive Audience Locations", "description": "Non-traditional venues provide access to high-traffic captive audiences", "rating": "High", "citations": ["Page 6"]}
  ]'::jsonb,
  '[
    {"title": "Limited Territory Availability", "description": "Non-traditional locations depend on venue availability and approval", "rating": "Medium", "citations": ["Page 8"]},
    {"title": "Venue-Specific Restrictions", "description": "Operating hours and menu may be restricted by host venue", "rating": "Medium", "citations": ["Page 9"]},
    {"title": "Higher Fee Structure", "description": "5% royalty plus 5% advertising fee", "rating": "Low", "citations": ["Page 7"]}
  ]'::jsonb,
  200000, 1500000, 200000, 1500000,
  45000, '5% of Gross Sales', '5% of Gross Sales',
  true, 4500, 4200, 300,
  12, 0,
  '["Globally recognized brand", "Captive audience venues", "Transparent financial disclosure"]'::jsonb,
  '2-3 years',
  'active',
  '{"California": 180, "Texas": 150, "Florida": 120, "New York": 95, "Illinois": 75}'::jsonb
);

-- Step 5: Verify the data was inserted
SELECT 
  name, 
  franchise_score, 
  total_units,
  has_item19,
  status
FROM franchises 
ORDER BY franchise_score DESC;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'SUCCESS: Franchises table created and populated with 4 franchises!';
END $$;
