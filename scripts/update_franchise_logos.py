#!/usr/bin/env python3
"""
Update franchise logos in Supabase database
"""

import os
import sys
from supabase import create_client, Client

# Logo URLs from Vercel Blob Storage
FRANCHISE_LOGOS = {
    "Drybar": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-1oCaKGIUSP1vqlue50dv742dtpmynd.png",
    "Radiant Waxing": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-pEkTVwWuDmTX8eCMmOkj2VcYIfwyJZ.png",
    "Elements Massage": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-kcb3tGV5Y6mUNplRqHXgxPvtgivizm.png"
}

def main():
    # Get Supabase credentials from environment
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables required")
        sys.exit(1)
    
    # Create Supabase client
    supabase: Client = create_client(supabase_url, supabase_key)
    
    print("🚀 Updating franchise logos...\n")
    
    # Update each franchise
    for franchise_name, logo_url in FRANCHISE_LOGOS.items():
        try:
            # Check if franchise exists
            result = supabase.table("franchises").select("id, name").eq("name", franchise_name).execute()
            
            if not result.data:
                print(f"⚠️  {franchise_name}: Not found in database (skipping)")
                continue
            
            franchise_id = result.data[0]["id"]
            
            # Update logo_url
            update_result = supabase.table("franchises").update({
                "logo_url": logo_url
            }).eq("id", franchise_id).execute()
            
            if update_result.data:
                print(f"✅ {franchise_name}: Logo updated successfully")
                print(f"   URL: {logo_url}\n")
            else:
                print(f"❌ {franchise_name}: Update failed\n")
                
        except Exception as e:
            print(f"❌ {franchise_name}: Error - {str(e)}\n")
    
    print("✨ Logo update complete!")

if __name__ == "__main__":
    main()
