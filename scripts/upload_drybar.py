#!/usr/bin/env python3
"""
Quick upload script for Drybar analysis.json
"""
import os
import subprocess
import sys

def main():
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    # Paths
    json_path = os.path.join(project_root, "data", "drybar-analysis.json")
    upload_script = os.path.join(script_dir, "upload_to_supabase.py")
    
    # Check if files exist
    if not os.path.exists(json_path):
        print(f"❌ Error: {json_path} not found")
        sys.exit(1)
    
    if not os.path.exists(upload_script):
        print(f"❌ Error: {upload_script} not found")
        sys.exit(1)
    
    # Get environment variables
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables required")
        sys.exit(1)
    
    print("🚀 Uploading Drybar to Supabase...")
    print(f"   JSON file: {json_path}")
    print(f"   Supabase URL: {supabase_url}")
    
    # Run the upload script
    cmd = [
        "python3",
        upload_script,
        "--json", json_path,
        "--url", supabase_url,
        "--key", supabase_key
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode == 0:
        print("✅ Successfully uploaded Drybar!")
        print(result.stdout)
    else:
        print("❌ Upload failed:")
        print(result.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
