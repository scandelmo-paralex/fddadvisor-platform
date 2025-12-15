-- ============================================================================
-- PART 1 OF 3: Create Table and Add Columns
-- Migration: 112a-team-members-table-and-columns.sql
-- Run this FIRST
-- ============================================================================

-- ============================================================================
-- STEP 1: Create the franchisor_team_members table
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
  -- 'recruiter': Can send invitations, see their own leads only
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
  notification_email TEXT,
  
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

DROP TRIGGER IF EXISTS update_franchisor_team_members_updated_at ON franchisor_team_members;

CREATE TRIGGER update_franchisor_team_members_updated_at 
  BEFORE UPDATE ON franchisor_team_members
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION: Check Part 1 completed successfully
-- ============================================================================

SELECT 'PART 1 COMPLETE - Table created: ' || 
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'franchisor_team_members')::text;

SELECT 'assigned_to column added: ' ||
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lead_invitations' AND column_name = 'assigned_to')::text;

SELECT 'created_by column added: ' ||
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lead_invitations' AND column_name = 'created_by')::text;

-- ============================================================================
-- NOW RUN PART 2: 112b-team-members-rls-policies.sql
-- ============================================================================
