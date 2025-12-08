# Enhanced FDD Analysis Extraction Prompt

You are an expert franchise analyst. Analyze the provided FDD text and extract structured data for database storage.

## CRITICAL INSTRUCTIONS

1. **Only use data explicitly stated in the FDD** - NO hallucinations or estimates
2. **Cite specific Item numbers and page numbers** for all data points
3. **READ TABLES CAREFULLY** - Item 19, Item 20, and Item 7 contain critical tabular data that MUST be extracted
4. **Focus your analysis on the relevant FDD Items** for each category:
   - **Investment data**: Item 7 (Estimated Initial Investment)
   - **Revenue/Financial Performance**: Item 19 (Financial Performance Representations) - **LOOK FOR TABLES WITH SALES DATA**
   - **Unit counts and trends**: Item 20 (Outlets and Franchisee Information) - **LOOK FOR TABLES WITH UNIT COUNTS**
   - **Support and Training**: Item 11 (Franchisor's Assistance, Advertising, Computer Systems, and Training)
   - **Territory**: Item 12 (Territory)
   - **Fees**: Items 5, 6, 7 (Initial Fees, Other Fees, Estimated Initial Investment)
   - **Litigation**: Item 3 (Litigation)
   - **Bankruptcy**: Item 4 (Bankruptcy)
5. **For complex franchises with multiple facility types** (like Burger King with Traditional, Non-Traditional, Co-Brand, etc.):
   - Extract the MOST COMMON or STANDARD facility type for the main investment range
   - Note in `investment_breakdown.notes` if multiple facility types exist
6. **Use null for any field not found in the FDD**

---

## REQUIRED JSON STRUCTURE

{
  "franchise_name": "string",
  "description": "string (2-3 sentences describing the business)",
  "industry": "string (e.g., 'Food & Beverage', 'Quick Service Restaurant', 'Health & Fitness', 'Retail', 'Business Services', 'Home Services', 'Education', 'Automotive')",
  
  "initial_investment_low": number,
  "initial_investment_high": number,
  "franchise_fee": number,
  "royalty_fee": "string (e.g., '6%' or '$500/month' or '6% of gross sales')",
  "marketing_fee": "string (e.g., '2%' or '$200/month' or '2% of gross sales')",
  
  "investment_breakdown": {
    "facility_type": "string (e.g., 'Traditional Freestanding', 'Non-Traditional', 'Standard Location') or null",
    "notes": "string (note if multiple facility types exist with different ranges) or null",
    "categories": [
      {
        "category": "string (e.g., 'Franchise Fee', 'Real Estate & Leasehold', 'Equipment & Fixtures', 'Initial Inventory', 'Working Capital', 'Training & Travel', 'Signage', 'Grand Opening', 'Professional Fees', 'Insurance', 'Other Costs')",
        "low": number,
        "high": number,
        "notes": "string (any important notes about this category) or null"
      }
    ]
  },
  
  "average_revenue": number or null,
  "revenue_data": {
    "has_item19": boolean,
    "item19_summary": "string (2-3 sentences summarizing Item 19 financial data) or null",
    "average": number or null,
    "median": number or null,
    "top_quartile": number or null,
    "sample_size": number or null,
    "notes": "string (any important notes about the financial data) or null"
  },
  
  "total_units": number,
  "franchised_units": number,
  "company_owned_units": number,
  "units_opened_last_year": number or null,
  "units_closed_last_year": number or null,
  
  "litigation_count": number,
  "bankruptcy_count": number,
  
  "opportunities": [
    {
      "title": "string (5-8 words)",
      "description": "string (3-5 sentences with specific data, calculations, and evidence from the FDD)",
      "rating": "High|Medium|Low",
      "citations": ["string (e.g., 'Item 19, pages 87-94')", "string (e.g., 'Item 20, page 112')"]
    }
  ],
  
  "concerns": [
    {
      "title": "string (5-8 words)",
      "description": "string (3-5 sentences with specific data, calculations, and evidence from the FDD)",
      "rating": "High|Medium|Low",
      "citations": ["string (e.g., 'Item 3, pages 15-18')", "string (e.g., 'Item 20, pages 112-115')"]
    }
  ],
  
  "analytical_summary": "string (2-3 paragraphs providing overall assessment of the franchise opportunity)",
  
  "franchise_score": number or null,
  "score_financial_performance": number or null,
  "score_business_model": number or null,
  "score_support_training": number or null,
  "score_legal_compliance": number or null,
  "score_franchisee_satisfaction": number or null,
  
  "franchise_score_breakdown": {
    "financial_performance": [
      {
        "metric": "string (e.g., 'Item 19 Availability', 'Revenue Transparency', 'Profitability Indicators')",
        "score": number,
        "max": number,
        "rating": "Excellent|Good|Fair|Poor",
        "explanation": "string (2-3 sentences with specific data from the FDD)"
      }
    ],
    "business_model": [
      {
        "metric": "string (e.g., 'Investment ROI Potential', 'Fee Structure', 'Territory Protection')",
        "score": number,
        "max": number,
        "rating": "Excellent|Good|Fair|Poor",
        "explanation": "string (2-3 sentences with specific data)"
      }
    ],
    "support_training": [
      {
        "metric": "string (e.g., 'Initial Training Quality', 'Ongoing Support', 'Marketing Support')",
        "score": number,
        "max": number,
        "rating": "Excellent|Good|Fair|Poor",
        "explanation": "string (2-3 sentences with specific data from Item 11)"
      }
    ],
    "legal_compliance": [
      {
        "metric": "string (e.g., 'Litigation History', 'Bankruptcy History', 'FDD Transparency')",
        "score": number,
        "max": number,
        "rating": "Excellent|Good|Fair|Poor",
        "explanation": "string (2-3 sentences with specific data from Items 3 and 4)"
      }
    ],
    "franchisee_satisfaction": [
      {
        "metric": "string (e.g., 'Unit Growth Rate', 'Closure Rate', 'System Stability')",
        "score": number,
        "max": number,
        "rating": "Excellent|Good|Fair|Poor",
        "explanation": "string (2-3 sentences with specific data from Item 20)"
      }
    ]
  },
  
  "risk_level": "string (Low|Medium|High) or null",
  "industry_percentile": number or null,
  "roi_timeframe": "string or null"
}

---

## EXTRACTION GUIDELINES

### **🚨 CRITICAL: Item 19 - Financial Performance Representations 🚨**

**⚠️ LEGAL STRUCTURE OF ITEM 19 (FTC Franchise Rule):**

Every Item 19 follows this standardized structure:

1. **First Paragraph (ALWAYS PRESENT)** - FTC boilerplate about what's permitted:
   - "The FTC's Franchise Rule permits a franchisor to provide information about the actual or potential financial performance..."
   - **IGNORE THIS PARAGRAPH** - It doesn't tell you if data exists or not

2. **Middle Section** - Financial data (if provided):
   - Tables with sales data, revenue, profit margins, etc.
   - Averages, medians, quartiles, sample sizes
   - This is what you need to extract

3. **Last Paragraph** - Disclaimer (CRITICAL FOR DETECTION):
   - **IF DATA EXISTS:** "Other than the preceding financial performance representation, [Company] does not make any financial performance representations."
   - **IF NO DATA:** "We do not make any representations about a franchisee's future financial performance or the past financial performance of company-owned or franchised outlets."

**DETECTION ALGORITHM:**

**STEP 1: Read the LAST paragraph of Item 19**

Check for this exact phrase: **"Other than the preceding financial performance representation"**

- **IF FOUND** → `has_item19 = true` (financial data exists above this disclaimer)
  - Proceed to STEP 2 to extract the data
  
- **IF NOT FOUND** → Check for "We do not make any representations about a franchisee's future financial performance"
  - **IF FOUND** → `has_item19 = false` (no financial data provided)
  - Set all revenue fields to null

**STEP 2: Extract financial data from the MIDDLE section**

Look for tables between the first paragraph (FTC boilerplate) and last paragraph (disclaimer):

**Table patterns to look for:**
- "TABLE 1", "TABLE 2", "TABLE 3"
- "TOTAL GROSS SALES", "AVERAGE GROSS SALES", "AVERAGE ANNUAL SALES"
- "HISTORICAL FINANCIAL PERFORMANCE"
- Tables with columns: "Low", "Median", "High", "Average", "Count", "Sample Size"
- Quartile breakdowns: "4th Q (Top 25%)", "3rd Q", "2nd Q", "1st Q (Bottom 25%)"
- "ALL", "Top 25%", "Top 50%", "Bottom 50%", "Bottom 25%"

**REAL EXAMPLE FROM DRYBAR FDD:**

ITEM 19
FINANCIAL PERFORMANCE REPRESENTATIONS

[First paragraph - FTC boilerplate - IGNORE]

The following table presents historical financial performance for 87 franchised Blo Blow Dry Bars...

TABLE 1: TOTAL GROSS SALES & AVERAGE GROSS SALES FOR THE ITEM 19 BARS

Category          Total Sales    Count    Low        Median      High        Average
ALL               32,897,224     87       103,439    345,752     1,091,796   378,129
4th Q (Top 25%)   13,358,165     22       460,639    547,179     1,091,796   607,189
3rd Q             8,869,062      22       345,752    396,044     459,999     403,139
2nd Q             6,893,773      21       283,000    329,000     345,000     328,275
1st Q (Bottom)    3,776,224      22       103,439    165,000     282,000     171,647

TABLE 2: TOTAL NUMBER OF MEMBERS AND AVERAGE NUMBER OF MEMBERS

Category          Total Members  Count    Low    Median    High    Average
ALL               7,885          87       3      86        293     91
4th Q (Top 25%)   3,234          22       107    138       293     147

[Last paragraph - CRITICAL]
Other than the preceding financial performance representation, Blo Blow Dry Bar Inc. does not make any financial performance representations.

**CORRECT EXTRACTION:**
{
  "revenue_data": {
    "has_item19": true,
    "item19_summary": "Item 19 provides financial performance data for 87 franchised bars during 2024. Data includes gross sales and member counts broken down by quartiles.",
    "average": 378129,
    "median": 345752,
    "top_quartile": 607189,
    "sample_size": 87,
    "notes": "Top quartile (22 bars) averaged $607,189 in gross sales with average 147 members. Range: $103,439 - $1,091,796. Bottom quartile averaged $171,647."
  }
}

**EXAMPLE OF NO FINANCIAL DATA:**

ITEM 19
FINANCIAL PERFORMANCE REPRESENTATIONS

[First paragraph - FTC boilerplate]

We do not make any representations about a franchisee's future financial performance or the past financial performance of company-owned or franchised outlets. We also do not authorize our employees or representatives to make any such representations either orally or in writing.

**CORRECT EXTRACTION:**
{
  "revenue_data": {
    "has_item19": false,
    "item19_summary": "Item 19 states that the franchisor does not make any financial performance representations.",
    "average": null,
    "median": null,
    "top_quartile": null,
    "sample_size": null,
    "notes": null
  }
}

### **🚨 CRITICAL: Item 20 - Outlets and Franchisee Information 🚨**

**YOU MUST extract unit counts from Item 20 tables.** These tables are ALWAYS present in Item 20.

**LOOK FOR THESE SPECIFIC TABLE NAMES:**
- "Table No. 1: System-Wide Outlet Summary"
- "Table No. 1: Systemwide Outlet Summary"
- "Outlet Summary for Years [Year] to [Year]"
- "Table No. 3: Status of Franchised Outlets"
- "Table No. 4: Status of Company-Owned Outlets"

**EXAMPLE FROM ITEM 20:**

Table No. 1
System-Wide Outlet Summary
For years 2022 to 2024

Outlet Type          Year    Outlets at     Outlets    Terminations    Non-Renewals    Reacquired    Ceased         Outlets at
                             Start of Year  Opened                                     by Franchisor Operations     End of Year
Franchised           2024    145            28         2               0               0             3              168
Franchised           2023    132            18         3               1               0             1              145
Franchised           2022    120            15         2               0               0             1              132

Company-Owned        2024    12             2          0               0               0             0              14
Company-Owned        2023    10             2          0               0               0             0              12
Company-Owned        2022    10             0          0               0               0             0              10

Total Outlets        2024    157            30         2               0               0             3              182

**CORRECT EXTRACTION:**
{
  "total_units": 182,
  "franchised_units": 168,
  "company_owned_units": 14,
  "units_opened_last_year": 30,
  "units_closed_last_year": 5
}

**Note:** `units_closed_last_year` = Terminations + Non-Renewals + Ceased Operations = 2 + 0 + 3 = 5

### **CRITICAL: Item 7 Investment Breakdown**

**YOU MUST extract the detailed line-item breakdown from Item 7.** Look for tables titled "YOUR ESTIMATED INITIAL INVESTMENT" or "ESTIMATED INITIAL INVESTMENT".

**Example extraction from Item 7:**

If the FDD shows:
Type of Expenditure          Low        High
Franchise Fee               $45,000    $45,000
Real Estate/Lease           $50,000    $150,000
Equipment                   $75,000    $100,000
Initial Inventory           $10,000    $15,000
Working Capital             $25,000    $50,000
Training Expenses           $5,000     $10,000
Total                       $210,000   $370,000

Extract as:
{
  "investment_breakdown": {
    "facility_type": "Standard Location",
    "notes": null,
    "categories": [
      {"category": "Franchise Fee", "low": 45000, "high": 45000, "notes": null},
      {"category": "Real Estate & Leasehold", "low": 50000, "high": 150000, "notes": null},
      {"category": "Equipment & Fixtures", "low": 75000, "high": 100000, "notes": null},
      {"category": "Initial Inventory", "low": 10000, "high": 15000, "notes": null},
      {"category": "Working Capital", "low": 25000, "high": 50000, "notes": null},
      {"category": "Training & Travel", "low": 5000, "high": 10000, "notes": null}
    ]
  }
}

### **Item 11 - Support and Training**

**Extract detailed information from Item 11** about:
- Initial training duration and location
- Ongoing support programs
- Marketing and advertising support
- Field support visits
- Technology and systems support

Use this information in:
- `franchise_score_breakdown.support_training` metrics
- `opportunities` if support is strong
- `concerns` if support is weak

### Opportunities and Concerns
- Provide exactly 3 opportunities and 3 concerns
- Each must have 3-5 sentence descriptions with specific data points
- Include citations array with Item numbers and page numbers
- Rate each as High/Medium/Low based on impact
- **Use Item 19 data in opportunities if financial performance is strong**
- **Use Item 20 data to assess growth trends and system stability**
- **Use Item 11 data to assess support quality**

### Percentages and Fees
- Keep as strings with % symbol: "6% of gross sales" → "6%"
- If flat fee: "$500/month" → "$500/month"

### Null Values
- Use null for any field not found in the FDD
- Do NOT guess or estimate

---

## OUTPUT FORMAT

Return ONLY valid JSON. No markdown code blocks, no explanatory text, just the raw JSON object starting with `{` and ending with `}`.

---

Now analyze the FDD text provided below and return the structured JSON:
