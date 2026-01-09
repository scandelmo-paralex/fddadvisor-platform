# Lead Scoring v2 - Update Summary

**Date:** January 9, 2026  
**Branch:** fix/lead-temperature-sync  
**Status:** Ready to commit

---

## Overview

This update rebalances the lead quality scoring algorithm to prioritize **engagement** over **financial qualification** as the primary signal of buyer intent. The rationale is that while financial qualification is a binary gate (must meet requirements), engagement depth indicates active interest and urgency.

---

## Changes Made

### 1. `lib/lead-scoring.ts` - Core Scoring Algorithm

#### Weight Rebalancing

| Component | Old (v1) | New (v2) | Rationale |
|-----------|----------|----------|-----------|
| Base | 30 pts | **20 pts** | Reduced - just for being a verified lead |
| Engagement | 25 pts | **35 pts** | Increased - PRIMARY signal of buyer intent |
| Financial | 30 pts | **25 pts** | Reduced - important but binary qualifier |
| Experience | 15 pts | **20 pts** | Increased - skills/background matter |

#### Engagement Tier Points

| Tier | Time | Old Points | New Points |
|------|------|------------|------------|
| High | 45+ min | 25 | **35** |
| Meaningful | 15-45 min | 18 | **25** |
| Partial | 5-15 min | 12 | **15** |
| Minimal | <5 min | 5 | 5 |
| None | 0 min | 0 | 0 |

#### Temperature Thresholds

| Temperature | Old Threshold | New Threshold |
|-------------|---------------|---------------|
| 🔥 Hot | 85+ | **80+** |
| 🟡 Warm | 70-84 | **60-79** |
| ❄️ Cold | <70 | **<60** |

#### Financial Scoring (25 pts max, reduced from 30)

- Both meet requirements: 25 pts (was 30)
- One meets, one borderline: ~20 pts
- Both borderline: ~16 pts
- Unknown (no requirements to compare): 20 pts (was 30)
- No profile data: 10 pts (was 15)

#### Experience Scoring (20 pts max, increased from 15)

- Management experience: 7 pts (was 5)
- Prior business ownership: 7 pts (was 5)
- Years of experience:
  - 10+ years: 6 pts (was 5)
  - 5-9 years: 4 pts (was 3)
  - 1-4 years: 2 pts (new)

---

### 2. `app/api/hub/leads/route.ts` - Dashboard API

- Updated pending leads base score from 30 to 20
- Updated scoreBreakdown for consistency

---

### 3. `scripts/sql/update-ace-handyman-ideal-profile.sql` (New)

SQL script to:
- Add financial requirements to Ace Handyman Services
- Includes onboarding template for future franchisors

---

## Expected Results

### Before (v1 Scoring)

| Lead | Time | Score | Temp |
|------|------|-------|------|
| Houston | 87 min | ~95 | Hot |
| Glenn | 8 min | ~85 | **Hot** ❌ |
| DeDe | 6 min | ~82 | **Hot** ❌ |
| New lead | 0 min | 45-60 | Warm/Cold |

### After (v2 Scoring)

| Lead | Time | Score | Temp |
|------|------|-------|------|
| Houston | 87 min | ~100 | Hot ✓ |
| Glenn | 8 min | ~62 | **Warm** ✓ |
| DeDe | 6 min | ~62 | **Warm** ✓ |
| New lead | 0 min | ~30 | Cold ✓ |

---

## Action Items

### Immediate (Run SQL)

Execute `scripts/sql/update-ace-handyman-ideal-profile.sql` in Supabase to:
1. Add financial requirements to Ace Handyman
2. This will change Glenn/DeDe from "UNKNOWN" to "QUALIFIED"

### Onboarding Process

For every new franchisor, we must configure:
```json
{
  "financial_requirements": {
    "liquid_capital_min": 100000,
    "net_worth_min": 300000
  }
}
```

This enables proper financial qualification assessment.

---

## Git Commands

```bash
cd ~/Downloads/duplicate-of-fdda-dvisor-platform-build_12_6_25

git add lib/lead-scoring.ts
git add app/api/hub/leads/route.ts
git add scripts/sql/update-ace-handyman-ideal-profile.sql
git add components/modals.tsx
git add docs/LEAD_SCORING_V2_UPDATE.md

git commit -m "feat: rebalance lead scoring to prioritize engagement over financials

BREAKING CHANGE: Lead scores will change for all existing leads

Scoring Weight Changes (v2):
- Base: 30 → 20 pts (reduced)
- Engagement: 25 → 35 pts (increased - PRIMARY signal)
- Financial: 30 → 25 pts (reduced)
- Experience: 15 → 20 pts (increased)

Temperature Threshold Changes:
- Hot: 85+ → 80+
- Warm: 70-84 → 60-79
- Cold: <70 → <60

Why: A lead with excellent financials but only 8 minutes of engagement
was scoring 'Hot' (85+), same as highly engaged leads. Engagement is
a stronger signal of active buyer intent than financial qualification.

Example impact:
- Glenn (8 min, great financials): 85 Hot → 62 Warm
- Houston (87 min, great financials): 95 Hot → 100 Hot

Also includes:
- SQL script to add ideal_candidate_profile for Ace Handyman
- Template for franchisor onboarding"

git push origin fix/lead-temperature-sync
```

---

### 4. `components/modals.tsx` - Lead Intelligence Modal

- Updated `getLeadTemperature()` thresholds: 80+/60+ (was 85+/70+)
- Updated `getQualityScoreColor()` thresholds: 80/60 (was 80/61)
- Updated `getQualityScoreLabel()` to return "Hot/Warm/Cold" (was "Excellent/Good/Fair")
- Updated tooltip to show correct scoring weights:
  - Engagement (35%) - was 40%
  - Financial Fit (25%) - was 30%  
  - Experience (20%) - was 15%
  - Base (20%) - was Timeline 15%
- Updated score thresholds in tooltip: 80-100 Hot, 60-79 Warm, 0-59 Cold

---

## Files Changed

1. `lib/lead-scoring.ts` - Core scoring algorithm
2. `app/api/hub/leads/route.ts` - Dashboard API (pending leads base score)
3. `scripts/sql/update-ace-handyman-ideal-profile.sql` - New SQL script
4. `components/modals.tsx` - Modal temperature thresholds and tooltip

---

## Testing Checklist

- [ ] Glenn Campbell shows as "Warm" (not "Hot")
- [ ] Houston Cantwell shows as "Hot" (still)
- [ ] DeDe Halfhill shows as "Warm" (not "Hot")
- [ ] New pending leads show score of 20 (not 30)
- [ ] Score breakdown shows correct component values
- [ ] After running SQL, Glenn/DeDe show "QUALIFIED" (not "UNKNOWN")
