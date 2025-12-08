#!/usr/bin/env python3
"""
Complete Franchise Upload Helper
=================================
Streamlines the process of adding a new franchise to the platform.

Usage:
    python3 add_new_franchise.py \
        --pipeline-dir pipeline_output/Your-Franchise-Name \
        --pdf path/to/original-fdd.pdf \
        --logo path/to/logo.png

This script will:
1. Upload the PDF to Supabase storage
2. Upload analysis.json to Supabase database
3. Get the franchise/FDD ID
4. Process and upload embeddings for semantic search
5. Upload the logo to Vercel Blob
"""

import os
import sys
import json
import argparse
from pathlib import Path
from supabase import create_client, Client
import requests

# Import existing scripts
sys.path.append(str(Path(__file__).parent))
from upload_to_supabase import upload_franchise
from enhanced_chunking_for_semantic_search import process_pipeline_output


def get_supabase_client():
    """Get Supabase client with credentials"""
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Error: Supabase credentials required")
        print("   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables")
        sys.exit(1)
    
    return create_client(supabase_url, supabase_key)


def upload_pdf_to_supabase(supabase: Client, pdf_path: str, franchise_name: str) -> str:
    """Upload PDF to Supabase storage and return public URL"""
    print(f"\n📄 Uploading PDF to Supabase storage...")
    
    # Create a slug-friendly filename
    slug = franchise_name.lower().replace(' ', '-').replace('&', 'and')
    filename = f"{slug}.pdf"
    
    # Read PDF file
    with open(pdf_path, 'rb') as f:
        pdf_data = f.read()
    
    try:
        # Upload to Supabase storage bucket 'fdd-pdfs'
        result = supabase.storage.from_('fdd-pdfs').upload(
            filename,
            pdf_data,
            file_options={"content-type": "application/pdf", "upsert": "true"}
        )
        
        # Get public URL
        pdf_url = supabase.storage.from_('fdd-pdfs').get_public_url(filename)
        
        print(f"✅ PDF uploaded: {pdf_url}")
        return pdf_url
    
    except Exception as e:
        print(f"❌ Error uploading PDF: {e}")
        print(f"   Make sure the 'fdd-pdfs' bucket exists in Supabase storage")
        sys.exit(1)


def get_franchise_id(supabase: Client, franchise_name: str) -> str:
    """Get franchise ID from Supabase after upload"""
    print(f"\n🔍 Looking up franchise ID for '{franchise_name}'...")
    
    result = supabase.table("franchises").select("id").eq("name", franchise_name).execute()
    
    if not result.data:
        print(f"❌ Error: Franchise '{franchise_name}' not found in database")
        sys.exit(1)
    
    franchise_id = result.data[0]["id"]
    print(f"✅ Found franchise ID: {franchise_id}")
    return franchise_id


def update_franchise_pdf_url(supabase: Client, franchise_id: str, pdf_url: str):
    """Update franchise record with PDF URL"""
    print(f"\n📝 Updating franchise with PDF URL...")
    
    supabase.table("franchises").update({
        "fdd_pdf_url": pdf_url
    }).eq("id", franchise_id).execute()
    
    print("✅ PDF URL updated in database")


def upload_logo_to_blob(logo_path: str, franchise_name: str) -> str:
    """Upload logo to Vercel Blob storage"""
    blob_token = os.environ.get("BLOB_READ_WRITE_TOKEN")
    
    if not blob_token:
        print("⚠️  Warning: BLOB_READ_WRITE_TOKEN not set, skipping logo upload")
        return None
    
    print(f"\n📤 Uploading logo: {logo_path}...")
    
    # Read logo file
    with open(logo_path, 'rb') as f:
        logo_data = f.read()
    
    # Get file extension
    ext = Path(logo_path).suffix
    
    # Upload to Vercel Blob
    # Create a slug-friendly filename
    slug = franchise_name.lower().replace(' ', '-').replace('&', 'and')
    filename = f"logos/{slug}{ext}"
    
    try:
        response = requests.put(
            f"https://blob.vercel-storage.com/{filename}",
            headers={
                "Authorization": f"Bearer {blob_token}",
                "x-content-type": f"image/{ext[1:]}"
            },
            data=logo_data
        )
        response.raise_for_status()
        
        result = response.json()
        logo_url = result.get("url")
        
        print(f"✅ Logo uploaded: {logo_url}")
        return logo_url
    
    except Exception as e:
        print(f"❌ Error uploading logo: {e}")
        return None


