-- Drop the unused analysis_url column that's causing v0 build errors
-- This field contains blob URLs that v0's bundler tries to import as JSON modules

ALTER TABLE franchises 
DROP COLUMN IF EXISTS analysis_url;
