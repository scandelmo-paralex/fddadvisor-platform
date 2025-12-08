"""
Complete Vertex AI FDD Processing Pipeline
==========================================
1. Extract full PDF text using pdfplumber (better for tables and large documents)
2. Identify Items 1-22 and financial exhibits (smart detection)
3. Analyze with DeepSeek via Vertex AI
4. Store in Supabase database
5. Prepare for vector database (chunking + embeddings)
"""

import os
import json
import time
import re
import argparse
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dotenv import load_dotenv
from google.cloud import aiplatform
from google.auth import default
from google.auth.transport.requests import Request
from google.oauth2 import service_account
import requests
from supabase import create_client, Client
from tqdm import tqdm
import pdfplumber

load_dotenv()

# ============================================================================
# CONFIGURATION
# ============================================================================

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "fddadvisor-fdd-processing")
LOCATION = os.getenv("DOCUMENT_AI_LOCATION", "us")
PROCESSOR_ID = os.getenv("DOCUMENT_AI_PROCESSOR_ID", "")

# Directories
PDF_INPUT_DIR = "./test_pdfs"  # Put your test PDF here
OUTPUT_DIR = "./pipeline_output"
CHECKPOINT_FILE = "./pipeline_checkpoint.json"

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Gemini 2.5 Flash-Lite endpoint configuration
MODEL_LOCATION = os.getenv("MODEL_LOCATION", "us-central1")
API_ENDPOINT = f"https://{MODEL_LOCATION}-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/{MODEL_LOCATION}/publishers/google/models/gemini-2.5-flash-lite:generateContent"
MODEL_NAME = "gemini-2.5-flash-lite"

# ============================================================================
# STEP 1: PDF TEXT EXTRACTION WITH PDFPLUMBER
# ============================================================================

def clean_text(text: str) -> str:
    """Clean extracted text by fixing encoding issues and removing excessive whitespace."""
    
    # Fix common encoding issues
    text = text.replace('â€™', "'")
    text = text.replace('â€œ', '"')
    text = text.replace('â€', '"')
    text = text.replace('â€"', '-')
    text = text.replace('â€"', '—')
    text = text.replace('Â', '')
    
    # Remove excessive newlines (3+ newlines become 2)
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
    
    # Clean up multiple spaces on the same line
    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        # Replace multiple spaces with single space
        line = re.sub(r'  +', ' ', line)
        line = line.strip()
        # Skip lines that are only page numbers
        if line and not re.match(r'^\d+$', line):
            cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines)


def extract_pdf_text_vertex(pdf_path: str) -> Tuple[str, Dict[str, int]]:
    """
    Extract complete text from PDF using pdfplumber (better for tables)
    Returns: (full_text, page_mapping)
    """
    print(f"Extracting text from PDF using pdfplumber...")
    
    full_text = ""
    page_mapping = {}
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            num_pages = len(pdf.pages)
            print(f"Processing {num_pages} pages...")
            
            for page_num, page in enumerate(pdf.pages):
                page_text = page.extract_text()
                if page_text:
                    page_text = clean_text(page_text)
                    full_text += page_text + "\n\n"
                    
                    item_match = re.search(r'ITEM\s+(\d+)', page_text, re.IGNORECASE)
                    if item_match:
                        item_num = int(item_match.group(1))
                        item_key = f"Item {item_num}"
                        if item_key not in page_mapping:
                            page_mapping[item_key] = page_num + 1
                
                if (page_num + 1) % 100 == 0:
                    print(f"  Processed {page_num + 1}/{num_pages} pages...")
        
        print(f"✓ Extracted {len(full_text):,} characters from {num_pages} pages")
        print(f"✓ Found {len(page_mapping)} Item headers")
        
        return full_text, page_mapping
        
    except Exception as e:
        raise Exception(f"PDF extraction failed: {str(e)}")


# ============================================================================
# STEP 2: SMART EXHIBIT DETECTION
# ============================================================================

