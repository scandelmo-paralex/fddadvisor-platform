import os
import json
import urllib.request
import urllib.error

# Environment variables
PROD_URL = os.environ.get('SUPABASE_URL')
PROD_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
STAGING_URL = os.environ.get('SUPABASE_URL_STAGING')
STAGING_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY_STAGING')

print("=" * 60)
print("PRODUCTION TO STAGING DATA SYNC v5 (UUID Preserving)")
print("=" * 60)
print(f"\nProduction: {PROD_URL}")
print(f"Staging: {STAGING_URL}")

def api_request(url, key, method="GET", data=None):
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    body = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            text = response.read().decode('utf-8')
            return response.status, json.loads(text) if text else []
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        return e.code, error_body

def auth_request(url, key, method="GET", data=None):
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }
    
    body = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            text = response.read().decode('utf-8')
            return response.status, json.loads(text) if text else {}
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        return e.code, error_body

# Step 1: Get production auth users
print("\n--- Step 1: Fetching production auth users ---")
status, prod_users = auth_request(f"{PROD_URL}/auth/v1/admin/users", PROD_KEY)
if status != 200:
    print(f"Failed to fetch production users: {prod_users}")
    exit(1)

users_list = prod_users.get('users', [])
print(f"Found {len(users_list)} users in production")

# Step 2: Delete existing staging auth users
print("\n--- Step 2: Clearing staging auth users ---")
status, staging_users = auth_request(f"{STAGING_URL}/auth/v1/admin/users", STAGING_KEY)
if status == 200:
    staging_list = staging_users.get('users', [])
    for user in staging_list:
        uid = user['id']
        del_status, _ = auth_request(f"{STAGING_URL}/auth/v1/admin/users/{uid}", STAGING_KEY, "DELETE")
        print(f"  Deleted user {user.get('email', uid)}: {del_status}")

# Step 3: Create users in staging with SAME UUIDs
print("\n--- Step 3: Creating users with preserved UUIDs ---")
for user in users_list:
    user_data = {
        "id": user['id'],  # Preserve the UUID!
        "email": user.get('email'),
        "email_confirm": True,
        "password": "TempPassword123!",  # Temporary password
        "user_metadata": user.get('user_metadata', {}),
        "app_metadata": user.get('app_metadata', {})
    }
    
    status, result = auth_request(f"{STAGING_URL}/auth/v1/admin/users", STAGING_KEY, "POST", user_data)
    if status in [200, 201]:
        print(f"  Created: {user.get('email')} with UUID {user['id'][:8]}...")
    else:
        print(f"  Failed: {user.get('email')} - {result}")

# Step 4: Clear and sync public tables
print("\n--- Step 4: Syncing public tables ---")

# Tables in foreign key dependency order
tables = [
    "franchises",
    "buyer_profiles",
    "franchisor_profiles",
    "franchisor_users",
    "fdds",
    "leads",
    "lead_invitations",
    "lead_fdd_access",
    "fdd_buyer_consents",
    "fdd_buyer_invitations",
    "fdd_engagements",
    "fdd_franchisescore_consents",
    "fdd_item_page_mappings",
    "fdd_question_answers",
    "fdd_search_queries",
    "engagement_events",
    "shared_access",
    "notifications",
    "white_label_settings",
    "closed_deals",
    "lender_profiles",
    "user_notes"
]

# Columns to skip per table
skip_columns = {
    "fdd_chunks": ["embedding"]  # Vector dimension mismatch
}

total_synced = 0

for table in tables:
    # Fetch from production
    prod_status, prod_data = api_request(f"{PROD_URL}/rest/v1/{table}?select=*", PROD_KEY)
    
    if prod_status != 200 or not prod_data:
        print(f"  {table}: No data")
        continue
    
    # Clear staging table
    api_request(f"{STAGING_URL}/rest/v1/{table}?id=not.is.null", STAGING_KEY, "DELETE")
    
    # Filter columns if needed
    if table in skip_columns:
        for row in prod_data:
            for col in skip_columns[table]:
                row.pop(col, None)
    
    # Insert to staging
    insert_status, insert_result = api_request(f"{STAGING_URL}/rest/v1/{table}", STAGING_KEY, "POST", prod_data)
    
    if insert_status in [200, 201]:
        count = len(insert_result) if isinstance(insert_result, list) else len(prod_data)
        print(f"  {table}: {count} rows synced")
        total_synced += count
    else:
        error_msg = insert_result[:100] if isinstance(insert_result, str) else str(insert_result)[:100]
        print(f"  {table}: {len(prod_data)} fetched, FAILED - {error_msg}")

# Step 5: Sync fdd_chunks without embedding
print("\n--- Step 5: Syncing fdd_chunks (without embeddings) ---")
prod_status, chunks = api_request(f"{PROD_URL}/rest/v1/fdd_chunks?select=*", PROD_KEY)
if prod_status == 200 and chunks:
    # Remove embedding column
    for chunk in chunks:
        chunk.pop('embedding', None)
    
    # Clear and insert
    api_request(f"{STAGING_URL}/rest/v1/fdd_chunks?id=not.is.null", STAGING_KEY, "DELETE")
    insert_status, result = api_request(f"{STAGING_URL}/rest/v1/fdd_chunks", STAGING_KEY, "POST", chunks)
    
    if insert_status in [200, 201]:
        print(f"  fdd_chunks: {len(chunks)} rows synced (without embeddings)")
        total_synced += len(chunks)
    else:
        print(f"  fdd_chunks: FAILED - {str(result)[:100]}")

print(f"\n--- Complete: {total_synced} total rows synced ---")
print("\nNote: Users created with temporary password 'TempPassword123!'")
print("You may need to reset passwords for test accounts.")
