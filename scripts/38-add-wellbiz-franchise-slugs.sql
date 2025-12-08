-- Add slugs for WellBiz Brands franchises
-- These franchises currently have NULL slugs which breaks FDD viewer routing

UPDATE franchises 
SET slug = 'drybar'
WHERE name = 'Drybar' AND slug IS NULL;

UPDATE franchises 
SET slug = 'amazing-lash-studio'
WHERE name = 'Amazing Lash Studio' AND slug IS NULL;

UPDATE franchises 
SET slug = 'radiant-waxing'
WHERE name = 'Radiant Waxing' AND slug IS NULL;

UPDATE franchises 
SET slug = 'elements-massage'
WHERE name = 'Elements Massage' AND slug IS NULL;

UPDATE franchises 
SET slug = 'fitness-together'
WHERE name = 'Fitness Together' AND slug IS NULL;

-- Verify the updates
SELECT id, name, slug, franchisor_id
FROM franchises
WHERE franchisor_id IN (
  SELECT id FROM franchisor_profiles WHERE company_name LIKE '%WellBiz%'
)
ORDER BY name;
