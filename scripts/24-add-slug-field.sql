-- Add slug field to franchises table
ALTER TABLE franchises ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create a function to generate unique slugs
CREATE OR REPLACE FUNCTION generate_unique_slug(franchise_name TEXT, franchise_id UUID) 
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Generate base slug from name
  base_slug := LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(franchise_name, '[^a-zA-Z0-9\s-]', '', 'g'),  -- Remove special chars
        '\s+', '-', 'g'                                               -- Replace spaces with hyphens
      ),
      '-+', '-', 'g'                                                  -- Replace multiple hyphens with single
    )
  );
  
  -- Trim leading/trailing hyphens
  base_slug := TRIM(BOTH '-' FROM base_slug);
  
  -- Start with base slug
  final_slug := base_slug;
  
  -- Check if slug exists (excluding current franchise)
  WHILE EXISTS (
    SELECT 1 FROM franchises 
    WHERE slug = final_slug 
    AND id != franchise_id
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Generate unique slugs for all franchises
UPDATE franchises
SET slug = generate_unique_slug(name, id)
WHERE slug IS NULL;

-- Now add the unique constraint
ALTER TABLE franchises ADD CONSTRAINT franchises_slug_key UNIQUE (slug);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_franchises_slug ON franchises(slug);

-- Add comment
COMMENT ON COLUMN franchises.slug IS 'URL-friendly slug generated from franchise name, guaranteed unique';

-- Clean up the function (optional, keep it if you want to use it for new franchises)
-- DROP FUNCTION IF EXISTS generate_unique_slug(TEXT, UUID);
