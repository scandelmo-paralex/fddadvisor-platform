-- Insert 4 test franchises from DeepSeek R1 processing
-- Run this after script 15 (create-franchises-table.sql)

-- 1. Burger King
INSERT INTO franchises (
  franchise_name, brand_description, industry, franchise_score,
  financial_performance_score, business_model_score, support_training_score,
  legal_compliance_score, franchisee_satisfaction_score,
  opportunities, concerns,
  initial_investment_low, initial_investment_high, franchise_fee,
  royalty_fee, marketing_fee, technology_fee,
  item19_available, units_total, units_franchised, units_company_owned,
  units_opened_last_year, units_closed_last_year,
  ongoing_support, litigation_count, bankruptcy_count, competitive_advantages
) VALUES (
  'Burger King (BKC)',
  'Global QSR leader with 19,732 units worldwide and strong brand recognition. Faces intense competition in the quick-service restaurant sector. Operates with corporate R&D support and digital infrastructure including app-based ordering.',
  'Food & Beverage',
  312,
  0, 123, 89, 70, 30,
  '[
    {"title": "Multi-Unit Development Incentives", "description": "2024 Program offers reduced franchise fees ($25K vs $50K), royalty discounts (2.5%-4.5%), and ad fund reductions (2.0%-3.5%) for 3-10 unit commitments", "rating": "High", "citations": "Items 5-6, pp.19-33"},
    {"title": "Remodel Incentive Programs", "description": "Reclaim the Flame 2 offers co-investment, reduced successor fees ($2.5K/year), and royalty flexibility (4.5%-6.0%) for remodels meeting deadlines", "rating": "Medium", "citations": "Item 6, p.30, Exhibit X1"},
    {"title": "Internal Talent Pipeline", "description": "Crown Your Career enables qualified employees to purchase stores after 1-3 years with possible financing", "rating": "Low", "citations": "Item 1, p.6"}
  ]'::jsonb,
  '[
    {"title": "Financial Performance Opacity", "description": "No Item 19 disclosure prohibits ROI validation. Initial investment ($1.2M-$2.3M) lacks performance context", "rating": "High", "citations": "Item 19, p.86"},
    {"title": "Litigation Exposure", "description": "Active antitrust lawsuit (Arrington v. BKC) could impact franchisee labor practices and brand reputation", "rating": "Medium", "citations": "Item 3, p.12"},
    {"title": "Complex Fee Structure", "description": "25+ fees include royalties (4.5%), ad fund (4.5%), tech fees ($0.30/transaction), and mandatory donations ($1K/store/year)", "rating": "Medium", "citations": "Item 6, pp.23-28, Exhibit W"}
  ]'::jsonb,
  1202500, 2285000, 50000,
  '4.5%', '4.5%', '$0.30 per transaction',
  false, 6701, 5524, 1177,
  85, 117,
  'Field support via Regional VPs, centralized IT desk, and digital app platform',
  7, 0,
  '["Global QSR leader", "Established supply chain", "Digital infrastructure (app/delivery)", "Corporate R&D support"]'::jsonb
);