def extract_item19_data(full_text: str) -> Dict:
    """
    Pre-process Item 19 to detect financial performance data
    Returns: {has_data: bool, raw_text: str, summary: str}
    """
    print("Pre-processing Item 19 for financial performance data...")
    
    # Find Item 19 section (between ITEM 19 and ITEM 20)
    item19_pattern = r'ITEM\s+19.*?(?=ITEM\s+20|$)'
    item19_match = re.search(item19_pattern, full_text, re.IGNORECASE | re.DOTALL)
    
    if not item19_match:
        print("  ⚠ Could not find Item 19 section")
        return {"has_data": False, "raw_text": "", "summary": "Item 19 section not found"}
    
    item19_text = item19_match.group(0)
    
    # Check for the legal phrase indicating financial data EXISTS
    has_data_phrase = "Other than the preceding financial performance representation"
    has_data = has_data_phrase.lower() in item19_text.lower()
    
    if has_data:
        print("  ✓ Found financial performance data (detected 'Other than the preceding' phrase)")
        
        # Extract tables and financial data
        # Look for common patterns: TABLE, Average, Median, Quartile, Gross Sales, Revenue
        table_patterns = [
            r'TABLE\s+\d+[:\s].*?(?=TABLE\s+\d+|Other than|$)',
            r'Average[:\s]+\$[\d,]+',
            r'Median[:\s]+\$[\d,]+',
            r'Top\s+25%',
            r'Bottom\s+25%',
            r'Gross\s+Sales',
            r'Total\s+Revenue'
        ]
        
        found_patterns = []
        for pattern in table_patterns:
            matches = re.findall(pattern, item19_text, re.IGNORECASE | re.DOTALL)
            if matches:
                found_patterns.extend(matches)
        
        summary = f"Item 19 contains financial performance data. Found {len(found_patterns)} data points/tables."
        print(f"  ✓ Extracted {len(found_patterns)} financial data patterns")
        
    else:
        # Check for the "no representations" phrase
        no_data_phrase = "We do not make any representations about a franchisee's future financial performance"
        if no_data_phrase.lower() in item19_text.lower():
            print("  ✓ Confirmed no financial performance data (detected 'We do not make any representations' phrase)")
            summary = "Item 19 states that the franchisor does not make any financial performance representations."
        else:
            print("  ⚠ Could not determine Item 19 status definitively")
            summary = "Item 19 status unclear - manual review recommended"
    
    return {
        "has_data": has_data,
        "raw_text": item19_text,
        "summary": summary
    }


