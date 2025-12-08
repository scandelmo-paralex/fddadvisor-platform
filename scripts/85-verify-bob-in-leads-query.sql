-- Check Bob Smith's complete lead data for the franchisor dashboard

-- 1. Check Bob's auth user
SELECT 'Auth User' as record_type, 
       id, 
       email,
       created_at
FROM auth.users 
WHERE email = 'spcandelmo@gmail.com';

-- 2. Check Bob's buyer profile
SELECT 'Buyer Profile' as record_type,
       id as buyer_id,
       user_id,
       first_name,
       last_name,
       email,
       phone,
       signup_source,
       created_at
FROM buyer_profiles 
WHERE email = 'spcandelmo@gmail.com' OR user_id IN (
    SELECT id FROM auth.users WHERE email = 'spcandelmo@gmail.com'
);

-- 3. Check Bob's FDD access for Drybar
SELECT 'FDD Access' as record_type,
       lfa.id as access_id,
       lfa.buyer_id,
       lfa.franchise_id,
       f.name as franchise_name,
       lfa.consent_given_at,
       lfa.receipt_signed_at,
       lfa.docuseal_submission_id,
       lfa.receipt_pdf_url,
       lfa.total_views,
       lfa.total_time_spent_seconds,
       lfa.granted_via,
       lfa.created_at as fdd_sent_at
FROM lead_fdd_access lfa
LEFT JOIN franchises f ON f.id = lfa.franchise_id
WHERE lfa.buyer_id IN (
    SELECT id FROM buyer_profiles WHERE email = 'spcandelmo@gmail.com'
);

-- 4. Check Bob's invitations
SELECT 'Invitation' as record_type,
       id as invitation_id,
       buyer_id,
       franchise_id,
       lead_name,
       lead_email,
       status,
       sent_at,
       expires_at,
       created_at
FROM lead_invitations
WHERE lead_email = 'spcandelmo@gmail.com' OR buyer_id IN (
    SELECT id FROM buyer_profiles WHERE email = 'spcandelmo@gmail.com'
);

-- 5. Check Bob's engagement data
SELECT 'Engagement' as record_type,
       id as engagement_id,
       buyer_id,
       franchise_id,
       duration_seconds,
       viewed_items,
       questions_list,
       created_at
FROM fdd_engagements
WHERE buyer_id IN (
    SELECT id FROM buyer_profiles WHERE email = 'spcandelmo@gmail.com'
);

-- 6. Check franchisor profile to verify they own Drybar
SELECT 'Franchisor Check' as record_type,
       fp.id as franchisor_id,
       fp.user_id,
       f.id as franchise_id,
       f.name as franchise_name
FROM franchisor_profiles fp
LEFT JOIN franchises f ON f.franchisor_id = fp.id
WHERE f.name = 'Drybar';
