-- Setup Demo Lead for WellBiz Demo
-- Creates scandelmo@gmail.com as an invited buyer with FDD access

-- First, ensure the buyer profile exists with correct signup_source
UPDATE users
SET signup_source = 'fddhub'
WHERE email = 'scandelmo@gmail.com';

-- Get IDs we need for the demo
DO $$
DECLARE
    v_franchisor_id uuid;
    v_buyer_id uuid;
    v_drybar_id uuid;
    v_lead_id uuid;
BEGIN
    -- Get the WellBiz franchisor ID (from franchisor_profiles where company_name includes 'WellBiz')
    SELECT user_id INTO v_franchisor_id
    FROM franchisor_profiles
    WHERE company_name ILIKE '%wellbiz%'
    LIMIT 1;

    -- Get the buyer user ID
    SELECT id INTO v_buyer_id
    FROM users
    WHERE email = 'scandelmo@gmail.com';

    -- Get Drybar franchise ID
    SELECT id INTO v_drybar_id
    FROM franchises
    WHERE slug = 'drybar';

    -- Check if IDs were found
    IF v_franchisor_id IS NULL THEN
        RAISE EXCEPTION 'WellBiz franchisor not found';
    END IF;
    
    IF v_buyer_id IS NULL THEN
        RAISE EXCEPTION 'Buyer scandelmo@gmail.com not found';
    END IF;
    
    IF v_drybar_id IS NULL THEN
        RAISE EXCEPTION 'Drybar franchise not found';
    END IF;

    -- Create or update the lead record
    INSERT INTO leads (
        id,
        franchise_id,
        buyer_profile_id,
        franchisor_id,
        email,
        first_name,
        last_name,
        status,
        source,
        liquid_capital,
        net_worth,
        timeframe,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        v_drybar_id,
        v_buyer_id,
        v_franchisor_id,
        'scandelmo@gmail.com',
        'Scott',
        'Candelmo',
        'fdd_shared',
        'direct_invitation',
        500000,
        1500000,
        '3-6 months',
        NOW() - INTERVAL '2 days', -- Lead created 2 days ago
        NOW() - INTERVAL '1 day'   -- Last updated yesterday
    )
    ON CONFLICT (email, franchise_id) 
    DO UPDATE SET
        status = 'fdd_shared',
        source = 'direct_invitation',
        updated_at = NOW() - INTERVAL '1 day',
        franchisor_id = v_franchisor_id,
        buyer_profile_id = v_buyer_id
    RETURNING id INTO v_lead_id;

    -- Create FDD access record for the buyer
    INSERT INTO lead_fdd_access (
        lead_id,
        franchise_id,
        user_id,
        access_granted_at,
        invitation_sent_at,
        consent_given_at,
        item23_signed_at,
        can_view_fdd,
        can_download_fdd
    )
    VALUES (
        v_lead_id,
        v_drybar_id,
        v_buyer_id,
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '2 days',
        NULL, -- Will be set when buyer completes consent
        NULL, -- Will be set when buyer signs Item 23
        true,
        false
    )
    ON CONFLICT (lead_id, franchise_id, user_id)
    DO UPDATE SET
        access_granted_at = NOW() - INTERVAL '1 day',
        invitation_sent_at = NOW() - INTERVAL '2 days',
        can_view_fdd = true;

    RAISE NOTICE 'Demo lead created successfully for scandelmo@gmail.com';
    RAISE NOTICE 'Lead ID: %', v_lead_id;
    RAISE NOTICE 'Buyer can now access Drybar FDD at /fdd/drybar';
END $$;

-- Verify the setup
SELECT 
    l.email,
    l.first_name,
    l.last_name,
    l.status,
    f.name as franchise_name,
    f.slug as franchise_slug,
    lfa.can_view_fdd,
    lfa.consent_given_at,
    lfa.item23_signed_at
FROM leads l
JOIN franchises f ON l.franchise_id = f.id
JOIN lead_fdd_access lfa ON lfa.lead_id = l.id
WHERE l.email = 'scandelmo@gmail.com';

COMMENT ON SCRIPT IS 'Sets up scandelmo@gmail.com as an invited buyer for WellBiz Drybar demo';
