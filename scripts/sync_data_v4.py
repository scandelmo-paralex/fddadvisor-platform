import json
import os
from urllib import request, parse, error

PROD_URL = os.environ.get('SUPABASE_URL', '').rstrip('/')
PROD_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
STAGING_URL = os.environ.get('SUPABASE_URL_STAGING', '').rstrip('/')
STAGING_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY_STAGING', '')

def make_request(url, method='GET', data=None, headers=None):
    """Make HTTP request with proper error handling"""
    if headers is None:
        headers = {}
    
    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    
    req = request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        response = request.urlopen(req)
        body = response.read().decode('utf-8')
        if body:
            return response.status, json.loads(body)
        return response.status, None
    except error.HTTPError as e:
        body = e.read().decode('utf-8')
        if body:
            try:
                return e.code, json.loads(body)
            except:
                return e.code, {'error': body}
        return e.code, {'error': str(e)}

def get_prod_headers():
    return {
        'apikey': PROD_KEY,
        'Authorization': f'Bearer {PROD_KEY}',
    }

def get_staging_headers():
    return {
        'apikey': STAGING_KEY,
        'Authorization': f'Bearer {STAGING_KEY}',
        'Prefer': 'return=minimal'
    }

# Tables to sync in order (respecting foreign keys)
TABLES = [
    'franchises',
    'buyer_profiles', 
    'franchisor_profiles',
    'franchisor_users',
    'fdds',
    'leads',
    'lead_invitations',
    'lead_fdd_access',
    'fdd_buyer_consents',
    'fdd_buyer_invitations',
    'fdd_engagements',
    'fdd_franchisescore_consents',
    'fdd_item_page_mappings',
    'fdd_question_answers',
    'fdd_search_queries',
    'engagement_events',
    'shared_access',
    'notifications',
    'white_label_settings',
    'closed_deals',
    'lender_profiles',
    'user_notes',
]

# Skip fdd_chunks due to vector dimension mismatch

print("=" * 60)
print("PRODUCTION TO STAGING DATA SYNC v4")
print("=" * 60)
print(f"\nProduction: {PROD_URL}")
print(f"Staging: {STAGING_URL}")

print("\n--- Syncing public tables ---")

total_synced = 0
for table in TABLES:
    # Fetch from production
    url = f"{PROD_URL}/rest/v1/{table}?select=*"
    status, data = make_request(url, headers=get_prod_headers())
    
    if status != 200 or not data:
        print(f"  {table}: No data or error fetching (status {status})")
        continue
    
    rows = data if isinstance(data, list) else []
    if not rows:
        print(f"  {table}: 0 rows")
        continue
    
    # Clear staging table first
    delete_url = f"{STAGING_URL}/rest/v1/{table}?id=not.is.null"
    del_status, _ = make_request(delete_url, method='DELETE', headers=get_staging_headers())
    
    # Insert into staging in batches
    batch_size = 100
    inserted = 0
    errors = []
    
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        insert_url = f"{STAGING_URL}/rest/v1/{table}"
        ins_status, ins_data = make_request(insert_url, method='POST', data=batch, headers=get_staging_headers())
        
        if ins_status in [200, 201]:
            inserted += len(batch)
        else:
            error_msg = ins_data.get('message', str(ins_data)) if ins_data else f'Status {ins_status}'
            errors.append(error_msg)
    
    if errors:
        print(f"  {table}: {len(rows)} fetched, {inserted} inserted, ERRORS: {errors[0][:80]}")
    else:
        print(f"  {table}: {len(rows)} fetched, {inserted} inserted")
        total_synced += inserted

print(f"\n--- Complete: {total_synced} total rows synced ---")
print("\nNote: fdd_chunks skipped due to vector dimension mismatch")
print("Note: Auth users were created in previous run")
