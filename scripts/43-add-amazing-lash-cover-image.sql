-- Add cover image URL for Amazing Lash Studio franchise
-- This enables the custom cover page overlay in the FDD viewer

UPDATE franchises
SET cover_image_url = '/images/amazing-lash-cover.png'
WHERE slug = 'amazing-lash-studio';
