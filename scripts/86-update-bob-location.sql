-- Update Bob Smith's buyer profile with location
UPDATE buyer_profiles
SET preferred_location = 'Austin, TX'
WHERE full_name = 'Bob Smith'
AND email = 'bob.smith@example.com';

-- Verify the update
SELECT 
  id,
  full_name,
  email,
  preferred_location,
  created_at
FROM buyer_profiles
WHERE full_name = 'Bob Smith';
