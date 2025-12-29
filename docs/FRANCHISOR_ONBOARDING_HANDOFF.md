# Franchisor Onboarding & Handoff Guide

**Last Updated:** December 16, 2025  
**Purpose:** Document the process for transferring a franchise from test/admin ownership to a real franchisor

---

## Overview

During pilot testing, franchises may be assigned to the Paralex Admin account for testing purposes. When a real franchisor signs up, we need to:

1. Clean up test data (leads, invitations, engagements)
2. Transfer franchise ownership to the new franchisor
3. Verify the handoff was successful

---

## Pre-Handoff Checklist

Before starting the handoff:

- [ ] New franchisor has signed up and has a `franchisor_profiles` record
- [ ] New franchisor's company info is correct
- [ ] FDD is current and properly processed
- [ ] FranchiseScore is accurate
- [ ] Logo and cover image are uploaded

---

## Step 1: Identify the Franchise and New Owner

Run this query to get the IDs you'll need:

```sql
-- Get franchise ID
SELECT id, name, slug, franchisor_id 
FROM franchises 
WHERE slug = 'FRANCHISE_SLUG_HERE';

-- Get new franchisor's profile ID
SELECT id, user_id, company_name, created_at
FROM franchisor_profiles
WHERE company_name ILIKE '%NEW_COMPANY_NAME%'
   OR user_id = (SELECT id FROM auth.users WHERE email = 'new_franchisor@email.com');
```

**Save these values:**
- `FRANCHISE_ID`: ____________________
- `OLD_FRANCHISOR_ID` (Paralex Admin): `c842904c-ec29-472e-b9e1-ce03cc92e94a`
- `NEW_FRANCHISOR_ID`: ____________________

---

## Step 2: Review Test Data (Optional)

Before deleting, review what test data exists:

```sql
-- Count test invitations
SELECT COUNT(*) as invitation_count
FROM lead_invitations 
WHERE franchise_id = 'FRANCHISE_ID'
  AND franchisor_id = 'c842904c-ec29-472e-b9e1-ce03cc92e94a';

-- Count test FDD access records
SELECT COUNT(*) as access_count
FROM lead_fdd_access
WHERE franchise_id = 'FRANCHISE_ID';

-- Count test engagements
SELECT COUNT(*) as engagement_count
FROM fdd_engagements
WHERE franchise_id = 'FRANCHISE_ID';

-- List test leads (to review before deletion)
SELECT 
    li.lead_name,
    li.lead_email,
    li.status,
    li.sent_at
FROM lead_invitations li
WHERE li.franchise_id = 'FRANCHISE_ID'
  AND li.franchisor_id = 'c842904c-ec29-472e-b9e1-ce03cc92e94a'
ORDER BY li.sent_at DESC;
```

---

## Step 3: Clean Up Test Data

**⚠️ WARNING: This permanently deletes test data. Make sure you have the correct FRANCHISE_ID!**

```sql
-- ============================================================================
-- CLEAN UP TEST DATA FOR FRANCHISE HANDOFF
-- Replace FRANCHISE_ID with the actual UUID
-- ============================================================================

BEGIN;

-- 1. Delete test engagement data
DELETE FROM fdd_engagements
WHERE franchise_id = 'FRANCHISE_ID';

-- 2. Delete test FDD access records
DELETE FROM lead_fdd_access
WHERE franchise_id = 'FRANCHISE_ID';

-- 3. Delete test invitations (sent by Paralex Admin)
DELETE FROM lead_invitations 
WHERE franchise_id = 'FRANCHISE_ID'
  AND franchisor_id = 'c842904c-ec29-472e-b9e1-ce03cc92e94a';

-- 4. Delete any test leads records
DELETE FROM leads
WHERE franchise_id = 'FRANCHISE_ID'
  AND franchisor_id = 'c842904c-ec29-472e-b9e1-ce03cc92e94a';

COMMIT;

-- Verify cleanup
SELECT 'lead_invitations' as table_name, COUNT(*) as remaining 
FROM lead_invitations WHERE franchise_id = 'FRANCHISE_ID'
UNION ALL
SELECT 'lead_fdd_access', COUNT(*) 
FROM lead_fdd_access WHERE franchise_id = 'FRANCHISE_ID'
UNION ALL
SELECT 'fdd_engagements', COUNT(*) 
FROM fdd_engagements WHERE franchise_id = 'FRANCHISE_ID';
```

