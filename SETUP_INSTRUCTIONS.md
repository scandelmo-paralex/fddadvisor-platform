# FDD Advisor Setup Instructions

## Current Issues & Solutions

### Issue 1: Only Burger King Showing

**Problem:** The database only contains 1 franchise (Burger King). The other franchises (7-Eleven, McDonald's, KFC) haven't been imported yet.

**Solution:** Run the SQL import script to add the remaining franchises.

#### Steps to Import Franchises:

1. **Navigate to the Scripts section** in the v0 sidebar (left side of the screen)
2. **Find and run** `scripts/22-import-detailed-franchises-fixed.sql`
3. This will import 4 franchises total:
   - Burger King (already exists, will be updated)
   - 7-Eleven
   - McDonald's  
   - KFC US, LLC (Non-Traditional)

**What this script does:**
- Deletes existing franchises by name to avoid duplicates
- Inserts complete franchise data including:
  - Investment ranges
  - Revenue data (where available)
  - Franchise scores and breakdowns
  - Opportunities and concerns
  - Unit counts and distribution
  - Litigation and bankruptcy data

### Issue 2: $NaN Values for Revenue

**Problem:** Revenue data was showing as "$NaN" because:
1. Some franchises don't have Item 19 data (intentionally NULL in database)
2. The code wasn't properly checking for NULL/undefined values

**Solution:** ✅ **FIXED** - Updated the code to:
- Check if `revenueData.average` exists before displaying
- Show "No Revenue Data Available" message when Item 19 is missing
- Properly handle NULL values in investment breakdown
- Only show revenue card when data is actually available

### Issue 3: Missing Average Revenue Cards

**Problem:** Revenue cards weren't showing even when data existed.

**Solution:** ✅ **FIXED** - Updated the condition to show revenue card when:
- `franchise.avgRevenue` exists, OR
- `franchise.revenueData.average` exists

### Issue 4: Initial Investment Placeholders

**Problem:** Investment breakdown was showing "$NaNK" for franchise fee.

**Solution:** ✅ **FIXED** - Added proper NULL checks and only show breakdown when data exists.

### Issue 5: Missing Citations

**Status:** ✅ **Already Working** - Citations are stored in the opportunities/concerns data structure and display when you expand each item.

### Issue 6: Improve Locations Display

**Solution:** ✅ **FIXED** - Enhanced to show:
- Total unit count
- Number of states (when `stateDistribution` data available)
- Top 3 states with unit counts

### Issue 7: Simplify DeepSeek Prompt

**Solution:** ✅ **FIXED** - Created new simplified prompt at `scripts/FDD_ANALYSIS_PROMPT.md` with:
- Everyday, conversational language
- Buyer-friendly explanations
- Same analytical depth, easier to understand

## Database Schema Reference

The franchises table includes these key columns:

\`\`\`sql
- id (uuid)
- name (text)
- description (text)
- industry (text)
- franchise_score (integer)
- score_financial_performance (integer)
- score_business_model (integer)
- score_support_training (integer)
- score_legal_compliance (integer)
- score_franchisee_satisfaction (integer)
- franchise_score_breakdown (jsonb)
- opportunities (jsonb)
- concerns (jsonb)
- initial_investment_low (integer)
- initial_investment_high (integer)
- franchise_fee (integer)
- royalty_fee (text)
- marketing_fee (text)
- investment_breakdown (jsonb)
- avg_revenue (integer) - NULL when no Item 19
- revenue_data (jsonb) - NULL when no Item 19
- total_units (integer)
- franchised_units (integer)
- company_owned_units (integer)
- state_distribution (jsonb)
\`\`\`

## Next Steps

1. **Run the SQL script** to import all franchises
2. **Refresh the discover page** - you should now see 4 franchises
3. **Verify the fixes:**
   - Revenue cards show properly (or "No Data" message)
   - Investment breakdown displays correctly
   - Locations show state distribution
   - Citations work when expanding opportunities/concerns

## Notes

- **Burger King** has no Item 19 data (intentional - they don't disclose revenue)
- The other franchises may also have NULL revenue data depending on their FDD
- The simplified DeepSeek prompt maintains all analytical depth while using buyer-friendly language
