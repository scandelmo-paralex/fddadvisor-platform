#!/usr/bin/env python3
"""
Step 4: Upload logo to Vercel Blob (optional)
"""
import os
import sys
import requests

def upload_logo_to_blob(logo_path: str, franchise_slug: str) -> str:
    """Upload logo to Vercel Blob and return the URL"""
    
    blob_token = os.environ.get("BLOB_READ_WRITE_TOKEN")
    if not blob_token:
        raise ValueError("Missing BLOB_READ_WRITE_TOKEN environment variable")
    
    if not os.path.exists(logo_path):
        raise FileNotFoundError(f"Logo file not found: {logo_path}")
    
    print(f"Uploading logo: {logo_path}")
    
    # Read logo file
    with open(logo_path, 'rb') as f:
        logo_data = f.read()
    
    # Determine content type
    ext = os.path.splitext(logo_path)[1].lower()
    content_type_map = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp'
    }
    content_type = content_type_map.get(ext, 'image/png')
    
    # Upload to Vercel Blob
    filename = f"logos/{franchise_slug}{ext}"
    
    response = requests.put(
        f"https://blob.vercel-storage.com/{filename}",
        headers={
            "Authorization": f"Bearer {blob_token}",
            "Content-Type": content_type,
        },
        data=logo_data
    )
    
    if response.status_code != 200:
        raise Exception(f"Failed to upload logo: {response.text}")
    
    logo_url = response.json().get('url')
    print(f"✓ Logo uploaded successfully!")
    print(f"  URL: {logo_url}")
    
    return logo_url

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 step4_upload_logo.py <logo_path> <franchise_slug>")
        print("Example: python3 step4_upload_logo.py logos/blo.png blo-blow-dry-bar")
        sys.exit(1)
    
    logo_path = sys.argv[1]
    franchise_slug = sys.argv[2]
    
    try:
        logo_url = upload_logo_to_blob(logo_path, franchise_slug)
        print(f"\n✓ Step 4 complete!")
        print(f"\nYou can now update the franchise record with this logo URL:")
        print(f"  {logo_url}")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
