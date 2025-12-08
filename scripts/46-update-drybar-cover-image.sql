-- Update Drybar FDD cover image to use the new clean PNG
UPDATE franchises
SET cover_image_url = '/images/drybar-cover.png'
WHERE slug = 'drybar';

-- Verify the update
SELECT id, name, slug, cover_image_url
FROM franchises
WHERE slug = 'drybar';
