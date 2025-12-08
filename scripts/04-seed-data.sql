-- Seed data for FDDAdvisor platform
-- This populates the database with sample data for testing

-- Clear existing data (optional - comment out if you want to keep existing data)
TRUNCATE TABLE closed_deals, pre_approval_requests, qualification_responses, 
  engagement_events, notes, leads, franchises, lender_profiles, 
  buyer_profiles, franchisor_profiles CASCADE;

-- ============================================================================
-- AUTH USERS (Required for foreign key constraints)
-- ============================================================================

-- Insert franchisor users
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES 
  ('a1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'john@subway.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"role":"franchisor"}', false, '', '', '', ''),
  ('a2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sarah@orangetheory.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"role":"franchisor"}', false, '', '', '', ''),
  ('a3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mike@anytimefitness.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"role":"franchisor"}', false, '', '', '', '');

-- Insert buyer users
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES 
  ('b0000001-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sarah.chen@email.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"role":"buyer"}', false, '', '', '', ''),
  ('b0000002-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'michael.r@email.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"role":"buyer"}', false, '', '', '', ''),
  ('b0000003-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'emily.watson@email.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"role":"buyer"}', false, '', '', '', ''),
  ('b0000004-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'david.kim@email.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"role":"buyer"}', false, '', '', '', '');

-- Insert lender users
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES 
  ('c0000001-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'robert@franfund.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"role":"lender"}', false, '', '', '', ''),
  ('c0000002-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lisa@guidant.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"role":"lender"}', false, '', '', '', ''),
  ('c0000003-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'james@boefly.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"role":"lender"}', false, '', '', '', '');

-- ============================================================================
-- FRANCHISOR PROFILES & FRANCHISES
-- ============================================================================

-- Franchisor 1: Subway
INSERT INTO franchisor_profiles (id, user_id, company_name, contact_name, email, phone, created_at)
VALUES 
  ('f1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 
   'Subway', 'John Anderson', 'john@subway.com', '555-0101', NOW());

-- Fixed column names to match schema: brand_name instead of name, added fdd_url
INSERT INTO franchises (id, franchisor_id, brand_name, industry, franchise_fee, total_investment_min, 
  total_investment_max, liquid_capital_required, net_worth_required, fdd_url, 
  quick_summary, opportunities, concerns, created_at)
VALUES 
  ('e1111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111',
   'Subway', 'Food & Beverage', 15000, 116000, 263000, 80000, 150000,
   'https://example.com/subway-fdd.pdf',
   'Subway is the world''s largest submarine sandwich chain with over 37,000 locations worldwide. Known for its customizable sandwiches and healthy options, Subway offers a proven business model with strong brand recognition and comprehensive training support.',
   ARRAY['Global brand recognition with 50+ years of success', 'Lower initial investment compared to other QSR franchises', 'Flexible real estate options including non-traditional locations'],
   ARRAY['Highly competitive QSR market with evolving consumer preferences', 'Royalty and advertising fees can impact profitability', 'Success heavily dependent on location selection'],
   NOW());

-- Franchisor 2: Orangetheory Fitness
INSERT INTO franchisor_profiles (id, user_id, company_name, contact_name, email, phone, created_at)
VALUES 
  ('f2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222',
   'Orangetheory Fitness', 'Sarah Mitchell', 'sarah@orangetheory.com', '555-0102', NOW());

INSERT INTO franchises (id, franchisor_id, brand_name, industry, franchise_fee, total_investment_min,
  total_investment_max, liquid_capital_required, net_worth_required, fdd_url,
  quick_summary, opportunities, concerns, created_at)
VALUES 
  ('e2222222-2222-2222-2222-222222222222', 'f2222222-2222-2222-2222-222222222222',
   'Orangetheory Fitness', 'Fitness', 59950, 563529, 994678, 250000, 500000,
   'https://example.com/orangetheory-fdd.pdf',
   'Orangetheory Fitness is a science-backed, technology-tracked, coach-inspired group workout designed to produce results from the inside out. With over 1,500 studios worldwide, it offers a unique heart-rate based interval training experience.',
   ARRAY['Rapidly growing fitness concept with strong member retention', 'Proprietary technology and workout methodology', 'Recurring revenue model with membership-based income'],
   ARRAY['High initial investment and build-out costs', 'Competitive fitness market with evolving trends', 'Requires significant staff training and management'],
   NOW());

-- Franchisor 3: Anytime Fitness
INSERT INTO franchisor_profiles (id, user_id, company_name, contact_name, email, phone, created_at)
VALUES 
  ('f3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333',
   'Anytime Fitness', 'Mike Johnson', 'mike@anytimefitness.com', '555-0103', NOW());

