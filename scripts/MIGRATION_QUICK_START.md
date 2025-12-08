# Quick Start: Run Buyer Profile Migration

**⏱️ Takes 2 minutes**

---

## Steps:

### 1. Open Supabase Dashboard
Go to: https://supabase.com/dashboard

### 2. Select Your Project
Click on your FDDHub production project

### 3. Open SQL Editor
Left sidebar → SQL Editor → New Query

### 4. Copy Migration SQL
Open: `scripts/buyer-profile-update-migration.sql`
Copy entire file (Cmd+A, Cmd+C)

### 5. Paste & Run
Paste into SQL Editor
Click "Run" (or Ctrl+Enter)

### 6. Verify Success
You should see output like:
```
status: Migration completed successfully!
total_buyer_profiles: 3
profiles_with_city: 1
profiles_with_state: 1
profiles_with_funding_plans: 0
```

---

## ✅ Done!

Now your database is ready for the new profile fields.

**Next:** Push code to GitHub → Vercel deploys → Test profile editing

---

## If Something Goes Wrong

**Error: "column already exists"**
→ Safe to ignore - means migration already ran

**Error: "permission denied"**
→ Make sure you're using your production project (not a test/demo project)

**Need to rollback?**
→ Contact me - but unlikely needed (migration is additive only)
