-- Seed Data v2

-- Create test franchisor users and profiles
DO $$
DECLARE
  v_user_id_1 UUID;
  v_user_id_2 UUID;
  v_user_id_3 UUID;
  v_franchisor_id_1 UUID;
  v_franchisor_id_2 UUID;
  v_franchisor_id_3 UUID;
  v_franchise_id_1 UUID;
  v_franchise_id_2 UUID;
  v_buyer_id_1 UUID;
  v_buyer_id_2 UUID;
BEGIN
  -- Create franchisor auth users
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token
  ) VALUES
    ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
     'john.smith@subway.com', crypt('password123', gen_salt('bf')), NOW(),
     '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', ''),
    ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
     'sarah@orangetheory.com', crypt('password123', gen_salt('bf')), NOW(),
     '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', ''),
    ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
     'mike@anytimefitness.com', crypt('password123', gen_salt('bf')), NOW(),
     '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '')
  RETURNING id INTO v_user_id_1, v_user_id_2, v_user_id_3;

  -- Get the created user IDs
  SELECT id INTO v_user_id_1 FROM auth.users WHERE email = 'john.smith@subway.com';
  SELECT id INTO v_user_id_2 FROM auth.users WHERE email = 'sarah@orangetheory.com';
  SELECT id INTO v_user_id_3 FROM auth.users WHERE email = 'mike@anytimefitness.com';

  -- Create franchisor profiles
  INSERT INTO franchisor_profiles (user_id, company_name, contact_name, email, phone, website)
  VALUES
    (v_user_id_1, 'Subway Franchising', 'John Smith', 'john.smith@subway.com', '555-0101', 'https://subway.com'),
    (v_user_id_2, 'Orangetheory Fitness', 'Sarah Orange', 'sarah@orangetheory.com', '555-0102', 'https://orangetheory.com'),
    (v_user_id_3, 'Anytime Fitness', 'Mike Johnson', 'mike@anytimefitness.com', '555-0103', 'https://anytimefitness.com')
  RETURNING id INTO v_franchisor_id_1, v_franchisor_id_2, v_franchisor_id_3;

  -- Get franchisor IDs
  SELECT id INTO v_franchisor_id_1 FROM franchisor_profiles WHERE email = 'john.smith@subway.com';
  SELECT id INTO v_franchisor_id_2 FROM franchisor_profiles WHERE email = 'sarah@orangetheory.com';
  SELECT id INTO v_franchisor_id_3 FROM franchisor_profiles WHERE email = 'mike@anytimefitness.com';

  -- Create franchises
  INSERT INTO franchises (franchisor_id, name, industry, description, initial_investment_min, initial_investment_max, franchise_fee, royalty_percentage, territories_available)
  VALUES
    (v_franchisor_id_1, 'Subway', 'Food & Beverage', 'World-famous submarine sandwich franchise', 150000, 300000, 15000, 8.0, 50),
    (v_franchisor_id_2, 'Orangetheory Fitness', 'Fitness', 'Heart-rate based interval training fitness franchise', 500000, 1000000, 59950, 8.0, 25),
    (v_franchisor_id_3, 'Anytime Fitness', 'Fitness', '24/7 fitness club franchise', 400000, 800000, 42500, 7.0, 30)
  RETURNING id INTO v_franchise_id_1, v_franchise_id_2;

  -- Create buyer profiles (without auth users for now)
  INSERT INTO buyer_profiles (user_id, full_name, email, phone, location, investment_range_min, investment_range_max, industries_of_interest)
  VALUES
    (NULL, 'Sarah Johnson', 'sarah.johnson@email.com', '555-1001', 'Austin, TX', 200000, 500000, ARRAY['Food & Beverage', 'Retail']),
    (NULL, 'Michael Chen', 'michael.chen@email.com', '555-1002', 'Denver, CO', 400000, 800000, ARRAY['Fitness', 'Health & Wellness'])
  RETURNING id INTO v_buyer_id_1, v_buyer_id_2;

  -- Get buyer IDs
  SELECT id INTO v_buyer_id_1 FROM buyer_profiles WHERE email = 'sarah.johnson@email.com';
  SELECT id INTO v_buyer_id_2 FROM buyer_profiles WHERE email = 'michael.chen@email.com';

  -- Create leads
  INSERT INTO leads (franchisor_id, buyer_id, franchise_id, status, source, notes)
  VALUES
    (v_franchisor_id_1, v_buyer_id_1, v_franchise_id_1, 'qualified', 'Website Inquiry', 'Interested in opening Subway in Austin area'),
    (v_franchisor_id_2, v_buyer_id_2, v_franchise_id_2, 'contacted', 'Referral', 'Looking for fitness franchise in Denver');

END $$;