def update_franchise_logo(supabase: Client, franchise_id: str, logo_url: str):
    """Update franchise record with logo URL"""
    if not logo_url:
        return
    
    print(f"\n📝 Updating franchise with logo URL...")
    
    supabase.table("franchises").update({
        "logo_url": logo_url
    }).eq("id", franchise_id).execute()
    
    print("✅ Logo URL updated in database")


def main():
    parser = argparse.ArgumentParser(
        description="Complete helper for adding a new franchise to the platform"
    )
    parser.add_argument(
        "--pipeline-dir",
        required=True,
        help="Path to pipeline output directory (e.g., pipeline_output/Your-Franchise-Name)"
    )
    parser.add_argument(
        "--pdf",
        required=True,
        help="Path to the original FDD PDF file"
    )
    parser.add_argument(
        "--logo",
        help="Path to franchise logo image (PNG, JPG, or SVG)"
    )
    parser.add_argument(
        "--skip-embeddings",
        action="store_true",
        help="Skip embedding generation (useful for testing)"
    )
    
    args = parser.parse_args()
    
    # Validate paths
    pipeline_dir = Path(args.pipeline_dir)
    if not pipeline_dir.exists():
        print(f"❌ Error: Pipeline directory not found: {pipeline_dir}")
        sys.exit(1)
    
    analysis_json = pipeline_dir / "analysis.json"
    if not analysis_json.exists():
        print(f"❌ Error: analysis.json not found in {pipeline_dir}")
        sys.exit(1)
    
    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        print(f"❌ Error: PDF file not found: {pdf_path}")
        sys.exit(1)
    
    # Load franchise name from analysis.json
    with open(analysis_json, 'r') as f:
        data = json.load(f)
        franchise_name = data.get("franchise_name")
    
    if not franchise_name:
        print("❌ Error: franchise_name not found in analysis.json")
        sys.exit(1)
    
    print("\n" + "="*70)
    print(f"ADDING NEW FRANCHISE: {franchise_name}")
    print("="*70)
    
    # Get Supabase client
    supabase = get_supabase_client()
    
    print("\n📄 STEP 1: Uploading PDF to Supabase storage...")
    print("-" * 70)
    pdf_url = upload_pdf_to_supabase(supabase, str(pdf_path), franchise_name)
    
    print("\n📊 STEP 2: Uploading franchise data to Supabase...")
    print("-" * 70)
    upload_franchise(str(analysis_json))
    
    print("\n🔑 STEP 3: Getting franchise ID and updating PDF URL...")
    print("-" * 70)
    franchise_id = get_franchise_id(supabase, franchise_name)
    update_franchise_pdf_url(supabase, franchise_id, pdf_url)
    
    if not args.skip_embeddings:
        print("\n🧠 STEP 4: Processing embeddings for semantic search...")
        print("-" * 70)
        try:
            process_pipeline_output(
                str(pipeline_dir),
                franchise_id,
                franchise_name
            )
        except Exception as e:
            print(f"❌ Error processing embeddings: {e}")
            print("   You can run this step manually later:")
            print(f"   python3 scripts/enhanced_chunking_for_semantic_search.py {pipeline_dir} {franchise_id}")
    else:
        print("\n⏭️  STEP 4: Skipping embeddings (--skip-embeddings flag)")
    
    if args.logo:
        print("\n🎨 STEP 5: Uploading logo...")
        print("-" * 70)
        logo_url = upload_logo_to_blob(args.logo, franchise_name)
        if logo_url:
            update_franchise_logo(supabase, franchise_id, logo_url)
    else:
        print("\n⏭️  STEP 5: No logo provided (use --logo to upload)")
    
    # Summary
    print("\n" + "="*70)
    print("✅ FRANCHISE ADDED SUCCESSFULLY!")
    print("="*70)
    print(f"\nFranchise: {franchise_name}")
    print(f"ID: {franchise_id}")
    print(f"PDF URL: {pdf_url}")
    print(f"\nNext steps:")
    print(f"1. Visit /fdd/{franchise_id} to view the franchise")
    print(f"2. Use the admin tool at /admin/fdd/{franchise_id}/item-mapping to map Items 1-23 and Exhibits")
    print(f"3. Test the PDF viewer and AI chat functionality")
    print()


if __name__ == "__main__":
    main()
