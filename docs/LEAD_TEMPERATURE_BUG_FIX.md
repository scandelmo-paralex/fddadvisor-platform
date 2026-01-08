# Lead Temperature Data Sync Bug Fix

## Problem Summary
- **Symptom**: Lead Intelligence Report (LIR) shows stale data (Quality Score 50, 0m time) until manually refreshed
- **Impact**: Dashboard temperature badges don't match actual engagement
- **Example**: Houston Cantwell shows ❄️ Cold in table but 🔥 Hot in modal after refresh

## Root Cause
**ID Type Mismatch in Database Trigger**

The `fdd_engagements` and `lead_fdd_access` tables use different ID types for `buyer_id`:

| Table | `buyer_id` Contains | UUID Source |
|-------|---------------------|-------------|
| `fdd_engagements` | `auth.users.id` | User's authentication ID |
| `lead_fdd_access` | `buyer_profiles.id` | Profile record ID |

The database trigger `sync_engagement_to_fdd_access` was doing:
```sql
WHERE buyer_id = NEW.buyer_id  -- Compares auth.users.id to buyer_profiles.id
```

This **NEVER matched** because they're completely different UUIDs!

## Data Flow (Before Fix)

```
Buyer views FDD
    ↓
fdd_engagements INSERT (buyer_id = auth.users.id) ✅ Works
    ↓
Trigger fires: UPDATE lead_fdd_access WHERE buyer_id = {auth.users.id}
    ↓
NO MATCH! (lead_fdd_access.buyer_id = buyer_profiles.id) ❌
    ↓
lead_fdd_access.total_time_spent_seconds stays 0
    ↓
Dashboard reads 0 → Shows ❄️ Cold
```

## The Fix

### 1. Database Trigger (scripts/fix-engagement-sync-trigger.sql)
- Fixed trigger to join through `buyer_profiles` to get correct ID
- Backfills all existing stale records

### 2. API Routes (already fixed)
- `/api/hub/leads/route.ts` - Uses `buyer.user_id` for engagement lookups
- Already deployed but won't help until DB trigger is fixed

## How to Apply

**Run in Supabase SQL Editor:**

```sql
-- Execute the full script:
-- scripts/fix-engagement-sync-trigger.sql
```

This will:
1. Drop the broken trigger and function
2. Create fixed function that joins through buyer_profiles
3. Recreate trigger
4. Backfill all existing records with correct totals
5. Show verification query results

## Expected Results After Fix

| Metric | Before | After |
|--------|--------|-------|
| Houston's `total_time_spent_seconds` | 0 | 5040 (1h 24m) |
| Houston's Quality Score | 50 | ~90 |
| Houston's Temperature | ❄️ Cold | 🔥 Hot |

## Verification Query

After running the fix, this should show correct values:

```sql
SELECT 
  bp.first_name || ' ' || bp.last_name AS buyer,
  lfa.total_time_spent_seconds,
  lfa.total_views
FROM lead_fdd_access lfa
JOIN buyer_profiles bp ON bp.id = lfa.buyer_id
WHERE bp.email LIKE '%houston%' OR bp.first_name ILIKE '%houston%';
```

## Files Changed

1. `scripts/fix-engagement-sync-trigger.sql` - **NEW** - Database fix
2. `app/api/hub/leads/route.ts` - **MODIFIED** - Uses correct ID for lookups
3. `components/franchisor-dashboard.tsx` - **MODIFIED** - Temperature terminology

## Future Prevention

Added comments in code explaining the ID relationship:
- `fdd_engagements.buyer_id` = `auth.users.id` (user_id)
- `lead_fdd_access.buyer_id` = `buyer_profiles.id`
- Always join through `buyer_profiles.user_id` when crossing tables
