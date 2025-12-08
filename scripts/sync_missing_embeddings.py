#!/usr/bin/env python3
"""
Sync embeddings for FDDs that have chunks but no embeddings.
"""

import os
import json
import urllib.request
import urllib.error

# Environment variables
PROD_URL = os.environ.get("SUPABASE_URL")
PROD_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
STAGING_URL = os.environ.get("SUPABASE_URL_STAGING")
STAGING_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY_STAGING")

# FDD IDs that need embeddings synced
FDDS_NEEDING_EMBEDDINGS = [
    ("amazing-lash-studio", "4ebb1dd1-babb-4b11-af1c-d6e6aa6490c2"),
    ("blo-blow-dry-bar", "2745d904-9e06-42ad-bab2-2f0d80d495db"),
    ("drybar", "7c038124-9cb9-43e0-ac82-e5e8f1be8b93"),
]

def make_request(url, key, method="GET", data=None):
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    req = urllib.request.Request(url, headers=headers, method=method)
    if data:
        req.data = json.dumps(data).encode('utf-8')
    
    try:
        with urllib.request.urlopen(req) as response:
            body = response.read().decode('utf-8')
            return json.loads(body) if body else []
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"  Error: {e.code} - {error_body}")
        return None

def sync_embeddings_for_fdd(slug, fdd_id):
    print(f"\n=== Syncing embeddings for {slug} (FDD: {fdd_id}) ===")
    
    # Get all chunks with embeddings from production
    offset = 0
    batch_size = 500
    total_updated = 0
    
    while True:
        # Fetch production chunks with embeddings
        prod_url = f"{PROD_URL}/rest/v1/fdd_chunks?fdd_id=eq.{fdd_id}&select=id,embedding&embedding=not.is.null&offset={offset}&limit={batch_size}"
        prod_chunks = make_request(prod_url, PROD_KEY)
        
        if not prod_chunks:
            print(f"  No more chunks at offset {offset}")
            break
        
        print(f"  Fetched {len(prod_chunks)} chunks from production (offset {offset})")
        
        # Update each chunk in staging
        for chunk in prod_chunks:
            if chunk.get('embedding'):
                update_url = f"{STAGING_URL}/rest/v1/fdd_chunks?id=eq.{chunk['id']}"
                result = make_request(
                    update_url, 
                    STAGING_KEY, 
                    method="PATCH",
                    data={"embedding": chunk['embedding']}
                )
                if result is not None:
                    total_updated += 1
        
        print(f"  Updated {total_updated} embeddings so far")
        
        if len(prod_chunks) < batch_size:
            break
        
        offset += batch_size
    
    print(f"  Completed: {total_updated} embeddings synced for {slug}")
    return total_updated

def main():
    print("=== Syncing Missing Embeddings ===\n")
    
    if not all([PROD_URL, PROD_KEY, STAGING_URL, STAGING_KEY]):
        print("ERROR: Missing environment variables")
        print(f"  SUPABASE_URL: {'set' if PROD_URL else 'MISSING'}")
        print(f"  SUPABASE_SERVICE_ROLE_KEY: {'set' if PROD_KEY else 'MISSING'}")
        print(f"  SUPABASE_URL_STAGING: {'set' if STAGING_URL else 'MISSING'}")
        print(f"  SUPABASE_SERVICE_ROLE_KEY_STAGING: {'set' if STAGING_KEY else 'MISSING'}")
        return
    
    total = 0
    for slug, fdd_id in FDDS_NEEDING_EMBEDDINGS:
        count = sync_embeddings_for_fdd(slug, fdd_id)
        total += count
    
    print(f"\n=== COMPLETE: {total} total embeddings synced ===")

if __name__ == "__main__":
    main()
