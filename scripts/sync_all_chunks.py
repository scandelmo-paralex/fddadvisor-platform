import os
import json
import urllib.request
import urllib.error

# Environment variables
PROD_URL = os.environ.get("SUPABASE_URL")
PROD_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
STAGING_URL = os.environ.get("SUPABASE_URL_STAGING")
STAGING_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY_STAGING")

def make_request(url, headers, method="GET", data=None):
    req = urllib.request.Request(url, headers=headers, method=method)
    if data:
        req.data = json.dumps(data).encode('utf-8')
    try:
        with urllib.request.urlopen(req) as response:
            body = response.read().decode('utf-8')
            return response.status, json.loads(body) if body else []
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        return e.code, body

def fetch_all_chunks_for_fdd(fdd_id, url, key):
    """Fetch ALL chunks for a specific FDD with pagination"""
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }
    
    all_chunks = []
    offset = 0
    limit = 1000
    
    while True:
        endpoint = f"{url}/rest/v1/fdd_chunks?fdd_id=eq.{fdd_id}&select=*&order=chunk_index&offset={offset}&limit={limit}"
        status, data = make_request(endpoint, headers)
        
        if status != 200 or not data:
            break
            
        all_chunks.extend(data)
        
        if len(data) < limit:
            break
        offset += limit
    
    return all_chunks

def delete_chunks_for_fdd(fdd_id, url, key):
    """Delete all chunks for a specific FDD in staging"""
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }
    
    endpoint = f"{url}/rest/v1/fdd_chunks?fdd_id=eq.{fdd_id}"
    status, _ = make_request(endpoint, headers, method="DELETE")
    return status in [200, 204]

def insert_chunks_batch(chunks, url, key):
    """Insert chunks in batches"""
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    endpoint = f"{url}/rest/v1/fdd_chunks"
    
    # Insert in batches of 100
    batch_size = 100
    inserted = 0
    
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i+batch_size]
        status, response = make_request(endpoint, headers, method="POST", data=batch)
        
        if status in [200, 201]:
            inserted += len(batch)
        else:
            print(f"    Failed batch {i//batch_size + 1}: {response}")
    
    return inserted

def main():
    if not all([PROD_URL, PROD_KEY, STAGING_URL, STAGING_KEY]):
        print("Missing environment variables!")
        return
    
    print("=== Syncing ALL FDD Chunks ===\n")
    
    # FDDs that need syncing (from comparison)
    fdds_to_sync = [
        ("7b0089c2-ac92-4d48-b88e-a6331ccb6586", "Ace Handyman Services"),
        ("859b5f97-0cfb-45a0-95f8-0aade7c4f8f8", "Elements Massage"),
        ("7312de7c-2538-4ed3-96b2-dd70df339d72", "Fitness Together"),
        ("12e7cdc4-9936-4c41-987b-5cf8e64ea5e3", "Radiant Waxing"),
    ]
    
    for fdd_id, name in fdds_to_sync:
        print(f"Processing: {name}")
        
        # Fetch from production
        print(f"  Fetching from production...")
        prod_chunks = fetch_all_chunks_for_fdd(fdd_id, PROD_URL, PROD_KEY)
        print(f"  Found {len(prod_chunks)} chunks in production")
        
        if not prod_chunks:
            print(f"  Skipping - no chunks in production")
            continue
        
        # Delete existing in staging
        print(f"  Deleting existing staging chunks...")
        delete_chunks_for_fdd(fdd_id, STAGING_URL, STAGING_KEY)
        
        # Insert all chunks to staging
        print(f"  Inserting to staging...")
        inserted = insert_chunks_batch(prod_chunks, STAGING_URL, STAGING_KEY)
        print(f"  Inserted {inserted} chunks\n")
    
    print("=== Sync Complete ===")

if __name__ == "__main__":
    main()
