-- Create rich Lead Intelligence Report data for Bob Smith for demo
-- This adds engagement data to make Bob appear as a high-quality, engaged lead

-- First, let's get Bob's buyer_id and the Drybar franchise_id
DO $$
DECLARE
  bob_buyer_id UUID;
  drybar_franchise_id UUID;
BEGIN
  -- Get Bob's buyer profile ID
  SELECT id INTO bob_buyer_id
  FROM buyer_profiles
  WHERE email = 'bob.smith@example.com'
  LIMIT 1;

  -- Get Drybar franchise ID
  SELECT id INTO drybar_franchise_id
  FROM franchises
  WHERE slug = 'drybar'
  LIMIT 1;

  IF bob_buyer_id IS NULL THEN
    RAISE NOTICE 'Bob Smith buyer profile not found';
    RETURN;
  END IF;

  IF drybar_franchise_id IS NULL THEN
    RAISE NOTICE 'Drybar franchise not found';
    RETURN;
  END IF;

  RAISE NOTICE 'Bob buyer_id: %', bob_buyer_id;
  RAISE NOTICE 'Drybar franchise_id: %', drybar_franchise_id;

  -- Delete existing engagement records for Bob to avoid duplicates
  DELETE FROM fdd_engagements
  WHERE buyer_id = bob_buyer_id
  AND franchise_id = drybar_franchise_id;

  -- Insert single comprehensive engagement record with rich data
  INSERT INTO fdd_engagements (
    buyer_id,
    franchise_id,
    franchise_slug,
    session_id,
    time_spent,
    questions_asked,
    sections_viewed,
    items_viewed,
    viewed_fdd,
    viewed_item19,
    viewed_item7,
    spent_significant_time,
    last_activity
  ) VALUES (
    bob_buyer_id,
    drybar_franchise_id,
    'drybar',
    'demo-session-' || gen_random_uuid()::text,
    10800, -- 3 hours total engagement (180 minutes)
    11, -- 11 questions asked
    ARRAY['Item 1: The Franchisor', 'Item 5: Initial Fees', 'Item 6: Other Fees', 'Item 7: Initial Investment', 'Item 11: Training', 'Item 12: Territory', 'Item 15: Obligations', 'Item 17: Renewal, Termination, Transfer', 'Item 19: Financial Performance', 'Item 20: Outlets & Information', 'Item 21: Financial Statements'],
    ARRAY['1', '5', '6', '7', '11', '12', '15', '17', '19', '20', '21'],
    TRUE, -- viewed FDD
    TRUE, -- viewed Item 19 (Financial Performance)
    TRUE, -- viewed Item 7 (Initial Investment)
    TRUE, -- spent significant time (3 hours)
    NOW() - INTERVAL '2 hours' -- Last activity 2 hours ago
  );

  RAISE NOTICE 'Successfully created rich engagement data for Bob Smith';
  RAISE NOTICE 'Total engagement time: 3 hours (10800 seconds)';
  RAISE NOTICE 'Total questions asked: 11';
  RAISE NOTICE 'Sections viewed: 11 unique FDD items';

END $$;
