-- Add brand column to lead_invitations table
ALTER TABLE lead_invitations 
ADD COLUMN IF NOT EXISTS brand TEXT;

-- Add comment
COMMENT ON COLUMN lead_invitations.brand IS 'Brand/franchise name selected when invitation was sent';
