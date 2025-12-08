import os
import json
from urllib import request, error

# Configuration - uses v0 environment variables
PROD_URL = os.environ.get('SUPABASE_URL', '')
PROD_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
STAGING_URL = os.environ.get('SUPABASE_URL_STAGING', '')
STAGING_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY_STAGING', '')

# Tables in dependency order (foreign keys)
TABLES = [
    # Tier 1 - No dependencies
    'buyer_profiles',
    'franchises',
    'lender_profiles',
    # Tier 2
    'franchisor_profiles',
    'franchisor_users',
    # Tier 3
    'fdds',
    'leads',
    'lead_invitations',
    # Tier 4
    'fdd_buyer_consents',
    'fdd_buyer_invitations',
    'fdd_engagements',
    'fdd_franchisescore_consents',
    'lead_fdd_access',
    'closed_deals',
    # Tier 5
    'fdd_chunks',
    'fdd_item_page_mappings',
    'fdd_question_answers',
    'fdd_search_queries',
    'engagement_events',
    'shared_access',
    'notifications',
    'white_label_settings',
    'user_notes',
]

def supabase_request(url, key, endpoint, method='GET', data=None):
    """Make a request to Supabase REST API"""
    full_url = f"{url}/rest/v1/{endpoint}"
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal' if method == 'DELETE' else 'return=representation',
    }
    
    req_data = json.dumps(data).encode('utf-8') if data else None
    req = request.Request(full_url, data=req_data, headers=headers, method=method)
    
    try:
        with request.urlopen(req) as response:
            if method == 'DELETE':
                return []
            return json.loads(response.read().decode('utf-8'))
    except error.HTTPError as e:
        print(f"  Error: {e.code} - {e.read().decode('utf-8')}")
        return []

def fetch_all(url, key, table):
    """Fetch all rows from a table"""
    return supabase_request(url, key, f"{table}?select=*")

def delete_all(url, key, table):
    """Delete all rows from a table"""
    # Use a filter that matches all rows
    return supabase_request(url, key, f"{table}?id=neq.00000000-0000-0000-0000-000000000000", method='DELETE')

def insert_batch(url, key, table, rows):
    """Insert rows into a table"""
    if not rows:
        return []
    return supabase_request(url, key, table, method='POST', data=rows)

def main():
    print("=" * 50)
    print("PRODUCTION TO STAGING DATA SYNC")
    print("=" * 50)
    
    # Validate environment variables
    if not all([PROD_URL, PROD_KEY, STAGING_URL, STAGING_KEY]):
        print("\nMissing environment variables:")
        if not PROD_URL: print("  - SUPABASE_URL")
        if not PROD_KEY: print("  - SUPABASE_SERVICE_ROLE_KEY")
        if not STAGING_URL: print("  - SUPABASE_URL_STAGING")
        if not STAGING_KEY: print("  - SUPABASE_SERVICE_ROLE_KEY_STAGING")
        return
    
    print(f"\nProduction: {PROD_URL}")
    print(f"Staging: {STAGING_URL}")
    print("")
    
    total_rows = 0
    
    # Clear staging tables in reverse order (handle foreign keys)
    print("Clearing staging tables...")
    for table in reversed(TABLES):
        delete_all(STAGING_URL, STAGING_KEY, table)
        print(f"  Cleared: {table}")
    
    print("\nSyncing data...")
    
    # Sync each table
    for table in TABLES:
        rows = fetch_all(PROD_URL, PROD_KEY, table)
        count = len(rows)
        
        if count > 0:
            # Insert in batches of 100
            for i in range(0, count, 100):
                batch = rows[i:i+100]
                insert_batch(STAGING_URL, STAGING_KEY, table, batch)
        
        total_rows += count
        print(f"  {table}: {count} rows")
    
    print("")
    print("=" * 50)
    print(f"SYNC COMPLETE - {total_rows} total rows copied")
    print("=" * 50)

if __name__ == "__main__":
    main()
