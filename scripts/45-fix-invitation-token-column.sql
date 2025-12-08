-- Check and fix the invitation token column name mismatch
-- The schema says 'invitation_token' but the database might have 'token'

-- First, let's check if 'invitation_token' column exists
DO $$ 
BEGIN
  -- If invitation_token doesn't exist but token does, rename it
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='lead_invitations' AND column_name='invitation_token')
     AND EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='lead_invitations' AND column_name='token')
  THEN
    ALTER TABLE lead_invitations RENAME COLUMN token TO invitation_token;
    RAISE NOTICE 'Renamed token column to invitation_token';
  END IF;
  
  -- If neither exists, something is wrong
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='lead_invitations' AND column_name='invitation_token')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='lead_invitations' AND column_name='token')
  THEN
    RAISE EXCEPTION 'Neither token nor invitation_token column exists in lead_invitations table';
  END IF;
END $$;

-- Update the index name if it was renamed
DROP INDEX IF EXISTS idx_lead_invitations_token;
CREATE INDEX IF NOT EXISTS idx_lead_invitations_invitation_token ON lead_invitations(invitation_token);
