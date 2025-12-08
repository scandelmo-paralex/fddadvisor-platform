import os
import json
from urllib import request, error

# Configuration
PROD_URL = os.environ.get('SUPABASE_URL', '')
PROD_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
STAGING_URL = os.environ.get('SUPABASE_URL_STAGING', '')
STAGING_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY_STAGING', '')

# Tables in dependency order
TABLES = [
    'buyer_profiles',
    'franchises',
    'lender_profiles',
    'franchisor_profiles',
    'franchisor_users',
    'fdds',
    'leads',
    'lead_invitations',
    'fdd_buyer_consents',
    'fdd_buyer_invitations',
    'fdd_engagements',
    'fdd_franchisescore_consents',
    'lead_fdd_access',
    'closed_deals',
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
        'Prefer': 'return=representation',
    }
    
    req_data = json.dumps(data).encode('utf-8') if data else None
    req = request.Request(full_url, data=req_data, headers=headers, method=method)
    
    try:
        with request.urlopen(req) as response:
            body = response.read().decode('utf-8')
            if body:
                return json.loads(body), None
            return [], None
    except error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        return [], f"{e.code}: {error_body}"

def fetch_all(url, key, table):
    """Fetch all rows from a table"""
    data, err = supabase_request(url, key, f"{table}?select=*")
    if err:
        print(f"    FETCH ERROR: {err}")
    return data

def delete_all(url, key, table):
    """Delete all rows using truncate via RPC or delete with broad filter"""
    # Try to delete all by matching any non-null id
    data, err = supabase_request(url, key, f"{table}?id=not.is.null", method='DELETE')
    if err and '404' not in err:
        print(f"    DELETE ERROR: {err}")
    return data

def insert_rows(url, key, table, rows):
    """Insert rows into a table with upsert"""
    if not rows:
        return 0
    
    # Use upsert to handle potential conflicts
    endpoint = f"{table}?on_conflict=id"
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation',
    }
    
    full_url = f"{url}/rest/v1/{endpoint}"
    req_data = json.dumps(rows).encode('utf-8')
    req = request.Request(full_url, data=req_data, headers=headers, method='POST')
    
    try:
        with request.urlopen(req) as response:
            body = response.read().decode('utf-8')
            result = json.loads(body) if body else []
            return len(result)
    except error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"    INSERT ERROR for {table}: {e.code}")
        print(f"    {error_body[:200]}")
        return 0

def main():
    print("=" * 50)
    print("PRODUCTION TO STAGING DATA SYNC v2")
    print("=" * 50)
    
    if not all([PROD_URL, PROD_KEY, STAGING_URL, STAGING_KEY]):
        print("\nMissing environment variables:")
        if not PROD_URL: print("  - SUPABASE_URL")
        if not PROD_KEY: print("  - SUPABASE_SERVICE_ROLE_KEY")
        if not STAGING_URL: print("  - SUPABASE_URL_STAGING")
        if not STAGING_KEY: print("  - SUPABASE_SERVICE_ROLE_KEY_STAGING")
        return
    
    print(f"\nProduction: {PROD_URL}")
    print(f"Staging: {STAGING_URL}")
    
    # First, disable RLS temporarily for inserts
    print("\n--- Clearing staging tables ---")
    for table in reversed(TABLES):
        delete_all(STAGING_URL, STAGING_KEY, table)
        print(f"  Cleared: {table}")
    
    print("\n--- Syncing data ---")
    total_fetched = 0
    total_inserted = 0
    
    for table in TABLES:
        rows = fetch_all(PROD_URL, PROD_KEY, table)
        fetched_count = len(rows)
        total_fetched += fetched_count
        
        if fetched_count > 0:
            # Insert in smaller batches
            inserted = 0
            batch_size = 50
            for i in range(0, fetched_count, batch_size):
                batch = rows[i:i+batch_size]
                inserted += insert_rows(STAGING_URL, STAGING_KEY, table, batch)
            total_inserted += inserted
            status = "OK" if inserted == fetched_count else f"PARTIAL ({inserted}/{fetched_count})"
            print(f"  {table}: {fetched_count} fetched, {inserted} inserted - {status}")
        else:
            print(f"  {table}: 0 rows (empty)")
    
    print("")
    print("=" * 50)
    print(f"COMPLETE: {total_fetched} fetched, {total_inserted} inserted")
    print("=" * 50)
    
    if total_inserted < total_fetched:
        print("\nWARNING: Some rows failed to insert. Check RLS policies.")
        print("The service_role key should bypass RLS, but verify the key is correct.")

if __name__ == "__main__":
    main()
