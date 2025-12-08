-- Add cover_image_url field to franchises table for PDF viewer cover page overlays
-- This allows admins to upload custom cover pages for each franchise's FDD viewer

ALTER TABLE franchises
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

COMMENT ON COLUMN franchises.cover_image_url IS 'URL to cover page image (PNG) to display in FDD viewer';

-- Update existing Drybar franchise with placeholder (admin will upload actual image)
UPDATE franchises 
SET cover_image_url = NULL 
WHERE slug = 'drybar';
