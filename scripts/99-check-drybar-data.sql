-- Check Drybar franchise data to see what's stored in blob fields
SELECT 
  id,
  name,
  slug,
  logo_url,
  fdd_cover_page_url,
  analysis_url,
  created_at
FROM franchises 
WHERE slug = 'drybar';

-- Also check the fdd_pages for Drybar
SELECT 
  franchise_id,
  page_number,
  page_image_url,
  page_text
FROM fdd_pages 
WHERE franchise_id = (SELECT id FROM franchises WHERE slug = 'drybar')
ORDER BY page_number
LIMIT 5;
