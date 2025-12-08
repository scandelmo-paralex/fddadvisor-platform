-- Add missing columns to lead_invitations table for storing all form data
-- These fields are collected in the invitation form but not currently stored

-- Add source field (Lead Source: Website, Referral, Trade Show, etc.)
ALTER TABLE lead_invitations 
ADD COLUMN IF NOT EXISTS source text;

-- Add timeline field (3-6 months, 6-12 months, etc.)
ALTER TABLE lead_invitations 
ADD COLUMN IF NOT EXISTS timeline text;

-- Add city field
ALTER TABLE lead_invitations 
ADD COLUMN IF NOT EXISTS city text;

-- Add state field
ALTER TABLE lead_invitations 
ADD COLUMN IF NOT EXISTS state text;

-- Add target_location field (optional - territory they want to open in)
ALTER TABLE lead_invitations 
ADD COLUMN IF NOT EXISTS target_location text;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'lead_invitations'
ORDER BY ordinal_position;
