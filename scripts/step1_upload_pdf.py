#!/usr/bin/env python3
"""
Step 1: Upload PDF to Supabase Storage
"""
import os
import sys
from supabase import create_client, Client

def upload_pdf_to_supabase(pdf_path: str, franchise_slug: str) -> str:
    """Upload PDF to Supabase storage and return the public URL"""
    
    # Initialize Supabase client
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables")
    
    supabase: Client = create_client(supabase_url, supabase_key)
    
    # Read PDF file
    with open(pdf_path, 'rb') as f:
        pdf_data = f.read()
    
    # Upload to Supabase storage
    bucket_name = "fdd-pdfs"
    file_name = f"{franchise_slug}.pdf"
    
    print(f"Uploading {pdf_path} to Supabase storage bucket '{bucket_name}'...")
    
    # Upload file
    response = supabase.storage.from_(bucket_name).upload(
        file_name,
        pdf_data,
        {"content-type": "application/pdf", "upsert": "true"}
    )
    
    # Get public URL
    pdf_url = supabase.storage.from_(bucket_name).get_public_url(file_name)
    
    print(f"✓ PDF uploaded successfully!")
    print(f"  URL: {pdf_url}")
    
    return pdf_url

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 step1_upload_pdf.py <pdf_path> <franchise_slug>")
        print("Example: python3 step1_upload_pdf.py path/to/fdd.pdf blo-blow-dry-bar")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    franchise_slug = sys.argv[2]
    
    if not os.path.exists(pdf_path):
        print(f"Error: PDF file not found: {pdf_path}")
        sys.exit(1)
    
    try:
        pdf_url = upload_pdf_to_supabase(pdf_path, franchise_slug)
        print(f"\n✓ Step 1 complete!")
        print(f"\nSave this PDF URL for the next step:")
        print(f"  {pdf_url}")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
