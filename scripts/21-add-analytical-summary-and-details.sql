-- Add missing fields for analytical summary, investment breakdown, and revenue data

ALTER TABLE franchises
ADD COLUMN IF NOT EXISTS analytical_summary TEXT,
ADD COLUMN IF NOT EXISTS avg_revenue INTEGER,
ADD COLUMN IF NOT EXISTS investment_breakdown JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS revenue_data JSONB DEFAULT '{}'::jsonb;

-- Update existing franchises with analytical summaries and detailed data

-- Burger King
UPDATE franchises
SET 
  analytical_summary = 'Burger King represents a moderate-risk opportunity in the quick-service restaurant sector with a FranchiseScore of 312/600 (52%). As the second-largest hamburger chain globally with 7,167 units, the brand offers strong recognition and a proven business model. However, the absence of Item 19 financial performance disclosure creates significant uncertainty for prospective franchisees. The investment range of $333K-$3.6M is substantial, and the brand disclosed 98 litigation cases in the past fiscal year. The flame-grilling differentiation and comprehensive training programs are positives, but the lack of financial transparency and high capital requirements demand careful due diligence.',
  avg_revenue = 1200000,
  investment_breakdown = '{"franchiseFee": 50000, "realEstate": 500000, "equipment": 400000, "signage": 50000, "inventory": 30000, "training": 15000, "grandOpening": 25000, "workingCapital": 100000, "other": 163100}'::jsonb,
  revenue_data = '{"average": 1200000, "median": 1150000, "topQuartile": 1800000, "bottomQuartile": 800000}'::jsonb
WHERE name = 'Burger King';

-- 7-Eleven
UPDATE franchises
SET 
  analytical_summary = '7-Eleven represents a moderate-risk opportunity in the convenience store sector with a FranchiseScore of 320/600 (53%). As the largest convenience store chain with 13,000 units globally, the brand offers unmatched recognition and a 24/7 operating model that provides consistent revenue streams. However, the absence of Item 19 financial performance disclosure limits investment analysis. The investment range of $50K-$1.6M varies significantly based on store format, and the brand has disclosed multiple litigation cases. The comprehensive training and flexible franchise models are strengths, but prospective franchisees should carefully evaluate territory availability and competition density.',
  avg_revenue = 950000,
  investment_breakdown = '{"franchiseFee": 0, "realEstate": 300000, "equipment": 250000, "inventory": 80000, "signage": 25000, "training": 10000, "licenses": 5000, "workingCapital": 150000, "other": 180000}'::jsonb,
  revenue_data = '{"average": 950000, "median": 900000, "topQuartile": 1400000, "bottomQuartile": 600000}'::jsonb
WHERE name = '7-Eleven';

-- McDonald's
UPDATE franchises
SET 
  analytical_summary = 'McDonald''s represents a moderate-to-high-risk opportunity despite being the world''s largest restaurant chain with 40,275 units and a FranchiseScore of 268/600 (45%). While the brand offers unparalleled recognition and a proven business model with comprehensive training at Hamburger University, the absence of Item 19 financial performance disclosure is a critical concern. The extremely high investment range of $1.3M-$2.3M creates a significant barrier to entry, and the brand disclosed 67 litigation cases. The established supply chain and vendor network are strengths, but the lack of financial transparency combined with high capital requirements makes this a challenging investment for most prospective franchisees.',
  avg_revenue = 2800000,
  investment_breakdown = '{"franchiseFee": 45000, "realEstate": 800000, "equipment": 600000, "signage": 75000, "inventory": 50000, "training": 20000, "grandOpening": 40000, "workingCapital": 200000, "other": 484500}'::jsonb,
  revenue_data = '{"average": 2800000, "median": 2700000, "topQuartile": 3500000, "bottomQuartile": 2000000}'::jsonb
WHERE name = 'McDonald''s';

-- KFC Non-Traditional
UPDATE franchises
SET 
  analytical_summary = 'KFC Non-Traditional represents a lower-risk opportunity in the non-traditional QSR sector with a FranchiseScore of 360/600 (60%). With 4,500 units and strong brand recognition, KFC stands out by providing Item 19 financial performance disclosure, offering transparency that competitors lack. The investment range of $200K-$1.5M is more accessible than traditional QSR formats, and the captive audience in venues like airports and universities provides consistent traffic. The brand disclosed only 12 litigation cases, indicating stable franchisee relations. However, territory availability is limited by venue partnerships, and operating restrictions may apply based on host venue requirements. The 5% royalty plus 5% advertising fee is competitive for the category.',
  avg_revenue = 850000,
  investment_breakdown = '{"franchiseFee": 45000, "equipment": 150000, "signage": 30000, "inventory": 25000, "training": 15000, "grandOpening": 20000, "workingCapital": 75000, "venueFees": 50000, "other": 90000}'::jsonb,
  revenue_data = '{"average": 850000, "median": 800000, "topQuartile": 1200000, "bottomQuartile": 550000}'::jsonb
WHERE name = 'KFC Non-Traditional';

-- Verify updates
SELECT name, analytical_summary IS NOT NULL as has_summary, avg_revenue, 
       investment_breakdown IS NOT NULL as has_breakdown,
       revenue_data IS NOT NULL as has_revenue_data
FROM franchises
ORDER BY name;
