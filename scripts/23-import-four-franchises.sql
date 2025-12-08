-- Import 4 detailed franchises: Burger King, 7-Eleven, McDonald's, KFC
-- This will add or update these franchises with detailed analysis data

-- First, let's ensure we have the franchises table with all necessary columns
-- (This is safe to run even if columns already exist)

-- Clear existing data to avoid duplicates
DELETE FROM franchises WHERE name IN ('Burger King', '7-Eleven', 'McDonald''s', 'KFC');

-- Insert Burger King
INSERT INTO franchises (
  name, industry, description, logo_url,
  franchise_score, score_financial_performance, score_business_model, 
  score_support_training, score_legal_compliance, score_franchisee_satisfaction,
  risk_level, industry_percentile,
  initial_investment_low, initial_investment_high,
  total_investment_min, total_investment_max,
  franchise_fee, royalty_rate, marketing_fee,
  total_units, franchised_units, company_owned_units,
  year_founded, franchising_since,
  opportunities, concerns,
  analytical_summary,
  has_item19, status
) VALUES (
  'Burger King',
  'Food & Beverage',
  'Global fast-food chain specializing in flame-grilled burgers, operating in over 100 countries with a strong brand presence.',
  '/placeholder.svg?height=100&width=100',
  87, 85, 88, 90, 86, 87,
  'Medium', 92,
  1200000, 2310000,
  1200000, 2310000,
  50000, 4.5, 4.0,
  6701, 6701, 0,
  1954, 1967,
  ARRAY[
    'Strong brand recognition with global presence in 100+ countries',
    'Robust multi-unit development incentive program encouraging expansion',
    'Comprehensive training and ongoing operational support systems'
  ],
  ARRAY[
    'Missing Financial Performance Data - Item 19 provides no unit economics or sales figures, making it difficult to assess revenue potential against $1.2M-$2.3M investment',
    'High Capital Requirements - Initial investment of $1.2M-$2.3M requires substantial capital and creates significant financial risk',
    'Intense Market Competition - Highly competitive QSR market with established players like McDonald''s and Wendy''s'
  ],
  'Burger King represents a high-investment, established QSR franchise with strong brand recognition but limited financial transparency. The $1.2M-$2.3M investment requirement is substantial, yet Item 19 provides no revenue data to assess potential returns. While the brand operates 6,701+ units globally with comprehensive support systems, the lack of financial performance data makes it challenging to evaluate profitability. The 4.5% royalty and 4% marketing fees are standard for the industry. Best suited for well-capitalized investors comfortable with brand strength over financial transparency.',
  false,
  'established'
);

-- Insert 7-Eleven
INSERT INTO franchises (
  name, industry, description, logo_url,
  franchise_score, score_financial_performance, score_business_model,
  score_support_training, score_legal_compliance, score_franchisee_satisfaction,
  risk_level, industry_percentile,
  initial_investment_low, initial_investment_high,
  total_investment_min, total_investment_max,
  franchise_fee, royalty_rate,
  total_units, franchised_units, company_owned_units,
  year_founded, franchising_since,
  opportunities, concerns,
  analytical_summary,
  has_item19, status
) VALUES (
  '7-Eleven',
  'Retail',
  'World''s largest convenience store chain with 24/7 operations, offering fuel, food, and everyday essentials.',
  '/placeholder.svg?height=100&width=100',
  85, 82, 87, 88, 85, 84,
  'Medium', 89,
  50000, 775000,
  50000, 775000,
  0, 0, -- 7-Eleven uses gross profit split model
  13000, 9000, 4000,
  1927, 1964,
  ARRAY[
    'Massive global brand with 13,000+ locations and strong consumer recognition',
    'Unique business model with no franchise fee or royalty - operates on gross profit split',
    '24/7 operation model provides consistent revenue streams'
  ],
  ARRAY[
    'No Item 19 Financial Data - Cannot assess revenue potential or profitability metrics',
    'Demanding Operations - 24/7 operation requires significant time commitment and staffing challenges',
    'Gross Profit Split Model - Company takes percentage of gross profits rather than traditional royalty structure'
  ],
  '7-Eleven offers a unique franchise model with no upfront franchise fee or ongoing royalties, instead operating on a gross profit split arrangement. With 13,000+ locations globally, the brand recognition is exceptional. However, Item 19 provides no financial performance data, making it impossible to evaluate actual profitability. The 24/7 operational model requires significant commitment and reliable staffing. Investment ranges from $50K-$775K depending on whether you''re converting an existing store or building new. Best for operators comfortable with intensive retail operations and the gross profit split model.',
  false,
  'established'
);

