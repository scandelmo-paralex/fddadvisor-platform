-- Reset Jane Smith's invitation to allow re-acceptance
-- This fixes the "invalid invitation token" error after partial account creation

UPDATE lead_invitations
SET 
  status = 'sent',
  buyer_id = NULL,
  signed_up_at = NULL
WHERE lead_email = 'scandelmo@pointonelegal.com'
  AND lead_name = 'Jane Smith';