---

## Step 4: Transfer Franchise Ownership

```sql
-- ============================================================================
-- TRANSFER FRANCHISE TO NEW FRANCHISOR
-- ============================================================================

UPDATE franchises 
SET franchisor_id = 'NEW_FRANCHISOR_ID'
WHERE id = 'FRANCHISE_ID';

-- Verify transfer
SELECT 
    f.id,
    f.name,
    f.slug,
    f.franchisor_id,
    fp.company_name as new_owner
FROM franchises f
JOIN franchisor_profiles fp ON f.franchisor_id = fp.id
WHERE f.id = 'FRANCHISE_ID';
```

---

## Step 5: Verify Handoff

### 5.1 Database Verification

```sql
-- Confirm ownership
SELECT 
    f.name,
    fp.company_name,
    fp.id as franchisor_profile_id
FROM franchises f
JOIN franchisor_profiles fp ON f.franchisor_id = fp.id
WHERE f.id = 'FRANCHISE_ID';

-- Confirm no orphaned test data
SELECT 
    (SELECT COUNT(*) FROM lead_invitations WHERE franchise_id = 'FRANCHISE_ID' AND franchisor_id = 'c842904c-ec29-472e-b9e1-ce03cc92e94a') as orphaned_invitations,
    (SELECT COUNT(*) FROM lead_fdd_access WHERE franchise_id = 'FRANCHISE_ID') as fdd_access_records,
    (SELECT COUNT(*) FROM fdd_engagements WHERE franchise_id = 'FRANCHISE_ID') as engagement_records;
```

### 5.2 UI Verification

1. **Log in as new franchisor**
2. **Check Dashboard:**
   - [ ] Franchise appears in their brand list
   - [ ] No test leads visible
   - [ ] "Add Lead" shows their franchise in dropdown
3. **Test Add Lead:**
   - [ ] Can add a new lead
   - [ ] Invitation sends correctly
4. **Check FDD Viewer:**
   - [ ] FDD loads correctly at `/hub/fdd/SLUG`
   - [ ] AI Chat works

### 5.3 Confirm with Franchisor

- [ ] Send welcome email with login instructions
- [ ] Schedule onboarding call if needed
- [ ] Provide link to user guide/documentation

---

## Rollback (If Needed)

If something goes wrong, you can reassign back to admin:

```sql
-- Reassign back to Paralex Admin
UPDATE franchises 
SET franchisor_id = 'c842904c-ec29-472e-b9e1-ce03cc92e94a'
WHERE id = 'FRANCHISE_ID';
```

---

## Reference: Key IDs

| Entity | ID |
|--------|-----|
| Paralex Admin Profile | `c842904c-ec29-472e-b9e1-ce03cc92e94a` |
| WellBiz Brands Profile | `1881ea8f-5b4b-47f5-82b3-7da85ce62ed7` |

---

## Franchise Status Tracker

| Franchise | Slug | Current Owner | Status |
|-----------|------|---------------|--------|
| Ace Handyman Services | `ace-handyman-services` | Paralex Admin (Testing) | 🧪 Test |
| Blo Blow Dry Bar | `blo-blow-dry-bar` | Unassigned | ⚪ Available |
| Amazing Lash Studio | `amazing-lash-studio` | WellBiz Brands | ✅ Production |
| Drybar | `drybar` | WellBiz Brands | ✅ Production |
| Elements Massage | `elements-massage` | WellBiz Brands | ✅ Production |
| Fitness Together | `fitness-together` | WellBiz Brands | ✅ Production |
| Radiant Waxing | `radiant-waxing` | WellBiz Brands | ✅ Production |

---

## Notes

- Always use a transaction (`BEGIN`/`COMMIT`) when deleting data
- Test the cleanup queries with `SELECT` before running `DELETE`
- Keep this document updated as new franchises are added
- The Paralex Admin account should only be used for testing, not production leads

---

*Document created: December 16, 2025*
