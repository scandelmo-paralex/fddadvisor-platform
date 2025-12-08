#!/usr/bin/env python3
"""
Fetch all PDF URLs from Supabase Storage buckets.

This script connects to your Supabase project and lists all files
in the storage buckets, displaying their public URLs.

Usage:
    python3 scripts/fetch_supabase_storage_urls.py
"""

import os
import sys
from supabase import create_client, Client

def fetch_storage_urls():
    """Fetch all PDF URLs from Supabase Storage."""
    
    # Get Supabase credentials from environment
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Error: Missing Supabase credentials")
        print("Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables")
        sys.exit(1)
    
    # Create Supabase client
    supabase: Client = create_client(supabase_url, supabase_key)
    
    print("🔍 Fetching PDFs from Supabase Storage...\n")
    
    # Common bucket names for FDD documents
    bucket_names = ["fdd-documents", "fdds", "documents", "pdfs"]
    
    found_files = False
    
    for bucket_name in bucket_names:
        try:
            # List all files in the bucket
            files = supabase.storage.from_(bucket_name).list()
            
            if files:
                found_files = True
                print(f"📁 Bucket: {bucket_name}")
                print("=" * 80)
                
                for file in files:
                    file_name = file.get("name", "")
                    
                    # Only show PDF files
                    if file_name.lower().endswith(".pdf"):
                        # Get public URL
                        public_url = supabase.storage.from_(bucket_name).get_public_url(file_name)
                        
                        print(f"\n📄 File: {file_name}")
                        print(f"🔗 URL: {public_url}")
                        print(f"📊 Size: {file.get('metadata', {}).get('size', 'Unknown')} bytes")
                        print(f"📅 Updated: {file.get('updated_at', 'Unknown')}")
                
                print("\n" + "=" * 80 + "\n")
        
        except Exception as e:
            # Bucket might not exist, skip silently
            continue
    
    if not found_files:
        print("❌ No PDF files found in common storage buckets")
        print("\nTried buckets:", ", ".join(bucket_names))
        print("\nTo check a specific bucket, modify the bucket_names list in the script")
    else:
        print("✅ Finished fetching PDF URLs")

if __name__ == "__main__":
    fetch_storage_urls()
