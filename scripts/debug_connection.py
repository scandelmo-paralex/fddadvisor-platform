import os
import urllib.request
import urllib.error
import json

print("=== Environment Variables ===")
print(f"SUPABASE_URL: {os.environ.get('SUPABASE_URL', 'NOT SET')[:50]}...")
print(f"SUPABASE_SERVICE_ROLE_KEY: {os.environ.get('SUPABASE_SERVICE_ROLE_KEY', 'NOT SET')[:20]}...")
print(f"SUPABASE_URL_STAGING: {os.environ.get('SUPABASE_URL_STAGING', 'NOT SET')[:50]}...")
print(f"SUPABASE_SERVICE_ROLE_KEY_STAGING: {os.environ.get('SUPABASE_SERVICE_ROLE_KEY_STAGING', 'NOT SET')[:20]}...")

staging_url = os.environ.get('SUPABASE_URL_STAGING')
staging_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY_STAGING')

if not staging_url or not staging_key:
    print("\nERROR: Staging environment variables not set!")
    exit(1)

print(f"\n=== Testing Staging Connection ===")
print(f"URL: {staging_url}")
print(f"Key starts with: {staging_key[:20]}...")
print(f"Key ends with: ...{staging_key[-10:]}")
print(f"Key length: {len(staging_key)}")

# Test a simple insert
test_url = f"{staging_url}/rest/v1/franchises?select=id&limit=1"
headers = {
    "apikey": staging_key,
    "Authorization": f"Bearer {staging_key}",
    "Content-Type": "application/json"
}

try:
    req = urllib.request.Request(test_url, headers=headers)
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print(f"\nSELECT test: SUCCESS - Got {len(data)} rows")
except urllib.error.HTTPError as e:
    print(f"\nSELECT test: FAILED - {e.code} {e.reason}")
    print(f"Response: {e.read().decode()}")

# Test insert with minimal data
print("\n=== Testing Insert ===")
insert_url = f"{staging_url}/rest/v1/franchises"
test_data = json.dumps({"name": "TEST_DELETE_ME", "slug": "test-delete-me"}).encode()
headers["Prefer"] = "return=minimal"

try:
    req = urllib.request.Request(insert_url, data=test_data, headers=headers, method='POST')
    with urllib.request.urlopen(req) as response:
        print(f"INSERT test: SUCCESS - Status {response.status}")
except urllib.error.HTTPError as e:
    print(f"INSERT test: FAILED - {e.code} {e.reason}")
    error_body = e.read().decode()
    print(f"Response: {error_body}")
    
    # Check if it's an RLS issue or key issue
    if "JWT" in error_body or "token" in error_body.lower():
        print("\n>>> ISSUE: Invalid or wrong API key")
    elif "permission" in error_body.lower() or "policy" in error_body.lower():
        print("\n>>> ISSUE: RLS policy blocking (but you said RLS is disabled?)")
    elif "violates" in error_body.lower():
        print("\n>>> ISSUE: Database constraint violation")
