-- ============================================================================
-- RLS POLICY TEST CASES
-- Migration: 113-test-team-member-rls-policies.sql
-- Date: December 15, 2025
-- Description: Test cases to verify RLS policies work correctly
-- Run this AFTER 112-create-franchisor-team-members.sql
-- ============================================================================

-- ============================================================================
-- TEST SETUP: Create test data
-- ============================================================================

-- NOTE: Replace these UUIDs with actual test user IDs from your environment
-- You can get them from: SELECT id, email FROM auth.users LIMIT 10;

DO $$
DECLARE
  v_franchisor_owner_user_id UUID;
  v_admin_team_member_user_id UUID;
  v_recruiter_user_id UUID;
  v_other_franchisor_user_id UUID;
  v_franchisor_profile_id UUID;
  v_other_franchisor_profile_id UUID;
  v_franchise_id UUID;
  v_admin_member_id UUID;
  v_recruiter_member_id UUID;
  v_invitation_id UUID;
BEGIN
  -- Skip test if we're in production (check for test environment)
  -- RAISE NOTICE 'Running RLS test suite...';
  
  -- For manual testing, you would:
  -- 1. Get actual user IDs from auth.users
  -- 2. Replace the UUIDs below
  -- 3. Run each test query as that user (using SET ROLE or RLS bypass)
  
  RAISE NOTICE 'RLS Test Suite - Manual Testing Required';
  RAISE NOTICE 'See comments below for test scenarios';
END $$;

-- ============================================================================
-- TEST SCENARIOS (Run manually as each user type)
-- ============================================================================

/*
SCENARIO 1: Franchisor Owner Access
----------------------------------------
Login as: The franchisor owner (franchisor_profiles.user_id)
Expected: Can see all team members, create team members, update team members

Test Query:
SELECT * FROM franchisor_team_members WHERE franchisor_id = '[YOUR_FRANCHISOR_ID]';
-- Should return all team members

INSERT INTO franchisor_team_members (franchisor_id, email, full_name, role)
VALUES ('[YOUR_FRANCHISOR_ID]', 'test@test.com', 'Test User', 'recruiter');
-- Should succeed

UPDATE franchisor_team_members SET role = 'viewer' WHERE email = 'test@test.com';
-- Should succeed
*/

/*
SCENARIO 2: Admin Team Member Access
----------------------------------------
Login as: A team member with role = 'admin'
Expected: Same as franchisor owner

Test Query:
SELECT * FROM franchisor_team_members WHERE franchisor_id = '[YOUR_FRANCHISOR_ID]';
-- Should return all team members

INSERT INTO franchisor_team_members (franchisor_id, email, full_name, role)
VALUES ('[YOUR_FRANCHISOR_ID]', 'test2@test.com', 'Test User 2', 'recruiter');
-- Should succeed
*/

/*
SCENARIO 3: Recruiter Access
----------------------------------------
Login as: A team member with role = 'recruiter'
Expected: Can only see their own record, cannot create/delete team members

Test Query:
SELECT * FROM franchisor_team_members WHERE franchisor_id = '[YOUR_FRANCHISOR_ID]';
-- Should return ONLY their own record

INSERT INTO franchisor_team_members (franchisor_id, email, full_name, role)
VALUES ('[YOUR_FRANCHISOR_ID]', 'test3@test.com', 'Test User 3', 'recruiter');
-- Should FAIL (permission denied)
*/

/*
SCENARIO 4: Lead Invitations - Admin Access
----------------------------------------
Login as: Franchisor owner or admin team member
Expected: Can see ALL invitations

Test Query:
SELECT * FROM lead_invitations WHERE franchisor_id = '[YOUR_FRANCHISOR_ID]';
-- Should return all invitations
*/

/*
SCENARIO 5: Lead Invitations - Recruiter Access
----------------------------------------
Login as: A team member with role = 'recruiter'
Expected: Can only see invitations assigned to them or created by them

Test Query:
SELECT * FROM lead_invitations WHERE franchisor_id = '[YOUR_FRANCHISOR_ID]';
-- Should return ONLY:
-- - Invitations where assigned_to = [their team member id]
-- - Invitations where created_by = [their team member id]
-- - Invitations where assigned_to IS NULL
*/

