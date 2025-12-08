-- Import detailed franchise data from Vertex AI analysis
-- Generated from all_franchises.json output

-- Delete existing franchises by name to avoid unique constraint violations
DELETE FROM franchises WHERE name IN ('Burger King', '7-Eleven', 'McDonald''s', 'KFC US, LLC (Non-Traditional)');

-- Insert/Update Burger King
INSERT INTO franchises (
  id,
  name,
  description,
  industry,
  franchise_score,
  score_financial_performance,
  score_business_model,
  score_support_training,
  score_legal_compliance,
  score_franchisee_satisfaction,
  opportunities,
  concerns,
  initial_investment_low,
  initial_investment_high,
  franchise_fee,
  royalty_fee,
  marketing_fee,
  total_units,
  franchised_units,
  company_owned_units,
  units_opened_last_year,
  units_closed_last_year,
  litigation_count,
  bankruptcy_count
) VALUES (
  'e5836360-09fe-453d-bb03-7e1bf4db487d',
  'Burger King',
  'Burger King is a global quick-service restaurant franchise specializing in flame-grilled burgers. The brand operates over 19,700 locations worldwide with standardized menu offerings and digital ordering capabilities.',
  'Quick Service Restaurant (QSR)',
  469,
  80, -- score_financial_performance
  135, -- score_business_model  
  145, -- score_support_training
  75, -- score_legal_compliance
  34, -- score_franchisee_satisfaction
  '[
    {
      "title": "Robust Multi-Unit Development Incentive Program",
      "description": "The 2024 program offers franchise fee credits ($50K per deposit) and graduated royalties starting at 2.5% (vs standard 4.5%) for developers committing to 3-10 units. With 214 signed agreements in pipeline, this enables scalable expansion. Program requires BKoT image compliance but offsets 52% of royalty costs in Year 1.",
      "rating": "High",
      "citations": ["Item 5, pages 19-20", "Item 6, pages 28-29"]
    },
    {
      "title": "Comprehensive National Advertising Fund Allocation",
      "description": "4.5% ad fund supports coordinated national campaigns, digital platforms, and grand openings. Franchisees benefit from marketing scale exceeding individual capabilities. Third-party audits ensure transparency for $300M+ annual system contributions.",
      "rating": "High",
      "citations": ["Item 6, page 23", "Item 11, page 55"]
    },
    {
      "title": "Crown Your Career Employee Transition Program",
      "description": "Enables qualified BKC employees (1-3 years tenure) to purchase company stores with franchise fee waivers and financing options. Covers 1,177 corporate locations (17.6% of US system). Includes 2% penalty-rate promissory notes for acquisitions.",
      "rating": "Medium",
      "citations": ["Item 1, pages 6-7", "Item 5, pages 20-21", "Exhibit Z3"]
    }
  ]'::jsonb,
  '[
    {
      "title": "Missing Financial Performance Data",
      "description": "Item 19 provides no unit economics or sales figures against $1.2M-$2.3M investment. Franchisees cannot assess ROI without disclosure of revenue/expense benchmarks. Omission violates FTC best practices, forcing reliance on external validation.",
      "rating": "High",
      "citations": ["Item 19, page 86"]
    },
    {
      "title": "Rising Unit Closure Rate Trend",
      "description": "Closures increased to 77 in 2024 (1.15% of system) from 65 in 2023 (+18% YoY). Ceased operations accounted for 41 units (53% of closures), reversing prior improvement. Trend signals potential profitability challenges requiring investigation.",
      "rating": "Medium",
      "citations": ["Item 20 Table 3, page 100"]
    },
    {
      "title": "Active Franchisee Litigation on Contracts",
      "description": "Pending cases include wrongful termination claims (€835K damages sought in Spain), ad fund mismanagement lawsuit (Germany), and US no-poach class action active since 2019. Indicates systemic disputes regarding royalty structures and operational control.",
      "rating": "Medium",
      "citations": ["Item 3, pages 12-14"]
    }
  ]'::jsonb,
  1200000,
  2310000,
  15000,
  '4.5%',
  '4.5%',
  6701,
  5524,
  1177,
  186,
  77,
  7,
  0
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  franchise_score = EXCLUDED.franchise_score,
  score_financial_performance = EXCLUDED.score_financial_performance,
  score_business_model = EXCLUDED.score_business_model,
  score_support_training = EXCLUDED.score_support_training,
  score_legal_compliance = EXCLUDED.score_legal_compliance,
  score_franchisee_satisfaction = EXCLUDED.score_franchisee_satisfaction,
  opportunities = EXCLUDED.opportunities,
  concerns = EXCLUDED.concerns,
  initial_investment_low = EXCLUDED.initial_investment_low,
  initial_investment_high = EXCLUDED.initial_investment_high,
  franchise_fee = EXCLUDED.franchise_fee,
  royalty_fee = EXCLUDED.royalty_fee,
  marketing_fee = EXCLUDED.marketing_fee,
  total_units = EXCLUDED.total_units,
  franchised_units = EXCLUDED.franchised_units,
  company_owned_units = EXCLUDED.company_owned_units,
  units_opened_last_year = EXCLUDED.units_opened_last_year,
  units_closed_last_year = EXCLUDED.units_closed_last_year,
  litigation_count = EXCLUDED.litigation_count,
  bankruptcy_count = EXCLUDED.bankruptcy_count,
  updated_at = NOW();

