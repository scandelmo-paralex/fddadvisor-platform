/**
 * Sync Production Data to Staging
 * 
 * This script copies all data from production Supabase to staging Supabase.
 * Tables are synced in dependency order to respect foreign key constraints.
 * 
 * Usage: Run this script from the Supabase SQL Editor or Node.js environment
 */

import { createClient } from '@supabase/supabase-js';

// Production Supabase
const PROD_URL = process.env.SUPABASE_URL || 'https://utunvzekehobtyncpcza.supabase.co';
const PROD_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Staging Supabase  
const STAGING_URL = process.env.SUPABASE_URL_STAGING || 'https://yqiaqhuhxalflukhtpmd.supabase.co';
const STAGING_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY_STAGING;

if (!PROD_SERVICE_KEY || !STAGING_SERVICE_KEY) {
  console.error('Missing environment variables:');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  console.error('- SUPABASE_SERVICE_ROLE_KEY_STAGING');
  process.exit(1);
}

const prodClient = createClient(PROD_URL, PROD_SERVICE_KEY);
const stagingClient = createClient(STAGING_URL, STAGING_SERVICE_KEY);

// Tables in dependency order (parents before children)
// Tier 1: No dependencies
// Tier 2+: Depends on previous tiers
const TABLES_IN_ORDER = [
  // Tier 1: No foreign key dependencies
  'franchises',
  'engagement_events',
  
  // Tier 2: Depends on franchises
  'fdds',
  'franchisor_profiles',
  'franchisor_users',
  'leads',
  'white_label_settings',
  
  // Tier 3: Depends on fdds or users
  'buyer_profiles',
  'lender_profiles',
  'fdd_chunks',
  'fdd_item_page_mappings',
  'lead_invitations',
  'shared_access',
  'closed_deals',
  
  // Tier 4: Depends on buyer_profiles, fdds
  'fdd_buyer_consents',
  'fdd_buyer_invitations',
  'fdd_engagements',
  'fdd_franchisescore_consents',
  'fdd_question_answers',
  'fdd_search_queries',
  'lead_fdd_access',
  'user_notes',
  
  // Tier 5: Depends on leads
  'notifications',
];

async function getTableCount(client, table) {
  const { count, error } = await client
    .from(table)
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    console.error(`  Error counting ${table}:`, error.message);
    return 0;
  }
  return count || 0;
}

async function fetchAllRows(client, table) {
  const { data, error } = await client
    .from(table)
    .select('*');
  
  if (error) {
    console.error(`  Error fetching ${table}:`, error.message);
    return [];
  }
  return data || [];
}

async function clearTable(client, table) {
  const { error } = await client
    .from(table)
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
  
  if (error) {
    // Try alternative delete method
    const { error: error2 } = await client
      .from(table)
      .delete()
      .gte('created_at', '1970-01-01');
    
    if (error2) {
      console.error(`  Warning: Could not clear ${table}:`, error2.message);
    }
  }
}

async function insertRows(client, table, rows) {
  if (rows.length === 0) return { success: 0, failed: 0 };
  
  // Insert in batches of 500
  const batchSize = 500;
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    
    const { error } = await client
      .from(table)
      .upsert(batch, { onConflict: 'id', ignoreDuplicates: false });
    
    if (error) {
      console.error(`  Error inserting batch into ${table}:`, error.message);
      failed += batch.length;
    } else {
      success += batch.length;
    }
  }
  
  return { success, failed };
}

async function syncTable(table) {
  console.log(`\nSyncing table: ${table}`);
  
  // Get counts
  const prodCount = await getTableCount(prodClient, table);
  const stagingCountBefore = await getTableCount(stagingClient, table);
  
  console.log(`  Production rows: ${prodCount}`);
  console.log(`  Staging rows (before): ${stagingCountBefore}`);
  
  if (prodCount === 0) {
    console.log(`  Skipping - no data in production`);
    return;
  }
  
  // Fetch all rows from production
  console.log(`  Fetching from production...`);
  const rows = await fetchAllRows(prodClient, table);
  
  if (rows.length === 0) {
    console.log(`  No rows fetched`);
    return;
  }
  
  // Clear staging table first (to handle updates/deletes)
  console.log(`  Clearing staging table...`);
  await clearTable(stagingClient, table);
  
  // Insert rows into staging
  console.log(`  Inserting ${rows.length} rows into staging...`);
  const { success, failed } = await insertRows(stagingClient, table, rows);
  
  const stagingCountAfter = await getTableCount(stagingClient, table);
  console.log(`  Staging rows (after): ${stagingCountAfter}`);
  console.log(`  Result: ${success} inserted, ${failed} failed`);
}

async function main() {
  console.log('='.repeat(50));
  console.log('Production to Staging Data Sync');
  console.log('='.repeat(50));
  console.log(`\nProduction: ${PROD_URL}`);
  console.log(`Staging: ${STAGING_URL}`);
  console.log(`\nTables to sync: ${TABLES_IN_ORDER.length}`);
  
  const startTime = Date.now();
  
  for (const table of TABLES_IN_ORDER) {
    await syncTable(table);
  }
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log('\n' + '='.repeat(50));
  console.log(`Sync complete in ${elapsed}s`);
  console.log('='.repeat(50));
}

main().catch(console.error);
