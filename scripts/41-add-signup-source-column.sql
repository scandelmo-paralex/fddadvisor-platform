-- Add signup_source column to users table
-- Updated to track lead sources instead of product names
-- This tracks where leads came from: Website, Broker, Referral, Internal, Trade Show, Direct Inquiry, FDDAdvisor, Other

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS signup_source TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_signup_source ON users(signup_source);

-- Update existing users to have a default signup_source
UPDATE users 
SET signup_source = 'Website' 
WHERE signup_source IS NULL;

-- Add comment
COMMENT ON COLUMN users.signup_source IS 'Lead source: Internal, Website, Broker, Referral, Trade Show, Direct Inquiry, FDDAdvisor, Other';
