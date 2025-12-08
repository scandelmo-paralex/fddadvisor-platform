#!/usr/bin/env python3
"""
Update logos for Amazing Lash Studio and Fitness Together
"""

import os
from supabase import create_client, Client

def update_logos():
    """Update logo URLs for the two new franchises"""
    
    # Get Supabase credentials from environment
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables required")
        return
    
    # Initialize Supabase client
    supabase: Client = create_client(supabase_url, supabase_key)
    
    # Logo URLs from Vercel Blob Storage
    logos = {
        "Amazing Lash Studio": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-5Ic9eL9ecxYqODgn6JRYAQiXmTv1xy.png",
        "Fitness Together": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-xrC0iu1ZXf8WJ0hMqEf7VjP7dQnb0D.png"
    }
    
    print("🚀 Updating franchise logos...\n")
    
    for franchise_name, logo_url in logos.items():
        try:
            # Update the franchise record
            result = supabase.table("franchises").update({
                "logo_url": logo_url
            }).eq("name", franchise_name).execute()
            
            if result.data:
                print(f"✅ Updated logo for {franchise_name}")
                print(f"   Logo URL: {logo_url}\n")
            else:
                print(f"⚠️  No franchise found with name: {franchise_name}\n")
                
        except Exception as e:
            print(f"❌ Error updating {franchise_name}: {str(e)}\n")
    
    print("✨ Logo update complete!")

if __name__ == "__main__":
    update_logos()