def extract_item20_data(full_text: str) -> Dict:
    """
    Pre-process Item 20 to extract outlet/unit data from tables
    Returns: {total_units, franchised_units, company_owned_units, units_opened, units_closed, raw_text}
    """
    print("Pre-processing Item 20 for outlet/unit data...")
    
    # Find Item 20 section (between ITEM 20 and ITEM 21)
    item20_pattern = r'ITEM\s+20.*?(?=ITEM\s+21|$)'
    item20_match = re.search(item20_pattern, full_text, re.IGNORECASE | re.DOTALL)
    
    if not item20_match:
        print("  ⚠ Could not find Item 20 section")
        return {
            "total_units": None,
            "franchised_units": None,
            "company_owned_units": None,
            "units_opened": None,
            "units_closed": None,
            "raw_text": ""
        }
    
    item20_text = item20_match.group(0)
    
    # Extract unit counts using common patterns
    # Look for tables with columns like: Year, Franchised, Company-Owned, Total
    
    # Pattern 1: Look for "Total" followed by numbers
    total_pattern = r'Total[:\s]+(\d+)'
    total_match = re.search(total_pattern, item20_text, re.IGNORECASE)
    total_units = int(total_match.group(1)) if total_match else None
    
    # Pattern 2: Look for "Franchised" or "Franchise-Owned"
    franchised_pattern = r'Franchis(?:ed|e-Owned)[:\s]+(\d+)'
    franchised_match = re.search(franchised_pattern, item20_text, re.IGNORECASE)
    franchised_units = int(franchised_match.group(1)) if franchised_match else None
    
    # Pattern 3: Look for "Company-Owned" or "Company Owned"
    company_pattern = r'Company[- ]Owned[:\s]+(\d+)'
    company_match = re.search(company_pattern, item20_text, re.IGNORECASE)
    company_owned_units = int(company_match.group(1)) if company_match else None
    
    # Pattern 4: Look for "Opened" in the most recent year
    opened_pattern = r'Opened[:\s]+(\d+)'
    opened_matches = re.findall(opened_pattern, item20_text, re.IGNORECASE)
    units_opened = int(opened_matches[-1]) if opened_matches else None  # Use last occurrence (most recent year)
    
    # Pattern 5: Look for "Closed" or "Terminated"
    closed_pattern = r'(?:Closed|Terminated)[:\s]+(\d+)'
    closed_matches = re.findall(closed_pattern, item20_text, re.IGNORECASE)
    units_closed = int(closed_matches[-1]) if closed_matches else None  # Use last occurrence (most recent year)
    
    if total_units or franchised_units or company_owned_units:
        print(f"  ✓ Extracted unit data: Total={total_units}, Franchised={franchised_units}, Company-Owned={company_owned_units}")
    else:
        print("  ⚠ Could not extract unit counts from Item 20")
    
    return {
        "total_units": total_units,
        "franchised_units": franchised_units,
        "company_owned_units": company_owned_units,
        "units_opened": units_opened,
        "units_closed": units_closed,
        "raw_text": item20_text
    }


def detect_financial_exhibits(full_text: str) -> Dict[str, str]:
    """
    Detect references to financial exhibits in Item 19
    Returns: {exhibit_name: exhibit_text}
    """
    print("Detecting financial exhibits referenced in Item 19...")
    
    # Find Item 19 section
    item19_match = re.search(
        r'ITEM\s+19.*?(?=ITEM\s+20|$)',
        full_text,
        re.IGNORECASE | re.DOTALL
    )
    
    if not item19_match:
        print("⚠ Could not find Item 19 section")
        return {}
    
    item19_text = item19_match.group(0)
    
    # Look for exhibit references
    exhibit_patterns = [
        r'see\s+Exhibit\s+([A-Z])',
        r'refer\s+to\s+Exhibit\s+([A-Z])',
        r'Exhibit\s+([A-Z])\s+attached',
        r'Schedule\s+([A-Z])',
        r'Appendix\s+([A-Z])',
    ]
    
    referenced_exhibits = set()
    for pattern in exhibit_patterns:
        matches = re.findall(pattern, item19_text, re.IGNORECASE)
        referenced_exhibits.update(matches)
    
    print(f"✓ Found {len(referenced_exhibits)} financial exhibits referenced: {referenced_exhibits}")
    
    # Extract exhibit text
    exhibits = {}
    for exhibit_name in referenced_exhibits:
        # Look for the exhibit in the full text
        exhibit_pattern = rf'EXHIBIT\s+{exhibit_name}.*?(?=EXHIBIT\s+[A-Z]|$)'
        exhibit_match = re.search(exhibit_pattern, full_text, re.IGNORECASE | re.DOTALL)
        
        if exhibit_match:
            exhibits[f"Exhibit {exhibit_name}"] = exhibit_match.group(0)
            print(f"  ✓ Extracted Exhibit {exhibit_name}")
    
    return exhibits


