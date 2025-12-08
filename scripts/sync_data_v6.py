#!/usr/bin/env python3
"""
Sync data from production to staging with UUID mapping.
Maps production user UUIDs to staging user UUIDs by email.
Version 6 - With UUID mapping for foreign keys
"""

import os
import json
import urllib.request
import urllib.error

# Environment variables
PROD_URL = os.environ.get('SUPABASE_URL', '')
PROD_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
STAGING_URL = os.environ.get('SUPABASE_URL_STAGING', '')
STAGING_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY_STAGING', '')

def make_request(url, method='GET', data=None, headers=None):
    """Make HTTP request and return response."""
    if headers is None:
        headers = {}
    
    req_data = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            body = response.read().decode('utf-8')
            return response.status, body
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        return e.code, body

def get_auth_users(base_url, key):
    """Get all auth users."""
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }
    status, body = make_request(f'{base_url}/auth/v1/admin/users', headers=headers)
    if status == 200:
        data = json.loads(body)
        return data.get('users', [])
    return []

def fetch_table(base_url, key, table, select='*'):
    """Fetch all rows from a table."""
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }
    url = f'{base_url}/rest/v1/{table}?select={select}'
    status, body = make_request(url, headers=headers)
    if status == 200 and body:
        return json.loads(body)
    return []

def delete_table(base_url, key, table):
    """Delete all rows from a table."""
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }
    url = f'{base_url}/rest/v1/{table}?id=neq.00000000-0000-0000-0000-000000000000'
    status, body = make_request(url, method='DELETE', headers=headers)
    return status < 300

def insert_table(base_url, key, table, rows):
    """Insert rows into a table."""
    if not rows:
        return True, 0
    
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal,resolution=ignore-duplicates'
    }
    url = f'{base_url}/rest/v1/{table}'
    status, body = make_request(url, method='POST', data=rows, headers=headers)
    if status < 300:
        return True, len(rows)
    else:
        return False, body

def map_uuids(rows, uuid_map, fields):
    """Replace UUIDs in rows using the mapping."""
    mapped_rows = []
    for row in rows:
        new_row = row.copy()
        for field in fields:
            if field in new_row and new_row[field] in uuid_map:
                new_row[field] = uuid_map[new_row[field]]
        mapped_rows.append(new_row)
    return mapped_rows

