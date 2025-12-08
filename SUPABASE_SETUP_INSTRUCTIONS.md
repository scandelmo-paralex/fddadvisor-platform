# How to Run SQL Script in Supabase

Since the v0 SQL runner isn't working for you, follow these steps to run the script directly in Supabase:

## Steps:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query" button

3. **Copy and Paste the Script**
   - Open the file `scripts/RUN_IN_SUPABASE.sql` from this project
   - Copy the ENTIRE contents
   - Paste into the Supabase SQL Editor

4. **Run the Script**
   - Click the "Run" button (or press Cmd/Ctrl + Enter)
   - Wait for it to complete (should take 2-3 seconds)

5. **Verify Success**
   - You should see a success message at the bottom
   - The query results will show 4 franchises:
     - KFC Non-Traditional (360)
     - 7-Eleven (320)
     - Burger King (312)
     - McDonald's (268)

6. **Refresh Your App**
   - Go back to your FDD Advisor app at /discover
   - Refresh the page
   - You should now see all 4 franchises!

## What This Script Does:

1. ✅ Drops any existing franchises table
2. ✅ Creates a new franchises table with ALL necessary columns
3. ✅ Creates indexes for better performance
4. ✅ Inserts 4 franchises with complete data:
   - Burger King
   - 7-Eleven
   - McDonald's
   - KFC Non-Traditional
5. ✅ Verifies the data was inserted correctly

## Troubleshooting:

- **Error: "permission denied"** - Make sure you're logged into the correct Supabase project
- **Error: "relation already exists"** - The script handles this with DROP TABLE IF EXISTS
- **No data showing in app** - Clear your browser cache and refresh

## After Running:

All 4 franchises will appear on your /discover page with:
- ✅ Correct FranchiseScores
- ✅ Investment ranges
- ✅ Unit counts
- ✅ Opportunities and Concerns
- ✅ State distribution data
- ✅ Proper handling of missing Item 19 data