-- 2. 7-Eleven
INSERT INTO franchises (
  franchise_name, brand_description, industry, franchise_score,
  financial_performance_score, business_model_score, support_training_score,
  legal_compliance_score, franchisee_satisfaction_score,
  opportunities, concerns,
  initial_investment_low, initial_investment_high, franchise_fee,
  liquid_capital_required, royalty_fee, marketing_fee,
  item19_available, units_total, units_franchised, units_company_owned,
  units_opened_last_year, units_closed_last_year, year_founded,
  ongoing_support, litigation_count, bankruptcy_count, competitive_advantages
) VALUES (
  '7-Eleven',
  '7-Eleven is a global convenience store franchise operating 21,651+ international units under parent company Seven & i Holdings. It leverages an integrated supply chain through SEIF (fuel) and SEDC (merchandise) while diversifying revenue streams via fresh food, proprietary beverages, and delivery services like Skipcart.',
  'Retail',
  320,
  0, 135, 85, 45, 55,
  '[
    {"title": "Global Brand Power", "description": "Operates 21,651+ stores internationally with strong brand recognition driving customer trust.", "rating": "High", "citations": "Item 1, p. 1"},
    {"title": "Integrated Supply Chain & Technology", "description": "SEIF/SEDC reduce procurement costs; Skipcart delivery and 7Now app enable revenue diversification.", "rating": "High", "citations": "Item 1, pp. 6-7"},
    {"title": "Revenue Stream Diversification", "description": "Focus on high-margin fresh food and beverages to offset fuel/tobacco dependence.", "rating": "Medium", "citations": "Item 1, p. 8; Item 6, p. 26"}
  ]'::jsonb,
  '[
    {"title": "Regulatory & Tobacco Dependence Risk", "description": "30%+ sales from tobacco/nicotine products; increasing restrictions may significantly lower store sales.", "rating": "High", "citations": "Item 1, p. 10; Item 3, p. 16"},
    {"title": "Financial Pressure on Franchisees", "description": "11% breached Minimum Net Worth requirement in 2024; complex royalty structure (45–59% of Gross Profit).", "rating": "High", "citations": "Item 5, pp. 18-19; Item 6, p. 25"},
    {"title": "Litigation & Franchisee Relations", "description": "15+ pending lawsuits including termination disputes and alleged training/support failures.", "rating": "High", "citations": "Item 3, pp. 14-16"}
  ]'::jsonb,
  37650, 716860, 0,
  20000, '45-59% of Gross Profit', '1% Gross Profit fee',
  false, 11101, 7300, 3801,
  172, 128, 1927,
  'Field support and marketing assistance',
  15, 0,
  '["Global brand recognition", "Integrated supply chain (SEIF/SEDC)", "Technology platforms (7Now app, Skipcart)"]'::jsonb
);

-- 3. McDonald's
INSERT INTO franchises (
  franchise_name, brand_description, industry, franchise_score,
  financial_performance_score, business_model_score, support_training_score,
  legal_compliance_score, franchisee_satisfaction_score,
  opportunities, concerns,
  initial_investment_low, initial_investment_high, franchise_fee,
  royalty_fee,
  item19_available,
  ongoing_support, litigation_count, bankruptcy_count, competitive_advantages
) VALUES (
  'McDonald''s USA, LLC',
  'Global quick-service restaurant leader with 95% franchise penetration and standardized operations. Known for instant brand recognition, global supply chain infrastructure, and diverse restaurant formats including traditional, STO/STR, and satellite locations.',
  'Food & Beverage',
  268,
  0, 123, 65, 50, 30,
  '[
    {"title": "Global Brand Dominance", "description": "95% franchise penetration, instant brand recognition, and standardized systems drive customer loyalty. Supported by global supply chain and marketing co-ops (OPNAD).", "rating": "High", "citations": "Item 1 (p.1), Item 11 (pp.23–24)"},
    {"title": "Real Estate & Infrastructure Support", "description": "Franchisor handles site selection, construction, and leases, reducing franchisee overhead. Co-investment options lower rent.", "rating": "High", "citations": "Item 6 (pp.12–16), Item 11 (p.23)"},
    {"title": "Technology Integration", "description": "POS/kiosk/digital tools enhance efficiency. Fees are structured but may increase.", "rating": "Medium", "citations": "Item 6 (p.11), Item 8 (p.19)"}
  ]'::jsonb,
  '[
    {"title": "Absence of Financial Performance Data", "description": "Item 19 not disclosed—prospective franchisees lack revenue/profitability benchmarks to assess ROI.", "rating": "High", "citations": "Not disclosed in any item"},
    {"title": "Litigation Exposure", "description": "7 active lawsuits (racial discrimination, antitrust, safety) could impact brand reputation and franchisee relations.", "rating": "High", "citations": "Item 3 (pp.3–6)"},
    {"title": "Royalty/Rent Cost Structure", "description": "5% royalty for new units, rent up to 29% of sales, plus 13+ tech fees. High fixed costs strain profitability.", "rating": "High", "citations": "Item 6 (pp.10–16), Item 7 (p.17)"}
  ]'::jsonb,
  525000, 2730000, 45000,
  '5%',
  false,
  'Field consultants and manuals provided, but specifics on frequency/scope lacking',
  7, 0,
  '["Global supply chain", "Tech infrastructure (POS/kiosks)", "Standardized operations"]'::jsonb
);

