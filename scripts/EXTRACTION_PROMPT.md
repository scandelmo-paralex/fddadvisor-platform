# FDD Analysis Extraction Prompt

You are a data extraction specialist. You will receive a narrative analysis of a Franchise Disclosure Document (FDD). Your task is to extract structured data in JSON format.

## Input
You will receive a text analysis of an FDD that contains information about a franchise opportunity.

## Output Format
Extract the following fields and return ONLY valid JSON (no markdown, no explanations):

\`\`\`json
{
  "name": "Franchise Name",
  "industry": "Industry Category (e.g., Food & Beverage, Health & Fitness, Personal Services, Business Services, Technology)",
  "description": "Brief 1-2 sentence description of the franchise",
  "hasItem19": true/false,
  "investmentMin": 0,
  "investmentMax": 0,
  "roiTimeframe": "X-Y years or Unknown",
  "avgRevenue": 0,
  "totalUnits": 0,
  "status": "Established" or "Trending" or "New",
  "analyticalSummary": "2-3 sentence summary of the franchise opportunity",
  "opportunities": [
    "First opportunity with specific data and context",
    "Second opportunity with specific data and context",
    "Third opportunity with specific data and context"
  ],
  "concerns": [
    "First concern with specific data and context",
    "Second concern with specific data and context",
    "Third concern with specific data and context"
  ],
  "investmentBreakdown": {
    "franchiseFee": 0,
    "equipment": 0,
    "leasehold": 0,
    "inventory": 0,
    "training": 0,
    "marketing": 0,
    "workingCapital": 0,
    "other": 0
  },
  "revenueData": {
    "average": 0,
    "median": 0,
    "topQuartile": 0,
    "bottomQuartile": 0
  },
  "franchiseScoreBreakdown": {
    "systemStability": [
      {
        "metric": "Metric name (e.g., Franchisee Turnover Rate)",
        "score": 0,
        "max": 50,
        "rating": "Excellent/Good/Fair/Poor",
        "explanation": "Detailed explanation with specific data points"
      }
    ],
    "supportQuality": [
      {
        "metric": "Metric name (e.g., Training Program Duration)",
        "score": 0,
        "max": 40,
        "rating": "Excellent/Good/Fair/Poor",
        "explanation": "Detailed explanation with specific data points"
      }
    ],
    "growthTrajectory": [
      {
        "metric": "Metric name (e.g., Unit Growth Rate)",
        "score": 0,
        "max": 40,
        "rating": "Excellent/Good/Fair/Poor",
        "explanation": "Detailed explanation with specific data points"
      }
    ],
    "financialDisclosure": [
      {
        "metric": "Metric name (e.g., Item 19 Completeness)",
        "score": 0,
        "max": 30,
        "rating": "Excellent/Good/Fair/Poor",
        "explanation": "Detailed explanation with specific data points"
      }
    ]
  }
}
\`\`\`

## Extraction Guidelines

### Basic Information
- **name**: Extract the exact franchise brand name
- **industry**: Categorize into one of: Food & Beverage, Health & Fitness, Personal Services, Business Services, Technology, Retail, Real Estate, Education, Automotive, Home Services
- **description**: Create a concise 1-2 sentence description
- **hasItem19**: true if Item 19 (Financial Performance Representations) is provided, false if not
- **status**: "New" if < 3 years old, "Trending" if growing rapidly, "Established" if mature system

### Financial Data
- **investmentMin/Max**: Extract from Item 7 (Initial Investment)
- **roiTimeframe**: Extract stated ROI timeframe or mark as "Unknown"
- **avgRevenue**: Average unit revenue from Item 19 (if available)
- **totalUnits**: Total number of operating units from Item 20

### Opportunities (Top 3)
Extract the 3 most compelling opportunities. Each should:
- Be specific with data points and numbers
- Include context about why it's an opportunity
- Be 1-2 sentences long
- Focus on: market position, revenue potential, support systems, brand strength, growth trajectory

### Concerns (Top 3)
Extract the 3 most significant concerns. Each should:
- Be specific with data points and numbers
- Include context about the risk
- Be 1-2 sentences long
- Focus on: financial risks, market challenges, fee structures, competition, franchisor stability

### Investment Breakdown
Extract detailed costs from Item 7. Common categories:
- franchiseFee: Initial franchise fee
- equipment: Equipment and fixtures
- leasehold: Leasehold improvements/buildout
- inventory: Initial inventory
- training: Training costs and travel
- marketing: Grand opening marketing
- workingCapital: Additional funds/working capital
- other: Other costs not categorized above

### Revenue Data (from Item 19)
If Item 19 is provided, extract:
- average: Average unit revenue
- median: Median unit revenue
- topQuartile: Top 25% revenue
- bottomQuartile: Bottom 25% revenue

### Franchise Score Breakdown (NEW)
Analyze the FDD and create detailed scoring breakdowns for each category. The total score should be out of 600 points distributed as follows:

#### System Stability (200 points max)
Evaluate and score 3-5 metrics such as:
- **Franchisee Turnover Rate** (50 points): Low turnover = Excellent (45-50), Moderate = Good (30-44), High = Fair (15-29), Very High = Poor (0-14)
- **System Maturity** (50 points): 10+ years = Excellent, 5-10 years = Good, 3-5 years = Fair, <3 years = Poor
- **Litigation History** (50 points): No significant litigation = Excellent, Minor issues = Good, Some concerns = Fair, Major issues = Poor
- **Financial Stability** (50 points): Strong financials = Excellent, Stable = Good, Concerns = Fair, Weak = Poor

#### Support Quality (150 points max)
Evaluate and score 3-5 metrics such as:
- **Training Program Duration** (40 points): 4+ weeks = Excellent, 2-4 weeks = Good, 1-2 weeks = Fair, <1 week = Poor
- **Ongoing Support** (40 points): Comprehensive field support = Excellent, Regular support = Good, Limited = Fair, Minimal = Poor
- **Marketing Support** (40 points): National campaigns + local support = Excellent, Good programs = Good, Basic = Fair, Minimal = Poor
- **Technology/Systems** (30 points): Advanced systems = Excellent, Modern = Good, Basic = Fair, Outdated = Poor

#### Growth Trajectory (150 points max)
Evaluate and score 3-5 metrics such as:
- **Unit Growth Rate** (40 points): 15%+ annual = Excellent, 10-15% = Good, 5-10% = Fair, <5% = Poor
- **Same-Store Sales Growth** (40 points): 10%+ = Excellent, 5-10% = Good, 0-5% = Fair, Negative = Poor
- **Market Demand** (40 points): High demand trend = Excellent, Growing = Good, Stable = Fair, Declining = Poor
- **Territory Availability** (30 points): Many territories = Excellent, Moderate = Good, Limited = Fair, Saturated = Poor

#### Financial Disclosure (100 points max)
Evaluate and score 2-4 metrics such as:
- **Item 19 Completeness** (30 points): Comprehensive data = Excellent, Good detail = Good, Basic = Fair, None = Poor
- **Fee Structure Transparency** (25 points): Clear and reasonable = Excellent, Clear = Good, Some opacity = Fair, Unclear = Poor
- **Profitability Data** (25 points): Detailed margins provided = Excellent, Some data = Good, Limited = Fair, None = Poor
- **Financial Requirements** (20 points): Reasonable requirements = Excellent, Moderate = Good, High = Fair, Very High = Poor

**Scoring Guidelines:**
- Excellent: 90-100% of max points for that metric
- Good: 70-89% of max points
- Fair: 50-69% of max points
- Poor: 0-49% of max points

Each metric should include:
- **metric**: Clear name of what's being evaluated
- **score**: Actual points awarded (0 to max)
- **max**: Maximum possible points for this metric
- **rating**: "Excellent", "Good", "Fair", or "Poor"
- **explanation**: 1-2 sentences explaining the score with specific data from the FDD

## Important Rules
1. Return ONLY valid JSON - no markdown code blocks, no explanations
2. Use 0 for any numeric values that are not disclosed
3. Use "Unknown" for text fields that are not disclosed
4. All dollar amounts should be integers (no decimals, no commas)
5. Opportunities and concerns must be specific and data-driven
6. If Item 19 is not provided, set hasItem19 to false and revenueData values to 0
7. Franchise score breakdown must include 3-5 metrics per category with specific scores and explanations
8. Total franchise score should equal the sum of all metric scores across all categories

## Example Output

\`\`\`json
{
  "name": "Example Franchise",
  "industry": "Food & Beverage",
  "description": "Fast-casual restaurant concept specializing in healthy bowls and smoothies",
  "hasItem19": true,
  "investmentMin": 250000,
  "investmentMax": 450000,
  "roiTimeframe": "3-4 years",
  "avgRevenue": 850000,
  "totalUnits": 150,
  "status": "Trending",
  "analyticalSummary": "Example Franchise represents a growing opportunity in the health-focused fast-casual segment with 150 units and strong unit economics. The investment range of $250K-$450K includes comprehensive training and support systems.",
  "opportunities": [
    "Strong unit economics with average revenue of $850K and 18% EBITDA margins demonstrated across 75% of reporting locations",
    "Growing health-conscious consumer trend driving 15% year-over-year same-store sales growth for the past 3 years",
    "Comprehensive training program (6 weeks) and ongoing field support reduces operational risk for first-time franchisees"
  ],
  "concerns": [
    "High initial investment ($250K-$450K) with buildout costs representing 60% of total investment creates extended payback period",
    "Royalty fee of 7% plus 3% marketing fee totaling 10% of gross sales significantly impacts profit margins in first 2 years",
    "Intense competition from established players and local concepts requires aggressive marketing spend beyond required minimums"
  ],
  "investmentBreakdown": {
    "franchiseFee": 45000,
    "equipment": 120000,
    "leasehold": 180000,
    "inventory": 15000,
    "training": 8000,
    "marketing": 25000,
    "workingCapital": 35000,
    "other": 22000
  },
  "revenueData": {
    "average": 850000,
    "median": 820000,
    "topQuartile": 1100000,
    "bottomQuartile": 650000
  },
  "franchiseScoreBreakdown": {
    "systemStability": [
      {
        "metric": "Franchisee Turnover Rate",
        "score": 42,
        "max": 50,
        "rating": "Good",
        "explanation": "Annual franchisee turnover of 8% is below industry average of 12%, indicating strong franchisee satisfaction and system stability."
      },
      {
        "metric": "System Maturity",
        "score": 45,
        "max": 50,
        "rating": "Excellent",
        "explanation": "Founded in 2010 with 13 years of operation demonstrates proven business model and operational systems."
      },
      {
        "metric": "Litigation History",
        "score": 38,
        "max": 50,
        "rating": "Good",
        "explanation": "Only 2 minor disputes in past 3 years, both resolved favorably, showing strong franchisor-franchisee relationships."
      },
      {
        "metric": "Financial Stability",
        "score": 40,
        "max": 50,
        "rating": "Good",
        "explanation": "Franchisor shows consistent profitability with no debt and adequate reserves for system support."
      }
    ],
    "supportQuality": [
      {
        "metric": "Training Program Duration",
        "score": 38,
        "max": 40,
        "rating": "Excellent",
        "explanation": "6-week comprehensive training program including 2 weeks classroom and 4 weeks in-store training exceeds industry standards."
      },
      {
        "metric": "Ongoing Support",
        "score": 32,
        "max": 40,
        "rating": "Good",
        "explanation": "Dedicated field consultant visits quarterly with 24/7 support hotline and online resource portal."
      },
      {
        "metric": "Marketing Support",
        "score": 28,
        "max": 40,
        "rating": "Fair",
        "explanation": "National marketing campaigns provided but local marketing support is limited to templates and guidelines."
      },
      {
        "metric": "Technology Systems",
        "score": 25,
        "max": 30,
        "rating": "Good",
        "explanation": "Modern POS system with integrated inventory management and reporting, though mobile app could be improved."
      }
    ],
    "growthTrajectory": [
      {
        "metric": "Unit Growth Rate",
        "score": 35,
        "max": 40,
        "rating": "Good",
        "explanation": "12% annual unit growth over past 3 years with 18 new locations opened in 2023."
      },
      {
        "metric": "Same-Store Sales Growth",
        "score": 32,
        "max": 40,
        "rating": "Good",
        "explanation": "Average same-store sales growth of 8% annually demonstrates strong brand momentum and customer loyalty."
      },
      {
        "metric": "Market Demand",
        "score": 36,
        "max": 40,
        "rating": "Excellent",
        "explanation": "Health-conscious dining trend growing 15% annually with increasing consumer preference for fresh, customizable options."
      },
      {
        "metric": "Territory Availability",
        "score": 22,
        "max": 30,
        "rating": "Fair",
        "explanation": "Major metro markets largely awarded but secondary markets and suburbs still have good availability."
      }
    ],
    "financialDisclosure": [
      {
        "metric": "Item 19 Completeness",
        "score": 28,
        "max": 30,
        "rating": "Excellent",
        "explanation": "Comprehensive Item 19 with revenue and expense data from 75% of locations including quartile breakdowns."
      },
      {
        "metric": "Fee Structure Transparency",
        "score": 20,
        "max": 25,
        "rating": "Good",
        "explanation": "Clear disclosure of 7% royalty and 3% marketing fee with no hidden costs, though technology fee could be better explained."
      },
      {
        "metric": "Profitability Data",
        "score": 18,
        "max": 25,
        "rating": "Fair",
        "explanation": "EBITDA margins provided for top quartile (22%) but limited data for median and lower performers."
      },
      {
        "metric": "Financial Requirements",
        "score": 16,
        "max": 20,
        "rating": "Good",
        "explanation": "Net worth requirement of $500K and liquid capital of $150K are reasonable for this investment level."
      }
    ]
  }
}
\`\`\`

Now extract the data from the provided FDD analysis.
