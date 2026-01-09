-- FIX: The sync_engagement_to_fdd_access trigger was comparing the wrong ID types
-- fdd_engagements.buyer_id = auth.users.id (user_id)
-- lead_fdd_access.buyer_id = buyer_profiles.id
-- These are DIFFERENT UUIDs so the trigger never matched any records!

-- Drop the broken trigger and function
DROP TRIGGER IF EXISTS sync_engagement_to_fdd_access ON fdd_engagements;
DROP FUNCTION IF EXISTS update_lead_fdd_access_from_engagement();

-- Create FIXED function that properly joins through buyer_profiles
CREATE OR REPLACE FUNCTION update_lead_fdd_access_from_engagement()
RETURNS TRIGGER AS $$
DECLARE
  v_buyer_profile_id UUID;
BEGIN
  -- NEW.buyer_id is auth.users.id (user_id)
  -- We need to find the corresponding buyer_profiles.id to match lead_fdd_access.buyer_id
  
  SELECT id INTO v_buyer_profile_id
  FROM buyer_profiles
  WHERE user_id = NEW.buyer_id;
  
  IF v_buyer_profile_id IS NULL THEN
    -- No buyer profile found, can't update lead_fdd_access
    RAISE NOTICE 'No buyer_profile found for user_id %, skipping lead_fdd_access update', NEW.buyer_id;
    RETURN NEW;
  END IF;
  
  -- Now update lead_fdd_access using the correct buyer_profile_id
  UPDATE lead_fdd_access
  SET 
    total_time_spent_seconds = COALESCE((
      SELECT SUM(duration_seconds)
      FROM fdd_engagements
      WHERE buyer_id = NEW.buyer_id  -- Still use auth.users.id for fdd_engagements
        AND franchise_id = NEW.franchise_id
    ), 0),
    total_views = COALESCE((
      SELECT COUNT(*)
      FROM fdd_engagements
      WHERE buyer_id = NEW.buyer_id
        AND franchise_id = NEW.franchise_id
    ), 0),
    last_viewed_at = NEW.created_at,
    updated_at = NOW()
  WHERE 
    buyer_id = v_buyer_profile_id  -- Use buyer_profiles.id for lead_fdd_access
    AND franchise_id = NEW.franchise_id;
    
  RAISE NOTICE 'Updated lead_fdd_access for buyer_profile_id % with % seconds', 
    v_buyer_profile_id, 
    (SELECT SUM(duration_seconds) FROM fdd_engagements WHERE buyer_id = NEW.buyer_id AND franchise_id = NEW.franchise_id);
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger with fixed function
CREATE TRIGGER sync_engagement_to_fdd_access
AFTER INSERT OR UPDATE ON fdd_engagements
FOR EACH ROW
EXECUTE FUNCTION update_lead_fdd_access_from_engagement();

-- BACKFILL: Fix all existing records that have stale data
-- This joins through buyer_profiles to correctly match the IDs
UPDATE lead_fdd_access AS lfa
SET 
  total_time_spent_seconds = COALESCE(engagement_totals.total_seconds, 0),
  total_views = COALESCE(engagement_totals.total_views, 0),
  last_viewed_at = engagement_totals.last_viewed,
  updated_at = NOW()
FROM (
  SELECT 
    bp.id as buyer_profile_id,
    fe.franchise_id,
    SUM(fe.duration_seconds) as total_seconds,
    COUNT(*) as total_views,
    MAX(fe.created_at) as last_viewed
  FROM fdd_engagements fe
  JOIN buyer_profiles bp ON bp.user_id = fe.buyer_id  -- Join through user_id
  GROUP BY bp.id, fe.franchise_id
) AS engagement_totals
WHERE lfa.buyer_id = engagement_totals.buyer_profile_id
  AND lfa.franchise_id = engagement_totals.franchise_id;

-- Verify the fix: Show records that should have engagement data
SELECT 
  lfa.id,
  bp.first_name || ' ' || bp.last_name AS buyer_name,
  bp.email,
  f.name AS franchise_name,
  lfa.total_time_spent_seconds,
  lfa.total_views,
  lfa.last_viewed_at,
  (
    SELECT SUM(duration_seconds) 
    FROM fdd_engagements fe 
    WHERE fe.buyer_id = bp.user_id 
      AND fe.franchise_id = lfa.franchise_id
  ) AS actual_engagement_seconds
FROM lead_fdd_access lfa
JOIN buyer_profiles bp ON bp.id = lfa.buyer_id
JOIN franchises f ON f.id = lfa.franchise_id
WHERE EXISTS (
  SELECT 1 FROM fdd_engagements fe 
  WHERE fe.buyer_id = bp.user_id 
    AND fe.franchise_id = lfa.franchise_id
)
ORDER BY lfa.updated_at DESC
LIMIT 20;
