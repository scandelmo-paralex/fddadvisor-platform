/**
 * Run this script to sync production data to staging
 */

import { createClient } from '@supabase/supabase-js';

// Production Supabase
const PROD_URL = process.env.SUPABASE_URL || 'https://utunvzekehobtyncpcza.supabase.co';
const PROD_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Staging Supabase  
const STAGING_URL = process.env.SUPABASE_URL_STAGING || 'https://yqiaqhuhxalflukhtpmd.supabase.co';
const STAGING_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY_STAGING;

console.log('[v0] Checking environment variables...');
console.log('[v0] PROD_URL:', PROD_URL);
console.log('[v0] STAGING_URL:', STAGING_URL);
console.log('[v0] PROD_SERVICE_KEY exists:', !!PROD_SERVICE_KEY);
console.log('[v0] STAGING_SERVICE_KEY exists:', !!STAGING_SERVICE_KEY);

if (!PROD_SERVICE_KEY || !STAGING_SERVICE_KEY) {
  console.error('[v0] Missing environment variables');
  process.exit(1);
}

const prodClient = createClient(PROD_URL, PROD_SERVICE_KEY);
const stagingClient = createClient(STAGING_URL, STAGING_SERVICE_KEY);

// Tables in dependency order
const TABLES_IN_ORDER = [
  'franchises',
  'engagement_events',
  'fdds',
  'franchisor_profiles',
  'franchisor_users',
  'leads',
  'white_label_settings',
  'buyer_profiles',
  'lender_profiles',
  'fdd_chunks',
  'fdd_item_page_mappings',
  'lead_invitations',
  'shared_access',
  'closed_deals',
  'fdd_buyer_consents',
  'fdd_buyer_invitations',
  'fdd_engagements',
  'fdd_franchisescore_consents',
  'fdd_question_answers',
  'fdd_search_queries',
  'lead_fdd_access',
  'user_notes',
  'notifications',
];

async function syncTable(table) {
  console.log(`\n[v0] Syncing: ${table}`);
  
  // Fetch from production
  const { data: rows, error: fetchError } = await prodClient
    .from(table)
    .select('*');
  
  if (fetchError) {
    console.log(`[v0] Error fetching ${table}:`, fetchError.message);
    return;
  }
  
  console.log(`[v0] Production rows: ${rows?.length || 0}`);
  
  if (!rows || rows.length === 0) {
    console.log(`[v0] Skipping - no data`);
    return;
  }
  
  // Clear staging table
  const { error: deleteError } = await stagingClient
    .from(table)
    .delete()
    .gte('created_at', '1970-01-01');
  
  if (deleteError) {
    console.log(`[v0] Warning clearing ${table}:`, deleteError.message);
  }
  
  // Insert into staging (batch by 100)
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const { error: insertError } = await stagingClient
      .from(table)
      .upsert(batch, { onConflict: 'id' });
    
    if (insertError) {
      console.log(`[v0] Error inserting ${table}:`, insertError.message);
    } else {
      inserted += batch.length;
    }
  }
  
  console.log(`[v0] Inserted: ${inserted} rows`);
}

async function main() {
  console.log('[v0] ========================================');
  console.log('[v0] Starting Production to Staging Sync');
  console.log('[v0] ========================================');
  
  for (const table of TABLES_IN_ORDER) {
    await syncTable(table);
  }
  
  console.log('\n[v0] ========================================');
  console.log('[v0] Sync Complete!');
  console.log('[v0] ========================================');
}

main().catch(err => console.error('[v0] Fatal error:', err));