INSERT INTO franchises (id, franchisor_id, brand_name, industry, franchise_fee, total_investment_min,
  total_investment_max, liquid_capital_required, net_worth_required, fdd_url,
  quick_summary, opportunities, concerns, created_at)
VALUES 
  ('e3333333-3333-3333-3333-333333333333', 'f3333333-3333-3333-3333-333333333333',
   'Anytime Fitness', 'Fitness', 42500, 378289, 705791, 150000, 350000,
   'https://example.com/anytimefitness-fdd.pdf',
   'Anytime Fitness is the world''s largest 24-hour gym franchise with over 5,000 locations globally. The brand focuses on providing convenient, affordable fitness options with a supportive community atmosphere and comprehensive member services.',
   ARRAY['Established brand with 20+ years of franchise success', '24/7 access model appeals to busy professionals', 'Strong support system and proven operational model'],
   ARRAY['Saturated market in many metropolitan areas', 'Member acquisition costs can be significant', 'Ongoing equipment maintenance and facility upkeep required'],
   NOW());

-- ============================================================================
-- BUYER PROFILES
-- ============================================================================

-- Removed is_verified from INSERT (it's a generated column)
-- Buyer 1: Sarah Chen (Qualified)
INSERT INTO buyer_profiles (id, user_id, name, email, phone, fico_score, fico_verified_at,
  plaid_connected, plaid_verified_at, liquid_capital, net_worth, background_check_completed,
  background_check_verified_at, created_at)
VALUES 
  ('b1111111-1111-1111-1111-111111111111', 'b0000001-1111-1111-1111-111111111111',
   'Sarah Chen', 'sarah.chen@email.com', '555-1001', 720, NOW() - INTERVAL '5 days',
   true, NOW() - INTERVAL '5 days', 150000, 400000, true, NOW() - INTERVAL '5 days',
   NOW() - INTERVAL '10 days');

-- Buyer 2: Michael Rodriguez (Engaged but not verified)
INSERT INTO buyer_profiles (id, user_id, name, email, phone, created_at)
VALUES 
  ('b2222222-2222-2222-2222-222222222222', 'b0000002-2222-2222-2222-222222222222',
   'Michael Rodriguez', 'michael.r@email.com', '555-1002', NOW() - INTERVAL '7 days');

-- Buyer 3: Emily Watson (Just signed up)
INSERT INTO buyer_profiles (id, user_id, name, email, phone, created_at)
VALUES 
  ('b3333333-3333-3333-3333-333333333333', 'b0000003-3333-3333-3333-333333333333',
   'Emily Watson', 'emily.watson@email.com', '555-1003', NOW() - INTERVAL '2 days');

-- Buyer 4: David Kim (Qualified)
INSERT INTO buyer_profiles (id, user_id, name, email, phone, fico_score, fico_verified_at,
  plaid_connected, plaid_verified_at, liquid_capital, net_worth, background_check_completed,
  background_check_verified_at, created_at)
VALUES 
  ('b4444444-4444-4444-4444-444444444444', 'b0000004-4444-4444-4444-444444444444',
   'David Kim', 'david.kim@email.com', '555-1004', 680, NOW() - INTERVAL '3 days',
   true, NOW() - INTERVAL '3 days', 200000, 500000, true, NOW() - INTERVAL '3 days',
   NOW() - INTERVAL '8 days');

-- ============================================================================
-- LENDER PROFILES
-- ============================================================================

-- Fixed column names to match schema
INSERT INTO lender_profiles (id, user_id, company_name, contact_name, email, phone,
  min_fico_score, max_loan_amount, created_at)
VALUES 
  ('d1111111-1111-1111-1111-111111111111', 'c0000001-1111-1111-1111-111111111111',
   'FranFund', 'Robert Martinez', 'robert@franfund.com', '555-2001',
   650, 5000000, NOW()),
  ('d2222222-2222-2222-2222-222222222222', 'c0000002-2222-2222-2222-222222222222',
   'Guidant Financial', 'Lisa Thompson', 'lisa@guidant.com', '555-2002',
   680, 3000000, NOW()),
  ('d3333333-3333-3333-3333-333333333333', 'c0000003-3333-3333-3333-333333333333',
   'BoeFly', 'James Wilson', 'james@boefly.com', '555-2003',
   700, 10000000, NOW());

-- ============================================================================
-- LEADS (Connections between buyers and franchises)
-- ============================================================================

-- Added franchisor_id column and removed is_qualified (generated column)
-- Sarah Chen → Subway (Qualified)
INSERT INTO leads (id, franchise_id, buyer_profile_id, franchisor_id, email, fdd_link_id, source,
  connection_type, status, total_time_spent, viewed_item_19, answered_questions,
  engagement_qualified, verification_qualified, created_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111',
   'b1111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111',
   'sarah.chen@email.com', 'fdd-link-sarah-subway',
   'broker', 'franchisor_initiated', 'qualified', 1200, true, true, true, true,
   NOW() - INTERVAL '10 days');

-- Michael Rodriguez → Orangetheory (Engaged, not verified)
INSERT INTO leads (id, franchise_id, buyer_profile_id, franchisor_id, email, fdd_link_id, source,
  connection_type, status, total_time_spent, viewed_item_19, answered_questions,
  engagement_qualified, verification_qualified, created_at)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222',
   'b2222222-2222-2222-2222-222222222222', 'f2222222-2222-2222-2222-222222222222',
   'michael.r@email.com', 'fdd-link-michael-ot',
   'website', 'franchisor_initiated', 'engaged', 900, true, true, true, false,
   NOW() - INTERVAL '7 days');

