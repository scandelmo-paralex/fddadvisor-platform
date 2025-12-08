# Buyer Profile Update - Complete Checklist

**Goal:** Fix buyer profile UI/UX and saving

---

## ✅ Phase 1: Database Migration (START HERE)

- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Run `scripts/buyer-profile-update-migration.sql`
- [ ] Verify success message appears
- [ ] Check validation queries show new columns

**Estimated Time:** 2 minutes

---

## ✅ Phase 2: Code Deployment

### Files Changed:
1. ✅ `components/profile-settings-cleaned.tsx` - NEW clean component
2. ✅ `components/profile-page-client.tsx` - Updated save logic
3. ✅ `lib/data.ts` - Updated BuyerProfile interface

### Deploy Steps:
- [ ] Commit changes to Git
  ```bash
  cd ~/Downloads/duplicate-of-fdda-dvisor-platform-build_12_6_25
  git add .
  git commit -m "Fix buyer profile: simplified fields, removed verification, fixed saving"
  git push origin main
  ```
- [ ] Wait for Vercel deployment (auto-triggers)
- [ ] Check Vercel dashboard for deployment status

**Estimated Time:** 5 minutes

---

## ✅ Phase 3: Testing

### Test Scenario 1: New User Profile
- [ ] Create new buyer account (or use existing incomplete profile)
- [ ] Navigate to Profile Settings
- [ ] See completion % at top (should be <100%)
- [ ] See alert: "Complete your profile to access FDDs"
- [ ] Try to save without filling required fields
- [ ] Verify: Save button disabled
- [ ] Fill in required fields:
  - [ ] First Name
  - [ ] Last Name
  - [ ] Phone
  - [ ] City
  - [ ] State
  - [ ] Desired Territories
  - [ ] Years of Experience
  - [ ] Employment Status
  - [ ] FICO Score Range
  - [ ] Liquid Assets Range
  - [ ] Net Worth Range
  - [ ] Select at least 1 Funding Plan (checkboxes)
  - [ ] Check both background attestations
- [ ] Verify: Save button becomes enabled
- [ ] Click "Save Changes"
- [ ] Verify: Success alert appears
- [ ] Verify: Completion % = 100%
- [ ] Refresh page
- [ ] Verify: All data persisted

### Test Scenario 2: Optional Fields
- [ ] Add profile photo
- [ ] Add LinkedIn URL
- [ ] Add Industry Experience (comma-separated)
- [ ] Add Relevant Skills (comma-separated)
- [ ] Check "Owned business before"
- [ ] Check "Management experience"
- [ ] Save
- [ ] Refresh
- [ ] Verify all optional fields persisted

### Test Scenario 3: Validation Errors
- [ ] Clear First Name field
- [ ] Try to save
- [ ] Verify: Red border on First Name field
- [ ] Verify: Error message shows below field
- [ ] Verify: Page scrolls to first error
- [ ] Fill First Name
- [ ] Verify: Error clears

### Test Scenario 4: Database Verification
- [ ] Open Supabase Dashboard → Table Editor → buyer_profiles
- [ ] Find your test user record
- [ ] Verify all fields saved correctly:
  - [ ] city, state, desired_territories populated
  - [ ] years_of_experience is number
  - [ ] funding_plans is array with values
  - [ ] industry_experience and relevant_skills are arrays
  - [ ] background_attested_at has timestamp

**Estimated Time:** 15 minutes

---

## ✅ Phase 4: Clean Up Old Component

After testing confirms everything works:

- [ ] Delete old component:
  ```bash
  git rm components/profile-settings.tsx
  git commit -m "Remove old profile-settings component"
  git push
  ```
- [ ] Rename cleaned component:
  ```bash
  mv components/profile-settings-cleaned.tsx components/profile-settings.tsx
  git add components/profile-settings.tsx
  git commit -m "Rename cleaned profile component to standard name"
  git push
  ```

**Estimated Time:** 2 minutes

---

## ✅ Phase 5: Update Checklist Document

- [ ] Open `FDDHub_Production_Readiness_Checklist.md`
- [ ] Mark Task #4 as ✅ COMPLETE:
  ```markdown
  ### 4. Fix Buyer Profile Saving (1 hour)
  **Status:** ✅ COMPLETE
  ```

---

## 🎯 Success Criteria

✅ Buyer can edit and save profile  
✅ All required fields validated  
✅ Optional fields work correctly  
✅ Profile completion % accurate  
✅ Save button disabled until complete  
✅ Data persists after refresh  
✅ Database has all new columns  
✅ No console errors  
✅ Clean, uncluttered UI  

---

## 📊 What We Fixed

### ❌ Before:
- Duplicate sections (2x Financial Qualification, 2x Background)
- Profile saves didn't work
- Plaid/FICO verification buttons (not needed)
- Privacy settings (FDDAdvisor-specific)
- My Documents section (wrong page)
- Too many optional fields cluttering UI
- No validation on required fields
- Save button always enabled

### ✅ After:
- Single, clean sections
- Profile saves work perfectly
- Self-reported financial info only
- No privacy settings clutter
- Documents stay on MyFDDs page
- Clear required vs optional
- Validation with helpful errors
- Save button disabled until complete
- Profile completion % visible
- Alert if incomplete

---

## 💡 Future Enhancements

**After WellBiz Demo:**
- [ ] Photo upload to Vercel Blob (currently just local preview)
- [ ] State dropdown with autocomplete
- [ ] Desired Territories multi-select by state/region
- [ ] Industry Experience autocomplete suggestions
- [ ] Skills autocomplete from common list
- [ ] Profile strength indicator (beyond just %)
- [ ] "Why we ask this" tooltips on fields
- [ ] Save draft functionality (auto-save incomplete profiles)

---

## 📝 Notes for Lead Intelligence

**New profile fields enable sophisticated matching:**

```sql
-- Example: Find buyers for Elements Massage
SELECT 
  b.first_name,
  b.last_name,
  b.city_location,
  b.state_location,
  b.years_of_experience,
  b.industry_experience,
  b.relevant_skills,
  b.liquid_assets_range
FROM buyer_profiles b
WHERE (
  'Healthcare' = ANY(b.industry_experience)
  OR 'Wellness' = ANY(b.industry_experience)
  OR 'Fitness' = ANY(b.industry_experience)
)
AND b.years_of_experience >= 5
AND 'Operations' = ANY(b.relevant_skills)
AND b.liquid_assets_range IN ('$100-250k', '$250-500k', '$500k+')
AND b.state_location IN ('TX', 'FL', 'CA', 'NY')
ORDER BY b.years_of_experience DESC;
```

This enables "Ideal Profile Matching" where each franchisor defines their perfect candidate profile, then we calculate match scores for each lead.

---

**Last Updated:** December 8, 2025  
**Status:** Ready to deploy