-- Insert/Update 7-Eleven
INSERT INTO franchises (
  id,
  name,
  description,
  industry,
  franchise_score,
  score_financial_performance,
  score_business_model,
  score_support_training,
  score_legal_compliance,
  score_franchisee_satisfaction,
  opportunities,
  concerns,
  initial_investment_low,
  initial_investment_high,
  franchise_fee,
  royalty_fee,
  marketing_fee,
  total_units,
  franchised_units,
  company_owned_units,
  units_opened_last_year,
  units_closed_last_year,
  litigation_count,
  bankruptcy_count
) VALUES (
  '7c9e4f2a-8b3d-4e1a-9f6c-2d5b8a7c3e9f',
  '7-Eleven',
  '7-Eleven is a global convenience store franchise operating 21,651+ international units under parent company Seven & i Holdings. It leverages an integrated supply chain through SEIF (fuel) and SEDC (merchandise) while diversifying revenue streams via fresh food, proprietary beverages, and delivery services like Skipcart.',
  'Retail',
  320,
  0, -- score_financial_performance
  135, -- score_business_model
  85, -- score_support_training
  45, -- score_legal_compliance
  55, -- score_franchisee_satisfaction
  '[
    {
      "title": "Global Brand Power",
      "description": "Operates 21,651+ stores internationally with strong brand recognition driving customer trust. The convenience store model benefits from 24/7 operations and diverse product offerings including fresh food, beverages, and fuel services.",
      "rating": "High",
      "citations": ["Item 1, p. 1"]
    },
    {
      "title": "Integrated Supply Chain & Technology",
      "description": "SEIF/SEDC reduce procurement costs through centralized distribution. Skipcart delivery and 7Now app enable revenue diversification beyond traditional in-store sales, capturing digital-first customers.",
      "rating": "High",
      "citations": ["Item 1, pp. 6-7"]
    },
    {
      "title": "Revenue Stream Diversification",
      "description": "Focus on high-margin fresh food and beverages to offset fuel/tobacco dependence. Fresh food programs and proprietary beverage lines provide competitive differentiation and improved profitability.",
      "rating": "Medium",
      "citations": ["Item 1, p. 8", "Item 6, p. 26"]
    }
  ]'::jsonb,
  '[
    {
      "title": "Regulatory & Tobacco Dependence Risk",
      "description": "30%+ sales from tobacco/nicotine products face increasing regulatory restrictions. Potential bans or taxes may significantly lower store sales and profitability, requiring rapid business model adaptation.",
      "rating": "High",
      "citations": ["Item 1, p. 10", "Item 3, p. 16"]
    },
    {
      "title": "Financial Pressure on Franchisees",
      "description": "11% breached Minimum Net Worth requirement in 2024, indicating financial stress. Complex royalty structure (45–59% of Gross Profit) creates high fixed costs that may squeeze margins during economic downturns.",
      "rating": "High",
      "citations": ["Item 5, pp. 18-19", "Item 6, p. 25"]
    },
    {
      "title": "Litigation & Franchisee Relations",
      "description": "15+ pending lawsuits including termination disputes and alleged training/support failures. High litigation volume suggests strained franchisee relations and potential systemic operational issues.",
      "rating": "High",
      "citations": ["Item 3, pp. 14-16"]
    }
  ]'::jsonb,
  37650,
  716860,
  0,
  '45-59% of Gross Profit',
  '1% Gross Profit fee',
  11101,
  7300,
  3801,
  172,
  128,
  15,
  0
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  franchise_score = EXCLUDED.franchise_score,
  score_financial_performance = EXCLUDED.score_financial_performance,
  score_business_model = EXCLUDED.score_business_model,
  score_support_training = EXCLUDED.score_support_training,
  score_legal_compliance = EXCLUDED.score_legal_compliance,
  score_franchisee_satisfaction = EXCLUDED.score_franchisee_satisfaction,
  opportunities = EXCLUDED.opportunities,
  concerns = EXCLUDED.concerns,
  initial_investment_low = EXCLUDED.initial_investment_low,
  initial_investment_high = EXCLUDED.initial_investment_high,
  franchise_fee = EXCLUDED.franchise_fee,
  royalty_fee = EXCLUDED.royalty_fee,
  marketing_fee = EXCLUDED.marketing_fee,
  total_units = EXCLUDED.total_units,
  franchised_units = EXCLUDED.franchised_units,
  company_owned_units = EXCLUDED.company_owned_units,
  units_opened_last_year = EXCLUDED.units_opened_last_year,
  units_closed_last_year = EXCLUDED.units_closed_last_year,
  litigation_count = EXCLUDED.litigation_count,
  bankruptcy_count = EXCLUDED.bankruptcy_count,
  updated_at = NOW();

