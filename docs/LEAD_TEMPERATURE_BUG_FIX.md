# Lead Temperature Data Sync Bug Fix

## Problem Summary
- **Symptom**: Lead Intelligence Report (LIR) shows different temperature than Dashboard
- **Root Cause 1**: ID type mismatch in database trigger (fixed)
- **Root Cause 2**: Two different quality score algorithms (fixed with shared utility)
- **Example**: Houston Cantwell shows ❄️ Cold in table but 🔥 Hot in modal

## Solution: Shared Scoring Utility

Created `/lib/lead-scoring.ts` as the **single source of truth** for lead quality score calculation.

### Files Changed

1. **`/lib/lead-scoring.ts`** - NEW - Shared scoring utility with:
   - `getEngagementTier()` - Determines engagement level (none/minimal/partial/meaningful/high)
   - `getEngagementPoints()` - Points for each tier (0/5/12/18/25)
   - `parseFinancialRange()` - Parses "$100K - $250K" strings
   - `assessFinancialFit()` - Compares buyer vs franchise requirements
   - `getExperiencePoints()` - Points for management/ownership/years
   - `calculateQualityScore()` - Main scoring function
   - `getLeadTemperature()` - Converts score to Hot/Warm/Cold

2. **`/app/api/hub/leads/route.ts`** - MODIFIED - Uses shared utility:
   - Imports `calculateQualityScore`, `getLeadTemperature` from `/lib/lead-scoring`
   - Queries `franchise.ideal_candidate_profile` for financial requirements
   - Passes buyer profile and requirements to scoring function
   - Returns consistent `temperature`, `qualityScore`, `engagementTier`, `financialStatus`

3. **`/app/api/leads/engagement/route.ts`** - UNCHANGED (for now)
   - Still has its own implementation with AI-enhanced insights
   - TODO: Refactor to use shared utility

4. **`/scripts/fix-engagement-sync-trigger.sql`** - Database trigger fix (previously created)

## Quality Score Algorithm

**Total: 100 points max**

| Component | Points | Source |
|-----------|--------|--------|
| Base | 30 | Always awarded |
| Engagement | 0-25 | Time spent tier |
| Financial | 0-30 | Qualification status |
| Experience | 0-15 | Background |

### Engagement Tier Scoring

| Tier | Time | Points |
|------|------|--------|
| high | 45+ min | 25 |
| meaningful | 15-45 min | 18 |
| partial | 5-15 min | 12 |
| minimal | <5 min | 5 |
| none | 0 min | 0 |

### Financial Qualification Scoring

| Status | Points | Condition |
|--------|--------|-----------|
| qualified | 30 | Meets all franchise requirements |
| borderline | 20 | Close to requirements |
| not_qualified | 5 | Below requirements |
| unknown | 15 | No requirements or no buyer data |

### Experience Scoring

| Factor | Points |
|--------|--------|
| Management experience | +5 |
| Owned business before | +5 |
| 10+ years experience | +5 |
| 5-9 years experience | +3 |

### Temperature Thresholds

| Temperature | Score Range |
|-------------|-------------|
| 🔥 Hot | 85-100 |
| 🟠 Warm | 70-84 |
| ❄️ Cold | 0-69 |

## Important Notes

### Financial Qualification Difference

The Dashboard API now queries `franchise.ideal_candidate_profile.financial_requirements` to do proper financial qualification. If a franchise doesn't have requirements configured, the score defaults to 15 points (benefit of doubt).

The Engagement API (`/api/leads/engagement`) has more sophisticated AI-enhanced financial assessment. This may still cause minor score differences until we fully consolidate.

### ID Relationship (Critical)

- `fdd_engagements.buyer_id` = `auth.users.id` (user_id)
- `lead_fdd_access.buyer_id` = `buyer_profiles.id`
- `buyer_profiles.user_id` = `auth.users.id`

Always join through `buyer_profiles.user_id` when crossing tables.

## Future Improvements

1. **Consolidate engagement API** to use shared utility
2. **Store score in database** via trigger when engagement changes
3. **Cache scores** to avoid recalculating on every API call

## Verification

After deploying, verify Houston Cantwell shows consistent temperature:

1. Dashboard table: Should show 🔥 Hot (or 🟠 Warm depending on financial qualification)
2. LIR modal: Should show same temperature
3. Scores should be within 5-10 points of each other

## Deployment

```bash
cd ~/Downloads/duplicate-of-fdda-dvisor-platform-build_12_6_25
git add lib/lead-scoring.ts app/api/hub/leads/route.ts docs/LEAD_TEMPERATURE_BUG_FIX.md
git commit -m "fix: create shared lead scoring utility for consistent temperature"
git push origin fix/lead-temperature-sync
```
