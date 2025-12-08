-- Query to check all URL fields for the Drybar franchise
SELECT 
  id,
  name,
  slug,
  fdd_url,
  fdd_pdf_url,
  fdd_document_url,
  logo_url
FROM franchises
WHERE slug = 'drybar' OR name ILIKE '%drybar%';