-- Emily Watson → Anytime Fitness (Just viewing)
INSERT INTO leads (id, franchise_id, buyer_profile_id, franchisor_id, email, fdd_link_id, source,
  connection_type, status, total_time_spent, viewed_item_19, answered_questions,
  engagement_qualified, verification_qualified, created_at)
VALUES 
  ('33333333-3333-3333-3333-333333333333', 'e3333333-3333-3333-3333-333333333333',
   'b3333333-3333-3333-3333-333333333333', 'f3333333-3333-3333-3333-333333333333',
   'emily.watson@email.com', 'fdd-link-emily-af',
   'referral', 'franchisor_initiated', 'viewing', 300, false, false, false, false,
   NOW() - INTERVAL '2 days');

-- David Kim → Subway (Qualified)
INSERT INTO leads (id, franchise_id, buyer_profile_id, franchisor_id, email, fdd_link_id, source,
  connection_type, status, total_time_spent, viewed_item_19, answered_questions,
  engagement_qualified, verification_qualified, created_at)
VALUES 
  ('44444444-4444-4444-4444-444444444444', 'e1111111-1111-1111-1111-111111111111',
   'b4444444-4444-4444-4444-444444444444', 'f1111111-1111-1111-1111-111111111111',
   'david.kim@email.com', 'fdd-link-david-subway',
   'trade_show', 'franchisor_initiated', 'qualified', 1500, true, true, true, true,
   NOW() - INTERVAL '8 days');

-- ============================================================================
-- ENGAGEMENT EVENTS
-- ============================================================================

-- Sarah Chen's engagement with Subway
INSERT INTO engagement_events (lead_id, event_type, metadata, created_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'fdd_viewed', 
   '{"duration": 1200, "sections": ["overview", "item_19", "fees", "territory"]}'::jsonb,
   NOW() - INTERVAL '9 days'),
  ('11111111-1111-1111-1111-111111111111', 'section_viewed',
   '{"section": "item_19", "duration": 600}'::jsonb, NOW() - INTERVAL '9 days'),
  ('11111111-1111-1111-1111-111111111111', 'question_asked',
   '{"question": "What is the average revenue for a Subway franchise?"}'::jsonb,
   NOW() - INTERVAL '9 days'),
  ('11111111-1111-1111-1111-111111111111', 'pdf_downloaded',
   '{}'::jsonb, NOW() - INTERVAL '8 days');

-- Michael Rodriguez's engagement with Orangetheory
INSERT INTO engagement_events (lead_id, event_type, metadata, created_at)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'fdd_viewed',
   '{"duration": 900, "sections": ["overview", "item_19", "support"]}'::jsonb,
   NOW() - INTERVAL '6 days'),
  ('22222222-2222-2222-2222-222222222222', 'section_viewed',
   '{"section": "item_19", "duration": 450}'::jsonb, NOW() - INTERVAL '6 days'),
  ('22222222-2222-2222-2222-222222222222', 'question_asked',
   '{"question": "What kind of training is provided?"}'::jsonb, NOW() - INTERVAL '6 days');

-- ============================================================================
-- QUALIFICATION RESPONSES
-- ============================================================================

-- Sarah Chen's responses
INSERT INTO qualification_responses (lead_id, question, answer, created_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 
   'How much liquid capital do you have available?', '$150,000', NOW() - INTERVAL '9 days'),
  ('11111111-1111-1111-1111-111111111111',
   'What is your timeline for opening a franchise?', '3-6 months', NOW() - INTERVAL '9 days'),
  ('11111111-1111-1111-1111-111111111111',
   'Do you have previous business ownership experience?', 'Yes, owned a retail store',
   NOW() - INTERVAL '9 days');

