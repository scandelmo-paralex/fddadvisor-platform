-- Verify Bob Smith's engagement data was inserted correctly

-- Check if Bob's buyer profile exists
SELECT 
  'Bob Buyer Profile' as check_type,
  id as buyer_id,
  email,
  first_name,
  last_name
FROM buyer_profiles
WHERE email = 'bob.smith@example.com';

-- Check if Drybar franchise exists
SELECT 
  'Drybar Franchise' as check_type,
  id as franchise_id,
  name,
  slug
FROM franchises
WHERE slug = 'drybar';

-- Check Bob's engagement records
SELECT 
  'Bob Engagements' as check_type,
  id,
  buyer_id,
  franchise_id,
  franchise_slug,
  time_spent,
  questions_asked,
  array_length(sections_viewed, 1) as sections_viewed_count,
  array_length(items_viewed, 1) as items_viewed_count,
  viewed_fdd,
  viewed_item19,
  viewed_item7,
  spent_significant_time,
  last_activity,
  created_at
FROM fdd_engagements
WHERE buyer_id IN (
  SELECT id FROM buyer_profiles WHERE email = 'bob.smith@example.com'
)
AND franchise_id IN (
  SELECT id FROM franchises WHERE slug = 'drybar'
)
ORDER BY last_activity DESC;

-- Summary
SELECT 
  'Summary' as check_type,
  COUNT(*) as total_engagement_records,
  SUM(time_spent) as total_seconds,
  ROUND(SUM(time_spent) / 60.0) as total_minutes,
  SUM(questions_asked) as total_questions
FROM fdd_engagements
WHERE buyer_id IN (
  SELECT id FROM buyer_profiles WHERE email = 'bob.smith@example.com'
)
AND franchise_id IN (
  SELECT id FROM franchises WHERE slug = 'drybar'
);
