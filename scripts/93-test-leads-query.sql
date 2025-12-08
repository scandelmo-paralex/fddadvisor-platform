-- Test the exact query the API uses to see what data is returned
SELECT 
  lfa.id as access_id,
  lfa.buyer_id,
  bp.first_name,
  bp.last_name,
  bp.city_location,
  bp.state_location,
  bp.buying_timeline
FROM lead_fdd_access lfa
LEFT JOIN buyer_profiles bp ON lfa.buyer_id = bp.id
WHERE bp.first_name = 'Bob' AND bp.last_name = 'Smith'
LIMIT 1;
