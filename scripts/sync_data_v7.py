import os
import json
import urllib.request
import urllib.error

# Environment variables
PROD_URL = os.environ.get('SUPABASE_URL')
PROD_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
STAGING_URL = os.environ.get('SUPABASE_URL_STAGING')
STAGING_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY_STAGING')

if not all([PROD_URL, PROD_KEY, STAGING_URL, STAGING_KEY]):
    print("ERROR: Missing environment variables")
    print(f"  SUPABASE_URL: {'SET' if PROD_URL else 'MISSING'}")
    print(f"  SUPABASE_SERVICE_ROLE_KEY: {'SET' if PROD_KEY else 'MISSING'}")
    print(f"  SUPABASE_URL_STAGING: {'SET' if STAGING_URL else 'MISSING'}")
    print(f"  SUPABASE_SERVICE_ROLE_KEY_STAGING: {'SET' if STAGING_KEY else 'MISSING'}")
    exit(1)

def make_request(url, headers, method='GET', data=None):
    """Make HTTP request and return response"""
    req = urllib.request.Request(url, headers=headers, method=method)
    if data:
        req.data = json.dumps(data).encode('utf-8')
    try:
        with urllib.request.urlopen(req) as response:
            body = response.read().decode('utf-8')
            if body:
                return json.loads(body), response.status
            return [], response.status
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        return body, e.code

def get_auth_users(base_url, key):
    """Get all auth users via Admin API"""
    url = f"{base_url}/auth/v1/admin/users"
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }
    result, status = make_request(url, headers)
    if status == 200 and isinstance(result, dict):
        return result.get('users', [])
    return []

def delete_auth_user(base_url, key, user_id):
    """Delete an auth user"""
    url = f"{base_url}/auth/v1/admin/users/{user_id}"
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }
    result, status = make_request(url, headers, method='DELETE')
    return status in [200, 204]

def create_auth_user(base_url, key, email, user_id):
    """Create auth user with specific UUID"""
    url = f"{base_url}/auth/v1/admin/users"
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }
    data = {
        'email': email,
        'password': 'TempPassword123!',
        'email_confirm': True,
        'user_metadata': {'synced_from_production': True},
        'id': user_id  # Try to set the UUID
    }
    result, status = make_request(url, headers, method='POST', data=data)
    return result, status

def fetch_table(base_url, key, table, select='*'):
    """Fetch all rows from a table"""
    url = f"{base_url}/rest/v1/{table}?select={select}"
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }
    result, status = make_request(url, headers)
    if status == 200 and isinstance(result, list):
        return result
    return []

def clear_table(base_url, key, table):
    """Delete all rows from a table"""
    url = f"{base_url}/rest/v1/{table}?id=neq.00000000-0000-0000-0000-000000000000"
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }
    result, status = make_request(url, headers, method='DELETE')
    return status in [200, 204]

def insert_rows(base_url, key, table, rows):
    """Insert rows into a table"""
    if not rows:
        return 0, None
    
    url = f"{base_url}/rest/v1/{table}"
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal,resolution=ignore-duplicates'
    }
    result, status = make_request(url, headers, method='POST', data=rows)
    if status in [200, 201]:
        return len(rows), None
    return 0, result

print("=" * 60)
print("PRODUCTION TO STAGING DATA SYNC v7 (Fixed Order)")
print("=" * 60)
print(f"\nProduction: {PROD_URL}")
print(f"Staging: {STAGING_URL}")

# Step 1: Get production users
print("\n--- Step 1: Fetching production auth users ---")
prod_users = get_auth_users(PROD_URL, PROD_KEY)
print(f"Found {len(prod_users)} users in production")
for u in prod_users:
    print(f"  {u.get('email')}: {u.get('id')}")

# Step 2: Delete all staging users and recreate with same UUIDs
print("\n--- Step 2: Recreating staging users with production UUIDs ---")
staging_users = get_auth_users(STAGING_URL, STAGING_KEY)
print(f"Found {len(staging_users)} existing users in staging")

# Delete existing staging users
for user in staging_users:
    delete_auth_user(STAGING_URL, STAGING_KEY, user['id'])
    print(f"  Deleted: {user.get('email')}")

# Create users with production UUIDs
uuid_mapping = {}
for user in prod_users:
    email = user.get('email')
    prod_id = user.get('id')
    result, status = create_auth_user(STAGING_URL, STAGING_KEY, email, prod_id)
    
    if status in [200, 201] and isinstance(result, dict):
        new_id = result.get('id')
        uuid_mapping[prod_id] = new_id
        if prod_id == new_id:
            print(f"  Created {email}: {prod_id} (UUID preserved!)")
        else:
            print(f"  Created {email}: {prod_id} -> {new_id} (UUID changed)")
    else:
        print(f"  Failed to create {email}: {result}")

