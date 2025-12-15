# Team Member Feature - Implementation Summary

**Date:** December 15, 2025  
**Status:** Phase 1 Complete (Database Schema)  
**Total Effort:** 16 hours estimated  
**Completed:** ~4 hours (database + types)

---

## What Was Implemented

### 1. Database Migration (scripts/112-create-franchisor-team-members.sql)

**New Table: `franchisor_team_members`**
- Links team members to franchisor organizations
- Supports three roles: `admin`, `recruiter`, `viewer`
- Tracks invitation workflow (invited_at, accepted_at, invitation_token)
- Notification preferences per member

**Schema Additions:**
- Added `assigned_to` column to `lead_invitations` (tracks which team member owns the lead)
- Added `created_by` column to `lead_invitations` (tracks who sent the invitation)

**RLS Policies Created:**
- Franchisor owners have full access to team members
- Admin team members have same access as owners
- Recruiters can only see their own record
- Cross-organization isolation enforced

**Auto-Generated Records:**
- Trigger creates admin team member record when franchisor profile is created
- Backfill script adds admin records for all existing franchisors

### 2. TypeScript Types (lib/types/database.ts)

**Added Types:**
- `TeamMemberRole` - Union type for roles
- `FranchisorTeamMember` - Full team member interface
- `TeamMemberWithFranchisor` - With joined franchisor data
- `TeamMemberInvitation` - For creating invitations
- `TeamMemberListItem` - For UI display
- `LeadInvitationWithAssignment` - Extended invitation with team member data

### 3. Test Suite (scripts/113-test-team-member-rls-policies.sql)

**Test Scenarios:**
- Franchisor owner access (full permissions)
- Admin team member access (same as owner)
- Recruiter access (limited to assigned leads)
- Cross-organization isolation
- Edge cases (deactivated members, self-deletion prevention)

---

## What Still Needs to Be Built

### Phase 2: API Routes (~4 hours)

```
app/api/team/
├── route.ts              # GET (list), POST (invite)
├── [id]/
│   └── route.ts          # GET, PUT, DELETE individual member
└── accept/
    └── route.ts          # POST (accept invitation)
```

**Endpoints Needed:**
1. `GET /api/team` - List team members for current franchisor
2. `POST /api/team` - Invite new team member
3. `GET /api/team/[id]` - Get single team member
4. `PUT /api/team/[id]` - Update team member (role, status)
5. `DELETE /api/team/[id]` - Deactivate team member
6. `POST /api/team/accept` - Accept invitation (creates auth account)

### Phase 3: Team Management UI (~3 hours)

**New Page: `/company-settings/team`**
- List all team members with status badges
- "Invite Team Member" button → modal
- Edit role dropdown
- Deactivate/reactivate toggle
- Resend invitation action

### Phase 4: Update Invitation Flow (~2 hours)

**Add Lead Modal Changes:**
- Add "Assign to" dropdown populated from team members
- Default to current user if they're a team member
- Save `assigned_to` when creating invitation

**Dashboard Changes:**
- Add "Assigned To" column in leads table
- Add filter dropdown for team member filter
- Show recruiter name on Lead Intelligence modal

### Phase 5: Team Member Invitation Email (~1 hour)

**New Email Template:**
- "You've been invited to join [Company] on FDDHub"
- Accept invitation button
- Links to team signup page

### Phase 6: Team Signup Page (~2 hours)

**New Page: `/team-signup`**
- Validates invitation token
- Creates Supabase auth account
- Links user_id to team member record
- Redirects to dashboard

---

## How to Deploy to Staging

### Step 1: Run Database Migration

```sql
-- Copy entire contents of scripts/112-create-franchisor-team-members.sql
-- Paste into Supabase SQL Editor (STAGING environment)
-- Click "Run"
```

### Step 2: Verify Migration Success

```sql
-- Run these verification queries:

-- 1. Check table exists
SELECT * FROM franchisor_team_members LIMIT 1;

-- 2. Check columns were added
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'lead_invitations' 
AND column_name IN ('assigned_to', 'created_by');

-- 3. Check backfill worked
SELECT fp.company_name, tm.email, tm.role 
FROM franchisor_profiles fp 
LEFT JOIN franchisor_team_members tm ON tm.franchisor_id = fp.id;

-- 4. Check RLS policies
SELECT policyname FROM pg_policies 
WHERE tablename = 'franchisor_team_members';
```

### Step 3: Test RLS Manually

1. Login as James Frank (WellBiz franchisor)
2. Verify he's now listed in `franchisor_team_members` as admin
3. Try to access team_members via API (when built)

---

## Risk Assessment

| Component | Risk Level | Mitigation |
|-----------|------------|------------|
| New table creation | 🟢 Low | Additive only |
| New columns on lead_invitations | 🟢 Low | Nullable, no data loss |
| RLS policy changes | 🟡 Medium | Carefully tested, rollback script ready |
| Backfill existing data | 🟢 Low | ON CONFLICT DO NOTHING |

**Rollback Procedure:**
Complete rollback script is included at bottom of migration file.

---

## Next Steps (When Ready to Continue)

1. **Run migration on staging** - Test with real data
2. **Build `/api/team` routes** - Basic CRUD operations
3. **Build Team Management UI** - In company-settings
4. **Update Add Lead modal** - Add "Assign to" dropdown
5. **Test end-to-end flow** - Invite → Accept → Login → See leads
6. **Get WellBiz input** - Ask James how their team structure works

---

## Files Created/Modified

**Created:**
- `scripts/112-create-franchisor-team-members.sql` - Main migration
- `scripts/113-test-team-member-rls-policies.sql` - Test suite

**Modified:**
- `lib/types/database.ts` - Added team member types

---

## Questions for WellBiz

Before building the UI, clarify these with James:

1. How many recruiters does WellBiz have per brand?
2. Is there a centralized sales team or per-brand teams?
3. Who typically assigns leads - admin only or self-claim?
4. What notifications would recruiters want?
5. Do recruiters need mobile access?

---

*Document generated: December 15, 2025*
