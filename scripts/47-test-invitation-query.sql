-- Test if we can query the invitation by token (simulating what the API does)
SELECT 
  id,
  lead_name,
  lead_email,
  status,
  invitation_token,
  sent_at,
  expires_at,
  franchisor_id,
  franchise_id
FROM lead_invitations
WHERE invitation_token = '4de8c08e99a28b4094a5f7d5d172019767994f2d270e65fe3938b721700f1827';

-- Also check what RLS policies exist on lead_invitations
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'lead_invitations';
