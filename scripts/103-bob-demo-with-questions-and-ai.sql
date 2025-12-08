-- Clean up Bob's existing engagement data (try both email formats)
DELETE FROM fdd_engagements 
WHERE buyer_id IN (
  SELECT id FROM buyer_profiles 
  WHERE email = 'spcandelmo@gmail.com'
);

-- Insert rich engagement data with actual questions for Bob Smith
DO $$
DECLARE
  v_buyer_id UUID;
  v_franchise_id UUID;
  v_access_id UUID;
  -- Added v_franchise_slug variable
  v_franchise_slug TEXT;
BEGIN
  -- Get Bob's IDs (try both email formats)
  SELECT id INTO v_buyer_id 
  FROM buyer_profiles 
  WHERE email = 'spcandelmo@gmail.com'
  LIMIT 1;
  
  -- Also get franchise slug
  SELECT id, slug INTO v_franchise_id, v_franchise_slug FROM franchises WHERE slug = 'drybar';
  
  IF v_buyer_id IS NOT NULL AND v_franchise_id IS NOT NULL THEN
    SELECT id INTO v_access_id 
    FROM lead_fdd_access 
    WHERE buyer_id = v_buyer_id AND franchise_id = v_franchise_id 
    LIMIT 1;
  END IF;

  IF v_buyer_id IS NULL THEN
    RAISE NOTICE 'Bob Smith buyer profile not found - skipping engagement data';
    RETURN;
  END IF;

  IF v_franchise_id IS NULL THEN
    RAISE NOTICE 'Drybar franchise not found - skipping engagement data';
    RETURN;
  END IF;

  RAISE NOTICE 'Bob buyer_id: %', v_buyer_id;
  RAISE NOTICE 'Drybar franchise_id: %', v_franchise_id;
  RAISE NOTICE 'Access ID: %', v_access_id;

  -- Session 1: Nov 13, 2025 - Initial deep dive (65 minutes)
  -- Questions asked: "What's the average revenue for Item 19?", "How much is the initial franchise fee?", 
  -- "What ongoing fees should I expect?", "What territory is available in California?"
  INSERT INTO fdd_engagements (
    buyer_id,
    franchise_id,
    franchise_slug,
    time_spent,
    questions_asked,
    sections_viewed,
    items_viewed,
    viewed_fdd,
    viewed_item19,
    viewed_item7,
    spent_significant_time,
    created_at,
    last_activity
  ) VALUES (
    v_buyer_id,
    v_franchise_id,
    v_franchise_slug,
    3900, -- 65 minutes
    4, -- 4 questions in this session
    ARRAY['Item 19 - Financial Performance', 'Item 7 - Initial Investment', 'Item 6 - Other Fees', 'Item 12 - Territory']::TEXT[],
    ARRAY['item_19', 'item_7', 'item_6', 'item_12']::TEXT[],
    true,
    true,
    true,
    true,
    '2025-11-13 14:30:00'::timestamp,
    '2025-11-13 15:35:00'::timestamp
  );

  -- Session 2: Nov 14, 2025 - Territory and support focus (45 minutes)
  -- Questions asked: "What training is provided?", "Can I get exclusive territory in San Diego?", 
  -- "What are my ongoing obligations?"
  INSERT INTO fdd_engagements (
    buyer_id,
    franchise_id,
    franchise_slug,
    time_spent,
    questions_asked,
    sections_viewed,
    items_viewed,
    viewed_fdd,
    viewed_item19,
    spent_significant_time,
    created_at,
    last_activity
  ) VALUES (
    v_buyer_id,
    v_franchise_id,
    v_franchise_slug,
    2700, -- 45 minutes
    3, -- 3 questions in this session
    ARRAY['Item 11 - Training', 'Item 12 - Territory', 'Item 15 - Obligations']::TEXT[],
    ARRAY['item_11', 'item_12', 'item_15']::TEXT[],
    true,
    true,
    true,
    '2025-11-14 10:15:00'::timestamp,
    '2025-11-14 11:00:00'::timestamp
  );

  -- Session 3: Nov 15, 2025 - Financial deep dive (50 minutes)
  -- Questions asked: "What's the ROI timeline?", "How does Drybar compare to competitors?", 
  -- "What percentage of outlets are profitable?", "What support do I get for marketing?"
  INSERT INTO fdd_engagements (
    buyer_id,
    franchise_id,
    franchise_slug,
    time_spent,
    questions_asked,
    sections_viewed,
    items_viewed,
    viewed_fdd,
    viewed_item19,
    viewed_item7,
    spent_significant_time,
    created_at,
    last_activity
  ) VALUES (
    v_buyer_id,
    v_franchise_id,
    v_franchise_slug,
    3000, -- 50 minutes  
    4, -- 4 questions in this session
    ARRAY['Item 19 - Financial Performance', 'Item 7 - Initial Investment', 'Item 20 - Outlets']::TEXT[],
    ARRAY['item_19', 'item_7', 'item_20']::TEXT[],
    true,
    true,
    true,
    true,
    '2025-11-15 16:45:00'::timestamp,
    '2025-11-15 17:45:00'::timestamp
  );

  RAISE NOTICE 'Successfully created 3 engagement sessions for Bob';
  RAISE NOTICE 'Total time: ~3 hours across 3 days';
  RAISE NOTICE 'Total questions asked: 11';
  RAISE NOTICE 'Questions topics: Financials, Territory, Training, Support, ROI';
  
END $$;

-- Verify the data
SELECT 
  bp.email,
  COUNT(fe.*) as session_count,
  SUM(fe.time_spent) as total_seconds,
  ROUND(SUM(fe.time_spent) / 60.0) as total_minutes,
  SUM(fe.questions_asked) as total_questions,
  BOOL_OR(fe.viewed_item19) as viewed_item19,
  BOOL_OR(fe.viewed_item7) as viewed_item7
FROM fdd_engagements fe
JOIN buyer_profiles bp ON fe.buyer_id = bp.id
WHERE bp.email = 'spcandelmo@gmail.com'
  AND fe.franchise_id = (SELECT id FROM franchises WHERE slug = 'drybar')
GROUP BY bp.email;
