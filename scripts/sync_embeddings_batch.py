#!/usr/bin/env python3
"""
Fast batch sync for missing embeddings.
Updates embeddings in batches instead of one at a time.
"""

import os
import json
import urllib.request
import urllib.error

# Environment variables
PROD_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
PROD_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
STAGING_URL = os.environ.get("SUPABASE_URL_STAGING", "").rstrip("/")
STAGING_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY_STAGING", "")

# FDDs missing embeddings
MISSING_FDDS = [
    ("amazing-lash-studio", "4ebb1dd1-babb-4b11-af1c-d6e6aa6490c2"),
    ("blo-blow-dry-bar", "eff20a3f-1730-4cf5-8b28-fe0ce9eb89d2"),
    ("drybar", "7c038124-9cb9-43e0-ac82-e5e8f1be8b93"),
]

def make_request(url, key, method="GET", data=None):
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    req = urllib.request.Request(url, headers=headers, method=method)
    if data:
        req.data = json.dumps(data).encode()
    
    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            if response.status in [200, 201, 204]:
                try:
                    return json.loads(response.read().decode())
                except:
                    return True
            return None
    except urllib.error.HTTPError as e:
        print(f"  HTTP Error {e.code}: {e.read().decode()[:200]}")
        return None
    except Exception as e:
        print(f"  Error: {e}")
        return None

def fetch_all_chunks_with_embeddings(fdd_id):
    """Fetch all chunks with embeddings from production"""
    all_chunks = []
    offset = 0
    batch_size = 500
    
    while True:
        url = f"{PROD_URL}/rest/v1/fdd_chunks?fdd_id=eq.{fdd_id}&select=id,embedding&embedding=not.is.null&offset={offset}&limit={batch_size}"
        chunks = make_request(url, PROD_KEY)
        
        if not chunks:
            break
            
        all_chunks.extend(chunks)
        print(f"  Fetched {len(all_chunks)} chunks with embeddings...")
        
        if len(chunks) < batch_size:
            break
        offset += batch_size
    
    return all_chunks

def update_embeddings_via_sql(fdd_id, chunks):
    """Update embeddings using raw SQL for speed"""
    if not chunks:
        return 0
    
    # Build CASE statement for batch update
    case_statements = []
    ids = []
    
    for chunk in chunks:
        chunk_id = chunk['id']
        embedding = chunk['embedding']
        if embedding:
            # Format embedding as PostgreSQL array
            embedding_str = "[" + ",".join(map(str, embedding)) + "]"
            case_statements.append(f"WHEN id = '{chunk_id}' THEN '{embedding_str}'::vector(768)")
            ids.append(f"'{chunk_id}'")
    
    if not case_statements:
        return 0
    
    # Execute in batches of 50 to avoid SQL size limits
    batch_size = 50
    updated = 0
    
    for i in range(0, len(case_statements), batch_size):
        batch_cases = case_statements[i:i+batch_size]
        batch_ids = ids[i:i+batch_size]
        
        sql = f"""
        UPDATE fdd_chunks 
        SET embedding = CASE {' '.join(batch_cases)} END
        WHERE id IN ({','.join(batch_ids)})
        """
        
        url = f"{STAGING_URL}/rest/v1/rpc/exec_sql"
        result = make_request(url, STAGING_KEY, "POST", {"query": sql})
        
        if result is not None:
            updated += len(batch_cases)
            print(f"  Updated {updated}/{len(case_statements)} embeddings...")
    
    return updated

def update_embeddings_direct(fdd_id, chunks):
    """Update embeddings one batch at a time via PATCH"""
    if not chunks:
        return 0
    
    updated = 0
    batch_size = 20  # Update 20 at a time
    
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i+batch_size]
        
        for chunk in batch:
            chunk_id = chunk['id']
            embedding = chunk['embedding']
            
            url = f"{STAGING_URL}/rest/v1/fdd_chunks?id=eq.{chunk_id}"
            result = make_request(url, STAGING_KEY, "PATCH", {"embedding": embedding})
            
            if result is not None:
                updated += 1
        
        print(f"  Updated {updated}/{len(chunks)} embeddings...")
    
    return updated

print("=== Fast Batch Embedding Sync ===\n")

for slug, fdd_id in MISSING_FDDS:
    print(f"=== {slug} (FDD: {fdd_id}) ===")
    
    # Fetch all chunks with embeddings from production
    chunks = fetch_all_chunks_with_embeddings(fdd_id)
    print(f"  Total chunks with embeddings: {len(chunks)}")
    
    if not chunks:
        print("  No embeddings to sync")
        continue
    
    # Update in staging
    updated = update_embeddings_direct(fdd_id, chunks)
    print(f"  Done! Updated {updated} embeddings\n")

print("\n=== Sync Complete ===")