-- Insert McDonald's
INSERT INTO franchises (
  name, industry, description, logo_url,
  franchise_score, score_financial_performance, score_business_model,
  score_support_training, score_legal_compliance, score_franchisee_satisfaction,
  risk_level, industry_percentile,
  initial_investment_low, initial_investment_high,
  total_investment_min, total_investment_max,
  franchise_fee, royalty_rate, marketing_fee,
  total_units, franchised_units, company_owned_units,
  year_founded, franchising_since,
  opportunities, concerns,
  analytical_summary,
  has_item19, status
) VALUES (
  'McDonald''s',
  'Food & Beverage',
  'The world''s leading global foodservice retailer with iconic brand recognition and proven business systems.',
  '/placeholder.svg?height=100&width=100',
  92, 90, 94, 95, 91, 90,
  'Low', 98,
  1314500, 2313000,
  1314500, 2313000,
  45000, 4.0, 4.0,
  40275, 36059, 4216,
  1940, 1955,
  ARRAY[
    'Unmatched global brand recognition - most valuable QSR brand worldwide',
    'Proven business model with 40,000+ locations and 65+ years of franchising experience',
    'Comprehensive training and support through Hamburger University and field consultants'
  ],
  ARRAY[
    'No Item 19 Financial Data - Despite size and maturity, provides no unit-level financial performance data',
    'High Investment Requirement - $1.3M-$2.3M initial investment with $45K franchise fee',
    'Extremely Competitive Selection - McDonald''s has rigorous franchisee selection process with limited availability'
  ],
  'McDonald''s represents the gold standard in QSR franchising with unparalleled brand recognition and operational systems. However, despite operating 40,000+ locations globally, Item 19 provides no financial performance data to assess ROI on the $1.3M-$2.3M investment. The 4% royalty and 4% marketing fees are industry-standard. With 65+ years of franchising experience and comprehensive support systems, McDonald''s offers a proven model but requires substantial capital and acceptance into their selective franchisee program. Best for well-capitalized, experienced operators who value brand strength and operational excellence.',
  false,
  'established'
);

-- Insert KFC
INSERT INTO franchises (
  name, industry, description, logo_url,
  franchise_score, score_financial_performance, score_business_model,
  score_support_training, score_legal_compliance, score_franchisee_satisfaction,
  risk_level, industry_percentile,
  initial_investment_low, initial_investment_high,
  total_investment_min, total_investment_max,
  franchise_fee, royalty_rate, marketing_fee,
  total_units, franchised_units, company_owned_units,
  year_founded, franchising_since,
  opportunities, concerns,
  analytical_summary,
  has_item19, status
) VALUES (
  'KFC',
  'Food & Beverage',
  'Global fried chicken restaurant chain with Colonel Sanders'' secret recipe, operating in 145+ countries.',
  '/placeholder.svg?height=100&width=100',
  84, 80, 85, 87, 84, 83,
  'Medium', 88,
  1442000, 3150000,
  1442000, 3150000,
  45000, 5.0, 5.0,
  4000, 3900, 100,
  1930, 1952,
  ARRAY[
    'Iconic global brand with presence in 145+ countries and strong international growth',
    'Unique product offering with proprietary recipe creates competitive differentiation',
    'Part of Yum! Brands portfolio providing corporate backing and resources'
  ],
  ARRAY[
    'No Item 19 Financial Data - Cannot evaluate revenue potential or profitability metrics',
    'High Investment Range - $1.4M-$3.2M investment is substantial with significant capital requirements',
    'Higher Fee Structure - 5% royalty and 5% marketing fees are above industry average'
  ],
  'KFC offers a globally recognized brand with unique product differentiation through Colonel Sanders'' secret recipe. Operating 4,000+ units worldwide with Yum! Brands corporate backing provides stability. However, Item 19 provides no financial performance data to assess ROI on the $1.4M-$3.2M investment. The 5% royalty and 5% marketing fees are higher than competitors like McDonald''s (4%) and Burger King (4.5%). With 70+ years of franchising experience, KFC has proven systems but requires substantial capital. Best for well-funded investors seeking international brand recognition in the chicken QSR segment.',
  false,
  'established'
);
