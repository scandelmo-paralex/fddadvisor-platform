-- Add Fitness Together cover image to database
-- This script updates the cover_image_url for Fitness Together franchise

-- Update Fitness Together cover image
UPDATE franchises
SET cover_image_url = '/images/fitness-together-cover.png'
WHERE slug = 'fitness-together';
