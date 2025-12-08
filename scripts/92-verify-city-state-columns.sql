-- Verify Bob's city and state data in the new columns
SELECT 
    id,
    first_name,
    last_name,
    preferred_location,
    city_location,
    state_location
FROM buyer_profiles
WHERE first_name = 'Bob' AND last_name = 'Smith';

-- Also check all buyer profiles to see the new columns
SELECT 
    first_name,
    last_name,
    city_location,
    state_location
FROM buyer_profiles
ORDER BY created_at DESC
LIMIT 10;
