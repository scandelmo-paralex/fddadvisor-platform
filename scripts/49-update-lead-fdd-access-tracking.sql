-- Add tracking columns to lead_fdd_access table to store engagement metrics

-- Add columns to track engagement in lead_fdd_access
ALTER TABLE lead_fdd_access
ADD COLUMN IF NOT EXISTS total_views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_time_spent_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS consent_given_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS receipt_signed_at TIMESTAMP WITH TIME ZONE;

-- Fixed to use buyer_id instead of user_id to match actual database schema
CREATE OR REPLACE FUNCTION update_lead_fdd_access_from_engagement()
RETURNS TRIGGER AS $$
BEGIN
  -- Find the corresponding lead_fdd_access record
  -- Note: Both tables use buyer_id
  UPDATE lead_fdd_access
  SET 
    total_time_spent_seconds = COALESCE((
      SELECT SUM(duration_seconds)
      FROM fdd_engagements
      WHERE buyer_id = NEW.buyer_id
      AND franchise_id = NEW.franchise_id
    ), 0),
    last_viewed_at = NEW.created_at,
    updated_at = NOW()
  WHERE 
    buyer_id = NEW.buyer_id
    AND franchise_id = NEW.franchise_id;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update lead_fdd_access when fdd_engagements is updated
DROP TRIGGER IF EXISTS sync_engagement_to_fdd_access ON fdd_engagements;
CREATE TRIGGER sync_engagement_to_fdd_access
AFTER INSERT OR UPDATE ON fdd_engagements
FOR EACH ROW
EXECUTE FUNCTION update_lead_fdd_access_from_engagement();

-- Fixed backfill query to use buyer_id in both tables
UPDATE lead_fdd_access AS lfa
SET 
  total_time_spent_seconds = COALESCE((
    SELECT SUM(duration_seconds)
    FROM fdd_engagements fe
    WHERE fe.buyer_id = lfa.buyer_id
    AND fe.franchise_id = lfa.franchise_id
  ), 0),
  last_viewed_at = (
    SELECT MAX(created_at)
    FROM fdd_engagements fe
    WHERE fe.buyer_id = lfa.buyer_id
    AND fe.franchise_id = lfa.franchise_id
  );

COMMENT ON COLUMN lead_fdd_access.total_views IS 'Total number of times the FDD was viewed';
COMMENT ON COLUMN lead_fdd_access.total_time_spent_seconds IS 'Total time spent viewing FDD in seconds, synced from fdd_engagements';
COMMENT ON COLUMN lead_fdd_access.last_viewed_at IS 'Last time the FDD was viewed, synced from fdd_engagements';
COMMENT ON COLUMN lead_fdd_access.consent_given_at IS 'When buyer gave consent to proceed';
COMMENT ON COLUMN lead_fdd_access.receipt_signed_at IS 'When buyer signed Item 23 receipt';
