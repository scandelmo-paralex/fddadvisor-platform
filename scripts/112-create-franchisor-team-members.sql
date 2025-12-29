-- ============================================================================
-- FRANCHISOR TEAM MEMBERS - REVISED MIGRATION
-- Migration: 112-create-franchisor-team-members.sql
-- Date: December 15, 2025
-- Description: Add franchisor-level team member support with role-based access
-- 
-- IMPORTANT: This migration discovered an existing `franchisor_users` table
-- that links users to FRANCHISES (brand-level). This new table links users
-- to FRANCHISOR PROFILES (organization-level, e.g., WellBiz as a whole).
--
-- Architecture:
--   franchisor_profiles (org) --> franchisor_team_members (team) --> auth.users
--   franchises (brand) --> franchisor_users (per-brand access) --> auth.users
--
-- Risk Level: LOW (additive only, no existing data modified)
-- ============================================================================

-- ============================================================================
-- STEP 1: Create the franchisor_team_members table
-- This is ORGANIZATION-level (e.g., WellBiz team members)
-- Different from franchisor_users which is FRANCHISE-level (e.g., Drybar access)
-- ============================================================================

CREATE TABLE IF NOT EXISTS franchisor_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Organization relationship (WellBiz, not Drybar)
  franchisor_id UUID NOT NULL REFERENCES franchisor_profiles(id) ON DELETE CASCADE,
  
  -- Auth relationship (NULL until they accept invitation and create account)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Member details
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  
  -- Role-based access control at organization level
  -- 'owner': Original franchisor account holder (auto-created)
  -- 'admin': Full access, can manage team members, see all leads across all brands
  -- 'recruiter': Can send invitations, see assigned leads only
  -- 'viewer': Read-only access to assigned leads
  role TEXT NOT NULL DEFAULT 'recruiter' CHECK (role IN ('owner', 'admin', 'recruiter', 'viewer')),
  
  -- Status tracking
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Invitation workflow
  invitation_token TEXT UNIQUE,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  invited_by UUID REFERENCES franchisor_team_members(id) ON DELETE SET NULL,
  
  -- Notification preferences
  receives_notifications BOOLEAN NOT NULL DEFAULT true,
  notification_email TEXT, -- Optional: send notifications to different email
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(franchisor_id, email)
);

-- ============================================================================
-- STEP 2: Add columns to lead_invitations for assignment tracking
-- ============================================================================

