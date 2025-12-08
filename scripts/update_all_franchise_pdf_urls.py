import os
from supabase import create_client, Client

# Initialize Supabase client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

# Define the correct PDF URLs from Supabase storage
# Format: franchise_slug -> PDF URL
pdf_urls = {
    "drybar": "https://utunvzekehobtyncpcza.supabase.co/storage/v1/object/public/fdd-documents/Drybar%20FDD%20(2025).pdf",
    "radiant-waxing": "https://utunvzekehobtyncpcza.supabase.co/storage/v1/object/public/fdd-documents/Radiant%20Waxing%20FDD%20(2025).pdf",
    "elements-massage": "https://utunvzekehobtyncpcza.supabase.co/storage/v1/object/public/fdd-documents/Top400%20-%20222%20-%20Elements%20Massage.pdf",
    "amazing-lash-studio": "https://utunvzekehobtyncpcza.supabase.co/storage/v1/object/public/fdd-documents/Amazing%20Lash%20FDD%20(2025).pdf",
    "fitness-together": "https://utunvzekehobtyncpcza.supabase.co/storage/v1/object/public/fdd-documents/Fitness%20Together%20FDD%20(2025).pdf",
}

def update_franchise_pdf_urls():
    """Update franchise PDF URLs in the database"""
    
    print("\n" + "="*60)
    print("Franchise PDF URL Updater")
    print("="*60 + "\n")
    
    updated_count = 0
    skipped_count = 0
    
    for slug, pdf_url in pdf_urls.items():
        if not pdf_url:
            print(f"⏭️  Skipping {slug} (no URL provided)")
            skipped_count += 1
            continue
            
        try:
            # Update the franchise record
            result = supabase.table("franchises").update({
                "fdd_url": pdf_url
            }).eq("slug", slug).execute()
            
            if result.data:
                print(f"✅ Updated {slug}")
                print(f"   URL: {pdf_url}\n")
                updated_count += 1
            else:
                print(f"⚠️  No franchise found with slug: {slug}\n")
                skipped_count += 1
                
        except Exception as e:
            print(f"❌ Error updating {slug}: {str(e)}\n")
            skipped_count += 1
    
    print("\n" + "="*60)
    print(f"Summary: {updated_count} updated, {skipped_count} skipped")
    print("="*60 + "\n")

if __name__ == "__main__":
    print("\nThis script will update franchise PDF URLs in your database.")
    print("Make sure you've added the correct URLs in the pdf_urls dictionary.\n")
    
    response = input("Continue? (yes/no): ")
    if response.lower() in ['yes', 'y']:
        update_franchise_pdf_urls()
    else:
        print("Cancelled.")
