-- Debug Jane Smith's invitation
SELECT 
  id,
  lead_name,
  lead_email,
  status,
  invitation_token,
  sent_at,
  expires_at,
  signed_up_at,
  buyer_id
FROM lead_invitations
WHERE lead_email = 'scandelmo@pointonelegal.com'
ORDER BY sent_at DESC;
