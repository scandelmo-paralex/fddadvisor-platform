-- ============================================================================
-- PIPELINE STAGES FEATURE
-- Version: 1.0
-- Date: January 2, 2026
-- Description: Custom sales pipeline stages for FDDHub franchisor dashboard
-- ============================================================================

-- ============================================================================
-- 1. CREATE PIPELINE_STAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchisor_id UUID NOT NULL REFERENCES franchisor_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#6B7280', -- Gray default
  position INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_closed_won BOOLEAN NOT NULL DEFAULT false,
  is_closed_lost BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_stage_name_per_franchisor UNIQUE (franchisor_id, name),
  CONSTRAINT only_one_default_per_franchisor EXCLUDE USING btree (franchisor_id WITH =) WHERE (is_default = true),
  CONSTRAINT only_one_closed_won_per_franchisor EXCLUDE USING btree (franchisor_id WITH =) WHERE (is_closed_won = true),
  CONSTRAINT only_one_closed_lost_per_franchisor EXCLUDE USING btree (franchisor_id WITH =) WHERE (is_closed_lost = true),
  CONSTRAINT closed_status_exclusive CHECK (NOT (is_closed_won = true AND is_closed_lost = true))
);

-- Indexes for pipeline_stages
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_franchisor_id ON pipeline_stages(franchisor_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_position ON pipeline_stages(franchisor_id, position);

-- ============================================================================
-- 2. ADD STAGE COLUMNS TO LEAD_INVITATIONS
-- ============================================================================

-- Add stage_id column to lead_invitations
ALTER TABLE lead_invitations 
  ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL;

-- Add tracking columns for stage changes
ALTER TABLE lead_invitations 
  ADD COLUMN IF NOT EXISTS stage_changed_at TIMESTAMPTZ;

ALTER TABLE lead_invitations 
  ADD COLUMN IF NOT EXISTS stage_changed_by UUID REFERENCES auth.users(id);

-- Index for stage queries
CREATE INDEX IF NOT EXISTS idx_lead_invitations_stage_id ON lead_invitations(stage_id);

-- ============================================================================
-- 3. CREATE LEAD_STAGE_HISTORY TABLE (For analytics and audit)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_invitation_id UUID NOT NULL REFERENCES lead_invitations(id) ON DELETE CASCADE,
  from_stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL,
  to_stage_id UUID NOT NULL REFERENCES pipeline_stages(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  time_in_previous_stage INTEGER, -- seconds
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for history queries
CREATE INDEX IF NOT EXISTS idx_lead_stage_history_lead_id ON lead_stage_history(lead_invitation_id);
CREATE INDEX IF NOT EXISTS idx_lead_stage_history_to_stage ON lead_stage_history(to_stage_id);
CREATE INDEX IF NOT EXISTS idx_lead_stage_history_created_at ON lead_stage_history(created_at DESC);

-- ============================================================================
-- 4. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on pipeline_stages
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;

-- Franchisor owners can manage their own stages
CREATE POLICY "Franchisors can manage their own stages"
  ON pipeline_stages
  FOR ALL
  USING (
    franchisor_id IN (
      SELECT id FROM franchisor_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    franchisor_id IN (
      SELECT id FROM franchisor_profiles WHERE user_id = auth.uid()
    )
  );

-- Team members can view stages
CREATE POLICY "Team members can view stages"
  ON pipeline_stages
  FOR SELECT
  USING (
    franchisor_id IN (
      SELECT franchisor_id FROM franchisor_team_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Team members (admin/recruiter) can update lead stages
CREATE POLICY "Team members can update lead stages"
  ON lead_invitations
  FOR UPDATE
  USING (
    franchisor_id IN (
      SELECT id FROM franchisor_profiles WHERE user_id = auth.uid()
      UNION
      SELECT franchisor_id FROM franchisor_team_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    franchisor_id IN (
      SELECT id FROM franchisor_profiles WHERE user_id = auth.uid()
      UNION
      SELECT franchisor_id FROM franchisor_team_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Enable RLS on lead_stage_history
ALTER TABLE lead_stage_history ENABLE ROW LEVEL SECURITY;

-- Franchisor and team can view stage history
CREATE POLICY "Franchisor and team can view stage history"
  ON lead_stage_history
  FOR SELECT
  USING (
    lead_invitation_id IN (
      SELECT id FROM lead_invitations WHERE franchisor_id IN (
        SELECT id FROM franchisor_profiles WHERE user_id = auth.uid()
        UNION
        SELECT franchisor_id FROM franchisor_team_members 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- Franchisor and team can insert stage history
CREATE POLICY "Franchisor and team can insert stage history"
  ON lead_stage_history
  FOR INSERT
  WITH CHECK (
    lead_invitation_id IN (
      SELECT id FROM lead_invitations WHERE franchisor_id IN (
        SELECT id FROM franchisor_profiles WHERE user_id = auth.uid()
        UNION
        SELECT franchisor_id FROM franchisor_team_members 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- ============================================================================
-- 5. AUTO-UPDATE TRIGGER FOR updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_pipeline_stages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_pipeline_stages_updated_at ON pipeline_stages;
CREATE TRIGGER trigger_update_pipeline_stages_updated_at
  BEFORE UPDATE ON pipeline_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_pipeline_stages_updated_at();

-- ============================================================================
-- 6. FUNCTION TO CREATE DEFAULT STAGES FOR NEW FRANCHISORS
-- ============================================================================

CREATE OR REPLACE FUNCTION create_default_pipeline_stages(p_franchisor_id UUID)
RETURNS void AS $$
BEGIN
  -- Only create if franchisor has no stages
  IF NOT EXISTS (SELECT 1 FROM pipeline_stages WHERE franchisor_id = p_franchisor_id) THEN
    INSERT INTO pipeline_stages (franchisor_id, name, description, color, position, is_default, is_closed_won, is_closed_lost)
    VALUES
      (p_franchisor_id, 'New Lead', 'Fresh leads that need initial contact', '#3B82F6', 0, true, false, false),
      (p_franchisor_id, 'Contacted', 'Initial contact has been made', '#8B5CF6', 1, false, false, false),
      (p_franchisor_id, 'Qualified', 'Lead has been qualified as potential candidate', '#06B6D4', 2, false, false, false),
      (p_franchisor_id, 'Discovery Call', 'Scheduled or completed discovery call', '#F59E0B', 3, false, false, false),
      (p_franchisor_id, 'FDD Review', 'Lead is actively reviewing FDD', '#EC4899', 4, false, false, false),
      (p_franchisor_id, 'Negotiation', 'In contract negotiation phase', '#10B981', 5, false, false, false),
      (p_franchisor_id, 'Closed Won', 'Deal successfully closed', '#22C55E', 6, false, true, false),
      (p_franchisor_id, 'Closed Lost', 'Deal did not close', '#EF4444', 7, false, false, true);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. CREATE DEFAULT STAGES FOR EXISTING FRANCHISORS
-- ============================================================================

-- Create default stages for all existing franchisors that don't have any
DO $$
DECLARE
  franchisor_rec RECORD;
BEGIN
  FOR franchisor_rec IN SELECT id FROM franchisor_profiles LOOP
    PERFORM create_default_pipeline_stages(franchisor_rec.id);
  END LOOP;
END $$;

-- ============================================================================
-- 8. TRIGGER TO AUTO-CREATE STAGES FOR NEW FRANCHISORS
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_create_pipeline_stages()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_pipeline_stages(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_create_pipeline_stages ON franchisor_profiles;
CREATE TRIGGER trigger_auto_create_pipeline_stages
  AFTER INSERT ON franchisor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_pipeline_stages();

-- ============================================================================
-- 9. ASSIGN EXISTING LEADS TO DEFAULT STAGE
-- ============================================================================

-- Update existing lead_invitations to use the default stage for their franchisor
UPDATE lead_invitations li
SET stage_id = (
  SELECT ps.id 
  FROM pipeline_stages ps 
  WHERE ps.franchisor_id = li.franchisor_id 
  AND ps.is_default = true
  LIMIT 1
)
WHERE li.stage_id IS NULL;

-- ============================================================================
-- VERIFICATION QUERIES (Run after migration to verify)
-- ============================================================================

-- Check pipeline_stages table exists and has data
-- SELECT COUNT(*) as stage_count FROM pipeline_stages;

-- Check lead_invitations has stage_id column
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'lead_invitations' AND column_name = 'stage_id';

-- Verify RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'pipeline_stages';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
