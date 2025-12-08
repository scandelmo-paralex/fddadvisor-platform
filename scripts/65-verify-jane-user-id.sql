SELECT 
  bp.id as buyer_profile_id,
  bp.user_id as buyer_user_id,
  u.id as auth_user_id,
  u.email,
  CASE 
    WHEN bp.user_id = u.id THEN 'MATCH ✓'
    WHEN bp.user_id IS NULL THEN 'user_id is NULL - THIS IS THE PROBLEM'
    ELSE 'MISMATCH - user_id does not match auth user'
  END as status
FROM buyer_profiles bp
LEFT JOIN users u ON u.email = 'scandelmo@pointonelegal.com'
WHERE bp.id = 'bc8397b1-c1b7-436c-bdb4-e052248b36b5';