-- Insert/Update McDonald's
INSERT INTO franchises (
  id,
  name,
  description,
  industry,
  franchise_score,
  score_financial_performance,
  score_business_model,
  score_support_training,
  score_legal_compliance,
  score_franchisee_satisfaction,
  opportunities,
  concerns,
  initial_investment_low,
  initial_investment_high,
  franchise_fee,
  royalty_fee,
  marketing_fee,
  total_units,
  franchised_units,
  company_owned_units,
  units_opened_last_year,
  units_closed_last_year,
  litigation_count,
  bankruptcy_count
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'McDonald''s',
  'McDonald''s is a globally recognized fast-food franchise specializing in burgers, fries, and quick-service meals. The brand operates through company-owned and franchised locations with a standardized menu and operating system.',
  'Quick Service Restaurant',
  220,
  0, -- score_financial_performance (Item 19 missing)
  130, -- score_business_model
  130, -- score_support_training
  90, -- score_legal_compliance
  0, -- score_franchisee_satisfaction (Item 20 missing)
  '[
    {
      "title": "Established Brand Recognition and System Support",
      "description": "McDonald''s global brand strength reduces customer acquisition costs significantly. Support includes Hamburger University training, OPNAD advertising cooperatives, and ongoing operational consulting. Revenue stability ($7.21B from franchisees in 2024) validates system reliability and reduces startup risks.",
      "rating": "High",
      "citations": ["Item 1 (page 1)", "Item 11 (pages 22-24)", "Item 7 (page 20)"]
    },
    {
      "title": "Comprehensive Technology Infrastructure",
      "description": "Mandated modern systems (POS, kiosks, cashless) enhance efficiency and customer experience. Annual software fees ($10,000-$12,000) cover 15+ services including Sesame POS and digital menu boards. This infrastructure supports scalability and aligns with digital ordering trends, potentially reducing labor costs by 15-20%.",
      "rating": "High",
      "citations": ["Item 6 (page 11)", "Item 8 (pages 18-19)", "Item 11 (page 24)"]
    },
    {
      "title": "Real Estate Co-Investment Rent Reduction",
      "description": "Co-investment options allow franchisees to reduce Fixed Percentage Rent by 0.25% increments (minimum 11% for traditional) via additional investments ($30,000+ per increment). Eligible sites with 20-year tenure can lower occupancy costs by $7,500+ annually per 0.25% reduction, improving long-term profitability.",
      "rating": "Medium",
      "citations": ["Item 6 (pages 14-15)"]
    }
  ]'::jsonb,
  '[
    {
      "title": "High Litigation Exposure and Reputational Risk",
      "description": "Item 3 discloses 6 pending lawsuits including racial discrimination claims (Crawford, Michell), antitrust cases (Deslandes, Turner), and product liability (Williams). Concluded cases show settlements up to $33.5M. Legal costs could exceed $50M annually based on historical payouts, impacting brand reputation and franchisee relations.",
      "rating": "High",
      "citations": ["Item 3 (pages 3-9)"]
    },
    {
      "title": "Significant Initial Investment and Ongoing Fees",
      "description": "Traditional startup costs range $1.47M-$2.73M including $313K rent and $1.79M equipment. Ongoing fees include 5% royalty (new units), 4%+ ad spend, percentage rent (up to 29%), and $10K+ technology fees. This structure may require $250K-$439K in working capital, straining cash flow during initial operations.",
      "rating": "Medium",
      "citations": ["Item 6 (pages 10-12)", "Item 7 (pages 17-18)"]
    },
    {
      "title": "Restrictive Sourcing and Technology Mandates",
      "description": "Item 8 requires approved suppliers meeting proprietary standards, potentially increasing costs 10-15% versus open market. Technology must be sourced from designated vendors at $150K-$250K upfront. Limited flexibility may hinder cost optimization during economic downturns.",
      "rating": "Medium",
      "citations": ["Item 8 (pages 18-19)"]
    }
  ]'::jsonb,
  525000,
  2730000,
  45000,
  '5% of Gross Sales',
  '4% of Gross Sales + local co-op contributions',
  40275,
  36059,
  4216,
  NULL,
  NULL,
  6,
  0
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  franchise_score = EXCLUDED.franchise_score,
  score_financial_performance = EXCLUDED.score_financial_performance,
  score_business_model = EXCLUDED.score_business_model,
  score_support_training = EXCLUDED.score_support_training,
  score_legal_compliance = EXCLUDED.score_legal_compliance,
  score_franchisee_satisfaction = EXCLUDED.score_franchisee_satisfaction,
  opportunities = EXCLUDED.opportunities,
  concerns = EXCLUDED.concerns,
  initial_investment_low = EXCLUDED.initial_investment_low,
  initial_investment_high = EXCLUDED.initial_investment_high,
  franchise_fee = EXCLUDED.franchise_fee,
  royalty_fee = EXCLUDED.royalty_fee,
  marketing_fee = EXCLUDED.marketing_fee,
  total_units = EXCLUDED.total_units,
  franchised_units = EXCLUDED.franchised_units,
  company_owned_units = EXCLUDED.company_owned_units,
  units_opened_last_year = EXCLUDED.units_opened_last_year,
  units_closed_last_year = EXCLUDED.units_closed_last_year,
  litigation_count = EXCLUDED.litigation_count,
  bankruptcy_count = EXCLUDED.bankruptcy_count,
  updated_at = NOW();

