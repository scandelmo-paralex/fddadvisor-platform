-- Add tracking columns for FDD engagement analytics
-- This assumes fdd_engagements table exists but may be missing some columns

-- Add questions_asked column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'fdd_engagements' 
                 AND column_name = 'questions_asked') THEN
    ALTER TABLE fdd_engagements ADD COLUMN questions_asked INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add column to track which FDD items were viewed
ALTER TABLE fdd_engagements 
ADD COLUMN IF NOT EXISTS viewed_items INTEGER[] DEFAULT '{}';

-- Add column to store actual questions asked (for future reference)
ALTER TABLE fdd_engagements 
ADD COLUMN IF NOT EXISTS questions_list TEXT[] DEFAULT '{}';

-- Create index for viewed_items for better query performance
CREATE INDEX IF NOT EXISTS idx_fdd_engagements_viewed_items ON fdd_engagements USING GIN(viewed_items);

-- Add comments
COMMENT ON COLUMN fdd_engagements.viewed_items IS 'Array of FDD item numbers that the user viewed (e.g., [1, 7, 19, 23])';
COMMENT ON COLUMN fdd_engagements.questions_list IS 'Array of questions the user asked via AI chat';
COMMENT ON COLUMN fdd_engagements.questions_asked IS 'Count of total questions asked';
