#!/usr/bin/env python3
"""
Quick script to upload Drybar analysis to Supabase
"""
import os
import sys
import subprocess

# Get the script directory
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)

# Path to the analysis file
analysis_file = os.path.join(project_root, "data", "drybar-analysis.json")

# Check if file exists
if not os.path.exists(analysis_file):
    print(f"❌ Error: Analysis file not found at {analysis_file}")
    sys.exit(1)

# Get Supabase credentials from environment
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("❌ Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in environment")
    sys.exit(1)

print("🚀 Uploading Drybar to Supabase...")
print(f"📁 File: {analysis_file}")
print(f"🔗 Supabase URL: {supabase_url}")

# Run the upload script
upload_script = os.path.join(script_dir, "upload_to_supabase.py")
result = subprocess.run([
    sys.executable,
    upload_script,
    "--json", analysis_file,
    "--url", supabase_url,
    "--key", supabase_key
], capture_output=True, text=True)

# Print output
print(result.stdout)
if result.stderr:
    print(result.stderr)

# Exit with same code as subprocess
sys.exit(result.returncode)