-- 4. KFC Non-Traditional
INSERT INTO franchises (
  franchise_name, brand_description, industry, franchise_score,
  financial_performance_score, business_model_score, support_training_score,
  legal_compliance_score, franchisee_satisfaction_score,
  opportunities, concerns,
  initial_investment_low, initial_investment_high, franchise_fee,
  royalty_fee, technology_fee,
  item19_available, item19_summary, average_revenue, revenue_range_low, revenue_range_high,
  units_total, units_franchised, units_company_owned,
  units_opened_last_year, units_closed_last_year,
  training_duration, ongoing_support, litigation_count, bankruptcy_count, competitive_advantages
) VALUES (
  'KFC US, LLC Non-Traditional',
  'KFC Non-Traditional outlets operate in captive-audience locations like airports, colleges, and military bases with a limited menu. The franchise leverages KFC''s globally recognized brand strength and focuses on high-traffic venues with reduced competition. Operations include standardized systems for technology, supply chain, and training.',
  'Food & Beverage',
  360,
  85, 100, 70, 65, 40,
  '[
    {"title": "Brand Power in Captive Markets", "description": "KFC''s global recognition drives foot traffic in non-traditional venues (airports/campuses). Highest-performing unit reported $5.28M net sales.", "rating": "High", "citations": "Item 1 (p.1), Item 19 (p.31)"},
    {"title": "Negotiated Lease Structures", "description": "Many sites use percentage-of-sales rent (vs. fixed cost), reducing overhead during slow periods. Real estate costs as low as $50K when revenue-sharing applies.", "rating": "Medium", "citations": "Item 7 (p.10)"},
    {"title": "Supply Chain Leverage", "description": "Access to RSCS purchasing co-op and Pepsi/DPSU partnerships may lower COGS. Patronage dividends possible via KFC Co-Op membership.", "rating": "Low", "citations": "Item 8 (pp.12-14)"}
  ]'::jsonb,
  '[
    {"title": "Undisclosed Profitability", "description": "Item 19 omits expenses, obscuring ROI. Royalties (9.5% of gross) + tech fees ($411.23+/month) could erode margins, especially with $1.43M upper investment.", "rating": "High", "citations": "Item 19 (p.31), Item 6 (p.7), Item 7 (p.10)"},
    {"title": "Investment Volatility", "description": "Initial investment spans $302K–$1.43M, driven by unpredictable construction/equipment costs ($75K–$900K and $100K–$356K). Wide range complicates financial planning.", "rating": "High", "citations": "Item 7 (p.10)"},
    {"title": "Growth Stagnation", "description": "Net unit loss (-1) in 2024; closures increased yearly. No renewal rights post-term forces reapplication.", "rating": "Medium", "citations": "Item 20 (p.33), Item 17 (p.28)"}
  ]'::jsonb,
  302825, 1434000, 22500,
  '9.5% of gross revenues', '$297.39 (increasing to $411.23)',
  true, 'Net Sales only (no expenses, profitability) for 16 Single-Brand Non-Traditional Outlets (FYE 2024); Average: $1,094,921; Highest: $5,282,226; Median: $873,053; Lowest: $96,119',
  1094921, 96119, 5282226,
  29, 29, 0,
  2, 3,
  '5 weeks', 'ROCC evaluations (3x/year), Learning Management System access, Franchise Business Coach',
  1, 0,
  '["Captive-audience locations", "Strong brand equity", "RSCS purchasing co-op", "Pepsi/DPSU partnerships", "Technology infrastructure (POS/KDS)"]'::jsonb
);
