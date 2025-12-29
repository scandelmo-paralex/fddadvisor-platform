-- ============================================================================
-- PART 2 OF 3: RLS Policies
-- Migration: 112b-team-members-rls-policies.sql
-- Run this SECOND (after 112a)
-- ============================================================================

-- ============================================================================
-- STEP 5: Enable Row Level Security
-- ============================================================================

ALTER TABLE franchisor_team_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: RLS Policies for franchisor_team_members table
-- ============================================================================

-- Policy 1: Franchisor owners/admins can view all team members in their org
DROP POLICY IF EXISTS "Team members viewable by org owners and admins" ON franchisor_team_members;
CREATE POLICY "Team members viewable by org owners and admins" ON franchisor_team_members
  FOR SELECT USING (
    -- Direct franchisor owner (original account)
    EXISTS (
      SELECT 1 FROM franchisor_profiles fp
      WHERE fp.id = franchisor_team_members.franchisor_id
      AND fp.user_id = auth.uid()
    )
    OR
    -- Admin or owner team member
    EXISTS (
      SELECT 1 FROM franchisor_team_members tm
      WHERE tm.franchisor_id = franchisor_team_members.franchisor_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
      AND tm.is_active = true
    )
    OR
    -- Any team member can view their own record
    franchisor_team_members.user_id = auth.uid()
    OR
    -- Platform admin can see all
    EXISTS (
      SELECT 1 FROM franchisor_profiles fp
      WHERE fp.user_id = auth.uid()
      AND fp.is_admin = true
    )
  );

-- Policy 2: Franchisor owners/admins can insert team members
DROP POLICY IF EXISTS "Team members insertable by org owners and admins" ON franchisor_team_members;
CREATE POLICY "Team members insertable by org owners and admins" ON franchisor_team_members
  FOR INSERT WITH CHECK (
    -- Direct franchisor owner
    EXISTS (
      SELECT 1 FROM franchisor_profiles fp
      WHERE fp.id = franchisor_team_members.franchisor_id
      AND fp.user_id = auth.uid()
    )
    OR
    -- Admin or owner team member
    EXISTS (
      SELECT 1 FROM franchisor_team_members tm
      WHERE tm.franchisor_id = franchisor_team_members.franchisor_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
      AND tm.is_active = true
    )
  );

-- Policy 3: Franchisor owners/admins can update team members
DROP POLICY IF EXISTS "Team members updatable by org owners and admins" ON franchisor_team_members;
CREATE POLICY "Team members updatable by org owners and admins" ON franchisor_team_members
  FOR UPDATE USING (
    -- Direct franchisor owner
    EXISTS (
      SELECT 1 FROM franchisor_profiles fp
      WHERE fp.id = franchisor_team_members.franchisor_id
      AND fp.user_id = auth.uid()
    )
    OR
    -- Admin or owner team member
    EXISTS (
      SELECT 1 FROM franchisor_team_members tm
      WHERE tm.franchisor_id = franchisor_team_members.franchisor_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
      AND tm.is_active = true
    )
    OR
    -- Team members can update their own notification preferences
    franchisor_team_members.user_id = auth.uid()
  );

-- Policy 4: Franchisor owners can delete team members
DROP POLICY IF EXISTS "Team members deletable by org owners" ON franchisor_team_members;
CREATE POLICY "Team members deletable by org owners" ON franchisor_team_members
  FOR DELETE USING (
    -- Direct franchisor owner can delete anyone except owner records
    (
      EXISTS (
        SELECT 1 FROM franchisor_profiles fp
        WHERE fp.id = franchisor_team_members.franchisor_id
        AND fp.user_id = auth.uid()
      )
      AND franchisor_team_members.role != 'owner'
    )
    OR
    -- Admin team member can delete recruiters and viewers only
    (
      EXISTS (
        SELECT 1 FROM franchisor_team_members tm
        WHERE tm.franchisor_id = franchisor_team_members.franchisor_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
        AND tm.is_active = true
      )
      AND franchisor_team_members.role IN ('recruiter', 'viewer')
      AND franchisor_team_members.user_id != auth.uid()
    )
  );

-- Policy 5: Service role has full access (for backend operations)
DROP POLICY IF EXISTS "Service role full access to team members" ON franchisor_team_members;
CREATE POLICY "Service role full access to team members" ON franchisor_team_members
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- STEP 7: RLS Policies for lead_invitations (team member filtering)
-- 
-- Design: Recruiter-owned leads
-- - Recruiters see only leads THEY created
-- - Owners/Admins see ALL leads for their org
-- ============================================================================

-- Policy for team members to view leads based on role
DROP POLICY IF EXISTS "Team members view leads by role" ON lead_invitations;
CREATE POLICY "Team members view leads by role" ON lead_invitations
  FOR SELECT USING (
    -- Owner/Admin: see all org leads
    EXISTS (
      SELECT 1 FROM franchisor_team_members tm
      WHERE tm.franchisor_id = lead_invitations.franchisor_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
      AND tm.is_active = true
    )
    OR
    -- Recruiter/Viewer: see only leads they created
    EXISTS (
      SELECT 1 FROM franchisor_team_members tm
      WHERE tm.franchisor_id = lead_invitations.franchisor_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('recruiter', 'viewer')
      AND tm.is_active = true
      AND lead_invitations.created_by = tm.id
    )
  );

-- Policy for team members to create invitations
DROP POLICY IF EXISTS "Team members can create invitations" ON lead_invitations;
CREATE POLICY "Team members can create invitations" ON lead_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM franchisor_team_members tm
      WHERE tm.franchisor_id = lead_invitations.franchisor_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin', 'recruiter')
      AND tm.is_active = true
    )
  );

-- Policy for team members to update leads
DROP POLICY IF EXISTS "Team members can update leads" ON lead_invitations;
CREATE POLICY "Team members can update leads" ON lead_invitations
  FOR UPDATE USING (
    -- Owner/Admin: can update any org lead
    EXISTS (
      SELECT 1 FROM franchisor_team_members tm
      WHERE tm.franchisor_id = lead_invitations.franchisor_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
      AND tm.is_active = true
    )
    OR
    -- Recruiter: can update leads they created
    EXISTS (
      SELECT 1 FROM franchisor_team_members tm
      WHERE tm.franchisor_id = lead_invitations.franchisor_id
      AND tm.user_id = auth.uid()
      AND tm.role = 'recruiter'
      AND tm.is_active = true
      AND lead_invitations.created_by = tm.id
    )
  );

-- ============================================================================
-- VERIFICATION: Check Part 2 completed successfully
-- ============================================================================

SELECT 'PART 2 COMPLETE - RLS policies created:';

SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'franchisor_team_members'
ORDER BY policyname;

SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'lead_invitations' AND policyname LIKE 'Team members%'
ORDER BY policyname;

-- ============================================================================
-- NOW RUN PART 3: 112c-team-members-functions-and-backfill.sql
-- ============================================================================
