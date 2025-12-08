-- Reset FranchiseScore consent for demo purposes
-- This script clears all FranchiseScore consent records

-- Option 1: Reset ALL consents for all users and FDDs
DELETE FROM fdd_franchisescore_consents;

-- Option 2: Reset consent for a specific FDD (e.g., 'drybar')
-- DELETE FROM fdd_franchisescore_consents WHERE fdd_id = 'drybar';

-- Option 3: Reset consent for a specific user
-- DELETE FROM fdd_franchisescore_consents WHERE user_id = 'YOUR_USER_ID';

-- Verify the reset
SELECT COUNT(*) as remaining_consents FROM fdd_franchisescore_consents;
