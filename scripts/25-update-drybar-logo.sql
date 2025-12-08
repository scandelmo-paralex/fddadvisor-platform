-- Update DryBar franchise with logo URL
UPDATE franchises 
SET logo_url = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/png-transparent-drybar-logo-horizontal-cruelty-free-cosmetics-and-beauty-brands-600x206-WeWCIEDWb0dLEq3Ptjhm7Yvez8dcBs.png'
WHERE name ILIKE '%drybar%' OR name ILIKE '%dry bar%';

-- Note: Run script 27-add-logo-url-to-franchisor-profiles.sql first if you want to update franchisor profiles
-- UPDATE franchisor_profiles
-- SET logo_url = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/png-transparent-drybar-logo-horizontal-cruelty-free-cosmetics-and-beauty-brands-600x206-WeWCIEDWb0dLEq3Ptjhm7Yvez8dcBs.png'
-- WHERE company_name ILIKE '%drybar%' OR company_name ILIKE '%dry bar%';
