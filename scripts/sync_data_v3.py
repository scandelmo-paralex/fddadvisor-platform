import os
import json
import urllib.request
import urllib.error

# Environment variables
PROD_URL = os.environ.get('SUPABASE_URL', '')
PROD_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
STAGING_URL = os.environ.get('SUPABASE_URL_STAGING', '')
STAGING_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY_STAGING', '')

def make_request(url, headers, method='GET', data=None):
    req = urllib.request.Request(url, headers=headers, method=method)
    if data:
        req.data = json.dumps(data).encode('utf-8')
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        return e.code, body

def get_headers(key, prefer=None):
    h = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }
    if prefer:
        h['Prefer'] = prefer
    return h

print("=" * 60)
print("PRODUCTION TO STAGING DATA SYNC v3")
print("=" * 60)
print(f"\nProduction: {PROD_URL}")
print(f"Staging: {STAGING_URL}")

# Step 1: Get auth users from production
print("\n--- Step 1: Fetching auth users from production ---")
status, prod_users = make_request(
    f"{PROD_URL}/auth/v1/admin/users",
    get_headers(PROD_KEY)
)
if status == 200:
    users = prod_users.get('users', [])
    print(f"  Found {len(users)} auth users")
    for u in users:
        print(f"    - {u.get('email')} ({u.get('id')})")
else:
    print(f"  ERROR fetching users: {status}")
    users = []

# Step 2: Create auth users in staging
print("\n--- Step 2: Creating auth users in staging ---")
for user in users:
    user_data = {
        'email': user.get('email'),
        'password': 'TempPassword123!',  # Temporary password
        'email_confirm': True,
        'user_metadata': user.get('user_metadata', {}),
        'app_metadata': user.get('app_metadata', {}),
        'id': user.get('id')  # Preserve the same UUID
    }
    
    # First try to delete if exists
    make_request(
        f"{STAGING_URL}/auth/v1/admin/users/{user.get('id')}",
        get_headers(STAGING_KEY),
        method='DELETE'
    )
    
    # Then create
    status, result = make_request(
        f"{STAGING_URL}/auth/v1/admin/users",
        get_headers(STAGING_KEY),
        method='POST',
        data=user_data
    )
    if status in [200, 201]:
        print(f"  Created: {user.get('email')}")
    else:
        print(f"  ERROR creating {user.get('email')}: {status} - {result}")

# Step 3: Sync public tables in correct order
print("\n--- Step 3: Syncing public tables ---")

# Tables in dependency order (no FK dependencies first)
TABLES = [
    'buyer_profiles',
    'lender_profiles', 
    'franchisor_profiles',
    'franchises',
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

total_fetched = 0
total_inserted = 0

for table in TABLES:
    # Clear staging table
    make_request(
        f"{STAGING_URL}/rest/v1/{table}?id=gte.00000000-0000-0000-0000-000000000000",
        get_headers(STAGING_KEY),
        method='DELETE'
    )
    
    # Fetch from production
    status, data = make_request(
        f"{PROD_URL}/rest/v1/{table}?select=*",
        get_headers(PROD_KEY)
    )
    
    if status == 404:
        print(f"  {table}: table not found, skipping")
        continue
    
    if status != 200 or not isinstance(data, list):
        print(f"  {table}: fetch error {status}")
        continue
    
    if len(data) == 0:
        print(f"  {table}: 0 rows (empty)")
        continue
    
    total_fetched += len(data)
    
    # For fdd_chunks, skip embedding column to avoid dimension mismatch
    if table == 'fdd_chunks':
        for row in data:
            if 'embedding' in row:
                del row['embedding']
    
    # Insert into staging in batches
    batch_size = 100
    inserted = 0
    for i in range(0, len(data), batch_size):
        batch = data[i:i+batch_size]
        status, result = make_request(
            f"{STAGING_URL}/rest/v1/{table}",
            get_headers(STAGING_KEY, 'return=minimal'),
            method='POST',
            data=batch
        )
        if status in [200, 201]:
            inserted += len(batch)
        else:
            print(f"    INSERT ERROR for {table}: {status}")
            if isinstance(result, str):
                print(f"    {result[:200]}")
            break
    
    total_inserted += inserted
    status_str = "OK" if inserted == len(data) else f"PARTIAL ({inserted}/{len(data)})"
    print(f"  {table}: {len(data)} fetched, {inserted} inserted - {status_str}")

print("\n" + "=" * 60)
print(f"COMPLETE: {total_fetched} fetched, {total_inserted} inserted")
print("=" * 60)

if total_inserted < total_fetched:
    print("\nNOTE: Some rows failed. Check the errors above.")
