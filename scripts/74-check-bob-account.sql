-- Removed email_confirmed_at column that doesn't exist in users table
SELECT 
  id,
  email,
  role,
  created_at
FROM users
WHERE email = 'bob-smith-email-here'  -- Replace with Bob's actual email
ORDER BY created_at DESC;

-- Also check buyer_profiles
SELECT *
FROM buyer_profiles
WHERE email = 'bob-smith-email-here'  -- Replace with Bob's actual email
ORDER BY created_at DESC;