# Verify users exist
print("\n--- Step 3: Verifying staging users ---")
staging_users = get_auth_users(STAGING_URL, STAGING_KEY)
staging_user_ids = {u['id'] for u in staging_users}
print(f"Staging now has {len(staging_users)} users")
for u in staging_users:
    print(f"  {u.get('email')}: {u.get('id')}")

# Step 4: Clear all staging tables in reverse dependency order
print("\n--- Step 4: Clearing staging tables ---")
tables_to_clear = [
    'fdd_chunks', 'fdd_item_page_mappings', 'fdd_question_answers',
    'fdd_search_queries', 'fdd_engagements', 'fdd_buyer_consents',
    'fdd_franchisescore_consents', 'fdd_buyer_invitations',
    'engagement_events', 'notifications', 'user_notes',
    'lead_fdd_access', 'lead_invitations', 'leads', 'closed_deals',
    'shared_access', 'fdds', 'franchises', 'franchisor_users',
    'franchisor_profiles', 'buyer_profiles', 'white_label_settings', 'lender_profiles'
]
for table in tables_to_clear:
    if clear_table(STAGING_URL, STAGING_KEY, table):
        print(f"  Cleared {table}")
    else:
        print(f"  Failed to clear {table}")

def map_uuids(rows, uuid_mapping, fields):
    """Replace production UUIDs with staging UUIDs in specified fields"""
    mapped = []
    for row in rows:
        new_row = row.copy()
        for field in fields:
            if field in new_row and new_row[field]:
                old_id = new_row[field]
                if old_id in uuid_mapping:
                    new_row[field] = uuid_mapping[old_id]
        mapped.append(new_row)
    return mapped

def sync_table(table, uuid_fields=None, skip_columns=None):
    """Sync a single table from production to staging"""
    rows = fetch_table(PROD_URL, PROD_KEY, table)
    if not rows:
        print(f"  {table}: No data")
        return 0
    
    # Remove skipped columns
    if skip_columns:
        for row in rows:
            for col in skip_columns:
                row.pop(col, None)
    
    # Map UUIDs if needed
    if uuid_fields and uuid_mapping:
        rows = map_uuids(rows, uuid_mapping, uuid_fields)
    
    count, error = insert_rows(STAGING_URL, STAGING_KEY, table, rows)
    if error:
        print(f"  {table}: FAILED - {error[:100]}")
        return 0
    print(f"  {table}: {count} rows synced")
    return count

total = 0

# Step 5: Sync profiles first (depend on auth.users)
print("\n--- Step 5: Syncing user profiles ---")
total += sync_table('buyer_profiles', ['user_id'])
total += sync_table('franchisor_profiles', ['user_id'])
total += sync_table('lender_profiles', ['user_id'])

# Step 6: Sync franchisor_users (depends on franchisor_profiles)
print("\n--- Step 6: Syncing franchisor_users ---")
total += sync_table('franchisor_users', ['user_id'])

# Step 7: Sync franchises (depends on franchisor_profiles via franchisor_id)
print("\n--- Step 7: Syncing franchises ---")
# Note: franchisor_id references franchisor_profiles.id, not auth.users
total += sync_table('franchises')

# Step 8: Sync FDDs (depends on franchises)
print("\n--- Step 8: Syncing fdds ---")
total += sync_table('fdds')

# Step 9: Sync leads and lead-related
print("\n--- Step 9: Syncing leads ---")
total += sync_table('leads', ['buyer_id'])
total += sync_table('lead_invitations', ['buyer_id'])
total += sync_table('lead_fdd_access', ['buyer_id'])

# Step 10: Sync FDD-related tables
print("\n--- Step 10: Syncing FDD-related tables ---")
total += sync_table('fdd_item_page_mappings')
total += sync_table('fdd_question_answers')
total += sync_table('fdd_search_queries', ['user_id'])
total += sync_table('fdd_engagements', ['user_id'])
total += sync_table('fdd_buyer_consents', ['user_id'])
total += sync_table('fdd_franchisescore_consents', ['user_id'])
total += sync_table('fdd_buyer_invitations', ['buyer_id'])

# Step 11: Sync fdd_chunks (skip embeddings due to dimension mismatch)
print("\n--- Step 11: Syncing fdd_chunks (without embeddings) ---")
total += sync_table('fdd_chunks', skip_columns=['embedding'])

# Step 12: Sync remaining tables
print("\n--- Step 12: Syncing remaining tables ---")
total += sync_table('engagement_events', ['user_id'])
total += sync_table('notifications', ['user_id'])
total += sync_table('user_notes', ['user_id'])
total += sync_table('shared_access', ['user_id'])
total += sync_table('closed_deals', ['buyer_id'])
total += sync_table('white_label_settings')

print(f"\n--- Complete: {total} total rows synced ---")
print("\nNote: Users in staging have temporary password 'TempPassword123!'")
print("You may need to reset passwords via Supabase dashboard.")