-- Insert/Update KFC US, LLC (Non-Traditional)
INSERT INTO franchises (
  id,
  name,
  description,
  industry,
  franchise_score,
  score_financial_performance,
  score_business_model,
  score_support_training,
  score_legal_compliance,
  score_franchisee_satisfaction,
  opportunities,
  concerns,
  initial_investment_low,
  initial_investment_high,
  franchise_fee,
  royalty_fee,
  marketing_fee,
  total_units,
  franchised_units,
  company_owned_units,
  units_opened_last_year,
  units_closed_last_year,
  litigation_count,
  bankruptcy_count
) VALUES (
  'f9e8d7c6-b5a4-3210-9876-543210fedcba',
  'KFC US, LLC (Non-Traditional)',
  'KFC non-traditional outlets operate in high-traffic venues like airports, universities, and entertainment centers. This model leverages brand recognition for captive audiences with limited menus and smaller footprints.',
  'Quick Service Restaurant (QSR)',
  418,
  80, -- score_financial_performance
  135, -- score_business_model
  130, -- score_support_training
  190, -- score_legal_compliance
  83, -- score_franchisee_satisfaction
  '[
    {
      "title": "High Growth Rate in Non-Traditional Segment",
      "description": "System expanded 38% (21→29 units) from 2022–2024 despite pandemic impacts. Non-traditional model shows strong resilience in captive venues like airports and universities. With only one pipeline unit committed, accelerated development could capture underserved markets. Median net sales of $873K indicate solid unit-level revenue potential.",
      "rating": "High",
      "citations": ["Item 20 (p. 33)", "Item 19 (p. 31)"]
    },
    {
      "title": "Comprehensive Initial Training Program",
      "description": "5-week key operator training covers operations, compliance, and leadership with $3,000 fee. Program exceeds industry standards with 80+ hours of blended learning (classroom + OJT). Training reduces ramp-up risk and LMS enables continuous skill development.",
      "rating": "Medium",
      "citations": ["Item 11 (pp. 21-22)"]
    },
    {
      "title": "Transparent Initial Investment Structure",
      "description": "Item 7 details all costs including $75K-$900K buildout and $100K-$356K equipment ranges. No hidden fees; partial fee refunds available if zoning prevents opening. Enables precise capital planning with site-specific adjustments.",
      "rating": "Medium",
      "citations": ["Item 7 (pp. 10-11)", "Item 5 (p. 6)"]
    }
  ]'::jsonb,
  '[
    {
      "title": "High Franchisee Turnover and Closure Rates",
      "description": "2023 turnover hit 38.5% (10 closures/26 outlets), improving to 10.3% in 2024 but still double healthy benchmarks. 3-year closure average: 23.2%. Item 19 excludes failed units, masking true failure risk. High volatility indicates operational/financial vulnerability in non-traditional venues.",
      "rating": "High",
      "citations": ["Item 20 (pp. 33-38)"]
    },
    {
      "title": "Rising Mandatory Technology Costs",
      "description": "Tech fees increasing 38% ($297→$411/month) within 2 years. Upfront costs: $22K-$31K. Vendor lock-in (Comcast broadband, Yum! software) limits cost control. Erodes profitability for lower-revenue units like $96K net sales performer.",
      "rating": "High",
      "citations": ["Item 11 (p. 20)", "Item 6 (p. 9)"]
    },
    {
      "title": "Selective Item 19 Financial Disclosures",
      "description": "Item 19 reports only 55% of outlets (16/29), excluding seasonal/college locations and multi-brand units. Wide sales range ($96K-$5.28M) with no expense data prevents break-even analysis. Limits validation of unit economics for prospective franchisees.",
      "rating": "Medium",
      "citations": ["Item 19 (p. 31)"]
    }
  ]'::jsonb,
  302825,
  1434000,
  22500,
  '5.0%',
  '0%',
  29,
  29,
  0,
  3,
  3,
  1,
  0
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  franchise_score = EXCLUDED.franchise_score,
  score_financial_performance = EXCLUDED.score_financial_performance,
  score_business_model = EXCLUDED.score_business_model,
  score_support_training = EXCLUDED.score_support_training,
  score_legal_compliance = EXCLUDED.score_legal_compliance,
  score_franchisee_satisfaction = EXCLUDED.score_franchisee_satisfaction,
  opportunities = EXCLUDED.opportunities,
  concerns = EXCLUDED.concerns,
  initial_investment_low = EXCLUDED.initial_investment_low,
  initial_investment_high = EXCLUDED.initial_investment_high,
  franchise_fee = EXCLUDED.franchise_fee,
  royalty_fee = EXCLUDED.royalty_fee,
  marketing_fee = EXCLUDED.marketing_fee,
  total_units = EXCLUDED.total_units,
  franchised_units = EXCLUDED.franchised_units,
  company_owned_units = EXCLUDED.company_owned_units,
  units_opened_last_year = EXCLUDED.units_opened_last_year,
  units_closed_last_year = EXCLUDED.units_closed_last_year,
  litigation_count = EXCLUDED.litigation_count,
  bankruptcy_count = EXCLUDED.bankruptcy_count,
  updated_at = NOW();
