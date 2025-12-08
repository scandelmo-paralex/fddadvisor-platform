-- Drop existing table if it exists
DROP TABLE IF EXISTS franchises CASCADE;

-- Create franchises table with all DeepSeek R1 fields
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

-- Create index on name for faster lookups
CREATE INDEX idx_franchises_name ON franchises(name);

-- Insert test data
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
-- McDonald''s
(
  'McDonald''s',
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
);

-- Verify the data
SELECT name, franchise_score, total_units FROM franchises ORDER BY name;