def extract_items_1_to_22(full_text: str) -> str:
    """Extract from cover page (beginning) to Item 23 RECEIPT"""
    print("Extracting from cover page to Item 23...")
    
    item23_pattern = r'ITEM\s+23[:\s]+RECEIPT'
    item23_matches = list(re.finditer(item23_pattern, full_text, re.IGNORECASE))
    
    if not item23_matches:
        print("⚠ Could not find Item 23 RECEIPT, trying generic Item 23...")
        # Fallback to generic pattern
        item23_pattern = r'ITEM\s+23'
        item23_matches = list(re.finditer(item23_pattern, full_text, re.IGNORECASE))
        
        if not item23_matches:
            print("⚠ Could not find Item 23, using full text")
            return full_text
    
    # Use the LAST Item 23 found (actual document body, not TOC)
    last_item23 = item23_matches[-1]
    end_pos = last_item23.start()
    
    # Start from position 0 (cover page)
    items_text = full_text[0:end_pos]
    print(f"✓ Extracted from cover page to Item 23 ({len(items_text):,} characters)")
    print(f"  Found {len(item23_matches)} occurrences of Item 23, using the last one at position {end_pos}")
    
    return items_text


# ============================================================================
# STEP 3: GEMINI ANALYSIS
# ============================================================================

def get_access_token():
    """Get Google Cloud access token with correct scope for Vertex AI"""
    credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    
    if credentials_path:
        # Use service account credentials with explicit Vertex AI scope
        credentials = service_account.Credentials.from_service_account_file(
            credentials_path,
            scopes=['https://www.googleapis.com/auth/cloud-platform']
        )
    else:
        # Fall back to default credentials with scope
        credentials, _ = default(scopes=['https://www.googleapis.com/auth/cloud-platform'])
    
    credentials.refresh(Request())
    return credentials.token


