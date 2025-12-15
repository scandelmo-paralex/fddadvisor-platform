-- ============================================================================
-- FIX: Infinite Recursion in franchisor_team_members RLS Policies
-- Migration: 114-fix-team-members-rls-recursion.sql
-- 
-- Problem: SELECT policy checks franchisor_team_members to authorize access
--          to franchisor_team_members, causing infinite recursion.
-- 
-- Solution: Use franchisor_profiles.user_id as the primary check (no recursion),
--           and only use team_members table for non-owner access via a 
--           security definer function.
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop existing problematic policies
-- ============================================================================

DROP POLICY IF EXISTS "Team members viewable by org owners and admins" ON franchisor_team_members;
DROP POLICY IF EXISTS "Team members insertable by org owners and admins" ON franchisor_team_members;
DROP POLICY IF EXISTS "Team members updatable by org owners and admins" ON franchisor_team_members;
DROP POLICY IF EXISTS "Team members deletable by org owners" ON franchisor_team_members;
DROP POLICY IF EXISTS "Service role full access to team members" ON franchisor_team_members;

-- ============================================================================
-- STEP 2: Create a security definer function to check team membership
-- This bypasses RLS to prevent recursion
-- ============================================================================

CREATE OR REPLACE FUNCTION is_team_admin_or_owner(p_franchisor_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- First check: Is this user the direct franchisor owner?
  IF EXISTS (
    SELECT 1 FROM franchisor_profiles 
    WHERE id = p_franchisor_id AND user_id = p_user_id
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Second check: Is this user an active admin/owner team member?
  SELECT role INTO v_role
  FROM franchisor_team_members
  WHERE franchisor_id = p_franchisor_id 
    AND user_id = p_user_id 
    AND is_active = true;
  
  RETURN v_role IN ('owner', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: Create new non-recursive policies
-- ============================================================================

-- Policy 1: SELECT - Who can view team members
CREATE POLICY "team_members_select_policy" ON franchisor_team_members
  FOR SELECT USING (
    -- Direct franchisor owner (via franchisor_profiles - no recursion)
    EXISTS (
      SELECT 1 FROM franchisor_profiles fp
      WHERE fp.id = franchisor_team_members.franchisor_id
      AND fp.user_id = auth.uid()
    )
    OR
    -- User's own record (simple user_id match - no recursion)
    user_id = auth.uid()
    OR
    -- Platform admin
    EXISTS (
      SELECT 1 FROM franchisor_profiles fp
      WHERE fp.user_id = auth.uid()
      AND fp.is_admin = true
    )
  );

-- Policy 2: INSERT - Who can invite team members
CREATE POLICY "team_members_insert_policy" ON franchisor_team_members
  FOR INSERT WITH CHECK (
    -- Direct franchisor owner
    EXISTS (
      SELECT 1 FROM franchisor_profiles fp
      WHERE fp.id = franchisor_team_members.franchisor_id
      AND fp.user_id = auth.uid()
    )
    OR
    -- Admin team member (use security definer function)
    is_team_admin_or_owner(franchisor_team_members.franchisor_id, auth.uid())
  );

-- Policy 3: UPDATE - Who can update team members
CREATE POLICY "team_members_update_policy" ON franchisor_team_members
  FOR UPDATE USING (
    -- Direct franchisor owner
    EXISTS (
      SELECT 1 FROM franchisor_profiles fp
      WHERE fp.id = franchisor_team_members.franchisor_id
      AND fp.user_id = auth.uid()
    )
    OR
    -- User updating their own record
    user_id = auth.uid()
    OR
    -- Admin team member (use security definer function)
    is_team_admin_or_owner(franchisor_team_members.franchisor_id, auth.uid())
  );

-- Policy 4: DELETE - Who can delete team members
CREATE POLICY "team_members_delete_policy" ON franchisor_team_members
  FOR DELETE USING (
    -- Only franchisor owner or admin can delete (not self, not owner role)
    (
      EXISTS (
        SELECT 1 FROM franchisor_profiles fp
        WHERE fp.id = franchisor_team_members.franchisor_id
        AND fp.user_id = auth.uid()
      )
      OR
      is_team_admin_or_owner(franchisor_team_members.franchisor_id, auth.uid())
    )
    AND franchisor_team_members.role != 'owner'
    AND franchisor_team_members.user_id != auth.uid()
  );

-- Policy 5: Service role has full access
CREATE POLICY "team_members_service_role_policy" ON franchisor_team_members
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Policies recreated successfully:';

SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'franchisor_team_members'
ORDER BY policyname;
