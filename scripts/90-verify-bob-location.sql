-- Verify Bob Smith's location data in the database
SELECT 
  bp.id as buyer_profile_id,
  bp.first_name,
  bp.last_name,
  bp.preferred_location,
  bp.buying_timeline,
  lfa.id as fdd_access_id,
  lfa.consent_given_at,
  lfa.receipt_signed_at,
  i.timeline as invitation_timeline,
  i.status as invitation_status
FROM buyer_profiles bp
LEFT JOIN lead_fdd_access lfa ON lfa.buyer_id = bp.id
LEFT JOIN invitations i ON lfa.invitation_id = i.id
WHERE bp.first_name = 'Bob' AND bp.last_name = 'Smith';