/*
SCENARIO 6: Cross-Organization Isolation
----------------------------------------
Login as: A team member from Franchisor A
Expected: Cannot see ANY data from Franchisor B

Test Query:
SELECT * FROM franchisor_team_members WHERE franchisor_id = '[DIFFERENT_FRANCHISOR_ID]';
-- Should return ZERO rows

SELECT * FROM lead_invitations WHERE franchisor_id = '[DIFFERENT_FRANCHISOR_ID]';
-- Should return ZERO rows
*/

-- ============================================================================
-- AUTOMATED VERIFICATION QUERIES
-- (Run as service role / admin to verify data integrity)
-- ============================================================================

-- Verify all franchisors have at least one admin team member
SELECT 
  fp.id as franchisor_id,
  fp.company_name,
  COUNT(tm.id) as team_member_count,
  COUNT(CASE WHEN tm.role = 'admin' THEN 1 END) as admin_count
FROM franchisor_profiles fp
LEFT JOIN franchisor_team_members tm ON tm.franchisor_id = fp.id AND tm.is_active = true
GROUP BY fp.id, fp.company_name
HAVING COUNT(CASE WHEN tm.role = 'admin' THEN 1 END) = 0;
-- Should return ZERO rows (all franchisors should have at least one admin)

-- Verify no orphaned team members
SELECT tm.* 
FROM franchisor_team_members tm
LEFT JOIN franchisor_profiles fp ON fp.id = tm.franchisor_id
WHERE fp.id IS NULL;
-- Should return ZERO rows

-- Verify invitation assignments reference valid team members
SELECT li.* 
FROM lead_invitations li
LEFT JOIN franchisor_team_members tm ON tm.id = li.assigned_to
WHERE li.assigned_to IS NOT NULL AND tm.id IS NULL;
-- Should return ZERO rows

-- Verify RLS policies exist
SELECT 
  tablename, 
  policyname, 
  permissive, 
  cmd
FROM pg_policies 
WHERE tablename = 'franchisor_team_members'
ORDER BY policyname;
-- Should return 4 policies (SELECT, INSERT, UPDATE, DELETE)

-- ============================================================================
-- LOAD TEST QUERIES (verify performance with RLS)
-- ============================================================================

-- Explain analyze for team member queries
EXPLAIN ANALYZE
SELECT * FROM franchisor_team_members 
WHERE franchisor_id = (SELECT id FROM franchisor_profiles LIMIT 1);

-- Explain analyze for lead invitations with team filter
EXPLAIN ANALYZE
SELECT * FROM lead_invitations 
WHERE franchisor_id = (SELECT id FROM franchisor_profiles LIMIT 1)
AND (assigned_to IS NULL OR assigned_to = (SELECT id FROM franchisor_team_members LIMIT 1));

-- ============================================================================
-- EDGE CASE TESTS
-- ============================================================================

/*
EDGE CASE 1: Deactivated Team Member
----------------------------------------
A deactivated team member (is_active = false) should not have any access

Setup:
UPDATE franchisor_team_members SET is_active = false WHERE email = 'test@test.com';

Then login as that user and verify:
SELECT * FROM franchisor_team_members WHERE franchisor_id = '[FRANCHISOR_ID]';
-- Should return ZERO rows (except their own record)

SELECT * FROM lead_invitations WHERE franchisor_id = '[FRANCHISOR_ID]';
-- Should return ZERO rows
*/

/*
EDGE CASE 2: Team Member Without user_id
----------------------------------------
A team member who hasn't accepted their invitation yet (user_id IS NULL)
should not be able to login at all, so no RLS test needed.
*/

/*
EDGE CASE 3: Admin Cannot Delete Self
----------------------------------------
An admin team member should not be able to delete their own record

Login as admin team member:
DELETE FROM franchisor_team_members WHERE id = '[THEIR_OWN_ID]';
-- Should FAIL
*/

/*
EDGE CASE 4: Admin Cannot Delete Other Admins (unless franchisor owner)
----------------------------------------
An admin team member should not be able to delete other admin team members

Login as admin team member (not franchisor owner):
DELETE FROM franchisor_team_members WHERE role = 'admin' AND id != '[THEIR_OWN_ID]';
-- Should FAIL

Login as franchisor owner:
DELETE FROM franchisor_team_members WHERE role = 'admin' AND id != '[OWNER_TEAM_MEMBER_ID]';
-- Should SUCCEED
*/

-- ============================================================================
-- END OF TEST SUITE
-- ============================================================================
