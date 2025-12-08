# Database Fields Mapping - CORRECTED

**Issue Found:** Migration was trying to create `city` and `state` columns, but they already exist as `city_location` and `state_location`!

---

## ✅ CORRECTED - Using Existing Columns

### Personal Info Fields:

| UI Field Name | Database Column Name | Status |
|--------------|---------------------|--------|
| firstName | `first_name` | ✅ EXISTS |
| lastName | `last_name` | ✅ EXISTS |
| email | `email` | ✅ EXISTS |
| phone | `phone` | ✅ EXISTS |
| **city** | **`city_location`** | ✅ EXISTS (was already there!) |
| **state** | **`state_location`** | ✅ EXISTS (was already there!) |
| desiredTerritories | `desired_territories` | 🆕 NEW (migration adds) |
| profilePhotoUrl | `profile_photo_url` | 🆕 NEW (migration adds) |
| linkedInUrl | `linkedin_url` | ✅ EXISTS |

### Business Experience Fields:

| UI Field Name | Database Column Name | Status |
|--------------|---------------------|--------|
| yearsOfExperience | `years_of_experience` | 🆕 NEW |
| industryExperience | `industry_experience` | 🆕 NEW (array) |
| hasOwnedBusiness | `has_owned_business` | 🆕 NEW |
| managementExperience | `management_experience` | 🆕 NEW |
| currentEmploymentStatus | `current_employment_status` | 🆕 NEW |
| relevantSkills | `relevant_skills` | 🆕 NEW (array) |

### Financial Fields:

| UI Field Name | Database Column Name | Status |
|--------------|---------------------|--------|
| ficoScoreRange | `fico_score_range` | ✅ EXISTS |
| liquidAssetsRange | `liquid_assets_range` | ✅ EXISTS |
| netWorthRange | `net_worth_range` | ✅ EXISTS |
| fundingPlans | `funding_plans` | 🆕 NEW (array - replaces `funding_plan`) |

### Background Attestations:

| UI Field Name | Database Column Name | Status |
|--------------|---------------------|--------|
| noBankruptcyAttestation | `no_bankruptcy_attestation` | ✅ EXISTS |
| noFelonyAttestation | `no_felony_attestation` | ✅ EXISTS |
| attestedAt | `background_attested_at` | 🆕 NEW |

---

## 📝 What Changed in Code

### 1. Migration SQL Fixed
**Before:** Tried to create `city` and `state` columns  
**After:** Uses existing `city_location` and `state_location`, only adds indexes

### 2. profile-page-client.tsx Fixed
**Before:** 
```typescript
city: buyerProfileData?.city || "",
state: buyerProfileData?.state || "",
// ...
city: updatedProfile.personalInfo.city,
state: updatedProfile.personalInfo.state,
```

**After:**
```typescript
city: buyerProfileData?.city_location || "",
state: buyerProfileData?.state_location || "",
// ...
city_location: updatedProfile.personalInfo.city,
state_location: updatedProfile.personalInfo.state,
```

### 3. lib/data.ts Interface
**No change needed** - The TypeScript interface uses `city` and `state` which is fine. The mapping happens in the component layer.

---

## 🎯 Total New Columns Being Added

**Only 10 new columns:**
1. `desired_territories` (text)
2. `profile_photo_url` (text)
3. `years_of_experience` (integer)
4. `industry_experience` (text[])
5. `has_owned_business` (boolean)
6. `management_experience` (boolean)
7. `current_employment_status` (text)
8. `relevant_skills` (text[])
9. `funding_plans` (text[])
10. `background_attested_at` (timestamptz)

**Plus 3 indexes on existing columns:**
- `idx_buyer_profiles_city_location`
- `idx_buyer_profiles_state_location`
- `idx_buyer_profiles_current_employment_status`

---

## ✅ Everything is Now Correct!

The migration will:
- ✅ Add only the truly missing columns
- ✅ Use existing city_location and state_location
- ✅ Migrate funding_plan → funding_plans
- ✅ Add indexes for performance
- ✅ Not create any duplicate columns
- ✅ Safe to run multiple times

The code will:
- ✅ Read from city_location/state_location
- ✅ Write to city_location/state_location
- ✅ Map correctly between UI and database
- ✅ No breaking changes

---

**Ready to run migration!** 🚀