def main():
    print("=" * 60)
    print("PRODUCTION TO STAGING DATA SYNC v6 (UUID Mapping)")
    print("=" * 60)
    print(f"\nProduction: {PROD_URL}")
    print(f"Staging: {STAGING_URL}")
    
    # Step 1: Get production users
    print("\n--- Step 1: Fetching production auth users ---")
    prod_users = get_auth_users(PROD_URL, PROD_KEY)
    print(f"Found {len(prod_users)} users in production")
    prod_user_map = {u['email']: u['id'] for u in prod_users}
    
    # Step 2: Get staging users
    print("\n--- Step 2: Fetching staging auth users ---")
    staging_users = get_auth_users(STAGING_URL, STAGING_KEY)
    print(f"Found {len(staging_users)} users in staging")
    staging_user_map = {u['email']: u['id'] for u in staging_users}
    
    # Step 3: Build UUID mapping (production UUID -> staging UUID)
    print("\n--- Step 3: Building UUID mapping ---")
    uuid_map = {}
    for email, prod_id in prod_user_map.items():
        if email in staging_user_map:
            staging_id = staging_user_map[email]
            uuid_map[prod_id] = staging_id
            print(f"  {email}: {prod_id[:8]}... -> {staging_id[:8]}...")
    
    if not uuid_map:
        print("ERROR: No UUID mappings found! Make sure users exist in staging.")
        return
    
    # Tables with user_id foreign key
    user_id_tables = [
        ('buyer_profiles', ['user_id']),
        ('franchisor_profiles', ['user_id']),
        ('franchisor_users', ['user_id']),
        ('fdd_engagements', ['user_id']),
        ('fdd_search_queries', ['user_id']),
        ('fdd_buyer_consents', ['user_id']),
        ('fdd_franchisescore_consents', ['user_id']),
        ('engagement_events', ['user_id']),
        ('notifications', ['user_id']),
        ('user_notes', ['user_id']),
    ]
    
    # Tables with franchisor_id (which is also a user UUID)
    franchisor_id_tables = [
        ('franchises', ['franchisor_id']),
        ('leads', ['franchisor_id', 'buyer_id']),
        ('lead_invitations', ['franchisor_id', 'buyer_id']),
        ('lead_fdd_access', ['franchisor_id', 'buyer_id']),
        ('shared_access', ['franchisor_id', 'shared_with_user_id']),
        ('closed_deals', ['franchisor_id', 'buyer_id']),
        ('white_label_settings', ['franchisor_id']),
    ]
    
    # Tables with franchise_id foreign key (need to sync franchises first)
    franchise_fk_tables = [
        'fdds',
        'fdd_buyer_invitations',
    ]
    
    # Tables with fdd_id foreign key (need to sync fdds first)
    fdd_fk_tables = [
        'fdd_chunks',
        'fdd_item_page_mappings',
        'fdd_question_answers',
    ]
    
    # Tables with no user FK
    standalone_tables = [
        'lender_profiles',
    ]
    
    total_synced = 0
    
    # Step 4: Clear staging tables (in reverse dependency order)
    print("\n--- Step 4: Clearing staging tables ---")
    all_tables = [
        'fdd_chunks', 'fdd_item_page_mappings', 'fdd_question_answers', 'fdd_search_queries',
        'fdd_engagements', 'fdd_buyer_consents', 'fdd_franchisescore_consents', 'fdd_buyer_invitations',
        'engagement_events', 'notifications', 'user_notes',
        'lead_fdd_access', 'lead_invitations', 'leads',
        'closed_deals', 'shared_access',
        'fdds', 'franchises',
        'franchisor_users', 'franchisor_profiles', 'buyer_profiles',
        'white_label_settings', 'lender_profiles'
    ]
    for table in all_tables:
        delete_table(STAGING_URL, STAGING_KEY, table)
        print(f"  Cleared {table}")
    
    # Step 5: Sync franchises first (has franchisor_id -> user UUID)
    print("\n--- Step 5: Syncing franchises ---")
    rows = fetch_table(PROD_URL, PROD_KEY, 'franchises')
    if rows:
        mapped = map_uuids(rows, uuid_map, ['franchisor_id'])
        success, result = insert_table(STAGING_URL, STAGING_KEY, 'franchises', mapped)
        if success:
            print(f"  franchises: {result} rows synced")
            total_synced += result
        else:
            print(f"  franchises: FAILED - {result[:100]}")
    else:
        print("  franchises: No data")
    
    # Step 6: Sync fdds (depends on franchises)
    print("\n--- Step 6: Syncing fdds ---")
    rows = fetch_table(PROD_URL, PROD_KEY, 'fdds')
    if rows:
        success, result = insert_table(STAGING_URL, STAGING_KEY, 'fdds', rows)
        if success:
            print(f"  fdds: {result} rows synced")
            total_synced += result
        else:
            print(f"  fdds: FAILED - {result[:100]}")
    else:
        print("  fdds: No data")
    
    # Step 7: Sync tables with user_id
    print("\n--- Step 7: Syncing user-related tables ---")
    for table, fields in user_id_tables:
        rows = fetch_table(PROD_URL, PROD_KEY, table)
        if rows:
            mapped = map_uuids(rows, uuid_map, fields)
            success, result = insert_table(STAGING_URL, STAGING_KEY, table, mapped)
            if success:
                print(f"  {table}: {result} rows synced")
                total_synced += result
            else:
                print(f"  {table}: FAILED - {result[:100]}")
        else:
            print(f"  {table}: No data")
    
    # Step 8: Sync tables with franchisor_id
    print("\n--- Step 8: Syncing franchisor-related tables ---")
    for table, fields in franchisor_id_tables:
        if table == 'franchises':
            continue  # Already synced
        rows = fetch_table(PROD_URL, PROD_KEY, table)
        if rows:
            mapped = map_uuids(rows, uuid_map, fields)
            success, result = insert_table(STAGING_URL, STAGING_KEY, table, mapped)
            if success:
                print(f"  {table}: {result} rows synced")
                total_synced += result
            else:
                print(f"  {table}: FAILED - {result[:100]}")
        else:
            print(f"  {table}: No data")
    
    # Step 9: Sync fdd-related tables
    print("\n--- Step 9: Syncing fdd-related tables ---")
    for table in ['fdd_item_page_mappings', 'fdd_question_answers']:
        rows = fetch_table(PROD_URL, PROD_KEY, table)
        if rows:
            success, result = insert_table(STAGING_URL, STAGING_KEY, table, rows)
            if success:
                print(f"  {table}: {result} rows synced")
                total_synced += result
            else:
                print(f"  {table}: FAILED - {result[:100]}")
        else:
            print(f"  {table}: No data")
    
    # Step 10: Sync fdd_chunks without embeddings
    print("\n--- Step 10: Syncing fdd_chunks (without embeddings) ---")
    rows = fetch_table(PROD_URL, PROD_KEY, 'fdd_chunks', 
                       'id,fdd_id,item_number,chunk_index,content,page_start,page_end,created_at')
    if rows:
        success, result = insert_table(STAGING_URL, STAGING_KEY, 'fdd_chunks', rows)
        if success:
            print(f"  fdd_chunks: {result} rows synced")
            total_synced += result
        else:
            print(f"  fdd_chunks: FAILED - {result[:100]}")
    else:
        print("  fdd_chunks: No data")
    
    # Step 11: Sync fdd_buyer_invitations
    print("\n--- Step 11: Syncing fdd_buyer_invitations ---")
    rows = fetch_table(PROD_URL, PROD_KEY, 'fdd_buyer_invitations')
    if rows:
        success, result = insert_table(STAGING_URL, STAGING_KEY, 'fdd_buyer_invitations', rows)
        if success:
            print(f"  fdd_buyer_invitations: {result} rows synced")
            total_synced += result
        else:
            print(f"  fdd_buyer_invitations: FAILED - {result[:100]}")
    else:
        print("  fdd_buyer_invitations: No data")
    
    # Step 12: Sync standalone tables
    print("\n--- Step 12: Syncing standalone tables ---")
    for table in standalone_tables:
        rows = fetch_table(PROD_URL, PROD_KEY, table)
        if rows:
            success, result = insert_table(STAGING_URL, STAGING_KEY, table, rows)
            if success:
                print(f"  {table}: {result} rows synced")
                total_synced += result
            else:
                print(f"  {table}: FAILED - {result[:100]}")
        else:
            print(f"  {table}: No data")
    
    print(f"\n--- Complete: {total_synced} total rows synced ---")
    print("\nNote: Users in staging have temporary password 'TempPassword123!'")
    print("You may need to reset passwords via Supabase dashboard.")

if __name__ == '__main__':
    main()
