-- Check Bob's buyer profile ID and FDD access record
SELECT 
    'Buyer Profile' as source,
    bp.id as buyer_id,
    bp.user_id,
    bp.email,
    bp.first_name,
    bp.last_name
FROM buyer_profiles bp
WHERE bp.email = 'spcandelmo@gmail.com';

-- Check FDD access records for this buyer
SELECT 
    'FDD Access' as source,
    lfa.id as access_id,
    lfa.buyer_id,
    lfa.franchise_id,
    lfa.invitation_id,
    lfa.granted_via
FROM lead_fdd_access lfa
WHERE lfa.buyer_id IN (
    SELECT id FROM buyer_profiles WHERE email = 'spcandelmo@gmail.com'
);

-- Check if there are ANY FDD access records with similar buyer_id
SELECT 
    'Possible Match' as source,
    lfa.buyer_id,
    lfa.franchise_id,
    lfa.invitation_id
FROM lead_fdd_access lfa
WHERE lfa.buyer_id::text LIKE 'e4a3cd6f%';
