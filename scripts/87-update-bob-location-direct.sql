-- Update Bob Smith's buyer profile with location information
UPDATE buyer_profiles
SET 
  preferred_location = 'Austin, TX',
  updated_at = NOW()
WHERE user_id = 'de165357-43a9-401c-82d4-289060dd012d';

-- Verify the update
SELECT 
  id,
  user_id,
  full_name,
  email,
  preferred_location,
  updated_at
FROM buyer_profiles
WHERE user_id = 'de165357-43a9-401c-82d4-289060dd012d';
