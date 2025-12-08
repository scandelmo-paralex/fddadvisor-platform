SELECT 
  lfa.id,
  lfa.buyer_id,
  lfa.franchise_id,
  lfa.fdd_id,
  lfa.created_at,
  f.name as franchise_name,
  f.slug as franchise_slug
FROM lead_fdd_access lfa
LEFT JOIN franchises f ON f.id = lfa.franchise_id
WHERE lfa.buyer_id = 'bc8397b1-c1b7-436c-bdb4-e052248b36b5';
