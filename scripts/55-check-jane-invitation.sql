-- Check if Jane Smith has an invitation
SELECT 
  id,
  lead_name,
  lead_email,
  franchise_id,
  franchisor_id,
  status,
  invitation_token,
  buyer_id,
  created_at,
  signed_up_at
FROM lead_invitations
WHERE lead_email = 'scandelmo@pointonelegal.com'
ORDER BY created_at DESC;
