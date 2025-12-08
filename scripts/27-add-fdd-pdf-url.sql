-- Add fdd_pdf_url column to franchises table
-- This allows each franchise to link directly to its FDD PDF document

ALTER TABLE franchises
  ADD COLUMN IF NOT EXISTS fdd_pdf_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN franchises.fdd_pdf_url IS 'URL to the franchise disclosure document (FDD) PDF file';

-- Create index for faster lookups when filtering by PDF availability
CREATE INDEX IF NOT EXISTS idx_franchises_has_pdf ON franchises(fdd_pdf_url) WHERE fdd_pdf_url IS NOT NULL;
