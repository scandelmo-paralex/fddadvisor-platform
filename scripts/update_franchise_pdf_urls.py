#!/usr/bin/env python3
"""
Update franchise PDF URLs in Supabase database.

This script helps you update the fdd_url field for franchises with the correct
Supabase storage URLs after uploading PDFs to Supabase storage buckets.

Usage:
    python3 scripts/update_franchise_pdf_urls.py
"""

import os
import sys
from supabase import create_client, Client

# Supabase configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Error: Missing required environment variables:")
    print("  - SUPABASE_URL")
    print("  - SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def list_franchises():
    """List all franchises and their current PDF URLs."""
    print("\n" + "="*80)
    print("CURRENT FRANCHISES AND PDF URLs")
    print("="*80 + "\n")
    
    response = supabase.table("franchises").select("id, franchise_name, franchise_slug, fdd_url").order("franchise_name").execute()
    
    franchises = response.data
    
    for i, franchise in enumerate(franchises, 1):
        print(f"{i}. {franchise['franchise_name']}")
        print(f"   Slug: {franchise['franchise_slug']}")
        print(f"   Current URL: {franchise.get('fdd_url') or 'NOT SET'}")
        print()
    
    return franchises

def update_pdf_url(franchise_slug: str, pdf_url: str):
    """Update the PDF URL for a specific franchise."""
    try:
        response = supabase.table("franchises").update({
            "fdd_url": pdf_url
        }).eq("franchise_slug", franchise_slug).execute()
        
        if response.data:
            print(f"✅ Successfully updated PDF URL for {franchise_slug}")
            return True
        else:
            print(f"❌ Failed to update PDF URL for {franchise_slug}")
            return False
    except Exception as e:
        print(f"❌ Error updating {franchise_slug}: {str(e)}")
        return False

def bulk_update_mode():
    """Bulk update mode - update multiple franchises at once."""
    print("\n" + "="*80)
    print("BULK UPDATE MODE")
    print("="*80)
    print("\nEnter franchise slug and PDF URL pairs (one per line)")
    print("Format: franchise-slug|https://your-supabase-url/storage/v1/object/public/bucket/file.pdf")
    print("Type 'done' when finished\n")
    
    updates = []
    while True:
        line = input("Enter franchise|url (or 'done'): ").strip()
        if line.lower() == 'done':
            break
        
        if '|' not in line:
            print("❌ Invalid format. Use: franchise-slug|url")
            continue
        
        slug, url = line.split('|', 1)
        updates.append((slug.strip(), url.strip()))
    
    if not updates:
        print("\nNo updates to process.")
        return
    
    print(f"\n📋 Processing {len(updates)} updates...")
    success_count = 0
    
    for slug, url in updates:
        if update_pdf_url(slug, url):
            success_count += 1
    
    print(f"\n✅ Successfully updated {success_count}/{len(updates)} franchises")

def interactive_mode():
    """Interactive mode - update one franchise at a time."""
    franchises = list_franchises()
    
    print("\n" + "="*80)
    print("INTERACTIVE UPDATE MODE")
    print("="*80)
    
    while True:
        choice = input("\nEnter franchise number to update (or 'q' to quit): ").strip()
        
        if choice.lower() == 'q':
            break
        
        try:
            idx = int(choice) - 1
            if idx < 0 or idx >= len(franchises):
                print("❌ Invalid franchise number")
                continue
            
            franchise = franchises[idx]
            print(f"\nUpdating: {franchise['franchise_name']}")
            print(f"Slug: {franchise['franchise_slug']}")
            print(f"Current URL: {franchise.get('fdd_url') or 'NOT SET'}")
            
            new_url = input("\nEnter new PDF URL (or 'skip' to skip): ").strip()
            
            if new_url.lower() == 'skip':
                continue
            
            if not new_url.startswith('http'):
                print("❌ URL must start with http:// or https://")
                continue
            
            update_pdf_url(franchise['franchise_slug'], new_url)
            
            # Refresh the franchise data
            franchises = list_franchises()
            
        except ValueError:
            print("❌ Please enter a valid number")

def main():
    print("\n" + "="*80)
    print("FRANCHISE PDF URL UPDATER")
    print("="*80)
    print("\nThis script helps you update franchise PDF URLs in the database.")
    print("\nYour Supabase storage URLs should look like:")
    print("https://[project].supabase.co/storage/v1/object/public/[bucket]/[filename].pdf")
    print("\nExample:")
    print("https://utunvzekehobtyncpcza.supabase.co/storage/v1/object/public/fdd-documents/Drybar_FDD_2025.pdf")
    
    while True:
        print("\n" + "="*80)
        print("MAIN MENU")
        print("="*80)
        print("\n1. List all franchises and current URLs")
        print("2. Interactive update (one at a time)")
        print("3. Bulk update (multiple at once)")
        print("4. Exit")
        
        choice = input("\nSelect an option (1-4): ").strip()
        
        if choice == '1':
            list_franchises()
        elif choice == '2':
            interactive_mode()
        elif choice == '3':
            bulk_update_mode()
        elif choice == '4':
            print("\n👋 Goodbye!")
            break
        else:
            print("❌ Invalid option. Please select 1-4.")

if __name__ == "__main__":
    main()
