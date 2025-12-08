-- Add cover image URL for Elements Massage franchise
-- This updates the franchises table with the cover image URL

-- Update Elements Massage with cover image
UPDATE franchises
SET cover_image_url = '/images/elements-massage-cover.png'
WHERE slug = 'elements-massage';

-- Verify the update
SELECT id, name, slug, cover_image_url
FROM franchises
WHERE slug = 'elements-massage';
