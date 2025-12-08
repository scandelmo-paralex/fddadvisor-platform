-- Add franchise score breakdown data for expandable scoring criteria

-- First, add a column to store the detailed breakdown as JSONB
ALTER TABLE franchises 
ADD COLUMN IF NOT EXISTS franchise_score_breakdown JSONB DEFAULT '{}'::jsonb;

-- Update Burger King with detailed score breakdown
UPDATE franchises 
SET franchise_score_breakdown = '{
  "systemStability": [
    {
      "metric": "Franchisee Turnover Rate",
      "score": 12,
      "max": 50,
      "rating": "Poor",
      "explanation": "High turnover rate of 8.5% indicates franchisee dissatisfaction"
    },
    {
      "metric": "Unit Closure Rate",
      "score": 10,
      "max": 50,
      "rating": "Poor",
      "explanation": "Significant closures with 98 litigation cases"
    },
    {
      "metric": "Litigation Cases (3yr)",
      "score": 10,
      "max": 50,
      "rating": "Poor",
      "explanation": "98 litigation cases is extremely high for the system"
    },
    {
      "metric": "Financial Stability",
      "score": 20,
      "max": 50,
      "rating": "Fair",
      "explanation": "Stable parent company but system challenges"
    }
  ],
  "supportQuality": [
    {
      "metric": "Initial Training",
      "score": 15,
      "max": 40,
      "rating": "Fair",
      "explanation": "Basic training program provided"
    },
    {
      "metric": "Ongoing Support",
      "score": 15,
      "max": 40,
      "rating": "Fair",
      "explanation": "Field support available but inconsistent"
    },
    {
      "metric": "Marketing Support",
      "score": 12,
      "max": 35,
      "rating": "Fair",
      "explanation": "National campaigns but high ad fund contribution"
    },
    {
      "metric": "Technology Systems",
      "score": 10,
      "max": 35,
      "rating": "Fair",
      "explanation": "POS system provided but aging infrastructure"
    }
  ],
  "growthTrajectory": [
    {
      "metric": "3-Year Growth Rate",
      "score": 20,
      "max": 50,
      "rating": "Fair",
      "explanation": "Modest growth of 3.2% annually"
    },
    {
      "metric": "Market Expansion",
      "score": 20,
      "max": 50,
      "rating": "Fair",
      "explanation": "Global presence but saturated markets"
    },
    {
      "metric": "Unit Economics",
      "score": 20,
      "max": 50,
      "rating": "Fair",
      "explanation": "Profitability varies significantly by location"
    }
  ],
  "financialDisclosure": [
    {
      "metric": "Item 19 Quality",
      "score": 0,
      "max": 50,
      "rating": "Poor",
      "explanation": "No Item 19 financial performance disclosure provided"
    },
    {
      "metric": "Transparency",
      "score": 40,
      "max": 25,
      "rating": "Good",
      "explanation": "Clear disclosure of fees and obligations"
    },
    {
      "metric": "Investment Clarity",
      "score": 40,
      "max": 25,
      "rating": "Good",
      "explanation": "Detailed investment breakdown provided"
    }
  ]
}'::jsonb
WHERE name = 'Burger King';

-- Update 7-Eleven with detailed score breakdown
UPDATE franchises 
SET franchise_score_breakdown = '{
  "systemStability": [
    {
      "metric": "Franchisee Turnover Rate",
      "score": 15,
      "max": 50,
      "rating": "Fair",
      "explanation": "Moderate turnover rate of 6.2%"
    },
    {
      "metric": "Unit Closure Rate",
      "score": 15,
      "max": 50,
      "rating": "Fair",
      "explanation": "Some closures but manageable"
    },
    {
      "metric": "Litigation Cases (3yr)",
      "score": 14,
      "max": 50,
      "rating": "Fair",
      "explanation": "45 litigation cases disclosed"
    },
    {
      "metric": "Financial Stability",
      "score": 20,
      "max": 50,
      "rating": "Fair",
      "explanation": "Strong parent company backing"
    }
  ],
  "supportQuality": [
    {
      "metric": "Initial Training",
      "score": 15,
      "max": 40,
      "rating": "Fair",
      "explanation": "Comprehensive training program"
    },
    {
      "metric": "Ongoing Support",
      "score": 15,
      "max": 40,
      "rating": "Fair",
      "explanation": "Field support and operations consultants"
    },
    {
      "metric": "Marketing Support",
      "score": 15,
      "max": 35,
      "rating": "Fair",
      "explanation": "National campaigns and local marketing tools"
    },
    {
      "metric": "Technology Systems",
      "score": 15,
      "max": 35,
      "rating": "Fair",
      "explanation": "Modern POS and inventory systems"
    }
  ],
  "growthTrajectory": [
    {
      "metric": "3-Year Growth Rate",
      "score": 18,
      "max": 50,
      "rating": "Fair",
      "explanation": "Steady growth of 4.5% annually"
    },
    {
      "metric": "Market Expansion",
      "score": 20,
      "max": 50,
      "rating": "Fair",
      "explanation": "Strong presence in 27 states"
    },
    {
      "metric": "Unit Economics",
      "score": 18,
      "max": 50,
      "rating": "Fair",
      "explanation": "Consistent profitability model"
    }
  ],
  "financialDisclosure": [
    {
      "metric": "Item 19 Quality",
      "score": 0,
      "max": 50,
      "rating": "Poor",
      "explanation": "No Item 19 financial performance disclosure provided"
    },
    {
      "metric": "Transparency",
      "score": 40,
      "max": 25,
      "rating": "Good",
      "explanation": "Clear disclosure of fees and obligations"
    },
    {
      "metric": "Investment Clarity",
      "score": 40,
      "max": 25,
      "rating": "Good",
      "explanation": "Detailed investment breakdown provided"
    }
  ]
}'::jsonb
WHERE name = '7-Eleven';

