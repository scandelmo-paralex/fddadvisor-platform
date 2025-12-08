UPDATE buyer_profiles
SET preferred_location = 'Austin, TX'
WHERE user_id = 'de165357-43a9-401c-82d4-289060dd012d';

-- Verify the update
SELECT 
  id,
  first_name,
  last_name,
  email,
  preferred_location
FROM buyer_profiles
WHERE user_id = 'de165357-43a9-401c-82d4-289060dd012d';
