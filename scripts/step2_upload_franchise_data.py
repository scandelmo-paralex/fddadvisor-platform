#!/usr/bin/env python3
"""
Step 2: Upload franchise data from analysis.json to Supabase
"""
import os
import sys
import subprocess

def upload_franchise_data(analysis_json_path: str, pdf_url: str = None):
    """Upload franchise data using the existing upload_to_supabase.py script"""
    
    if not os.path.exists(analysis_json_path):
        raise FileNotFoundError(f"analysis.json not found: {analysis_json_path}")
    
    print(f"Uploading franchise data from {analysis_json_path}...")
    
    # Build command
    cmd = ["python3", "scripts/upload_to_supabase.py", "--json", analysis_json_path]
    
    if pdf_url:
        cmd.extend(["--pdf-url", pdf_url])
    
    # Run the upload script
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"Error uploading franchise data:")
        print(result.stderr)
        raise Exception("Upload failed")
    
    print(result.stdout)
    print("✓ Step 2 complete!")
    
    # Extract franchise ID from output
    for line in result.stdout.split('\n'):
        if 'franchise_id' in line.lower() or 'fdd_id' in line.lower():
            print(f"\n{line}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 step2_upload_franchise_data.py <analysis_json_path> [pdf_url]")
        print("Example: python3 step2_upload_franchise_data.py pipeline_output/Blo/analysis.json https://...")
        sys.exit(1)
    
    analysis_json_path = sys.argv[1]
    pdf_url = sys.argv[2] if len(sys.argv) > 2 else None
    
    try:
        upload_franchise_data(analysis_json_path, pdf_url)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