-- Michael Rodriguez's responses
INSERT INTO qualification_responses (lead_id, question, answer, created_at)
VALUES 
  ('22222222-2222-2222-2222-222222222222',
   'How much liquid capital do you have available?', '$200,000', NOW() - INTERVAL '6 days'),
  ('22222222-2222-2222-2222-222222222222',
   'What is your timeline for opening a franchise?', '6-12 months', NOW() - INTERVAL '6 days'),
  ('22222222-2222-2222-2222-222222222222',
   'Do you have previous business ownership experience?', 'No, first time',
   NOW() - INTERVAL '6 days');

-- David Kim's responses
INSERT INTO qualification_responses (lead_id, question, answer, created_at)
VALUES 
  ('44444444-4444-4444-4444-444444444444',
   'How much liquid capital do you have available?', '$200,000', NOW() - INTERVAL '7 days'),
  ('44444444-4444-4444-4444-444444444444',
   'What is your timeline for opening a franchise?', '1-3 months', NOW() - INTERVAL '7 days'),
  ('44444444-4444-4444-4444-444444444444',
   'Do you have previous business ownership experience?', 'Yes, managed franchises before',
   NOW() - INTERVAL '7 days');

-- ============================================================================
-- PRE-APPROVAL REQUESTS
-- ============================================================================

-- Fixed column names to match schema
-- Sarah Chen requesting pre-approval from FranFund
INSERT INTO pre_approval_requests (id, lead_id, buyer_profile_id, lender_id, requested_amount, status,
  lender_notes, created_at, updated_at)
VALUES 
  ('aa111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'b1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 
   150000, 'approved',
   'Strong credit profile, approved for up to $150K', NOW() - INTERVAL '4 days',
   NOW() - INTERVAL '3 days');

-- David Kim requesting pre-approval from Guidant Financial
INSERT INTO pre_approval_requests (id, lead_id, buyer_profile_id, lender_id, requested_amount, status,
  lender_notes, created_at, updated_at)
VALUES 
  ('aa222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444',
   'b4444444-4444-4444-4444-444444444444', 'd2222222-2222-2222-2222-222222222222', 
   200000, 'approved',
   'Excellent experience, approved for up to $200K', NOW() - INTERVAL '2 days',
   NOW() - INTERVAL '1 day');

-- Michael Rodriguez requesting pre-approval (pending)
INSERT INTO pre_approval_requests (id, lead_id, buyer_profile_id, lender_id, requested_amount, status,
  created_at, updated_at)
VALUES 
  ('aa333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222',
   'b2222222-2222-2222-2222-222222222222', 'd3333333-3333-3333-3333-333333333333', 
   180000, 'pending',
   NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- ============================================================================
-- CLOSED DEALS
-- ============================================================================

-- Fixed column names to match schema
-- Sarah Chen closed deal with Subway
INSERT INTO closed_deals (id, lead_id, franchise_id, franchisor_id, buyer_profile_id,
  franchise_fee, total_investment, closed_at, created_at)
VALUES 
  ('de111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'e1111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111',
   'b1111111-1111-1111-1111-111111111111',
   15000, 180000, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- ============================================================================
-- NOTES
-- ============================================================================

-- Removed created_by column (doesn't exist in schema)
-- Notes on leads
INSERT INTO notes (lead_id, buyer_profile_id, content, created_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111',
   'Very engaged prospect. Has retail experience. Ready to move forward.',
   NOW() - INTERVAL '5 days'),
  ('22222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222',
   'Interested but needs to complete verification. Following up next week.',
   NOW() - INTERVAL '4 days'),
  ('44444444-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444',
   'Excellent candidate with franchise management experience. Fast track.',
   NOW() - INTERVAL '6 days');

-- Success message
SELECT 'Database seeded successfully!' as message,
       (SELECT COUNT(*) FROM franchisor_profiles) as franchisors,
       (SELECT COUNT(*) FROM franchises) as franchises,
       (SELECT COUNT(*) FROM buyer_profiles) as buyers,
       (SELECT COUNT(*) FROM lender_profiles) as lenders,
       (SELECT COUNT(*) FROM leads) as leads,
       (SELECT COUNT(*) FROM engagement_events) as engagement_events,
       (SELECT COUNT(*) FROM pre_approval_requests) as pre_approval_requests,
       (SELECT COUNT(*) FROM closed_deals) as closed_deals;
