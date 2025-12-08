-- Add logo_url column to franchises table
ALTER TABLE franchises 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add comment
COMMENT ON COLUMN franchises.logo_url IS 'URL to the franchise brand logo stored in Vercel Blob';
