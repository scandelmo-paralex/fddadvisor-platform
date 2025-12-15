-- ============================================================================
-- PART 3 OF 3: Functions, Triggers, and Backfill
-- Migration: 112c-team-members-functions-and-backfill.sql
-- Run this LAST (after 112a and 112b)
-- ============================================================================

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
-- STEP 9: Trigger to auto-create owner team member for NEW franchisors
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
-- STEP 10: Backfill EXISTING franchisors with owner team member records
-- This creates owner records for WellBiz, your account, etc.
-- ============================================================================

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
-- FINAL VERIFICATION: Show all team members created
-- ============================================================================

SELECT 'PART 3 COMPLETE - All team members:';

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

-- ============================================================================
-- SUMMARY: What was created
-- ============================================================================

SELECT '========== MIGRATION COMPLETE ==========' as status;

SELECT 'Table: franchisor_team_members' as created, 
       COUNT(*) as row_count 
FROM franchisor_team_members;

SELECT 'New columns on lead_invitations: assigned_to, created_by' as added;

SELECT 'RLS Policies on franchisor_team_members:' as policies, COUNT(*) as count
FROM pg_policies WHERE tablename = 'franchisor_team_members';

SELECT 'New RLS Policies on lead_invitations:' as policies, COUNT(*) as count
FROM pg_policies WHERE tablename = 'lead_invitations' AND policyname LIKE 'Team members%';

SELECT 'Functions created: get_current_team_member(), auto_create_franchisor_owner()' as functions;

SELECT 'Trigger: auto_create_owner_on_franchisor_create' as trigger;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
