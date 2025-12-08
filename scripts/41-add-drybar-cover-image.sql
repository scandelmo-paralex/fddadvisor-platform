-- Add Drybar FDD cover image URL to the franchises table
-- This restores the cover image that was previously shown via DrybarCoverOverlay

UPDATE franchises
SET cover_image_url = '/images/design-mode/Drybar-FDD-%282025%29%28Cover-Page%29_1.png'
WHERE slug = 'drybar';

-- Verify the update
SELECT id, name, slug, cover_image_url
FROM franchises
WHERE slug = 'drybar';
