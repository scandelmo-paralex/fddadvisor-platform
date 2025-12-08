-- Add DocuSeal template URL to franchises table
ALTER TABLE franchises ADD COLUMN IF NOT EXISTS docuseal_item23_template_url TEXT;

-- Set the Drybar template URL
UPDATE franchises 
SET docuseal_item23_template_url = 'https://docuseal.com/d/F8HwgzbF4jPbAd'
WHERE slug = 'drybar';

-- Verify the update
SELECT id, name, slug, docuseal_item23_template_url 
FROM franchises 
WHERE slug = 'drybar';
