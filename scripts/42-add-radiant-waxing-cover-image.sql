-- Add Radiant Waxing FDD cover image URL to the franchises table
-- This enables the cover image overlay in the FDD viewer for Radiant Waxing

UPDATE franchises
SET cover_image_url = '/images/radiant-waxing-cover.png'
WHERE slug = 'radiant-waxing';

-- Verify the update
SELECT id, name, slug, cover_image_url
FROM franchises
WHERE slug = 'radiant-waxing';