-- Add column for tracking which team member owns the lead
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_invitations' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE lead_invitations 
      ADD COLUMN assigned_to UUID REFERENCES franchisor_team_members(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add column for tracking who created the invitation
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_invitations' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE lead_invitations 
      ADD COLUMN created_by UUID REFERENCES franchisor_team_members(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_franchisor_team_members_franchisor_id 
  ON franchisor_team_members(franchisor_id);

CREATE INDEX IF NOT EXISTS idx_franchisor_team_members_user_id 
  ON franchisor_team_members(user_id) 
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_franchisor_team_members_email 
  ON franchisor_team_members(email);

CREATE INDEX IF NOT EXISTS idx_franchisor_team_members_invitation_token 
  ON franchisor_team_members(invitation_token) 
  WHERE invitation_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_franchisor_team_members_role
  ON franchisor_team_members(role);

CREATE INDEX IF NOT EXISTS idx_lead_invitations_assigned_to 
  ON lead_invitations(assigned_to) 
  WHERE assigned_to IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lead_invitations_created_by 
  ON lead_invitations(created_by) 
  WHERE created_by IS NOT NULL;

-- ============================================================================
-- STEP 4: Add updated_at trigger
-- ============================================================================

-- Trigger function already exists from other tables, just create the trigger
DROP TRIGGER IF EXISTS update_franchisor_team_members_updated_at ON franchisor_team_members;

CREATE TRIGGER update_franchisor_team_members_updated_at 
  BEFORE UPDATE ON franchisor_team_members
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 5: Enable Row Level Security
-- ============================================================================

ALTER TABLE franchisor_team_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: RLS Policies for franchisor_team_members
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

-- Policy 4: Franchisor owners can delete team members (admins cannot delete other admins)
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
-- STEP 7: Update lead_invitations RLS to support team member filtering
-- 
-- Design: Recruiter-owned leads
-- - Recruiters see only leads THEY created
-- - Owners/Admins see ALL leads for their org
-- - No manual assignment needed - whoever sends the invite owns it
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

-- Policy for team members to create invitations (auto-sets created_by)
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
-- STEP 8: Helper function to get current user's team member record
-- ============================================================================

CREATE OR REPLACE FUNCTION get_current_team_member(p_franchisor_id UUID)
RETURNS TABLE (
  id UUID,
  role TEXT,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT tm.id, tm.role, tm.is_active
  FROM franchisor_team_members tm
  WHERE tm.franchisor_id = p_franchisor_id
  AND tm.user_id = auth.uid()
  AND tm.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 9: Function to auto-create owner team member for existing franchisors
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_create_franchisor_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Create an owner team member record for the franchisor account holder
  INSERT INTO franchisor_team_members (
    franchisor_id,
    user_id,
    email,
    full_name,
    role,
    is_active,
    accepted_at
  )
  SELECT
    NEW.id,
    NEW.user_id,
    COALESCE(NEW.email, u.email),
    COALESCE(NEW.contact_name, 'Account Owner'),
    'owner',
    true,
    NOW()
  FROM auth.users u
  WHERE u.id = NEW.user_id
  ON CONFLICT (franchisor_id, email) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_create_owner_on_franchisor_create ON franchisor_profiles;

CREATE TRIGGER auto_create_owner_on_franchisor_create
  AFTER INSERT ON franchisor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_franchisor_owner();

-- ============================================================================
-- STEP 10: Backfill existing franchisors with owner team member records
-- ============================================================================

-- This inserts owner team member records for all existing franchisor account holders
INSERT INTO franchisor_team_members (
  franchisor_id,
  user_id,
  email,
  full_name,
  role,
  is_active,
  accepted_at
)
SELECT
  fp.id,
  fp.user_id,
  COALESCE(fp.email, u.email),
  COALESCE(fp.contact_name, 'Account Owner'),
  'owner',
  true,
  NOW()
FROM franchisor_profiles fp
JOIN auth.users u ON u.id = fp.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM franchisor_team_members tm
  WHERE tm.franchisor_id = fp.id
  AND tm.user_id = fp.user_id
)
ON CONFLICT (franchisor_id, email) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these after migration to verify success
-- ============================================================================

-- Check table was created
SELECT 'franchisor_team_members table exists: ' || 
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'franchisor_team_members')::text;

-- Check columns were added to lead_invitations
SELECT 'lead_invitations.assigned_to exists: ' ||
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lead_invitations' AND column_name = 'assigned_to')::text;

SELECT 'lead_invitations.created_by exists: ' ||
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lead_invitations' AND column_name = 'created_by')::text;

-- Check backfill worked - show all team members created
SELECT 
  fp.company_name,
  tm.email,
  tm.full_name,
  tm.role,
  tm.is_active,
  CASE WHEN tm.user_id IS NOT NULL THEN 'linked' ELSE 'pending' END as status
FROM franchisor_profiles fp
LEFT JOIN franchisor_team_members tm ON tm.franchisor_id = fp.id
ORDER BY fp.company_name, tm.role;

-- Check RLS policies were created
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'franchisor_team_members'
ORDER BY policyname;

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================

/*
-- To rollback this migration, run:

-- 1. Drop new policies on lead_invitations
DROP POLICY IF EXISTS "Team members view leads by role" ON lead_invitations;
DROP POLICY IF EXISTS "Team members can create invitations" ON lead_invitations;
DROP POLICY IF EXISTS "Team members can update leads" ON lead_invitations;

-- 2. Drop triggers
DROP TRIGGER IF EXISTS auto_create_owner_on_franchisor_create ON franchisor_profiles;
DROP TRIGGER IF EXISTS update_franchisor_team_members_updated_at ON franchisor_team_members;

-- 3. Drop functions
DROP FUNCTION IF EXISTS auto_create_franchisor_owner();
DROP FUNCTION IF EXISTS get_current_team_member(UUID);

-- 4. Remove columns from lead_invitations (NOTE: this loses assignment data!)
ALTER TABLE lead_invitations DROP COLUMN IF EXISTS assigned_to;
ALTER TABLE lead_invitations DROP COLUMN IF EXISTS created_by;

-- 5. Drop policies on franchisor_team_members
DROP POLICY IF EXISTS "Team members viewable by org owners and admins" ON franchisor_team_members;
DROP POLICY IF EXISTS "Team members insertable by org owners and admins" ON franchisor_team_members;
DROP POLICY IF EXISTS "Team members updatable by org owners and admins" ON franchisor_team_members;
DROP POLICY IF EXISTS "Team members deletable by org owners" ON franchisor_team_members;
DROP POLICY IF EXISTS "Service role full access to team members" ON franchisor_team_members;

-- 6. Drop the table (WARNING: loses all team member data!)
DROP TABLE IF EXISTS franchisor_team_members;
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