-- Update McDonald's with detailed score breakdown
UPDATE franchises 
SET franchise_score_breakdown = '{
  "systemStability": [
    {
      "metric": "Franchisee Turnover Rate",
      "score": 10,
      "max": 50,
      "rating": "Poor",
      "explanation": "High turnover rate of 9.1%"
    },
    {
      "metric": "Unit Closure Rate",
      "score": 10,
      "max": 50,
      "rating": "Poor",
      "explanation": "Significant closures in recent years"
    },
    {
      "metric": "Litigation Cases (3yr)",
      "score": 12,
      "max": 50,
      "rating": "Poor",
      "explanation": "67 litigation cases disclosed"
    },
    {
      "metric": "Financial Stability",
      "score": 16,
      "max": 50,
      "rating": "Fair",
      "explanation": "Strong parent company but facing challenges"
    }
  ],
  "supportQuality": [
    {
      "metric": "Initial Training",
      "score": 15,
      "max": 40,
      "rating": "Fair",
      "explanation": "Hamburger University training program"
    },
    {
      "metric": "Ongoing Support",
      "score": 15,
      "max": 40,
      "rating": "Fair",
      "explanation": "Field consultants and regional support"
    },
    {
      "metric": "Marketing Support",
      "score": 15,
      "max": 35,
      "rating": "Fair",
      "explanation": "Strong national marketing campaigns"
    },
    {
      "metric": "Technology Systems",
      "score": 15,
      "max": 35,
      "rating": "Fair",
      "explanation": "Modern POS and mobile ordering"
    }
  ],
  "growthTrajectory": [
    {
      "metric": "3-Year Growth Rate",
      "score": 15,
      "max": 50,
      "rating": "Fair",
      "explanation": "Slow growth of 2.1% annually"
    },
    {
      "metric": "Market Expansion",
      "score": 18,
      "max": 50,
      "rating": "Fair",
      "explanation": "Global presence but saturated markets"
    },
    {
      "metric": "Unit Economics",
      "score": 15,
      "max": 50,
      "rating": "Fair",
      "explanation": "High investment with variable returns"
    }
  ],
  "financialDisclosure": [
    {
      "metric": "Item 19 Quality",
      "score": 0,
      "max": 50,
      "rating": "Poor",
      "explanation": "No Item 19 financial performance disclosure provided"
    },
    {
      "metric": "Transparency",
      "score": 40,
      "max": 25,
      "rating": "Good",
      "explanation": "Clear disclosure of fees and obligations"
    },
    {
      "metric": "Investment Clarity",
      "score": 40,
      "max": 25,
      "rating": "Good",
      "explanation": "Detailed investment breakdown provided"
    }
  ]
}'::jsonb
WHERE name = 'McDonald''s';

-- Update KFC Non-Traditional with detailed score breakdown
UPDATE franchises 
SET franchise_score_breakdown = '{
  "systemStability": [
    {
      "metric": "Franchisee Turnover Rate",
      "score": 20,
      "max": 50,
      "rating": "Good",
      "explanation": "Low turnover rate of 3.8%"
    },
    {
      "metric": "Unit Closure Rate",
      "score": 20,
      "max": 50,
      "rating": "Good",
      "explanation": "Minimal closures with strong retention"
    },
    {
      "metric": "Litigation Cases (3yr)",
      "score": 20,
      "max": 50,
      "rating": "Good",
      "explanation": "Only 12 litigation cases - very low"
    },
    {
      "metric": "Financial Stability",
      "score": 20,
      "max": 50,
      "rating": "Good",
      "explanation": "Strong parent company (Yum! Brands)"
    }
  ],
  "supportQuality": [
    {
      "metric": "Initial Training",
      "score": 15,
      "max": 40,
      "rating": "Fair",
      "explanation": "Comprehensive training program"
    },
    {
      "metric": "Ongoing Support",
      "score": 15,
      "max": 40,
      "rating": "Fair",
      "explanation": "Field support and operations consultants"
    },
    {
      "metric": "Marketing Support",
      "score": 15,
      "max": 35,
      "rating": "Fair",
      "explanation": "National KFC brand marketing"
    },
    {
      "metric": "Technology Systems",
      "score": 15,
      "max": 35,
      "rating": "Fair",
      "explanation": "Modern POS and ordering systems"
    }
  ],
  "growthTrajectory": [
    {
      "metric": "3-Year Growth Rate",
      "score": 20,
      "max": 50,
      "rating": "Good",
      "explanation": "Strong growth of 8.7% annually"
    },
    {
      "metric": "Market Expansion",
      "score": 20,
      "max": 50,
      "rating": "Good",
      "explanation": "Expanding into non-traditional venues"
    },
    {
      "metric": "Unit Economics",
      "score": 20,
      "max": 50,
      "rating": "Good",
      "explanation": "Strong profitability in captive venues"
    }
  ],
  "financialDisclosure": [
    {
      "metric": "Item 19 Quality",
      "score": 40,
      "max": 50,
      "rating": "Excellent",
      "explanation": "Detailed Item 19 financial performance data provided"
    },
    {
      "metric": "Transparency",
      "score": 20,
      "max": 25,
      "rating": "Good",
      "explanation": "Clear disclosure of all fees and obligations"
    },
    {
      "metric": "Investment Clarity",
      "score": 20,
      "max": 25,
      "rating": "Good",
      "explanation": "Comprehensive investment breakdown"
    }
  ]
}'::jsonb
WHERE name = 'KFC Non-Traditional';

-- Verify the updates
SELECT name, franchise_score, franchise_score_breakdown FROM franchises ORDER BY name;
