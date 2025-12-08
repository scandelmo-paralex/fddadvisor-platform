#!/usr/bin/env python3
"""
Sync only embeddings from production fdd_chunks to staging.
Matches by chunk id and updates the embedding column.
"""

import os
import requests
import json

# Get environment variables
PROD_URL = os.environ.get("SUPABASE_URL")
PROD_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
STAGING_URL = os.environ.get("SUPABASE_URL_STAGING")
STAGING_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY_STAGING")

def get_headers(key):
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

def fetch_production_embeddings():
    """Fetch all chunk IDs and embeddings from production"""
    print("Fetching embeddings from production...")
    
    all_chunks = []
    offset = 0
    limit = 500
    
    while True:
        url = f"{PROD_URL}/rest/v1/fdd_chunks?select=id,embedding&offset={offset}&limit={limit}"
        response = requests.get(url, headers=get_headers(PROD_KEY))
        
        if response.status_code != 200:
            print(f"Error fetching: {response.status_code} - {response.text}")
            break
            
        chunks = response.json()
        if not chunks:
            break
            
        # Filter out null embeddings
        chunks_with_embeddings = [c for c in chunks if c.get('embedding')]
        all_chunks.extend(chunks_with_embeddings)
        print(f"  Fetched {len(chunks)} chunks, {len(chunks_with_embeddings)} have embeddings (total: {len(all_chunks)})")
        
        if len(chunks) < limit:
            break
        offset += limit
    
    print(f"Total chunks with embeddings: {len(all_chunks)}")
    return all_chunks

def update_staging_embeddings(chunks):
    """Update staging chunks with production embeddings"""
    print(f"\nUpdating {len(chunks)} embeddings in staging...")
    
    success = 0
    failed = 0
    
    for i, chunk in enumerate(chunks):
        chunk_id = chunk['id']
        embedding = chunk['embedding']
        
        url = f"{STAGING_URL}/rest/v1/fdd_chunks?id=eq.{chunk_id}"
        data = {"embedding": embedding}
        
        response = requests.patch(url, headers=get_headers(STAGING_KEY), json=data)
        
        if response.status_code in [200, 204]:
            success += 1
        else:
            failed += 1
            if failed <= 5:  # Only show first 5 errors
                print(f"  Error updating {chunk_id}: {response.status_code} - {response.text}")
        
        if (i + 1) % 100 == 0:
            print(f"  Progress: {i + 1}/{len(chunks)} (success: {success}, failed: {failed})")
    
    print(f"\nComplete! Success: {success}, Failed: {failed}")

def main():
    if not all([PROD_URL, PROD_KEY, STAGING_URL, STAGING_KEY]):
        print("Missing environment variables!")
        print(f"  SUPABASE_URL: {'set' if PROD_URL else 'MISSING'}")
        print(f"  SUPABASE_SERVICE_ROLE_KEY: {'set' if PROD_KEY else 'MISSING'}")
        print(f"  SUPABASE_URL_STAGING: {'set' if STAGING_URL else 'MISSING'}")
        print(f"  SUPABASE_SERVICE_ROLE_KEY_STAGING: {'set' if STAGING_KEY else 'MISSING'}")
        return
    
    print("=== Syncing Embeddings from Production to Staging ===\n")
    
    chunks = fetch_production_embeddings()
    
    if chunks:
        update_staging_embeddings(chunks)
    else:
        print("No embeddings to sync!")

if __name__ == "__main__":
    main()
