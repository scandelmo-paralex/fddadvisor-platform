import requests
import csv
from io import StringIO

# Fetch the CSV file
url = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Supabase%20Snippet%20Row%20Counts%20for%20Core%20Tables-E32PGEjjNCNDhp521zea93ZHbckXVR.csv"
response = requests.get(url)

# Parse CSV
csv_data = StringIO(response.text)
reader = csv.DictReader(csv_data)

print("Franchises Table Schema:")
print("-" * 50)
for row in reader:
    print(f"{row['column_name']:<30} {row['data_type']}")