def call_deepseek_api(prompt: str, max_tokens: int = 16000) -> Optional[str]:
    """Call Gemini 2.5 Flash-Lite via Vertex AI native endpoint"""
    print(f"Calling Gemini 2.5 Flash-Lite API...")
    
    try:
        # Get access token
        access_token = get_access_token()
        
        # Prepare request
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "maxOutputTokens": max_tokens,
                "temperature": 0.2,  # Lower temperature for more consistent structured output
                "topP": 0.8,
                "topK": 40
            }
        }
        
        print(f"  Sending request to Gemini 2.5 Flash-Lite endpoint...")
        
        # Make request
        response = requests.post(API_ENDPOINT, headers=headers, json=payload, timeout=300)
        response.raise_for_status()
        
        result = response.json()
        text_content = result["candidates"][0]["content"]["parts"][0]["text"]
        
        print(f"✓ Received response ({len(text_content)} chars)")
        return text_content
            
    except requests.exceptions.RequestException as e:
        print(f"✗ API request failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"  Response: {e.response.text[:1000]}")
        return None
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return None


def analyze_fdd(items_text: str, exhibits: Dict[str, str], franchise_name: str, item19_data: Dict, item20_data: Dict) -> Optional[Dict]:
    """
    Analyze FDD using Gemini 2.5 Flash-Lite with the enhanced prompt
    Now includes pre-extracted Item 19 and Item 20 data
    """
    print(f"Analyzing FDD with Gemini 2.5 Flash-Lite...")
    
    prompt_path = Path(__file__).parent / "FDD_ANALYSIS_PROMPT_ENHANCED.md"
    if not prompt_path.exists():
        print(f"⚠ Enhanced prompt not found at {prompt_path}, falling back to simplified")
        prompt_path = Path(__file__).parent / "FDD_ANALYSIS_PROMPT_SIMPLIFIED.md"
    
    with open(prompt_path, 'r') as f:
        analysis_prompt = f.read()
    
    combined_text = items_text
    if exhibits:
        combined_text += "\n\n" + "="*60 + "\n"
        combined_text += "FINANCIAL EXHIBITS REFERENCED IN ITEM 19\n"
        combined_text += "="*60 + "\n\n"
        for exhibit_name, exhibit_text in exhibits.items():
            combined_text += f"\n{exhibit_name}:\n{exhibit_text}\n"
    
    pre_extracted_data = "\n\n" + "="*60 + "\n"
    pre_extracted_data += "PRE-EXTRACTED DATA (Use this to populate your analysis)\n"
    pre_extracted_data += "="*60 + "\n\n"
    
    pre_extracted_data += "ITEM 19 - FINANCIAL PERFORMANCE:\n"
    pre_extracted_data += f"Has Financial Data: {item19_data['has_data']}\n"
    pre_extracted_data += f"Summary: {item19_data['summary']}\n"
    if item19_data['has_data']:
        pre_extracted_data += "\nIMPORTANT: Item 19 contains financial performance data. You MUST extract:\n"
        pre_extracted_data += "- Set has_item19 = true\n"
        pre_extracted_data += "- Extract all tables, averages, medians, quartiles from the Item 19 text below\n"
        pre_extracted_data += "- Populate revenue_data with the extracted financial information\n"
    else:
        pre_extracted_data += "\nItem 19 does not contain financial performance data.\n"
        pre_extracted_data += "- Set has_item19 = false\n"
        pre_extracted_data += "- Set all revenue_data fields to null\n"
    
    pre_extracted_data += "\n\nITEM 20 - OUTLET/UNIT DATA:\n"
    if item20_data['total_units'] or item20_data['franchised_units']:
        pre_extracted_data += f"Total Units: {item20_data['total_units']}\n"
        pre_extracted_data += f"Franchised Units: {item20_data['franchised_units']}\n"
        pre_extracted_data += f"Company-Owned Units: {item20_data['company_owned_units']}\n"
        pre_extracted_data += f"Units Opened (Last Year): {item20_data['units_opened']}\n"
        pre_extracted_data += f"Units Closed (Last Year): {item20_data['units_closed']}\n"
        pre_extracted_data += "\nIMPORTANT: Use these exact values in your analysis.\n"
    else:
        pre_extracted_data += "Could not extract unit data from Item 20 tables.\n"
        pre_extracted_data += "Please manually extract unit counts from the Item 20 text below.\n"
    
    pre_extracted_data += "\n" + "="*60 + "\n\n"
    
    combined_text = pre_extracted_data + combined_text
    
    if len(combined_text) > 150000:
        combined_text = combined_text[:150000]
        print(f"⚠ Truncated text to 150K characters for API")
    
    full_prompt = f"{analysis_prompt}\n\nFDD Content:\n{combined_text}"
    
    print("  Calling Gemini with enhanced prompt and pre-extracted data...")
    response = call_deepseek_api(full_prompt, max_tokens=16000)
    if not response:
        return None
    
    print(f"  Raw response length: {len(response)} chars")
    
    json_text = extract_json_from_response(response)
    
    if not json_text:
        print(f"✗ Could not extract JSON from response")
        save_failed_response(response, "no_json_found")
        return None
    
    print(f"  Extracted JSON length: {len(json_text)} chars")
    print(f"  First 200 chars of JSON: {json_text[:200]}")
    
    try:
        structured_data = json.loads(json_text)
        
        if item19_data['has_data'] and not structured_data.get('has_item19'):
            print("  ⚠ LLM missed Item 19 data, overriding with pre-extracted value")
            structured_data['has_item19'] = True
        
        if item20_data['total_units'] and not structured_data.get('total_units'):
            print("  ⚠ LLM missed unit data, overriding with pre-extracted values")
            structured_data['total_units'] = item20_data['total_units']
            structured_data['franchised_units'] = item20_data['franchised_units']
            structured_data['company_owned_units'] = item20_data['company_owned_units']
            structured_data['units_opened_last_year'] = item20_data['units_opened']
            structured_data['units_closed_last_year'] = item20_data['units_closed']
        
        print(f"✓ Successfully extracted structured data")
        return structured_data
    except json.JSONDecodeError as e:
        print(f"✗ JSON parsing error: {e}")
        print(f"  Error at position {e.pos}: {json_text[max(0, e.pos-50):e.pos+50]}")
        save_failed_response(response, "json_parse_error", json_text)
        return None


def extract_json_from_response(response: str) -> Optional[str]:
    """
    Extract JSON from LLM response using multiple strategies
    """
    # Strategy 1: Look for markdown code blocks
    if "\`\`\`json" in response:
        parts = response.split("\`\`\`json")
        if len(parts) > 1:
            json_part = parts[1].split("\`\`\`")[0].strip()
            if json_part.startswith("{"):
                return json_part
    
    if "\`\`\`" in response:
        parts = response.split("\`\`\`")
        for part in parts:
            part = part.strip()
            if part.startswith("{"):
                # Remove any trailing \`\`\` or text
                if "\`\`\`" in part:
                    part = part.split("\`\`\`")[0]
                return part.strip()
    
    # Strategy 2: Find JSON object boundaries
    # Look for the first { and last }
    first_brace = response.find("{")
    if first_brace == -1:
        return None
    
    # Find matching closing brace
    brace_count = 0
    last_brace = -1
    for i in range(first_brace, len(response)):
        if response[i] == "{":
            brace_count += 1
        elif response[i] == "}":
            brace_count -= 1
            if brace_count == 0:
                last_brace = i
                break
    
    if last_brace == -1:
        return None
    
    json_text = response[first_brace:last_brace+1]
    
    # Strategy 3: Clean up common issues
    # Remove any text before the first {
    json_text = json_text[json_text.find("{"):]
    # Remove any text after the last }
    json_text = json_text[:json_text.rfind("}")+1]
    
    return json_text


def save_failed_response(response: str, error_type: str, extracted_json: str = None):
    """Save failed response for debugging"""
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    filename = f"failed_response_{error_type}_{timestamp}.txt"
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(f"Error Type: {error_type}\n")
        f.write(f"Timestamp: {timestamp}\n")
        f.write("="*70 + "\n\n")
        f.write("ORIGINAL RESPONSE:\n")
        f.write("="*70 + "\n")
        f.write(response)
        f.write("\n\n" + "="*70 + "\n")
        
        if extracted_json:
            f.write("\nEXTRACTED JSON:\n")
            f.write("="*70 + "\n")
            f.write(extracted_json)
            f.write("\n\n" + "="*70 + "\n")
    
    print(f"  Saved failed response to {filename}")

# ============================================================================
# STEP 4: SUPABASE STORAGE
# ============================================================================

def store_in_supabase(data: Dict, franchise_name: str) -> bool:
    """Store franchise data in Supabase"""
    print(f"Storing data in Supabase...")
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("⚠ Supabase credentials not found, skipping database storage")
        return False
    
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        normalized_name = data.get("franchise_name", franchise_name)
        # Convert to title case (e.g., "BURGER KING" -> "Burger King")
        if normalized_name:
            normalized_name = normalized_name.title()
        
        db_data = {
            "name": normalized_name,
            "description": data.get("description"),
            "industry": data.get("industry"),
            "franchise_score": data.get("franchise_score"),
            "score_financial_performance": data.get("score_financial_performance"),
            "score_business_model": data.get("score_business_model"),
            "score_support_training": data.get("score_support_training"),
            "score_legal_compliance": data.get("score_legal_compliance"),
            "score_franchisee_satisfaction": data.get("score_franchisee_satisfaction"),
            "risk_level": data.get("risk_level"),
            "industry_percentile": data.get("industry_percentile"),
            "analytical_summary": data.get("analytical_summary"),
            "opportunities": json.dumps(data.get("opportunities", [])),
            "concerns": json.dumps(data.get("concerns", [])),
            "initial_investment_low": data.get("initial_investment_low"),
            "initial_investment_high": data.get("initial_investment_high"),
            "franchise_fee": data.get("franchise_fee"),
            "royalty_fee": data.get("royalty_fee"),
            "marketing_fee": data.get("marketing_fee"),
            "investment_breakdown": json.dumps(data.get("investment_breakdown", {})),
            "has_item19": data.get("has_item19", False),
            "average_revenue": data.get("average_revenue"),  # Changed from avg_revenue
            "revenue_data": json.dumps(data.get("revenue_data", {})),
            "franchise_score_breakdown": json.dumps(data.get("franchise_score_breakdown", {})),
            "total_units": data.get("total_units"),
            "franchised_units": data.get("franchised_units"),
            "company_owned_units": data.get("company_owned_units"),
            "units_opened_last_year": data.get("units_opened_last_year"),
            "units_closed_last_year": data.get("units_closed_last_year"),
            "litigation_count": data.get("litigation_count", 0),
            "bankruptcy_count": data.get("bankruptcy_count", 0),
            "roi_timeframe": data.get("roi_timeframe"),
            "status": "active"
        }
        
        franchise_name_to_check = normalized_name
        existing = supabase.table("franchises").select("id").ilike("name", franchise_name_to_check).execute()
        
        if existing.data and len(existing.data) > 0:
            # Update existing franchise
            franchise_id = existing.data[0]["id"]
            result = supabase.table("franchises").update(db_data).eq("id", franchise_id).execute()
            print(f"✓ Updated existing franchise in Supabase (ID: {franchise_id})")
        else:
            # Insert new franchise
            result = supabase.table("franchises").insert(db_data).execute()
            print(f"✓ Inserted new franchise into Supabase")
        
        return True
        
    except Exception as e:
        print(f"✗ Supabase storage error: {e}")
        import traceback
        traceback.print_exc()
        return False

# ============================================================================
# STEP 5: VECTOR DATABASE PREPARATION
# ============================================================================

def prepare_for_vector_db(full_text: str, page_mapping: Dict, franchise_name: str) -> List[Dict]:
    """
    Chunk text and prepare for vector database storage
    Returns list of chunks with metadata
    """
    print(f"Preparing text chunks for vector database...")
    
    chunks = []
    
    for item_name, page_num in sorted(page_mapping.items(), key=lambda x: x[1]):
        item_pattern = rf'{item_name}.*?(?=ITEM\s+\d+|$)'
        item_match = re.search(item_pattern, full_text, re.IGNORECASE | re.DOTALL)
        
        if item_match:
            item_text = item_match.group(0)
            
            if len(item_text) > 1000:
                paragraphs = item_text.split('\n\n')
                current_chunk = ""
                
                for para in paragraphs:
                    if len(current_chunk) + len(para) < 1000:
                        current_chunk += para + "\n\n"
                    else:
                        if current_chunk:
                            chunks.append({
                                "franchise_name": franchise_name,
                                "item": item_name,
                                "page": page_num,
                                "text": current_chunk.strip(),
                                "char_count": len(current_chunk)
                            })
                        current_chunk = para + "\n\n"
                
                if current_chunk:
                    chunks.append({
                        "franchise_name": franchise_name,
                        "item": item_name,
                        "page": page_num,
                        "text": current_chunk.strip(),
                        "char_count": len(item_text)
                    })
            else:
                chunks.append({
                    "franchise_name": franchise_name,
                    "item": item_name,
                    "page": page_num,
                    "text": item_text.strip(),
                    "char_count": len(item_text)
                })
    
    print(f"✓ Created {len(chunks)} text chunks for vector database")
    return chunks


# ============================================================================
# MAIN PIPELINE
# ============================================================================

def process_single_pdf(pdf_path: Path) -> bool:
    """
    Complete pipeline for a single PDF
    """
    franchise_name = pdf_path.stem
    output_dir = Path(OUTPUT_DIR) / franchise_name
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n{'='*70}")
    print(f"PROCESSING: {franchise_name}")
    print(f"{'='*70}\n")
    
    try:
        full_text, page_mapping = extract_pdf_text_vertex(str(pdf_path))
        
        with open(output_dir / "full_text.txt", 'w', encoding='utf-8') as f:
            f.write(full_text)
        
        with open(output_dir / "page_mapping.json", 'w') as f:
            json.dump(page_mapping, f, indent=2)
            
    except Exception as e:
        print(f"✗ PDF extraction failed: {e}")
        return False
    
    items_text = extract_items_1_to_22(full_text)
    with open(output_dir / "items_1_to_22.txt", 'w', encoding='utf-8') as f:
        f.write(items_text)
    
    item19_data = extract_item19_data(full_text)
    item20_data = extract_item20_data(full_text)
    
    # Save pre-extracted data for debugging
    with open(output_dir / "item19_preprocessed.json", 'w') as f:
        json.dump(item19_data, f, indent=2)
    with open(output_dir / "item20_preprocessed.json", 'w') as f:
        json.dump(item20_data, f, indent=2)
    
    exhibits = detect_financial_exhibits(full_text)
    if exhibits:
        with open(output_dir / "financial_exhibits.json", 'w') as f:
            json.dump(exhibits, f, indent=2)
    
    analysis_data = analyze_fdd(items_text, exhibits, franchise_name, item19_data, item20_data)
    if not analysis_data:
        print(f"✗ Analysis failed")
        return False
    
    with open(output_dir / "analysis.json", 'w') as f:
        json.dump(analysis_data, f, indent=2)
    
    store_in_supabase(analysis_data, franchise_name)
    
    vector_chunks = prepare_for_vector_db(full_text, page_mapping, franchise_name)
    with open(output_dir / "vector_chunks.json", 'w') as f:
        json.dump(vector_chunks, f, indent=2)
    
    print(f"\n{'='*70}")
    print(f"✓ COMPLETED: {franchise_name}")
    print(f"{'='*70}\n")
    print(f"Results saved to: {output_dir}")
    print(f"  - full_text.txt: Complete PDF text")
    print(f"  - items_1_to_22.txt: Core FDD items")
    print(f"  - item19_preprocessed.json: Pre-extracted Item 19 data")
    print(f"  - item20_preprocessed.json: Pre-extracted Item 20 data")
    print(f"  - financial_exhibits.json: Extracted exhibits")
    print(f"  - analysis.json: Structured analysis")
    print(f"  - vector_chunks.json: Ready for vector DB")
    print(f"  - Supabase: Data stored in database")
    
    return True


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Vertex AI FDD Processing Pipeline")
    parser.add_argument("--pdf", type=str, help="Path to a specific PDF file to process")
    parser.add_argument("--test", action="store_true", help="Run in test mode")
    args = parser.parse_args()
    
    print(f"\n{'='*70}")
    print(f"VERTEX AI COMPLETE FDD PIPELINE")
    print(f"{'='*70}\n")
    print(f"Project: {PROJECT_ID}")
    print(f"Location: {LOCATION}")
    print(f"Model: {MODEL_NAME}")
    print(f"Gemini 2.5 Flash-Lite Endpoint: {API_ENDPOINT}\n")
    
    if args.pdf:
        pdf_file = Path(args.pdf)
        if not pdf_file.exists():
            print(f"✗ PDF file not found: {args.pdf}")
            return
        
        print(f"Input: {pdf_file}")
        print(f"Output: {OUTPUT_DIR}\n")
        
        success = process_single_pdf(pdf_file)
        if success:
            print(f"\n{'='*70}")
            print(f"✓ PIPELINE COMPLETE")
            print(f"{'='*70}\n")
        else:
            print(f"\n{'='*70}")
            print(f"✗ PIPELINE FAILED")
            print(f"{'='*70}\n")
        return
    
    print(f"Input: {PDF_INPUT_DIR}")
    print(f"Output: {OUTPUT_DIR}\n")
    
    pdf_dir = Path(PDF_INPUT_DIR)
    pdf_files = list(pdf_dir.glob("*.pdf"))
    
    if not pdf_files:
        print(f"✗ No PDF files found in {PDF_INPUT_DIR}")
        print(f"  Please add a test PDF to process")
        return
    
    print(f"Found {len(pdf_files)} PDF(s) to process\n")
    
    for pdf_file in pdf_files:
        success = process_single_pdf(pdf_file)
        if not success:
            print(f"✗ Failed to process {pdf_file.name}")
    
    print(f"\n{'='*70}")
    print(f"PIPELINE COMPLETE")
    print(f"{'='*70}\n")


if __name__ == "__main__":
    main()
