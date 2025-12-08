# Buyer Profile Database Migration

**Date:** December 8, 2025  
**File:** `scripts/buyer-profile-update-migration.sql`

---

## Summary

This migration adds fields to the `buyer_profiles` table to support the simplified, self-reported profile system.

---

## Changes

### New Fields Added:

**Personal Information:**
- `city_location` (text) - City where buyer is located (ALREADY EXISTS)
- `state_location` (text) - State (2-letter abbreviation) (ALREADY EXISTS)
- `desired_territories` (text) - Geographic territories of interest (free text) - NEW
- `profile_photo_url` (text) - URL to uploaded photo - NEW

**Business Experience:**
- `years_of_experience` (integer) - Years of business experience
- `industry_experience` (text[]) - Industries with experience
- `has_owned_business` (boolean) - Owned/operated business before
- `management_experience` (boolean) - Managed teams/operations
- `current_employment_status` (text) - Employment status
- `relevant_skills` (text[]) - Relevant skills (Sales, Operations, etc.)

**Financial Qualification:**
- `funding_plans` (text[]) - Multiple funding plans (array)

**Background Attestations:**
- `background_attested_at` (timestamptz) - When attestations completed

### Indexes Added:
- `idx_buyer_profiles_state_location` - For filtering by state (uses existing column)
- `idx_buyer_profiles_city_location` - For filtering by city (uses existing column)
- `idx_buyer_profiles_current_employment_status` - For employment status queries

### Data Migration:
- Migrates `funding_plan` (singular) → `funding_plans` (array)
- Uses existing `city_location` and `state_location` columns (no migration needed)

---

## How to Run

### Option 1: Supabase Dashboard (Recommended)
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Copy entire contents of `scripts/buyer-profile-update-migration.sql`
4. Paste and click "Run"
5. Check success message at bottom

### Option 2: Supabase CLI
```bash
cd ~/Downloads/duplicate-of-fdda-dvisor-platform-build_12_6_25
supabase db push --file scripts/buyer-profile-update-migration.sql
```

---

## Validation

After running, these queries verify success:

```sql
-- Check new columns exist
SELECT 
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_name = 'buyer_profiles'
  AND column_name IN (
    'city_location', 'state_location', 'desired_territories', 
    'years_of_experience', 'funding_plans'
  );

-- Check profile completeness
SELECT 
  COUNT(*) as total_profiles,
  COUNT(city_location) as have_city,
  COUNT(state_location) as have_state,
  COUNT(CASE WHEN array_length(funding_plans, 1) > 0 THEN 1 END) as have_funding
FROM buyer_profiles;
```

---

## Required Fields (For Profile Completion)

**Must Complete:**
- first_name
- last_name
- phone
- city
- state
- desired_territories
- years_of_experience
- current_employment_status
- fico_score_range
- liquid_assets_range
- net_worth_range
- funding_plans (at least 1)
- no_bankruptcy_attestation = true
- no_felony_attestation = true

**Optional (But Recommended):**
- profile_photo_url
- linkedin_url
- industry_experience
- relevant_skills
- has_owned_business
- management_experience

---

## Lead Intelligence Value

These new fields enable sophisticated lead matching:

**Industry Experience Matching:**
```sql
-- Find buyers with healthcare experience for Elements Massage
SELECT * FROM buyer_profiles
WHERE 'Healthcare' = ANY(industry_experience)
   OR 'Wellness' = ANY(industry_experience);
```

**Skills Alignment:**
```sql
-- Find buyers with operations skills
SELECT * FROM buyer_profiles
WHERE 'Operations' = ANY(relevant_skills)
   AND has_owned_business = true;
```

**Geographic Targeting:**
```sql
-- Find buyers interested in Texas
SELECT * FROM buyer_profiles
WHERE state_location = 'TX'
   OR desired_territories ILIKE '%Texas%'
   OR desired_territories ILIKE '%Austin%';
```

**Future: Ideal Profile Matching**
Each franchisor can define their ideal franchisee profile, then calculate match scores:
- Years experience match
- Industry experience overlap
- Skills alignment
- Employment status preference
- Financial qualification tiers

---

## Breaking Changes

❌ **NONE** - This is a purely additive migration. All existing columns remain unchanged.

---

## Next Steps

After migration:
1. ✅ Test profile editing in app
2. ✅ Verify all fields save correctly
3. ✅ Test validation (required fields)
4. ✅ Test profile completion blocking FDD access
5. ✅ Build Lead Intelligence matching queries

---

## Notes

- All new fields are nullable (safe for existing profiles)
- Existing profiles will show as incomplete until filled
- Profile photo upload goes to Vercel Blob (not Supabase Storage)
- LinkedIn URL validation happens client-side only
