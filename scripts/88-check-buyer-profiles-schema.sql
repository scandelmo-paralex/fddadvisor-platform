-- Check the actual structure of buyer_profiles table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'buyer_profiles'
ORDER BY ordinal_position;

-- Also show Bob's actual data
SELECT *
FROM buyer_profiles
WHERE user_id = 'de165357-43a9-401c-82d4-289060dd012d';
