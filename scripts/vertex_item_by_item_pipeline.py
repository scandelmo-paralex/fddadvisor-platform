"""
Item-by-Item Vertex AI FDD Processing Pipeline
==============================================
1. Extract full PDF text using pdfplumber
2. Split into 23 individual Items (ITEM 1 through ITEM 23)
3. Analyze each Item separately with Gemini 2.5 Flash-Lite
4. Combine all Item analyses into final structured output
5. Synthesize final analysis (scores, opportunities, concerns, summary)
6. Store in Supabase database
"""

import os
import json
import time
import re
import argparse
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dotenv import load_dotenv
from google.auth import default
from google.auth.transport.requests import Request
from google.oauth2 import service_account
import google.generativeai as genai
import requests
from supabase import create_client, Client
import pdfplumber
import anthropic # Import anthropic for Claude API

load_dotenv()

# ============================================================================
# CONFIGURATION
# ============================================================================

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "fddadvisor-fdd-processing")
LOCATION = os.getenv("DOCUMENT_AI_LOCATION", "us")

# Directories
OUTPUT_DIR = "./pipeline_output"

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Synthesis API configuration
SYNTHESIS_API = os.getenv("SYNTHESIS_API", "claude")  # Options: "gemini" or "claude"
CLAUDE_API_KEY = os.getenv("ANTHROPIC_API_KEY")  # For future Claude integration

# Gemini 2.5 Flash-Lite endpoint configuration
MODEL_LOCATION = os.getenv("MODEL_LOCATION", "us-central1")
API_ENDPOINT = f"https://{MODEL_LOCATION}-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/{MODEL_LOCATION}/publishers/google/models/gemini-2.5-flash-lite:generateContent"
MODEL_NAME = "gemini-2.5-flash-lite"

# ============================================================================
# STEP 1: PDF TEXT EXTRACTION
# ============================================================================

def clean_text(text: str) -> str:
    """Clean extracted text by fixing encoding issues and removing excessive whitespace."""
    text = text.replace('â€™', "'")
    text = text.replace('â€œ', '"')
    text = text.replace('â€', '"')
    text = text.replace('â€"', '-')
    text = text.replace('â€"', '—')
    text = text.replace('Â', '')
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        line = re.sub(r'  +', ' ', line)
        line = line.strip()
        if line and not re.match(r'^\d+$', line):
            cleaned_lines.append(line)
    return '\n'.join(cleaned_lines)


def extract_pdf_text(pdf_path: str) -> str:
    """Extract complete text from PDF using pdfplumber"""
    print(f"Extracting text from PDF using pdfplumber...")
    
    full_text = ""
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            num_pages = len(pdf.pages)
            print(f"Processing {num_pages} pages...")
            
            for page_num, page in enumerate(pdf.pages):
                page_text = page.extract_text()
                if page_text:
                    page_text = clean_text(page_text)
                    full_text += page_text + "\n\n"
                
                if (page_num + 1) % 100 == 0:
                    print(f"  Processed {page_num + 1}/{num_pages} pages...")
        
        print(f"✓ Extracted {len(full_text):,} characters from {num_pages} pages")
        return full_text
        
    except Exception as e:
        raise Exception(f"PDF extraction failed: {str(e)}")


# ============================================================================
# STEP 2: EXTRACT ALL 23 ITEMS
# ============================================================================

def extract_all_items_with_ai(full_text: str) -> Dict[int, str]:
    """
    Use Gemini to intelligently extract Items 1-23 from FDD text.
    Handles any formatting variation.
    """
    print("Extracting all 23 Items with AI...")
    
    text_sample = full_text[:200000]
    
    extraction_prompt = f"""You are an expert at parsing Franchise Disclosure Documents (FDDs).

Extract Items 1-23 from this FDD text. Each Item is a major section that starts with a header like:
- "ITEM 1. THE FRANCHISOR"
- "ITEM 2. BUSINESS EXPERIENCE"
- etc.

For each Item (1-23):
1. Find where the Item header begins
2. Extract ALL text from that header until the next Item header (or end of document for Item 23)
3. Include the Item header itself in the extracted text

CRITICAL RULES:
- Ignore references to Items in other contexts (like "See Item 19")
- Ignore Table of Contents listings
- Only extract the actual Item sections
- If an Item is truly missing, return empty string for that Item number
- Items may span multiple pages
- Items may have the number on ONE line and title on the NEXT line, like:
  ITEM 1
  THE FRANCHISOR AND ANY PARENTS, PREDECESSORS, AND AFFILIATES
  This is still Item 1 - include the full text.

Return ONLY valid JSON in this exact format:
{{
  "items": {{
    "1": "full text of Item 1 including header...",
    "2": "full text of Item 2 including header...",
    ...
    "23": "full text of Item 23 including header..."
  }}
}}

FDD TEXT (first 200,000 characters):
{text_sample}

OUTPUT (valid JSON only):"""

    try:
        # Use the same API method as the rest of the script
        response = call_gemini_api(extraction_prompt, max_tokens=16000)
        
        if not response:
            raise Exception("API call returned None")
        
        # Extract JSON from response
        result = extract_json_from_response(response)
        
        if not result:
            raise Exception("Could not parse JSON from response")

        items_dict = result.get('items', {})
        
        # Convert string keys to integers
        items = {int(k): v for k, v in items_dict.items() if v and v.strip()}
        
        print(f"  ✓ AI extracted {len(items)}/23 Items")
        
        if len(items) < 20:
            print(f"  ⚠ Warning: Only found {len(items)} Items. May need manual review.")
        
        missing = [i for i in range(1, 24) if i not in items]
        if missing:
            print(f"  ⚠ Missing Items: {missing}")
        
        return items
        
    except Exception as e:
        print(f"  ✗ AI extraction failed: {str(e)}")
        print(f"  Falling back to regex extraction...")
        return extract_all_items_regex(full_text)


def extract_all_items_regex(full_text: str) -> Dict[int, str]:
    """
    IMPROVED regex-based extraction v2.0
    Handles multiple FDD formatting styles including:
    - Standard: ITEM 1. THE FRANCHISOR
    - Separate lines: ITEM 1 (newline) THE FRANCHISOR
    - Various punctuation styles
    
    Skips Table of Contents entries.
    """
    print("Extracting Items with improved regex v2.0...")
    
    items = {}
    
    # Known Item title keywords for validation
    ITEM_KEYWORDS = {
        1: ['FRANCHISOR', 'PARENTS', 'PREDECESSORS'],
        2: ['BUSINESS EXPERIENCE', 'EXPERIENCE'],
        3: ['LITIGATION'],
        4: ['BANKRUPTCY'],
        5: ['INITIAL', 'FEES'],
        6: ['OTHER FEES'],
        7: ['ESTIMATED', 'INVESTMENT'],
        8: ['RESTRICTIONS', 'SOURCES', 'PRODUCTS'],
        9: ['FRANCHISEE', 'OBLIGATIONS'],
        10: ['FINANCING'],
        11: ['ASSISTANCE', 'ADVERTISING', 'TRAINING'],
        12: ['TERRITORY'],
        13: ['TRADEMARKS'],
        14: ['PATENTS', 'COPYRIGHTS'],
        15: ['PARTICIPATE', 'OPERATION'],
        16: ['RESTRICTIONS', 'SELL'],
        17: ['RENEWAL', 'TERMINATION', 'TRANSFER'],
        18: ['PUBLIC FIGURES'],
        19: ['FINANCIAL PERFORMANCE', 'EARNINGS'],
        20: ['OUTLETS', 'FRANCHISEE INFORMATION', 'UNITS', 'LICENSEE INFORMATION', 'UNIT INFORMATION'],
        21: ['FINANCIAL STATEMENTS'],
        22: ['CONTRACTS'],
        23: ['RECEIPTS', 'RECEIPT'],
    }
    
    # STEP 1: Find Table of Contents end
    content_start = 0
    
    # Method A: Find last TOC-style entry (ITEM X ..... page number)
    toc_pattern = r'(?i)ITEM\s+\d+.*?\.{2,}\s*\d+\s*$'
    toc_matches = list(re.finditer(toc_pattern, full_text, re.MULTILINE | re.IGNORECASE))
    if toc_matches:
        content_start = toc_matches[-1].end()
        print(f"  Found TOC ending at position {content_start}")
    
    # Method B: If no dotted TOC found, find first ITEM 1 that is a HEADER (not cross-reference)
    if content_start == 0:
        # Pattern: "ITEM 1" at start of line - distinguishes headers from inline cross-references
        
        # First try: ITEM 1 alone on a line (Ace Handyman format)
        item1_alone_pattern = r'(?i)^\s*ITEM\s+1\s*$'
        item1_alone_matches = list(re.finditer(item1_alone_pattern, full_text, re.MULTILINE | re.IGNORECASE))
        
        for match in item1_alone_matches:
            # Validate: next 300 chars should contain Item 1 title keywords
            next_text = full_text[match.end():match.end()+300].upper()
            if any(kw in next_text for kw in ['FRANCHISOR', 'PARENTS', 'PREDECESSORS', 'AFFILIATES']):
                content_start = match.start()
                print(f"  Found Item 1 header (alone pattern) at position {content_start}")
                break
        
        # Second try: ITEM 1 with title on same line (WellBiz format)
        if content_start == 0:
            item1_inline_pattern = r'(?i)^\s*ITEM\s+1[\.\:\s]+[A-Za-z]'
            item1_inline_match = re.search(item1_inline_pattern, full_text, re.MULTILINE | re.IGNORECASE)
            if item1_inline_match:
                content_start = item1_inline_match.start()
                print(f"  Found Item 1 header (inline pattern) at position {content_start}")
    
    # Method C: Ultimate fallback - use first ITEM 1 occurrence
    if content_start == 0:
        first_item1 = re.search(r'ITEM\s+1\b', full_text, re.IGNORECASE)
        if first_item1:
            content_start = first_item1.start()
            print(f"  Fallback: Using first ITEM 1 at position {content_start}")

    content_text = full_text[content_start:]
    
    # STEP 2: Find all Item headers using multiple patterns
    # Pattern 1: ITEM X alone on a line (followed by title on next line)
    pattern_alone = r'(?i)^\s*ITEM\s+(\d+)\s*$'
    
    # Pattern 2: ITEM X followed by title on same line
    pattern_inline = r'(?i)^\s*ITEM\s+(\d+)[\.\:\s]+[A-Za-z]'
    
    item_positions = []  # (item_num, position_in_full_text, pattern_type)
    
    lines = content_text.split('\n')
    current_pos = content_start
    
    for i, line in enumerate(lines):
        line_stripped = line.strip()
        
        # Check for ITEM X alone pattern first
        match_alone = re.match(pattern_alone, line, re.IGNORECASE)
        if match_alone:
            item_num = int(match_alone.group(1))
            if 1 <= item_num <= 23:
                # Validate: next non-empty line should have expected keywords
                is_valid_item = True
                
                # Look at next 3 lines for expected title
                for j in range(1, min(4, len(lines) - i)):
                    next_line = lines[i + j].strip().upper()
                    if next_line:  # Found next non-empty line
                        expected = ITEM_KEYWORDS.get(item_num, [])
                        if expected and not any(kw in next_line for kw in expected):
                            is_valid_item = False
                        break
                
                if is_valid_item:
                    item_positions.append((item_num, current_pos, 'alone'))
        
        # Check for inline pattern if alone didn't match
        elif re.match(pattern_inline, line, re.IGNORECASE):
            match = re.match(pattern_inline, line, re.IGNORECASE)
            item_num = int(match.group(1))
            if 1 <= item_num <= 23:
                item_positions.append((item_num, current_pos, 'inline'))
        
        current_pos += len(line) + 1
    
    # STEP 3: Deduplicate (keep first occurrence of each Item)
    seen = set()
    unique_positions = []
    for item_num, pos, ptype in item_positions:
        if item_num not in seen:
            unique_positions.append((item_num, pos, ptype))
            seen.add(item_num)
    
    unique_positions.sort(key=lambda x: x[1])
    
    print(f"  Found {len(unique_positions)} unique Item headers")
    
    found_items = sorted([x[0] for x in unique_positions])
    missing_items = [i for i in range(1, 24) if i not in found_items]
    if missing_items:
        print(f"  ⚠ Missing Items: {missing_items}")
    
    # STEP 4: Extract text between Items
    for i, (item_num, start_pos, ptype) in enumerate(unique_positions):
        if i + 1 < len(unique_positions):
            end_pos = unique_positions[i + 1][1]
        else:
            end_pos = len(full_text)
        
        item_text = full_text[start_pos:end_pos].strip()
        
        if len(item_text) > 50:
            items[item_num] = item_text
        else:
            print(f"  ⚠ Item {item_num} too short ({len(item_text)} chars), skipping")
    
    print(f"✓ Extracted {len(items)}/23 Items")
    
    return items

# ============================================================================
# STEP 3: ITEM-SPECIFIC PROMPTS
# ============================================================================

def get_item_prompt(item_num: int) -> str:
    """Get the extraction prompt for a specific Item"""
    
    base_requirements = """
ANALYSIS REQUIREMENTS:

FORBIDDEN LANGUAGE - Never use these words:
- Subjective quality: "significant", "impressive", "robust", "strong", "weak", "excellent", "poor"
- Intensity modifiers: "exceptionally", "particularly", "notably", "remarkably", "extremely"
- Comparative judgments: "extensive", "limited", "adequate", "insufficient", "thorough"
- Value assessments: "comprehensive", "detailed", "minimal", "substantial", "considerable"

APPROVED LANGUAGE PATTERNS:
- Quantitative: "X weeks", "Y locations", "Z% of units", "$N investment"
- Descriptive: "includes", "covers", "specifies", "discloses", "states"
- Factual: "Item X provides...", "The document specifies...", "The franchisor discloses..."
- Comparative (with data): "This exceeds the FTC minimum of..." (only for regulatory requirements)

Example of WRONG vs RIGHT analysis:
❌ WRONG: "The franchise offers an impressive 12-week training program with extensive hands-on components."
✅ RIGHT: "Item 11 discloses a 12-week initial training program that includes classroom instruction and hands-on practice."

❌ WRONG: "Unit growth of 15% annually shows strong system expansion."
✅ RIGHT: "Item 20 reports unit count increased from 200 to 230 locations over 12 months (15% growth)."

"""
    
    if item_num == 1:
        return base_requirements + """Extract the following from Item 1 (The Franchisor):
- Franchise brand name (the actual brand name, not the parent company)
- Business description (what the franchise does, products/services offered)
- Industry/category (e.g., "Food Service - Quick Service", "Beauty/Personal Care", "Retail", "Health & Fitness")
- Parent company name (if different from brand name)
- Year the company was founded (year business began operating)
- Year franchising began (CRITICAL: when franchising started, including predecessor history)
- Key business experience of the franchisor

**CRITICAL: PREDECESSOR/ACQUISITION HANDLING**

Many franchises have been acquired. The franchise system's history matters more than ownership changes.

**Look for predecessor language patterns:**
- "franchises were previously offered by [Predecessor] from [Year]"
- "acquired the franchise system from [Company] in [Year]"
- "predecessor began franchising in [Year]"
- "purchased substantially all of the assets of the Franchise System"
- "[Predecessor] offered franchises from [Year] to [Year]"

**Extraction rules:**
1. If predecessor history is mentioned, use the EARLIEST franchise start date
2. Capture both original start date AND acquisition date
3. For scoring, use the ORIGINAL franchise start date (system maturity matters)

**Examples:**

Example 1 - Simple case:
"The franchisor began franchising in 2015"
→ year_franchising_began: 2015
→ predecessor_info: null

Example 2 - Acquisition with predecessor history:
"On July 15, 2021, we purchased the franchise system from Lunchbox Franchise, LLC. Lunchbox offered franchises from March 2013 to July 2021."
→ year_franchising_began: 2013 (use original date)
→ year_acquired: 2021
→ predecessor_name: "Lunchbox Franchise, LLC"
→ predecessor_franchising_years: "2013-2021"

Example 3 - Multiple owners:
"We acquired the system in 2020. The predecessor began franchising in 2008."
→ year_franchising_began: 2008 (use earliest date)
→ year_acquired: 2020

**Why this matters:**
The franchise system's track record (operations manual, business model, brand history) continues through ownership changes. A buyer cares about system maturity, not just current ownership tenure.

Return as JSON:
{
  "franchise_name": "string",
  "description": "string",
  "industry": "string",
  "parent_company": "string or null",
  "year_founded": number,
  "year_franchising_began": number (EARLIEST date if predecessor exists),
  "years_in_franchising": number (calculated: current_year - year_franchising_began),
  "has_predecessor": boolean,
  "predecessor_name": "string or null",
  "year_acquired": number or null (when current owner acquired),
  "predecessor_franchising_years": "string or null" (e.g., "2013-2021"),
  "business_experience": "string (full context including predecessor history)"
}

**Validation:**
- If business_experience mentions predecessor/acquisition but year_franchising_began is recent (2020+), you likely missed the original date
- Re-read the text for phrases like "from [Year]", "since [Year]", "began offering franchises in [Year]"
- Use the EARLIEST franchising date found
"""
    
    elif item_num == 2:
        return base_requirements + """Extract the following from Item 2 (Business Experience):

Extract structured data for EACH executive listed:
- Full name and title
- Years of experience in franchise industry (total, across all companies)
- Years with current franchisor
- Previous franchise brands worked with (if disclosed)
- Industry-specific expertise
- Relevant operational/management background

**SCORING CONTEXT:**
- 10+ years franchise experience = highly experienced
- 5-10 years = experienced
- 2-5 years = developing
- <2 years = limited

Look for phrases like:
- "has X years of franchise experience"
- "previously served at [Brand Name]"
- "held positions at [Company]"
- "experience in franchise operations"

Return as JSON:
{
  "executives": [
    {
      "name": "string",
      "title": "string",
      "franchise_experience_years": number or null,
      "tenure_with_franchisor_years": number or null,
      "previous_franchise_brands": ["string"] or [],
      "industry_expertise": "string",
      "background_summary": "string"
    }
  ],
  "overall_team_assessment": {
    "highly_experienced_count": number (executives with 10+ years franchise experience),
    "experienced_count": number (executives with 5-10 years),
    "limited_experience_count": number (executives with <5 years),
    "has_multi_brand_experience": boolean (any executive worked at other franchise brands)
  }
}"""
    
    elif item_num == 3:
        return base_requirements + """Extract the following from Item 3 (Litigation):

**CRITICAL INSTRUCTIONS:**
1. If Item 3 states "No litigation to report" or similar → this is a POSITIVE clean record
2. Count total litigation cases disclosed
3. For each case, extract:
   - Nature of litigation (franchisee dispute, regulatory, employment, etc.)
   - Parties involved (direct franchisor vs parent/affiliate company)
   - Status (pending, resolved, settled)
   - Recency (when filed/resolved)

**CATEGORIZATION:**
- Direct franchisor litigation: Cases where the franchisor entity itself is named
- Parent/affiliate litigation: Cases involving parent company or related entities
- Franchisee-initiated: Cases brought by current/former franchisees
- Regulatory: Government/agency actions
- Other: Employment, supplier disputes, etc.

Return as JSON:
{
  "has_litigation": boolean,
  "total_cases": number,
  "clean_record": boolean (true if no litigation disclosed),
  "cases": [
    {
      "case_type": "franchisee" | "regulatory" | "employment" | "other",
      "party_involved": "direct_franchisor" | "parent_company" | "affiliate",
      "status": "pending" | "resolved" | "settled",
      "year_filed": number or null,
      "year_resolved": number or null,
      "nature": "string (brief description)",
      "resolution": "string or null"
    }
  ],
  "summary_by_type": {
    "direct_franchisor_cases": number,
    "parent_affiliate_cases": number,
    "franchisee_disputes": number,
    "regulatory_actions": number
  }
}"""
    
    elif item_num == 4:
        return base_requirements + """Extract the following from Item 4 (Bankruptcy):

**CRITICAL INSTRUCTIONS:**
1. If Item 4 states "No bankruptcy to report" or similar → this is a POSITIVE clean record
2. Count total bankruptcy cases disclosed
3. For each case, extract:
   - Entity involved (direct franchisor vs parent/affiliate)
   - Type of bankruptcy (Chapter 7, 11, 13, etc.)
   - Date filed and date resolved/discharged
   - Current status

Return as JSON:
{
  "has_bankruptcy": boolean,
  "total_cases": number,
  "clean_record": boolean (true if no bankruptcy disclosed),
  "cases": [
    {
      "entity": "direct_franchisor" | "parent_company" | "affiliate" | "officer",
      "bankruptcy_type": "string (Chapter 7, 11, etc.)",
      "date_filed": "string or null",
      "date_resolved": "string or null",
      "status": "discharged" | "pending" | "dismissed",
      "description": "string"
    }
  ]
}"""
    
    elif item_num == 5:
        return base_requirements + """Extract the following from Item 5 (Initial Fees):
- Initial franchise fee (amount and when paid)
- Any fee variations (multi-unit discounts, veteran discounts, etc.)
- Refund policy (be explicit about conditions)
- Payment terms and timing

**CRITICAL: Extract refund policy details:**
- Is the fee refundable? Under what conditions?
- Are there any non-refundable portions?
- Time limits on refund requests?

Return as JSON:
{
  "initial_franchise_fee": number,
  "fee_variations": [{"type": "string", "amount": number, "description": "string"}],
  "refund_policy": "string (explicit - 'non-refundable' or conditions for refund)",
  "refundable": boolean,
  "payment_terms": "string (when paid, to whom, method)"
}"""
    
    elif item_num == 6:
        return base_requirements + """Extract the following from Item 6 (Other Fees):
- Royalty fee (percentage or amount, frequency)
- Marketing/advertising fee (percentage or amount, frequency)
- Technology/software fees
- Training fees
- Transfer fees
- Renewal fees
- Any other recurring or one-time fees

**CRITICAL: Extract numeric percentages for Investment Efficiency calculations**

**NEW: Extract calculation methods and refund policies for each fee**

Return as JSON:
{
  "royalty_fee": "string (full description)",
  "royalty_fee_percentage": number or null,
  "royalty_calculation_method": "string (e.g., 'percentage of gross sales', 'flat monthly fee')",
  "marketing_fee": "string (full description)",
  "marketing_fee_percentage": number or null,
  "marketing_calculation_method": "string",
  "technology_fees": "string or null",
  "other_fees": [
    {
      "name": "string",
      "amount": "string",
      "frequency": "string",
      "refundable": boolean or null,
      "calculation_method": "string or null"
    }
  ],
  "total_ongoing_fees_percentage": number (royalty + marketing if both are percentages),
  "fee_refund_policies": "string (summary of any refund provisions across all fees)"
}

**Instructions for percentage extraction:**
- If royalty is "6% of gross sales" → royalty_fee_percentage = 6.0
- If marketing is "2%" → marketing_fee_percentage = 2.0
- If fee is tiered (e.g., "5% for first $500K, 3% thereafter"), use the AVERAGE rate or note as tiered
- If fee is a flat dollar amount (e.g., "$500/month"), set percentage to null
- total_ongoing_fees_percentage = royalty_fee_percentage + marketing_fee_percentage
"""
    
    elif item_num == 7:
        return base_requirements + """Extract the following from Item 7 (Estimated Initial Investment):
- ALL line items from the investment table with low and high ranges
- Facility type (if multiple types, extract all)
- Method of payment for each category
- When payment is due
- To whom payment is made

**NEW REQUIREMENTS:**
1. COUNT the total number of cost categories (needed for scoring: 15+ categories = high detail)
2. Extract any ASSUMPTIONS stated in footnotes or explanatory text
3. Note if payment terms are specified for each category

CRITICAL: Extract EVERY line item from the table, including:
- Franchise Fee, Real Estate, Rent, Security Deposits, Leasehold Improvements
- Equipment, Furniture, Fixtures, Signage, Computer Systems, POS Systems
- Initial Inventory, Supplies, Insurance, Training, Grand Opening
- Legal/Accounting, Licenses/Permits, Working Capital, Additional Funds

Return as JSON:
{
  "total_categories": number (count of line items in table),
  "facility_types": [
    {
      "type": "string",
      "categories": [
        {
          "name": "string",
          "low": number,
          "high": number,
          "method": "string (cash, financing, lease, etc.)",
          "when_due": "string",
          "paid_to": "string"
        }
      ],
      "total_low": number,
      "total_high": number,
      "total_midpoint": number
    }
  ],
  "assumptions_stated": "string (any footnotes or assumptions about the investment ranges)",
  "payment_terms_clarity": "detailed" | "standard" | "minimal"
}

**Calculate midpoint:**
- total_midpoint = (total_low + total_high) ÷ 2

**Scoring context:**
- 15+ categories with detailed assumptions = 30 points
- 10-14 categories with standard detail = 18 points
- <10 categories or minimal detail = 6 points
"""
    
    elif item_num == 11:
        return base_requirements + """Extract the following from Item 11 (Franchisor's Assistance, Advertising, Computer Systems, and Training):

**CRITICAL: Extract STRUCTURED data for scoring:**

**TRAINING (60 points max):**
- Initial training duration in WEEKS (not just "string")
- Training location(s)
- Topics covered (count them)
- Required attendees
- Trainer qualifications
- Ongoing training programs (frequency and type)

**OPERATIONAL SUPPORT (48 points max):**
- Field representative visits (FREQUENCY - e.g., "quarterly", "monthly", "4 times per year")
- Support hotline/helpdesk (HOURS - e.g., "24/7", "business hours", "M-F 9-5")
- Technology systems provided
- Operations manual (provided? how often updated?)
- Marketing support specifics
- Regional/national meetings (frequency)

**Scoring context:**
Training:
- 2+ weeks initial + ongoing = 60 points
- 1-2 weeks + basic ongoing = 36 points
- <1 week or minimal = 12 points

Support:
- Field visits + 24/7 hotline + tech systems + updated manual = 48 points
- Hotline + periodic visits + basic systems = 30 points
- Minimal assistance = 12 points

Return as JSON:
{
  "pre_opening_assistance": "string",
  "initial_training": {
    "duration_weeks": number or null (extract number of weeks),
    "duration_hours": number or null (extract total hours if specified),
    "duration_description": "string (original text)",
    "location": "string",
    "topics": ["string"],
    "topics_count": number,
    "required_attendees": "string",
    "trainer_qualifications": "string or null",
    "cost_covered_by": "franchisor" | "franchisee" | "shared" | "not specified"
  },
  "ongoing_training": {
    "available": boolean,
    "frequency": "string (e.g., 'quarterly', 'annual', 'as needed')",
    "types": ["string (e.g., 'webinars', 'regional meetings', 'online courses')"],
    "description": "string"
  },
  "field_support": {
    "provided": boolean,
    "visit_frequency": "string (e.g., 'quarterly', 'monthly', '4 times annually')",
    "representative_ratio": "string or null (e.g., '1 rep per 20 franchisees')",
    "description": "string"
  },
  "support_hotline": {
    "available": boolean,
    "hours": "string (e.g., '24/7', 'M-F 8am-6pm EST', 'business hours')",
    "contact_methods": ["phone" | "email" | "portal" | "chat"]
  },
  "technology_systems": {
    "pos_system": "string or null",
    "software_provided": ["string"],
    "ongoing_tech_support": "string or null"
  },
  "operations_manual": {
    "provided": boolean,
    "format": "string (physical, digital, online portal)",
    "update_frequency": "string or null (e.g., 'quarterly', 'as needed')",
    "page_count": number or null
  },
  "advertising_support": "string",
  "conferences_conventions": "string or null"
}"""
    
    elif item_num == 12:
        return base_requirements + """Extract the following from Item 12 (Territory):

**CRITICAL: Territory protection is scored 0-42 points based on:**
- Protected exclusive territory with clear boundaries = 42 points
- Protected territory with e-commerce/online exceptions = 24 points
- No territorial protection = 6 points

**Extract:**
1. Geographic territory definition (radius, population, ZIP codes, counties, etc.)
2. Exclusivity provisions (is territory exclusive or non-exclusive?)
3. E-commerce and online sales restrictions
4. Franchisor's reserved rights within territory
5. Competition from other franchisees allowed or restricted
6. Mobile/delivery service restrictions
7. Relocation rights

Look for key phrases:
- "exclusive territory"
- "protected territory"
- "minimum territory"
- "population requirements"
- "e-commerce sales"
- "online ordering"
- "delivery services"
- "mobile operations"

Return as JSON:
{
  "has_territory_protection": boolean,
  "exclusive_territory": boolean,
  "territory_definition": {
    "type": "radius" | "population" | "zip_codes" | "geographic_area" | "none",
    "radius_miles": number or null,
    "minimum_population": number or null,
    "description": "string"
  },
  "exclusivity_provisions": "string (what is protected)",
  "exceptions_to_exclusivity": {
    "ecommerce_sales": "franchisor_reserved" | "restricted" | "not_mentioned",
    "online_ordering": "franchisor_reserved" | "restricted" | "not_mentioned",
    "mobile_services": "allowed" | "restricted" | "not_mentioned",
    "delivery_services": "franchisor_reserved" | "restricted" | "not_mentioned",
    "other_exceptions": ["string"]
  },
  "franchisor_reserved_rights": "string (what can franchisor do in territory)",
  "other_franchisee_competition": "prohibited" | "allowed" | "conditional" | "not_specified",
  "relocation_rights": "string or null",
  "territory_scoring_category": "exclusive_protected" | "limited_protection" | "no_protection"
}"""
    
    elif item_num == 17:
        return base_requirements + """Extract the following from Item 17 (Renewal, Termination, Transfer and Dispute Resolution):
Extract the table showing franchisee and franchisor rights for:
- Renewal terms and conditions
- Termination rights (by franchisor and franchisee)
- Transfer/assignment rights and restrictions
- Dispute resolution procedures (mediation, arbitration, litigation)
- Non-compete clauses
- Post-termination obligations

Return as JSON:
{
  "renewal": {
    "term_length": "string (e.g., '10 years')",
    "conditions": ["string"],
    "fees": "string (renewal fee amount or 'none')",
    "franchisee_must_sign_current_agreement": boolean or null
  },
  "termination_by_franchisor": ["string (list of conditions allowing termination)"],
  "termination_by_franchisee": ["string (list of conditions)"],
  "transfer_rights": {
    "allowed": boolean,
    "conditions": ["string"],
    "transfer_fee": "string or null",
    "franchisor_approval_required": boolean or null,
    "training_required_for_transferee": boolean or null
  },
  "dispute_resolution": {
    "mediation": "required" | "optional" | "not_mentioned",
    "mediation_details": "string or null",
    "arbitration": "required" | "optional" | "not_mentioned",
    "arbitration_details": "string or null",
    "litigation_allowed": boolean or null,
    "governing_law": "string (state/jurisdiction)",
    "venue": "string or null"
  },
  "non_compete": {
    "applies": boolean,
    "duration": "string (e.g., '2 years')",
    "geographic_scope": "string (e.g., 'within 10 miles')",
    "activities_restricted": "string"
  },
  "post_termination_obligations": ["string"]
}"""
    
    elif item_num == 19:
        return base_requirements + """Extract the following from Item 19 (Financial Performance Representations):

STEP 1: Check the LAST paragraph of Item 19
- If it starts with "Other than the preceding financial performance representation"
  → Financial data EXISTS (has_data = true)
- If it contains "We do not make any representations about a franchisee's future financial performance"
  → NO financial data (has_data = false)

STEP 2: If has_data = true, extract ALL financial tables and data:
- Number of outlets analyzed
- Time period covered
- Average revenue/sales
- Median revenue/sales
- Revenue ranges (high, low)
- Distribution breakdowns (top performers, quartiles, bottom performers)
- Percentage of outlets achieving results
- Any other financial metrics (profit, EBITDA, etc.)
- Member counts, transaction data, or other performance metrics

CRITICAL - DISTRIBUTION DATA PATTERNS:
Franchises use different terminology for performance distribution. Recognize ALL these patterns:

**TOP PERFORMERS (map to "top_25_percent"):**
- "Top 10", "Top 10%"
- "Top 25%", "Top Quartile"
- "Top Third", "Top 3rd", "Upper Third"
- "Highest Performing", "Top Performers"

**UPPER-MIDDLE PERFORMERS (map to "third_quartile"):**
- "Top 3rd", "Top Third"
- "3rd Quartile", "Third Quartile"
- "Upper Middle", "Above Average"
- "75th Percentile"

**LOWER-MIDDLE PERFORMERS (map to "second_quartile"):**
- "Bottom 3rd", "Bottom Third"
- "2nd Quartile", "Second Quartile"
- "Middle Third", "Middle Performers"
- "Median", "50th Percentile"
- "Below Average"

**BOTTOM PERFORMERS (map to "bottom_25_percent"):**
- "Bottom 10", "Bottom 10%"
- "Bottom 25%", "Bottom Quartile"
- "Bottom Third", "Lower Third"
- "Lowest Performing", "Bottom Performers"

CRITICAL - MULTI-COLUMN TABLE HANDLING:
Some franchises use complex tables with multiple cohorts. Common formats:

FORMAT A - Age/Performance Cohort Tables:
Tables with columns like: "Top 10 | Top 3rd | Bottom 3rd | Bottom 10 | All Studios | >1 Year | >3 Years"

For these tables:
1. Identify the "All Studios" or "All Outlets" or "System-Wide" column (usually middle of table)
2. Extract values from THAT column as the primary system-wide data for median/average
3. Extract Top 10/Top 3rd values as distribution data (map to top_25_percent and third_quartile)
4. Extract Bottom 3rd/Bottom 10 values as distribution data (map to second_quartile and bottom_25_percent)
5. Parse the row/column intersection carefully

Example: If you see a row like:
"2024 Median Revenue    $1,725,271  $1,224,387  $506,919  $286,420  $779,778  $798,418  $872,830"

And column headers are: "Top 10 | Top 3rd | Bottom 3rd | Bottom 10 | All Studios | >1 Year | >3 Years"

Then extract:
- median (from All Studios column): 779778
- top_25_percent (from Top 10 column): 1725271
- third_quartile (from Top 3rd column): 1224387
- second_quartile (from Bottom 3rd column): 506919
- bottom_25_percent (from Bottom 10 column): 286420

FORMAT B - Simple Tables:
Single column or simple structure. Extract directly without cohort mapping.

PARSING NUMBERS:
- Remove $ signs, commas, and spaces
- "$1,224,387" → 1224387
- "$779,778" → 779778
- "26.0%" → 26.0

Look for table patterns like:
- "TABLE 1", "TABLE 2", "Schedule A", "Schedule 1"
- Row headers: "Average:", "Median:", "Range:", "High:", "Low:"
- "Top 25%", "3rd Quartile", "2nd Quartile", "Bottom 25%"
- "Gross Sales", "Total Revenue", "Net Income", "EBITDA"

**CRITICAL: Extract distribution data even if terminology differs from standard quartiles**

Return as JSON:
{
  "has_data": boolean,
  "outlets_analyzed": number or null,
  "sample_size_percentage": number or null (if total system size known),
  "time_period": "string" or null,
  "table_format": "multi_column_cohort" | "simple" | "geographic" | null,
  "median_revenue": number or null,
  "average_revenue": number or null,
  "highest_revenue": number or null,
  "lowest_revenue": number or null,
  "has_profitability_data": boolean (true if profit/EBITDA/net income disclosed),
  "tables": [
    {
      "table_name": "string",
      "metric": "string (e.g., '2024 Average Revenue', '2024 Median Revenue')",
      "average": number or null,
      "median": number or null,
      "high": number or null,
      "low": number or null,
      "top_25_percent": number or null (from Top 10, Top 25%, or Top Third columns),
      "third_quartile": number or null (from Top 3rd, 3rd Quartile, or Upper Third columns),
      "second_quartile": number or null (from Bottom 3rd, 2nd Quartile, or Middle columns),
      "bottom_25_percent": number or null (from Bottom 10, Bottom 25%, or Bottom Third columns),
      "percent_achieving": number or null (% of outlets meeting benchmark),
      "all_studios_value": number or null (value from All Studios/System-Wide column),
      "year_over_year_trend": "increasing" | "stable" | "decreasing" | "not_applicable"
    }
  ],
  "notes": "string",
  "disclosure_quality": "detailed" | "partial" | "minimal",
  "has_distribution_data": boolean (true if ANY quartile/cohort data extracted)
}

**EXTRACTION PRIORITY:**
1. First, find the "All Studios" or system-wide column for median/average
2. Then, extract distribution data from cohort columns (Top 10, Top 3rd, Bottom 10, Bottom 3rd)
3. Map cohort terminology to standard quartile fields
4. Set has_distribution_data = true if ANY top/bottom performer data found

**IMPORTANT:** 
- Focus on extracting actual numeric values, not just table structure
- The synthesis step needs real numbers to score properly
- Distribution data is critical for scoring - extract ALL cohort breakdowns
- Don't miss distribution data just because column names differ from "Top 25%" or "3rd Quartile"
"""
    
    elif item_num == 20:
        return base_requirements + """Extract the following from Item 20 (Outlets and Franchisee Information):

Extract the outlet/unit tables showing:
- Total outlets (franchised + company-owned)
- Franchised outlets
- Company-owned outlets
- Outlets opened in the last 3 years
- Outlets closed in the last 3 years
- Transfers in the last 3 years
- States/provinces where outlets are located

Look for tables with columns like:
- Year, Franchised, Company-Owned, Total
- Outlets at Start of Year, Opened, Closed, Transfers, Outlets at End of Year

CRITICAL: Extract the MOST RECENT year's data (usually the last row of the table)

**NEW REQUIREMENTS:**
1. Extract TRANSFERS data (needed for turnover calculations)
2. Extract 3-year historical data for trend analysis
3. Calculate closure rate = (units_closed / total_units) × 100
4. Note any franchisee expansion (multi-unit ownership) mentioned

Return as JSON:
{
  "current_year": number,
  "total_outlets": number,
  "franchised_outlets": number,
  "company_owned_outlets": number,
  "outlets_opened_last_year": number,
  "units_closed_last_year": number,
  "transfers_last_year": number,
  "reacquisitions_last_year": number or null (units bought back by franchisor),
  "closure_rate": number (calculated: units_closed / total_units × 100),
  "states": ["string"],
  "historical_data": [
    {
      "year": number,
      "total": number,
      "franchised": number,
      "company_owned": number,
      "opened": number,
      "closed": number,
      "transfers": number or null,
      "reacquisitions": number or null,
      "net_growth": number (opened - closed)
    }
  ],
  "three_year_trend": "growing" | "stable" | "declining",
  "multi_unit_ownership_mentioned": boolean,
  "multi_unit_details": "string or null (any info about franchisees owning multiple units)"
}"""
    
    # Simple Items with basic extraction
    else:
        return base_requirements + f"""Extract the key information from Item {item_num}.
Identify the main points, requirements, obligations, and any important details.
Return as JSON with relevant fields based on the content."""


# ============================================================================
# STEP 4: GEMINI API
# ============================================================================

def get_access_token():
    """Get Google Cloud access token"""
    credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    
    if credentials_path:
        credentials = service_account.Credentials.from_service_account_file(
            credentials_path,
            scopes=['https://www.googleapis.com/auth/cloud-platform']
        )
    else:
        credentials, _ = default(scopes=['https://www.googleapis.com/auth/cloud-platform'])
    
    credentials.refresh(Request())
    return credentials.token


def call_gemini_api(prompt: str, max_tokens: int = 8000) -> Optional[str]:
    """Call Gemini 2.5 Flash-Lite via Vertex AI"""
    
    try:
        access_token = get_access_token()
        
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
                "temperature": 0.1,  # Very low for consistent structured output
                "topP": 0.8,
                "topK": 40
            }
        }
        
        response = requests.post(API_ENDPOINT, headers=headers, json=payload, timeout=120)
        response.raise_for_status()
        
        result = response.json()
        text_content = result["candidates"][0]["content"]["parts"][0]["text"]
        
        return text_content
            
    except Exception as e:
        print(f"  ✗ API error: {e}")
        return None


def call_claude_api(prompt: str, max_tokens: int = 8000) -> Optional[str]:
    """Call Claude API as fallback for Item 19 extraction"""
    
    if not CLAUDE_API_KEY:
        print(f"  ✗ CLAUDE_API_KEY not configured")
        return None
    
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=CLAUDE_API_KEY)
        
        # Use a recent, suitable Claude model. 'claude-sonnet-4-20250514' is a good choice.
        # Ensure max_tokens is appropriate for the model and task.
        message = client.messages.create(
            model="claude-sonnet-4-20250514", 
            max_tokens=max_tokens,
            temperature=0.1,
            messages=[{"role": "user", "content": prompt}]
        )
        
        # Accessing the text content might vary slightly based on the anthropic library version.
        # For newer versions, it's typically message.content[0].text
        if message and message.content:
            return message.content[0].text
        else:
            print("  ✗ Claude API returned an empty message or content.")
            return None
            
    except Exception as e:
        print(f"  ✗ Claude API error: {e}")
        return None


def extraction_failed(analysis: Optional[Dict]) -> bool:
    """Check if Item 19 extraction failed (all key revenue fields are null)"""
    if not analysis:
        return True
    
    # Check for top-level fields first
    if analysis.get('median_revenue') or analysis.get('average_revenue') or analysis.get('highest_revenue') or analysis.get('lowest_revenue'):
        return False
    
    tables = analysis.get('tables', [])
    if not tables:
        return True
    
    # If all tables have null median/average/all_studios, it failed
    for table in tables:
        if table.get('median') or table.get('average') or table.get('all_studios_value'):
            return False  # Found at least one value
    
    return True  # All nulls = failure


def extract_item_19_with_fallback(item_text: str, output_dir: Path) -> Optional[Dict]:
    """Extract Item 19 with Claude fallback if Gemini fails"""
    
    # Get Item 19 prompt
    item_prompt = get_item_prompt(19)
    full_prompt = f"{item_prompt}\n\nItem 19 Text:\n{item_text}"
    
    # Try Gemini first (cheaper, 90%+ success rate)
    print(f"  Analyzing Item 19 with Gemini...")
    response = call_gemini_api(full_prompt)
    
    if response:
        analysis = extract_json_from_response(response)
        
        # Check if extraction failed (all nulls)
        if not extraction_failed(analysis):
            print(f"    ✓ Gemini extraction successful")
            return analysis
        
        print(f"    ⚠ Gemini extraction failed (all revenue fields null)")
    else:
        print(f"    ✗ Gemini API call failed")
    
    # Fallback to Claude (more expensive but potentially more reliable for complex JSON)
    print(f"  Retrying Item 19 with Claude...")
    claude_response = call_claude_api(full_prompt)
    
    if not claude_response:
        print(f"    ✗ Claude API call failed")
        # Save failed response for manual inspection, prioritizing Gemini's response if it existed
        try:
            with open(output_dir / f"item_19_failed_response.txt", 'w', encoding='utf-8') as f:
                f.write(response or "No response from Gemini or Claude.")
            print(f"    [DEBUG] Failed response saved to: {output_dir / 'item_19_failed_response.txt'}")
        except Exception as e:
            print(f"    [DEBUG] Could not save failed response: {e}")
        return None
    
    claude_analysis = extract_json_from_response(claude_response)
    if not claude_analysis:
        print(f"    ✗ Could not extract JSON from Claude response")
        return None
    
    print(f"    ✓ Claude extraction successful")
    return claude_analysis


def extract_json_from_response(response: str) -> Optional[Dict]:
    """Extract JSON from Gemini response"""
    json_text = response.strip()
    
    # Remove markdown code blocks if present
    if json_text.startswith('\`\`\`json'):
        json_text = json_text[7:]
    elif json_text.startswith('\`\`\`'):
        json_text = json_text[3:]
    if json_text.endswith('\`\`\`'):
        json_text = json_text[:-3]
    
    json_text = json_text.strip()
    
    # Find the outermost JSON object
    brace_count = 0
    start_index = -1
    end_index = -1
    
    for i, char in enumerate(json_text):
        if char == '{':
            if start_index == -1:
                start_index = i
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            if brace_count == 0 and start_index != -1:
                end_index = i
                break
    
    if start_index == -1 or end_index == -1:
        print(f"  ✗ Could not find valid JSON object in response.")
        return None
    
    json_text = json_text[start_index : end_index + 1]
    
    try:
        return json.loads(json_text)
    except json.JSONDecodeError as e:
        print(f"  ✗ JSON parse error: {e}")
        # Attempt to fix common issues like trailing commas
        try:
            # A common fix is to remove trailing commas before closing braces/brackets
            json_text = re.sub(r',\s*([\}\]])', r'\1', json_text)
            return json.loads(json_text)
        except json.JSONDecodeError as e2:
            print(f"  ✗ JSON parse error after fix attempt: {e2}")
            return None


WELLBIZ_BRANDS_DATA = {
    "brands": [
        "Drybar",
        "Elements Massage",
        "Elements Therapeutic Massage",
        "Radiant Waxing",
        "Amazing Lash",
        "Amazing Lash Studio",
        "Fitness Together"
    ],
    "portfolio_entities": [ # Known parent or related entities for portfolio companies
        "wellbiz brands", "wellbiz"
    ]
}

def is_wellbiz_brand(franchise_name: str) -> bool:
    """Check if franchise is a WellBiz brand"""
    name_lower = franchise_name.lower()
    return any(brand.lower() in name_lower for brand in WELLBIZ_BRANDS_DATA["brands"])

def is_wellbiz_entity(text: str) -> bool:
    """Check if text mentions known WellBiz portfolio entities"""
    text_lower = text.lower()
    return any(entity.lower() in text_lower for entity in WELLBIZ_BRANDS_DATA["portfolio_entities"])

def extract_territory_score_from_formula(formula_used: str) -> int:
    """
    Extract the numeric score from formula_used string for Territory Protection.
    
    Examples:
    - "Limited protection... = 24 points" → 24
    - "Protected territory with exceptions = 24 points" → 24
    """
    if not formula_used:
        return None
    
    # Look for pattern: "= XX points" or "= XX."
    match = re.search(r'=\s*(\d+)\s*points?', formula_used, re.IGNORECASE)
    if match:
        return int(match.group(1))
    
    return None


def analyze_territory_protection(explanation: str) -> dict:
    """
    Analyze the explanation to determine actual territory protection level.
    
    Returns dict with:
    - has_defined_territory: bool
    - is_exclusive: bool
    - has_ecommerce_exception: bool
    - has_other_exceptions: bool
    - no_protection: bool
    - protection_level: "none" | "limited" | "protected" | "exclusive"
    """
    explanation_lower = explanation.lower()
    
    # Check for territory definition
    has_defined_territory = any(term in explanation_lower for term in [
        'protected area', 'protected territory', 'exclusive territory',
        'radius', 'population', 'geographic'
    ])
    
    # Check for exclusivity
    is_exclusive = any(term in explanation_lower for term in [
        'exclusive', 'exclusivity stated', 'no competition from franchisor'
    ]) and 'no exclusivity' not in explanation_lower
    
    # Check for e-commerce exceptions
    has_ecommerce_exception = any(term in explanation_lower for term in [
        'e-commerce', 'online sales', 'internet sales', 'digital channels',
        'ecommerce', 'web sales'
    ])
    
    # Check for other exceptions
    has_other_exceptions = any(term in explanation_lower for term in [
        'exceptions', 'reserves rights', 'captive market', 'other channels',
        'mail order', 'special events', 'different marks', 'other concepts',
        'other distribution', 'franchisor operates'
    ])
    
    # Check for no protection
    no_protection = any(term in explanation_lower for term in [
        'no territorial restrictions', 'no protection', 'franchisor can compete',
        'no exclusivity', 'no territorial rights'
    ])
    
    # Determine protection level
    if no_protection or not has_defined_territory:
        protection_level = "none"
    elif is_exclusive and not has_ecommerce_exception and not has_other_exceptions:
        protection_level = "exclusive"
    elif has_defined_territory and not has_ecommerce_exception and not has_other_exceptions:
        protection_level = "protected"
    else:
        protection_level = "limited"
    
    return {
        "has_defined_territory": has_defined_territory,
        "is_exclusive": is_exclusive,
        "has_ecommerce_exception": has_ecommerce_exception,
        "has_other_exceptions": has_other_exceptions,
        "no_protection": no_protection,
        "protection_level": protection_level
    }


def calculate_correct_territory_score(analysis: dict) -> int:
    """
    Calculate the correct score based on protection level analysis.
    
    Scoring rubric from FranchiseScore 2.0:
    - 42 points: Protected exclusive territory (full protection)
    - 36 points: Protected territory but not explicitly exclusive
    - 24 points: Limited protection (exceptions exist)
    - 6 points: No protection
    """
    protection_level = analysis['protection_level']
    
    if protection_level == "exclusive":
        # Full exclusive territory with no exceptions
        return 42
    
    elif protection_level == "protected":
        # Protected territory but not explicitly exclusive
        # OR minor exceptions only
        return 36
    
    elif protection_level == "limited":
        # Protected territory WITH exceptions (e-commerce, other channels)
        # This is the most common for WellBiz brands
        return 24
    
    else:  # "none"
        # No territorial restrictions
        return 6


def generate_territory_rationale(analysis: dict, score: int) -> str:
    """
    Generate neutral, factual rationale for the Territory Protection score.
    
    Must follow FranchiseScore 2.0 neutral language requirements.
    """
    protection_level = analysis['protection_level']
    
    if protection_level == "exclusive":
        rationale = "Item 12 defines protected exclusive territory with clear geographic boundaries. "
        rationale += "Exclusivity stated explicitly with no online competition from franchisor in territory "
        rationale += "and restrictions on other franchisees in territory."
    
    elif protection_level == "protected":
        rationale = "Item 12 defines protected territory with clear geographic boundaries. "
        rationale += "Some protection provided but exclusivity not explicitly stated or minor exceptions noted."
    
    elif protection_level == "limited":
        rationale = "Item 12 defines protected territory "
        
        exceptions = []
        if analysis['has_ecommerce_exception']:
            exceptions.append("franchisor e-commerce sales")
        if analysis['has_other_exceptions']:
            exceptions.append("other distribution channels")
        
        if exceptions:
            rationale += "but excludes " + " and ".join(exceptions) + " within the territory. "
            rationale += "Franchisor reserves rights for captive market locations and other concepts within protected area."
        else:
            rationale += "with certain limitations on exclusivity."
    
    else:  # "none"
        rationale = "Item 12 discloses no territorial restrictions. "
        rationale += "Franchisor can compete freely and other franchisees can compete in territory."
    
    return rationale.strip()


def validate_and_fix_scores(combined_data: Dict, synthesis: Dict) -> Dict:
    """
    Validate and fix FranchiseScore calculations to ensure they match the methodology.
    This function overrides Gemini's scoring mistakes with correct calculations.
    
    Returns corrected synthesis with debug messages printed.
    """
    import re
    
    print("  [VALIDATION] Checking scores match formulas...")
    
    fixes = []
    
    # Helper function for ratings
    def get_rating(score: int, max_score: int) -> str:
        """Convert score to rating"""
        if max_score == 0: # Avoid division by zero
            return "N/A"
        percentage = (score / max_score) * 100
        if percentage >= 90:
            return "Excellent"
        elif percentage >= 70:
            return "Good"
        elif percentage >= 50:
            return "Fair"
        else:
            return "Poor"
    
    # ========================================================================
    # DIMENSION 2: SYSTEM STRENGTH - Clean Record Fix with Portfolio Company Support & Recency
    # ========================================================================
    
    sys_metrics = synthesis.get('franchise_score_breakdown', {}).get('system_strength', {}).get('metrics', [])
    clean_record_metric = next((m for m in sys_metrics if m['metric_name'] == 'Clean Record'), None)
    
    if clean_record_metric:
        item3_data = combined_data.get('all_items', {}).get(3, {})
        franchise_name = combined_data.get('franchise_name', '')
        
        if item3_data and franchise_name:
            cases = item3_data.get('cases', [])
            
            # Count cases if: (1) Filed within last 3 years, OR (2) Filed 4+ years ago but still ongoing/pending
            current_year = 2025 # Assume current year for recency checks
            recent_cases = []
            
            for case in cases:
                year_filed = case.get('year_filed')
                status = case.get('status', '').lower()
                
                if not year_filed:
                    # If year not available, include it to be conservative
                    recent_cases.append(case)
                    continue
                
                years_ago = current_year - year_filed
                
                # Rule 1: Filed within last 3 years
                if years_ago <= 3:
                    recent_cases.append(case)
                    continue
                
                # Rule 2: Filed 4+ years ago BUT still ongoing/pending
                if status in ['ongoing', 'pending', 'active', 'in progress']:
                    recent_cases.append(case)
                    continue
            
            # Categorize cases
            direct_cases = 0
            affiliate_cases = 0
            total_recent = len(recent_cases)

            if is_wellbiz_brand(franchise_name):
                for case in recent_cases:
                    party_info_str = f"{case.get('nature', '')} {case.get('party_involved', '')}".lower()
                    if franchise_name.lower() in party_info_str:
                        direct_cases += 1
                    elif is_wellbiz_entity(party_info_str):
                        affiliate_cases += 1
                    else: # Default if can't determine and not clearly affiliate
                        direct_cases += 1
            else: # Non-portfolio companies
                for case in recent_cases:
                    party = case.get('party_involved', 'direct_franchisor')
                    if 'affiliate' in party.lower() or 'parent' in party.lower():
                        affiliate_cases += 1
                    else:
                        direct_cases += 1

            # Apply scoring tiers
            correct_score = 0
            if total_recent == 0:
                correct_score = 42
            elif total_recent <= 2:
                if affiliate_cases == total_recent:
                    correct_score = 40  # Only affiliate cases
                elif total_recent == 1:
                    correct_score = 38  # 1 direct case
                else: # 2 cases total
                    correct_score = 36  # Mix or 2 direct
            elif total_recent <= 5:
                if direct_cases <= 1:
                    correct_score = 28 # Mostly affiliate
                elif direct_cases <= 2:
                    correct_score = 26
                else: # 3+ direct cases
                    correct_score = 25
            else: # 6+ cases
                if direct_cases <= 2:
                    correct_score = 15  # Mostly affiliate
                elif direct_cases <= 4:
                    correct_score = 10
                else: # 5+ direct cases
                    correct_score = 5

            # Update metric if score differs
            if clean_record_metric['score'] != correct_score:
                old_score = clean_record_metric['score']
                clean_record_metric['score'] = correct_score
                clean_record_metric['rating'] = get_rating(correct_score, 42)
                
                # Update explanation with tier-based rationale
                total_cases = len(cases)
                
                explanation = f"Items 3-4 disclose {total_recent} recent litigation case(s) filed within last 3 years or still ongoing: "
                explanation += f"{direct_cases} direct franchisor, {affiliate_cases} affiliate. "
                if total_cases > total_recent:
                    explanation += f"({total_cases - total_recent} older case(s) not scored). "
                
                # Add tier explanation
                if total_recent == 0:
                    explanation += "No recent or ongoing cases found. Clean record = 42 points."
                elif total_recent <= 2:
                    explanation += f"Tier: 1-2 cases (35-40 points). Score: {correct_score} points."
                elif total_recent <= 5:
                    explanation += f"Tier: 3-5 cases (25-30 points). Score: {correct_score} points."
                else:
                    explanation += f"Tier: 6+ cases (0-20 points). Score: {correct_score} points."
                
                clean_record_metric['explanation'] = explanation
                fixes.append(f"Clean Record: {old_score} → {correct_score}")
    
    # ========================================================================
    # DIMENSION 2: SYSTEM STRENGTH - System Growth Pattern Fix
    # ========================================================================
    
    growth_metric = next((m for m in sys_metrics if m['metric_name'] == 'System Growth Pattern'), None)
    
    if growth_metric:
        item20_data = combined_data.get('all_items', {}).get(20, {})
        
        if item20_data:
            # Extract key metrics from Item 20
            total_units = item20_data.get('total_outlets', 0) or item20_data.get('total_units', 0) or 0
            units_closed = item20_data.get('units_closed_last_year', 0) or item20_data.get('closures', 0) or 0
            units_opened = item20_data.get('outlets_opened_last_year', 0) or item20_data.get('openings', 0) or 0
            historical_data = item20_data.get('historical_data', [])
            
            # Calculate closure rate
            closure_rate = (units_closed / total_units * 100) if total_units > 0 else 0
            
            # Determine 3-year trend from historical data
            three_year_net_positive = False
            if historical_data and len(historical_data) >= 2:
                # Sort by year to get oldest and newest
                sorted_data = sorted(historical_data, key=lambda x: x.get('year', 0))
                oldest_total = sorted_data[0].get('total', 0) or sorted_data[0].get('units', 0) or 0
                newest_total = sorted_data[-1].get('total', 0) or sorted_data[-1].get('units', 0) or 0
                three_year_net_positive = newest_total > oldest_total
            
            # Check for single-year contraction (opened < closed this year)
            single_year_contraction = units_opened < units_closed
            
            # Determine correct score based on methodology
            if closure_rate < 5 and three_year_net_positive and not single_year_contraction:
                correct_score = 60  # Net positive growth + Closure rate <5% + Consistent expansion
            elif closure_rate <= 10:
                # Moderate tier: flat growth OR closure 5-10% OR inconsistent pattern
                if three_year_net_positive or single_year_contraction:
                    correct_score = 36  # 3-year positive but single year decline = inconsistent = 36
                else:
                    correct_score = 36  # Moderate closure tier
            else:  # closure_rate > 10%
                correct_score = 12  # High closure rate
            
            # CRITICAL: If 3-year trend is positive but single year shows contraction,
            # this is "inconsistent pattern" = 36 points, NOT 12 points
            if three_year_net_positive and single_year_contraction and growth_metric['score'] == 12:
                correct_score = 36
            
            # Apply correction if needed
            if growth_metric['score'] != correct_score:
                old_score = growth_metric['score']
                growth_metric['score'] = correct_score
                growth_metric['rating'] = get_rating(correct_score, 60)
                
                # Build neutral explanation with calculations
                explanation = f"Item 20 shows {total_units} total units. "
                explanation += f"Closure rate: {closure_rate:.1f}% ({units_closed} closed ÷ {total_units} units). "
                
                if historical_data and len(historical_data) >= 2:
                    sorted_data = sorted(historical_data, key=lambda x: x.get('year', 0))
                    oldest = sorted_data[0].get('total', 0) or sorted_data[0].get('units', 0)
                    newest = sorted_data[-1].get('total', 0) or sorted_data[-1].get('units', 0)
                    growth_pct = ((newest - oldest) / oldest * 100) if oldest > 0 else 0
                    explanation += f"3-year trend: {oldest}→{newest} units ({growth_pct:+.1f}%). "
                
                if correct_score == 60:
                    explanation += "Tier: Net positive + <5% closure + consistent expansion = 60 points."
                elif correct_score == 36:
                    if single_year_contraction and three_year_net_positive:
                        explanation += "Tier: Positive 3-year trend but single-year contraction = inconsistent pattern = 36 points."
                    else:
                        explanation += f"Tier: Closure rate 5-10% range = 36 points."
                else:
                    explanation += "Tier: High closure rate (>10%) or consistent contraction = 12 points."
                
                growth_metric['explanation'] = explanation
                growth_metric['formula_used'] = f"Closure rate {closure_rate:.1f}% + 3-year {'positive' if three_year_net_positive else 'negative'} = {correct_score} points"
                
                fixes.append(f"System Growth Pattern: {old_score} → {correct_score}")
                print(f"  [FIX] System Growth Pattern: {old_score} → {correct_score}")
                print(f"        Closure rate: {closure_rate:.1f}%, 3-year positive: {three_year_net_positive}, Single-year contraction: {single_year_contraction}")
    
    # ========================================================================
    # DIMENSION 3: FRANCHISEE SUPPORT
    # ========================================================================
    
    support_metrics = synthesis.get('franchise_score_breakdown', {}).get('franchisee_support', {}).get('metrics', [])
    
    # Training Program Quality - Fix if 40+ hours but scored low
    training_metric = next((m for m in support_metrics if m['metric_name'] == 'Training Program Quality'), None)
    
    if training_metric:
        item11 = combined_data.get('all_items', {}).get(11, {})
        initial_training = item11.get('initial_training', {})
        duration_text = str(initial_training.get('duration_description', '')) 
        
        if 'hour' in duration_text.lower():
            hours_match = re.findall(r'(\d+(\.\d+)?)\s*(?:hour|hours)', duration_text.lower())
            total_hours = sum(float(h[0]) for h in hours_match) if hours_match else 0
            
            if total_hours >= 40:  # 40+ hours = comprehensive
                correct_score = 60
                if training_metric['score'] < 60:
                    old_score = training_metric['score']
                    training_metric['score'] = correct_score
                    training_metric['rating'] = get_rating(correct_score, 60)
                    fixes.append(f"Training Quality: {old_score} → {correct_score}")
    
    # Territory Protection - Fix if scored too low
    territory_metric = next((m for m in support_metrics if m['metric_name'] == 'Territory Protection'), None)
    
    if territory_metric:
        original_score = territory_metric['score']
        explanation = territory_metric.get('explanation', '')
        formula_used = territory_metric.get('formula_used', '')
        
        # Extract what Claude actually calculated in the formula
        formula_score = extract_territory_score_from_formula(formula_used) if formula_used else None
        
        # Analyze the explanation for territory protection level
        analysis = analyze_territory_protection(explanation)
        
        # Determine correct score based on analysis
        correct_score = calculate_correct_territory_score(analysis)
        
        # Check if there's a mismatch
        has_mismatch = False
        mismatch_type = None
        
        if formula_score is not None and formula_score != original_score:
            has_mismatch = True
            mismatch_type = f"Score ({original_score}) doesn't match formula ({formula_score})"
        
        if original_score != correct_score:
            has_mismatch = True
            if mismatch_type is None:
                mismatch_type = f"Score doesn't match protection level analysis"
        
        # Apply correction if needed
        if has_mismatch:
            old_score = territory_metric['score']
            territory_metric['score'] = correct_score
            territory_metric['rating'] = get_rating(correct_score, 42)
            
            # Update explanation with neutral rationale
            territory_metric['explanation'] = generate_territory_rationale(analysis, correct_score)
            
            # Log the fix with details
            fixes.append(f"Territory Protection: {old_score} → {correct_score}")
            print(f"  [FIX] Territory Protection: {old_score} → {correct_score}")
            print(f"        Reason: {mismatch_type}")
            if formula_score:
                print(f"        Formula Score: {formula_score}")
            print(f"        Protection Level: {analysis['protection_level']}")
            if analysis['protection_level'] == 'limited':
                exceptions = []
                if analysis['has_ecommerce_exception']:
                    exceptions.append("e-commerce")
                if analysis['has_other_exceptions']:
                    exceptions.append("other channels")
                print(f"        Exceptions: {', '.join(exceptions)}")
    
    # ========================================================================
    # DIMENSION 4: BUSINESS FOUNDATION
    # ========================================================================
    
    biz_metrics = synthesis.get('franchise_score_breakdown', {}).get('business_foundation', {}).get('metrics', [])
    
    mgmt_metric = next((m for m in biz_metrics if m['metric_name'] == 'Management Experience'), None)
    
    if mgmt_metric:
        item2_data = combined_data.get('all_items', {}).get(2, {})
        
        if item2_data:
            executives = item2_data.get('executives', [])
            overall_assessment = item2_data.get('overall_team_assessment', {})
            
            # Keywords for franchise experience detection
            franchise_keywords = [
                'franchise', 'franchisor', 'franchisee', 'multi-unit', 'franchise development',
                'franchise operations', 'area developer', 'master franchise'
            ]
            
            # Major brand names for experience detection
            major_brands = [
                'united franchise group', 'signarama', 'fully promoted', 'experimax',
                'papa john', 'taco bell', 'burger king', 'mcdonald', 'subway',
                'starbucks', 'domino', 'kfc', 'wendy', 'pizza hut',
                '24 hour fitness', 'planet fitness', 'gold\'s gym', 'anytime fitness',
                'wellbiz', 'well biz', 'drybar', 'elements massage', 'radiant waxing',
                'amazing lash', 'fitness together', 'massage envy', 'european wax',
                'great clips', 'supercuts', 'sport clips', 'fantastic sams'
            ]
            
            # Senior title keywords
            senior_titles = ['ceo', 'coo', 'cfo', 'president', 'chief', 'vp', 'vice president', 'director', 'svp', 'evp']
            
            # Count executives with various experience indicators
            executives_with_franchise_exp = 0
            executives_with_major_brand_exp = 0
            executives_with_senior_titles = 0
            
            for exec_data in executives:
                prev_brands = exec_data.get('previous_franchise_brands', [])
                background = exec_data.get('background_summary', '').lower()
                title = exec_data.get('title', '').lower()
                
                # Check for senior title
                if any(t in title for t in senior_titles):
                    executives_with_senior_titles += 1
                
                # Check for franchise keywords in background
                has_franchise_exp = any(kw in background for kw in franchise_keywords)
                if has_franchise_exp:
                    executives_with_franchise_exp += 1
                
                # Check for major brand experience
                has_major_brand = False
                
                # Check previous brands list
                if prev_brands:
                    for brand in prev_brands:
                        if any(mb in brand.lower() for mb in major_brands):
                            has_major_brand = True
                            break
                
                # Check background summary for major brands
                if not has_major_brand:
                    if any(mb in background for mb in major_brands):
                        has_major_brand = True
                
                if has_major_brand:
                    executives_with_major_brand_exp += 1
            
            # Get counts from overall assessment
            highly_experienced_count = overall_assessment.get('highly_experienced_count', 0) or 0
            experienced_count = overall_assessment.get('experienced_count', 0) or 0
            has_multi_brand_experience = overall_assessment.get('has_multi_brand_experience', False)
            
            # Determine correct score based on methodology
            # Tier 1 (48 points): Multiple executives with 10+ years OR 2+ with major brand experience
            # Tier 2 (30 points): Some franchise experience, relevant operational background
            # Tier 3 (12 points): Little franchise-specific experience
            
            if highly_experienced_count >= 2 or executives_with_major_brand_exp >= 2:
                correct_score = 48
            elif (highly_experienced_count >= 1 or 
                  experienced_count >= 2 or 
                  executives_with_franchise_exp >= 3 or 
                  has_multi_brand_experience or
                  executives_with_major_brand_exp >= 1):
                correct_score = 30
            else:
                correct_score = 12
            
            # CRITICAL: Absence of specific tenure disclosure ≠ absence of experience
            # If executives demonstrate multi-brand franchise operations, score at least 30
            if executives_with_franchise_exp >= 2 and correct_score < 30:
                correct_score = 30
            
            # Only increase scores, never decrease
            if mgmt_metric['score'] < correct_score:
                old_score = mgmt_metric['score']
                mgmt_metric['score'] = correct_score
                mgmt_metric['rating'] = get_rating(correct_score, 48)
                
                # Build neutral explanation
                explanation = f"Item 2 lists {len(executives)} executives. "
                if executives_with_major_brand_exp > 0:
                    explanation += f"{executives_with_major_brand_exp} executive(s) with major franchise brand experience. "
                if executives_with_franchise_exp > 0:
                    explanation += f"{executives_with_franchise_exp} executive(s) with franchise industry background. "
                if highly_experienced_count > 0:
                    explanation += f"{highly_experienced_count} executive(s) with 10+ years experience. "
                if experienced_count > 0:
                    explanation += f"{experienced_count} executive(s) with 5-10 years experience. "
                
                if correct_score == 48:
                    explanation += "Tier: Multiple highly experienced executives = 48 points."
                elif correct_score == 30:
                    explanation += "Tier: Demonstrated franchise experience across team = 30 points."
                else:
                    explanation += "Tier: Limited franchise-specific experience = 12 points."
                
                mgmt_metric['explanation'] = explanation
                mgmt_metric['formula_used'] = f"{executives_with_franchise_exp} franchise exp + {executives_with_major_brand_exp} major brand exp = {correct_score} points"
                
                fixes.append(f"Management Experience: {old_score} → {correct_score}")
                print(f"  [FIX] Management Experience: {old_score} → {correct_score}")
                print(f"        Franchise exp: {executives_with_franchise_exp}, Major brand exp: {executives_with_major_brand_exp}")
    
    # ========================================================================
    # DIMENSION 4: BUSINESS FOUNDATION - System Performance Validation
    # ========================================================================
    
    sys_perf_metric = next((m for m in biz_metrics if m['metric_name'] == 'System Performance'), None)
    
    if sys_perf_metric:
        item20_data = combined_data.get('all_items', {}).get(20, {})
        
        if item20_data:
            # Extract transfer and turnover data
            total_units = item20_data.get('total_outlets', 0) or item20_data.get('total_units', 0) or 0
            transfers = item20_data.get('transfers_last_year', 0) or item20_data.get('transfers', 0) or 0
            reacquisitions = item20_data.get('reacquisitions_last_year', 0) or item20_data.get('reacquisitions', 0) or 0
            historical_data = item20_data.get('historical_data', [])
            multi_unit_mentioned = item20_data.get('multi_unit_ownership_mentioned', False)
            
            # Try to extract transfer count from metric explanation if not in structured data
            if transfers == 0 and sys_perf_metric.get('explanation'):
                transfer_match = re.search(r'(\d+)\s*transfer', sys_perf_metric['explanation'].lower())
                if transfer_match:
                    transfers = int(transfer_match.group(1))
            
            # Calculate transfer rate
            transfer_rate = (transfers / total_units * 100) if total_units > 0 else 0
            
            # Determine 3-year trend
            three_year_positive = False
            if historical_data and len(historical_data) >= 2:
                sorted_data = sorted(historical_data, key=lambda x: x.get('year', 0))
                oldest_total = sorted_data[0].get('total', 0) or sorted_data[0].get('units', 0) or 0
                newest_total = sorted_data[-1].get('total', 0) or sorted_data[-1].get('units', 0) or 0
                three_year_positive = newest_total > oldest_total
            
            # Determine correct score based on methodology
            # Tier 1 (30 points): Transfer rate <5%, high multi-unit, low reacquisition
            # Tier 2 (18 points): Transfer rate 5-10%, moderate patterns
            # Tier 3 (0-6 points): Transfer rate >10%, high turnover
            
            if transfer_rate < 5:
                if multi_unit_mentioned and three_year_positive:
                    correct_score = 30  # Low transfer + multi-unit + growth
                elif three_year_positive:
                    correct_score = 24  # Low transfer + growth
                else:
                    correct_score = 24  # Low transfer rate alone
            elif transfer_rate <= 10:
                correct_score = 18  # Moderate tier
            else:  # transfer_rate > 10%
                if three_year_positive:
                    correct_score = 6  # High transfer but positive growth
                else:
                    correct_score = 0  # High transfer + negative/flat growth
            
            # Only increase scores, never decrease
            if sys_perf_metric['score'] < correct_score:
                old_score = sys_perf_metric['score']
                sys_perf_metric['score'] = correct_score
                sys_perf_metric['rating'] = get_rating(correct_score, 30)
                
                # Build neutral explanation with calculations
                explanation = f"Item 20 shows transfer rate of {transfer_rate:.1f}% ({transfers} transfers ÷ {total_units} units). "
                
                if reacquisitions > 0:
                    explanation += f"Reacquisitions: {reacquisitions}. "
                
                if three_year_positive:
                    explanation += "3-year growth trend is positive. "
                
                if multi_unit_mentioned:
                    explanation += "Multi-unit ownership patterns noted. "
                
                if correct_score >= 24:
                    explanation += f"Tier: Low transfer rate (<5%) = {correct_score} points."
                elif correct_score == 18:
                    explanation += "Tier: Moderate transfer rate (5-10%) = 18 points."
                else:
                    explanation += f"Tier: High transfer rate (>10%) = {correct_score} points."
                
                sys_perf_metric['explanation'] = explanation
                sys_perf_metric['formula_used'] = f"Transfer rate {transfer_rate:.1f}% + {'positive' if three_year_positive else 'flat/negative'} growth = {correct_score} points"
                
                fixes.append(f"System Performance: {old_score} → {correct_score}")
                print(f"  [FIX] System Performance: {old_score} → {correct_score}")
                print(f"        Transfer rate: {transfer_rate:.1f}%, 3-year positive: {three_year_positive}")
    
    # Item 19 Performance Indicators - CRITICAL FIX FOR REVENUE-ONLY DATA
    item19_perf_metric = next((m for m in biz_metrics if m['metric_name'] == 'Item 19 Performance Indicators'), None)
    
    if item19_perf_metric:
        # Fetch extracted Item 19 data
        item19_data = combined_data.get('all_items', {}).get(19, {})
        has_item19_data = item19_data.get('has_data', False)
        
        # If no Item 19 data, assign neutral score
        if not has_item19_data:
            correct_score = 36 # Neutral score for no Item 19 provided
        else:
            outlets_analyzed = item19_data.get('outlets_analyzed', 0)
            has_median = item19_data.get('median_revenue') is not None or any(t.get('median') is not None for t in item19_data.get('tables', []))
            has_distribution = item19_data.get('has_distribution_data', False)
            
            # Define sample size thresholds for scoring
            large_sample_threshold = 100
            moderate_sample_threshold = 50
            
            # Score based on disclosure quality and sample size
            if has_median and has_distribution and (outlets_analyzed >= large_sample_threshold):
                correct_score = 72  # Full disclosure: median + distribution + large sample
            elif has_median and has_distribution:
                correct_score = 66  # Good disclosure: median + distribution, smaller sample
            elif has_median and (outlets_analyzed >= large_sample_threshold):
                correct_score = 60  # Good disclosure: median + large sample, no distribution
            elif has_distribution and (outlets_analyzed >= large_sample_threshold):
                correct_score = 54  # Distribution data + large sample, no median
            elif has_median or (outlets_analyzed >= moderate_sample_threshold):
                correct_score = 48  # Basic disclosure: median or moderate sample
            else:
                correct_score = 36  # Limited disclosure

        # Apply correction if the current score is lower than the calculated correct score
        if item19_perf_metric['score'] < correct_score:
            old_score = item19_perf_metric['score']
            item19_perf_metric['score'] = correct_score
            item19_perf_metric['rating'] = get_rating(correct_score, 72)
            
            # Update explanation to reflect revenue-only is normal
            if has_item19_data:
                explanation = f"Item 19 provides revenue data for {outlets_analyzed} outlets. "
                explanation += "Revenue-only disclosure is standard practice in the franchise industry. "
                
                if has_median and has_distribution and (outlets_analyzed >= large_sample_threshold):
                    explanation += "The disclosure includes median revenue, distribution data, and a large sample size."
                elif has_median and has_distribution:
                    explanation += "The disclosure includes median revenue and distribution data with a smaller sample size."
                elif has_median and (outlets_analyzed >= large_sample_threshold):
                    explanation += "The disclosure includes median revenue and a large sample size, but lacks distribution data."
                elif has_distribution and (outlets_analyzed >= large_sample_threshold):
                    explanation += "The disclosure includes distribution data and a large sample size, but lacks median revenue."
                elif has_median or (outlets_analyzed >= moderate_sample_threshold):
                    explanation += "Basic revenue metrics or a moderate sample size are provided."
                else:
                    explanation += "Limited revenue metrics are disclosed."
                
                item19_perf_metric['explanation'] = explanation
                
            else:
                item19_perf_metric['explanation'] = (
                    "Item 19 does not provide financial performance representations. "
                    "This is a neutral score, as many franchisors choose not to disclose "
                    "financial performance data."
                )
            
            fixes.append(f"Item 19 Performance: {old_score} → {correct_score}")
    
    # ========================================================================
    # RECALCULATE AND VALIDATE DIMENSION TOTALS
    # ========================================================================

    for dimension_name in ['financial_transparency', 'system_strength', 'franchisee_support', 'business_foundation']:
        dimension = synthesis['franchise_score_breakdown'][dimension_name]
        metrics = dimension['metrics']
        total = sum(m['score'] for m in metrics)
        dimension['total_score'] = total
    
    # ========================================================================
    # RECALCULATE FRANCHISE SCORE
    # ========================================================================
    
    new_total = sum(
        synthesis['franchise_score_breakdown'][dim]['total_score']
        for dim in ['financial_transparency', 'system_strength', 'franchisee_support', 'business_foundation']
    )
    
    synthesis['franchise_score'] = new_total
    
    # ========================================================================
    # UPDATE ANALYTICAL SUMMARY WITH CORRECTED SCORE AND FORBIDDEN WORD REMOVAL
    # ========================================================================
    
    if 'analytical_summary' in synthesis:
        old_summary = synthesis['analytical_summary']
        
        # Find and replace the score in the summary using flexible patterns
        # Use the NEWLY calculated 'new_total' for the summary update
        score_patterns = [
            (r'\b(\d{3})\s+out of 600', f'{new_total} out of 600'),
            (r'\b(\d{3})/600', f'{new_total}/600'),
            (r'scores?\s+(\d{3})\s+', f'scores {new_total} '), # Matches "scores XXX "
            (r'scores?\s+(\d{3})\.', f'scores {new_total}.'),   # Matches "scores XXX."
            (r'achieves?\s+(\d{3})\s+', f'achieves {new_total} '), # Matches "achieves XXX "
            (r'achieves?\s+(\d{3})\.', f'achieves {new_total}.'),   # Matches "achieves XXX."
            (r'overall score of (\d{3})', f'overall score of {new_total}'), # Handles "overall score of XXX"
            (r'(\d{3})\s+out of\s+600', f'{new_total} out of 600') # General "XXX out of 600"
        ]
        
        updated_summary = old_summary
        for pattern, replacement in score_patterns:
            # Use re.sub for flexible replacements
            updated_summary = re.sub(pattern, replacement, updated_summary, flags=re.IGNORECASE)
        
        # Strip subjective words as per the prompt instructions
        subjective_replacements = {
            'strong franchise opportunity': 'franchise opportunity',
            'excellent financial transparency': 'financial transparency',
            'robust support': 'operational support',
            'impressive': '', # Replace with empty string to remove
            'substantial': '',
            'comprehensive': '',
            'extensive': '',
            'viable opportunity': 'opportunity',
            'highly experienced': 'experienced', # Standardize
            'detailed breakdown': 'breakdown',
            'significant track record': 'track record', # Neutralize positive adjectives
            'positive system expansion': 'system expansion',
            'low turnover': 'turnover', # Remove subjective qualifiers if not necessary
            'moderate turnover': 'turnover',
            'high turnover': 'turnover',
            'clean record': 'no litigation or bankruptcy', # Neutralize positive connotation
            'clear geographic boundaries': 'geographic boundaries', # Neutralize
            'exceptional training': 'training' # Neutralize
        }
        
        # Apply replacements case-insensitively for better coverage
        for bad_phrase, replacement in subjective_replacements.items():
            # Replace all occurrences, ensuring whitespace consistency
            updated_summary = re.sub(re.escape(bad_phrase), replacement, updated_summary, flags=re.IGNORECASE)
        
        # Clean up extra spaces and leading/trailing whitespace
        updated_summary = re.sub(r'\s+', ' ', updated_summary).strip()
        
        # Ensure the summary still contains the correct score mention
        # If the initial score replacement logic failed to update, add it.
        # This is a fallback.
        if str(new_total) not in updated_summary:
            # Attempt to prepend or append if not found. More robust would be to re-generate.
            # For now, we assume the primary substitution logic worked.
            pass 

        if updated_summary != old_summary:
            synthesis['analytical_summary'] = updated_summary
            print(f"  [VALIDATION] Updated analytical summary with corrected score and removed forbidden/subjective words")
    
    # ========================================================================
    # PRINT DEBUG MESSAGES
    # ========================================================================
    
    if fixes:
        for fix in fixes:
            print(f"    [FIX] {fix}")
        print(f"  [VALIDATION] Fixed {len(fixes)} score mismatches")
    else:
        print(f"  [VALIDATION] All scores match methodology requirements")
    
    print(f"  [VALIDATION] Recalculated total score: {new_total}")
    
    return synthesis


# ============================================================================
# STEP 5: PROCESS EACH ITEM
# ============================================================================

def analyze_item(item_num: int, item_text: str, output_dir: Path) -> Optional[Dict]:
    """Analyze a single Item with Gemini"""
    print(f"  Analyzing Item {item_num}...")
    
    if item_num == 19:
        return extract_item_19_with_fallback(item_text, output_dir)
    
    # Get Item-specific prompt
    item_prompt = get_item_prompt(item_num)
    
    # Combine prompt with Item text
    full_prompt = f"{item_prompt}\n\nItem {item_num} Text:\n{item_text}"
    
    # Call Gemini
    response = call_gemini_api(full_prompt)
    if not response:
        print(f"    ✗ API call failed for Item {item_num}")
        return None
    
    # Extract JSON
    analysis = extract_json_from_response(response)
    if not analysis:
        print(f"    ✗ Could not extract JSON for Item {item_num}")
        # Save failed response for manual inspection
        try:
            with open(output_dir / f"item_{item_num:02d}_failed_response.txt", 'w', encoding='utf-8') as f:
                f.write(response)
            print(f"    [DEBUG] Raw response saved to: {output_dir / f'item_{item_num:02d}_failed_response.txt'}")
        except Exception as e:
            print(f"    [DEBUG] Could not save failed response: {e}")
        return None
    
    print(f"    ✓ Extracted structured data for Item {item_num}")
    return analysis


# ============================================================================
# STEP 6: COMBINE ALL ITEMS
# ============================================================================

def combine_item_analyses(item_analyses: Dict[int, Dict]) -> Dict:
    """Combine all Item analyses into final structured output"""
    print("Combining all Item analyses...")
    
    combined = {
        "franchise_name": None,
        "description": None,
        "industry": None,
        "initial_investment_low": None,
        "initial_investment_high": None,
        "initial_investment_midpoint": None,
        "franchise_fee": None,
        "royalty_fee": None,
        "marketing_fee": None,
        "royalty_fee_percentage": None,
        "marketing_fee_percentage": None,
        "total_ongoing_fees_percentage": None,
        "investment_breakdown": None,
        "average_revenue": None,
        "median_revenue": None, # Added for Item 19
        "has_item19": False,
        "revenue_data": None,
        "total_units": None,
        "franchised_units": None,
        "company_owned_units": None,
        "units_opened_last_year": None,
        "units_closed_last_year": None,
        "support_training": None,
        "renewal_termination": None,
        "all_items": item_analyses # Keep raw analyses for reference
    }
    
    # Populate combined data from individual item analyses
    if 1 in item_analyses:
        combined["franchise_name"] = item_analyses[1].get("franchise_name")
        combined["description"] = item_analyses[1].get("description")
        combined["industry"] = item_analyses[1].get("industry")
        # Ensure 'years_in_franchising' is available for later validation if needed
        combined["years_in_franchising"] = item_analyses[1].get("years_in_franchising") 
    
    if 5 in item_analyses:
        combined["franchise_fee"] = item_analyses[5].get("initial_franchise_fee")
    
    if 6 in item_analyses:
        combined["royalty_fee"] = item_analyses[6].get("royalty_fee")
        combined["marketing_fee"] = item_analyses[6].get("marketing_fee")
        combined["royalty_fee_percentage"] = item_analyses[6].get("royalty_fee_percentage")
        combined["marketing_fee_percentage"] = item_analyses[6].get("marketing_fee_percentage")
        combined["total_ongoing_fees_percentage"] = item_analyses[6].get("total_ongoing_fees_percentage")
    
    if 7 in item_analyses:
        facility_types = item_analyses[7].get("facility_types", [])
        if facility_types:
            combined["investment_breakdown"] = facility_types
            # Take data from the first facility type as the primary representative if multiple exist
            combined["initial_investment_low"] = facility_types[0].get("total_low")
            combined["initial_investment_high"] = facility_types[0].get("total_high")
            combined["initial_investment_midpoint"] = facility_types[0].get("total_midpoint")
        # Fallback calculation if midpoint not directly extracted or if ranges are available
        if (combined["initial_investment_midpoint"] is None and 
            combined["initial_investment_low"] is not None and 
            combined["initial_investment_high"] is not None):
            combined["initial_investment_midpoint"] = (combined["initial_investment_low"] + combined["initial_investment_high"]) / 2
    
    if 11 in item_analyses:
        combined["support_training"] = item_analyses[11]
    
    if 17 in item_analyses:
        combined["renewal_termination"] = item_analyses[17]
    
    if 19 in item_analyses:
        combined["has_item19"] = item_analyses[19].get("has_data", False)
        combined["revenue_data"] = item_analyses[19] # Store the raw Item 19 analysis
        
        # Extract key financial metrics for easier access
        tables = item_analyses[19].get("tables", [])
        
        # Priority for average/median revenue:
        # 1. Top-level fields directly from Item 19 analysis.
        # 2. 'all_studios_value' or 'average' from tables.
        # 3. 'median' from tables.
        
        # Extract average_revenue
        combined["average_revenue"] = item_analyses[19].get("average_revenue")
        if combined["average_revenue"] is None:
            for table in tables:
                if table.get("average") is not None:
                    combined["average_revenue"] = table.get("average")
                    break # Stop at first found
        
        # Extract median_revenue
        combined["median_revenue"] = item_analyses[19].get("median_revenue")
        if combined["median_revenue"] is None:
            for table in tables:
                if table.get("median") is not None:
                    combined["median_revenue"] = table.get("median")
                    break # Stop at first found
            
        # If still not found, try to infer from 'all_studios_value' if median extraction was insufficient
        if combined["median_revenue"] is None:
             for table in tables:
                if table.get("all_studios_value") is not None:
                    combined["median_revenue"] = table.get("all_studios_value")
                    break
    
    if 20 in item_analyses:
        combined["total_units"] = item_analyses[20].get("total_outlets")
        combined["franchised_units"] = item_analyses[20].get("franchised_outlets")
        combined["company_owned_units"] = item_analyses[20].get("company_owned_outlets")
        combined["units_opened_last_year"] = item_analyses[20].get("outlets_opened_last_year")
        combined["units_closed_last_year"] = item_analyses[20].get("units_closed_last_year")
    
    print("✓ Combined all Item analyses")
    return combined


# ============================================================================
# STEP 7: SYNTHESIZE ANALYSIS (SCORES, STRENGTHS, CONSIDERATIONS, SUMMARY)
# ============================================================================

SYNTHESIS_PROMPT_TEMPLATE = """You are an expert at analyzing a Franchise Disclosure Document (FDD) based on extracted data from all 23 Items.

⚠️ CRITICAL - DO NOT MODIFY SCORING METHODOLOGY ⚠️
===================================================
This scoring rubric is FranchiseScore™ 2.0 methodology approved on October 30, 2025.

ABSOLUTELY FORBIDDEN:
- Do NOT change point values (e.g., 90 points → 100 points)
- Do NOT change dimension maximums (150 points each)
- Do NOT change total maximum (600 points)
- Do NOT add new metrics or dimensions
- Do NOT remove existing metrics
- Do NOT reweight or rebalance the methodology

YOUR ONLY JOB:
1. Apply the rubric exactly as written below
2. Calculate scores using the formulas provided
3. Return JSON in the exact structure specified

If you change ANY scoring values, the entire methodology breaks.
===================================================

CRITICAL LANGUAGE REQUIREMENTS:
=================================
Use ONLY neutral, factual language. Remove all subjective characterizations.

FORBIDDEN WORDS/PHRASES:
- Quality judgments: significant, impressive, robust, strong, weak, excellent, poor, substantial
- Intensity modifiers: exceptionally, particularly, notably, remarkably, extremely, highly
- Comparative assessments: extensive, limited, adequate, insufficient, comprehensive, thorough
- Value assessments: detailed, minimal, considerable, attractive, concerning, favorable

REQUIRED APPROACH:
- State facts with numbers: "12-week training program" not "extensive training"
- Describe scope: "Covers 15 operational areas" not "comprehensive coverage"
- Report data: "Item 19 includes 150 reporting units" not "substantial disclosure"
- Note presence/absence: "Item X provides specifications" or "Item X does not disclose"

Your task is to generate a comprehensive FranchiseScore™ analysis following the improved methodology based on expert guidance from the FTC, SBA, Franchise Business Review, and industry analysts.

**EXTRACTED DATA:**
{extracted_data}

**FRANCHISESCORE™ METHODOLOGY (0-600 POINTS TOTAL):**

This methodology focuses on the most critical FDD Items that experts agree predict franchise success and buyer satisfaction.

## 1. FINANCIAL TRANSPARENCY (0-150 points)

*Evaluates disclosure quality and financial openness - critical for informed decision-making*

### A. Item 19 Quality (90 points max)
Based on Item 19 disclosure comprehensiveness:
- Full Item 19 with detailed data (system-wide averages, median performance, distribution of results, sample sizes stated) = 90 points
- Partial Item 19 (limited data, only top performers, or minimal sample size) = 48 points
- No Item 19 provided = 0 points

**Rationale:** Item 19 is universally cited by FTC, SBA, and industry experts as the most important FDD disclosure. It allows buyers to make informed financial decisions.

### B. Investment Clarity from Item 7 (30 points max)
Based on Item 7 investment table quality:
- Comprehensive breakdown (detailed ranges with clear assumptions and explanations) = 30 points
- Basic breakdown (standard ranges without much context) = 18 points
- Minimal detail (vague or very wide ranges) = 6 points

**Rationale:** SBA and FTC emphasize understanding total investment requirements. Clear investment disclosures help buyers plan adequately.

### C. Fee Structure Transparency from Items 5-6 (30 points max)
Based on fee disclosure quality:
- All fees clearly disclosed (all costs shown, conditions clear, refundability stated) = 30 points
- Standard disclosure (fees disclosed but conditions unclear) = 18 points
- Minimal disclosure (only mandatory minimum disclosures) = 6 points

**Rationale:** Hidden or unclear fees are a major source of franchisee-franchisor disputes. Transparency builds trust.

## 2. SYSTEM STRENGTH (0-150 points)

*Evaluates franchisor stability and system health - predicts long-term viability*

### A. System Growth Pattern from Item 20 (60 points max)
Based on unit growth and closure patterns:
- Healthy growth (net positive growth, closure rate <5%, consistent expansion) = 60 points
- Stable system (flat growth, moderate closures 5-10%) = 36 points
- Declining system (net negative growth, closure rate >10%) = 12 points

**Calculation Notes:**
- Net growth = (Units opened - Units closed) ÷ Total units at start of year × 100
- Closure rate = Units closed ÷ Total units × 100
- Look at 3-year trend for stability

**Rationale:** FTC and SBA highlight Item 20 as critical. High closure rates may indicate financial struggles or poor franchisor support.

### B. Franchisor Longevity from Item 1 (48 points max)
Based on years in franchising:
- Established (10+ years in franchising) = 48 points
- Experienced (5-10 years) = 30 points
- Developing (2-5 years) = 18 points
- New (<2 years) = 6 points

**Rationale:** Track record matters. Established franchisors have proven systems, while new franchisors carry higher risk.

### C. Clean Record from Items 3-4 (42 points max)

**CRITICAL: Use ONLY this rubric (do not invent formulas):**

IF Items 3-4 disclose NO litigation/bankruptcy:
  score = 42 points (maximum - clean record is POSITIVE)
  
ELSE IF Items 3-4 disclose 1-2 cases:
  score = 35-40 points
  - Assess severity, recency, resolution
  - Settled favorably = higher score (38-40)
  - Ongoing = lower score (35-37)
  
ELSE IF Items 3-4 disclose 3-5 cases:
  score = 25-30 points
  - Indicates pattern of disputes but manageable
  - All settled = higher score (28-30)
  - Multiple ongoing = lower score (25-27)
  
ELSE IF Items 3-4 disclose 6+ cases:
  score = 0-20 points
  - Indicates systemic issues
  - All settled = 10-20 points
  - Many ongoing = 0-10 points
  - Consider resolution outcomes

**NEVER use formulas like "42 - (count × X)".**
**NEVER give negative scores.**

**Recency Filter:** Only count litigation cases filed within the last 3 years.

**Portfolio Company Handling:** For multi-brand portfolio companies (e.g., WellBiz brands like Drybar, Elements Massage, Radiant Waxing, Amazing Lash, Fitness Together):
- Distinguish between litigation against the specific brand vs. litigation against other portfolio entities
- Direct brand litigation: Apply full scoring impact
- Affiliate/parent entity litigation: Apply reduced scoring impact (note in explanation but score more leniently)

**Rationale:** FTC specifically requires disclosure of litigation and bankruptcy for buyer protection. Clean records indicate good business practices.

## 3. FRANCHISEE SUPPORT (0-150 points)

*Evaluates what franchisors provide to ensure franchisee success*

### A. Training Program Quality from Item 11 (60 points max)
Based on initial and ongoing training:
- Comprehensive training (2+ weeks initial, ongoing support, multiple training locations/methods, experienced trainers) = 60 points
- Standard training (1-2 weeks initial training, basic ongoing support) = 36 points
- Minimal training (brief training only, limited support mentioned) = 12 points

**Key Factors:**
- Initial training duration and location
- Trainer qualifications and experience
- Ongoing training availability
- Training materials and methods
- Cost coverage (franchisor vs franchisee paid)

**Rationale:** All industry experts emphasize training as essential for franchisee success. Comprehensive training reduces failure rates.

### B. Operational Support from Item 11 (48 points max)
Based on ongoing operational assistance:
- Extensive support (field support, dedicated business coaches, regular communications, technology systems) = 48 points
- Standard support (hotline, periodic visits, basic systems) = 30 points
- Limited support (minimal ongoing assistance described) = 12 points

**Key Factors:**
- Field representative ratio and visit frequency
- Support hotline availability
- Technology/POS systems provided
- Operations manual quality
- Marketing support programs

**Rationale:** Ongoing support directly correlates with franchisee satisfaction and success. Strong support systems help franchisees overcome challenges.

### C. Territory Protection from Item 12 (42 points max)
Based on territorial rights:
- Protected exclusive territory (clear geographic protection, no online competition from franchisor/others in territory) = 42 points
- Limited protection (protected territory but with exceptions for e-commerce or other channels) = 24 points
- No protection (no territorial restrictions disclosed) = 6 points

**Key Factors:**
- Geographic territory definition
- Exclusivity provisions
- E-commerce/online sales restrictions
- Franchisor's reserved rights
- Competition from other franchisees

**Rationale:** Territory protections affect competition levels and revenue potential. Clear protections give franchisees better control over their market.

## 4. BUSINESS FOUNDATION (0-150 points)

*Evaluates core business strength and franchisee success factors*

### A. Management Experience from Item 2 (48 points max)
Based on management team qualifications:
- Highly experienced team (multiple executives with 10+ years franchise experience) = 48 points
- Experienced team (some franchise experience across management team) = 30 points
- Limited experience (little franchise-specific experience) = 12 points

**Key Factors:**
- Years of franchise industry experience
- Relevant operational experience
- Track record with other franchise brands
- Tenure with current franchisor
- Industry-specific expertise

**Rationale:** FTC and experts emphasize management team experience. Experienced teams better support franchisees and navigate challenges.

### B. Item 19 Performance Indicators (72 points max)
Based on financial performance when disclosed:
- Strong performance shown (majority of locations profitable, positive trends, achievable benchmarks) = 72 points
- Mixed performance (wide variance, some concerns about achievability) = 42 points
- Weak performance (low percentages profitable, declining trends) = 18 points
- No Item 19 provided = 36 points (neutral score - absence is not inherently negative)

**Assessment Guidelines (when Item 19 exists):**
- Percentage of locations meeting benchmarks
- Median vs average performance (median preferred)
- Performance distribution (concentration vs wide spread)
- Year-over-year trends
- Profitability indicators (not just revenue)
- Sample size adequacy

**Rationale:** When disclosed, Item 19 performance data is the single best predictor of franchisee success potential.

### C. System Performance from Item 20 (30 points max)
Based on behavioral indicators in Item 20:
- Positive signals (low turnover, long tenures, franchisees expanding with multiple units) = 30 points
- Neutral signals (average turnover patterns) = 18 points
- Concerning signals (high turnover, many transfers, short tenures) = 0 points

**Key Indicators:**
- Franchisee tenure (how long franchisees stay)
- Multi-unit ownership rates (satisfied franchisees expand)
- Transfer vs termination ratio
- Reacquisitions by franchisor (may indicate failures)
- Renewal rates (when disclosed)

**Rationale:** SBA emphasizes talking to current franchisees. Turnover and expansion data reveals actual satisfaction levels better than marketing claims.

MANDATORY SCORE VALIDATION:
============================

1. **Dimension totals must not exceed maximums:**
   - Financial Transparency: max 150 points
   - System Strength: max 150 points
   - Franchisee Support: max 150 points
   - Business Foundation: max 150 points

2. **Individual metrics must not exceed their maximums:**
   - Verify each metric score ≤ its max_score
   - If any score exceeds maximum, reduce to maximum

3. **Recalculate dimension totals:**
   - Sum all metric scores within each dimension
   - Update dimension total_score to match sum

4. **Recalculate franchise_score:**
   - Sum all 4 dimension total_scores
   - Final franchise_score must be 0-600

5. **If validation fails:**
   - Identify which metrics exceed limits
   - Reduce to maximums
   - Recalculate all totals
   - Return corrected scores

CRITICAL: Always perform this validation before returning JSON output.

CRITICAL SCORING GUIDELINES:
============================

1. **NO SUBJECTIVE LANGUAGE**: Replace quality judgments with quantities
   - ❌ "Strong training program" → ✅ "8-week training program"
   - ❌ "Impressive growth" → ✅ "Added 45 units over 12 months (22% growth)"

2. **LITIGATION/BANKRUPTCY**: Absence = clean record = maximum points
   - Never suggest "unusual" or imply potential hidden issues
   - FTC requires disclosure, so no disclosure = clean record

3. **CALCULATIONS REQUIRED**: Show your work for all scored metrics
   - ROI: (profit / investment) × 100
   - Growth rate: (new - old) / old × 100
   - Closure rate: (closures / total units) × 100

4. **MISSING DATA**: Explicitly state when calculations impossible
   - "Item 19 does not disclose profitability data, ROI cannot be calculated"
   - "Insufficient data in Item 20 to determine multi-unit ownership percentage"

5. **CITATIONS**: Reference specific Items for all claims
   - "Item 7 specifies total investment of $150K-$300K"
   - "Item 20 reports 450 units as of December 31, 2024"

**SCORING INSTRUCTIONS:**

For each category, calculate ALL metrics with:
1. **metric_name**: Name of the specific metric
2. **score**: Points earned (using rubric above)
3. **max_score**: Maximum points possible for this metric
4. **rating**: "Excellent" | "Good" | "Fair" | "Poor" | "Not Available"
5. **explanation**: 2-3 sentences explaining the score with specific data points and FDD Item citations
6. **formula_used**: Show any calculations used (if applicable)

**STRENGTHS & CONSIDERATIONS:**
- Generate EXACTLY 3 strengths and EXACTLY 3 considerations
- Each item must include:
  - title: string (clear, specific)
  - description: string (2-3 sentences with specific data from FDD)
  - citation: string (e.g., "Item 7", "Item 19, Table 1", "Item 20")
  - impact: "High" | "Medium" | "Low"
- Strengths should highlight genuine strengths disclosed in the FDD
- Considerations should note legitimate risks or areas requiring careful evaluation
- Be balanced - even strong franchises have considerations worth noting

CRITICAL - REVENUE-ONLY DATA IS NORMAL:
- FDDs almost NEVER include profitability, net profit, ROI, or margin data
- They typically only disclose REVENUE metrics (gross sales, average revenue, etc.)
- Do NOT cite "absence of profitability data" or "no ROI disclosed" as a concern
- This is standard across the franchise industry and not a weakness
- Score Item 19 Performance based on REVENUE performance indicators only

ANALYTICAL SUMMARY:
- Write 4-5 sentences that synthesize the overall FranchiseScore
- Lead with the total score and overall rating
- CRITICAL: After validation, the final franchise_score may differ from your calculated score. Always reference YOUR calculated score in the summary, and note that validation may adjust it. The validation function will update the summary if needed.
- Highlight 2-3 key strengths
- Note 1-2 primary considerations
- Conclude with balanced perspective on the opportunity
- Use specific data points from the FDD
- Avoid hyperbole - be measured and professional

**CRITICAL REMINDER - NEUTRAL LANGUAGE IN ALL OUTPUT:**
============================
Before generating your response, review these requirements:

NEVER use these words in ANY field (explanation, formula_used, etc.):
❌ comprehensive, extensive, robust, significant, impressive, substantial, strong, weak

ALWAYS use these patterns instead:
✅ Numbers: "10-week training program" not "extensive training"
✅ Facts: "Item 7 lists 17 cost categories" not "comprehensive breakdown"
✅ Data: "87 outlets reported" not "substantial sample size"
✅ Descriptions: "The franchisor provides field visits" not "robust support"

Review your entire JSON output before returning it. Replace any forbidden words with neutral, quantitative descriptions.

**OUTPUT STRUCTURE:**

Return ONLY valid JSON (no markdown, no explanations):
{
  "franchise_score": number (0-600),
  "franchise_score_breakdown": {
    "financial_transparency": {
      "total_score": number,
      "max_score": 150,
      "metrics": [
        {
          "metric_name": "Item 19 Quality",
          "score": number,
          "max_score": 90,
          "rating": "string",
          "explanation": "string",
          "formula_used": "string"
        },
        {
          "metric_name": "Investment Clarity",
          "score": number,
          "max_score": 30,
          "rating": "string",
          "explanation": "string",
          "formula_used": "string"
        },
        {
          "metric_name": "Fee Structure Transparency",
          "score": number,
          "max_score": 30,
          "rating": "string",
          "explanation": "string",
          "formula_used": "string"
        }
      ]
    },
    "system_strength": {
      "total_score": number,
      "max_score": 150,
      "metrics": [
        {
          "metric_name": "System Growth Pattern",
          "score": number,
          "max_score": 60,
          "rating": "string",
          "explanation": "string",
          "formula_used": "string"
        },
        {
          "metric_name": "Franchisor Longevity",
          "score": number,
          "max_score": 48,
          "rating": "string",
          "explanation": "string",
          "formula_used": "string"
        },
        {
          "metric_name": "Clean Record",
          "score": number,
          "max_score": 42,
          "rating": "string",
          "explanation": "string",
          "formula_used": "string"
        }
      ]
    },
    "franchisee_support": {
      "total_score": number,
      "max_score": 150,
      "metrics": [
        {
          "metric_name": "Training Program Quality",
          "score": number,
          "max_score": 60,
          "rating": "string",
          "explanation": "string",
          "formula_used": "string"
        },
        {
          "metric_name": "Operational Support",
          "score": number,
          "max_score": 48,
          "rating": "string",
          "explanation": "string",
          "formula_used": "string"
        },
        {
          "metric_name": "Territory Protection",
          "score": number,
          "max_score": 42,
          "rating": "string",
          "explanation": "string",
          "formula_used": "string"
        }
      ]
    },
    "business_foundation": {
      "total_score": number,
      "max_score": 150,
      "metrics": [
        {
          "metric_name": "Management Experience",
          "score": number,
          "max_score": 48,
          "rating": "string",
          "explanation": "string",
          "formula_used": "string"
        },
        {
          "metric_name": "Item 19 Performance Indicators",
          "score": number,
          "max_score": 72,
          "rating": "string",
          "explanation": "string",
          "formula_used": "string"
        },
        {
          "metric_name": "System Performance",
          "score": number,
          "max_score": 30,
          "rating": "string",
          "explanation": "string",
          "formula_used": "string"
        }
      ]
    }
  },
  "strengths": [
    {
      "title": "string",
      "description": "string",
      "citation": "string",
      "impact": "High" | "Medium" | "Low"
    },
    {
      "title": "string",
      "description": "string",
      "citation": "string",
      "impact": "High" | "Medium" | "Low"
    },
    {
      "title": "string",
      "description": "string",
      "citation": "string",
      "impact": "High" | "Medium" | "Low"
    }
  ],
  "considerations": [
    {
      "title": "string",
      "description": "string",
      "citation": "string",
      "impact": "High" | "Medium" | "Low"
    },
    {
      "title": "string",
      "description": "string",
      "citation": "string",
      "impact": "High" | "Medium" | "Low"
    },
    {
      "title": "string",
      "description": "string",
      "citation": "string",
      "impact": "High" | "Medium" | "Low"
    }
  ],
  "analytical_summary": "string (4-5 sentences synthesizing the overall FranchiseScore, highlighting key strengths and considerations with specific data points from the FDD)"
}"""


def synthesize_analysis(combined_data: Dict) -> Dict:
    """
    Generate analytical components from all Item data using FranchiseScore™ methodology:
    - franchise_score (0-600 points)
    - franchise_score_breakdown (4 categories with detailed metrics)
    - strengths (array with citations)
    - considerations (array with citations)
    - analytical_summary (comprehensive analysis)
    """
    global SYNTHESIS_API  # Required to modify module-level variable
    
    print("\nSynthesizing final analysis (FranchiseScore™, strengths, considerations, summary)...")
    
    # Pass the combined_data object to the prompt template
    synthesis_prompt = SYNTHESIS_PROMPT_TEMPLATE.replace(
        "{extracted_data}",
        json.dumps(combined_data, indent=2) # Use indent=2 for readability in the prompt
    )
    
    response = None
    # Call the configured API for synthesis
    if SYNTHESIS_API == "claude" and CLAUDE_API_KEY:
        try:
            # Use the updated call_claude_api function
            response = call_claude_api(synthesis_prompt, max_tokens=16000)
            if response:
                print("  ✓ Claude API call successful")
            else:
                print("  ✗ Claude API returned no response.")
        except Exception as e:
            print(f"  ✗ Claude API call failed: {e}")
            # Fallback to Gemini if Claude fails or returns no response
            SYNTHESIS_API = "gemini" 

    # Default or fallback to Gemini
    if SYNTHESIS_API == "gemini" or response is None: 
        print("  Calling Gemini API for synthesis...")
        # Use a generous max_tokens for synthesis, as it's complex.
        response = call_gemini_api(synthesis_prompt, max_tokens=16000) 
        if not response:
            print("  ✗ Gemini API call failed for synthesis")
            return {}
        print("  ✓ Gemini API call successful")

    # Save raw response for debugging purposes
    try:
        # Determine output directory dynamically
        output_dir = Path(OUTPUT_DIR)
        # Try to create a subdirectory based on franchise name if possible
        if combined_data.get("franchise_name"):
            output_dir = output_dir / combined_data["franchise_name"]
        
        output_dir.mkdir(parents=True, exist_ok=True)
        debug_path = output_dir / "synthesis_debug.txt"
        
        with open(debug_path, 'w', encoding='utf-8') as f:
            f.write(response)
        print(f"  [DEBUG] Raw synthesis response saved to: {debug_path}")
    except Exception as e:
        print(f"  [DEBUG] Could not save synthesis response: {e}")
    
    synthesis = extract_json_from_response(response)
    if not synthesis:
        print("  ✗ Could not extract synthesis JSON from response.")
        print("  [DEBUG] Please check synthesis_debug.txt for raw output.")
        return {}
    
    # CRITICAL: Validate and fix scores based on the methodology BEFORE returning
    synthesis = validate_and_fix_scores(combined_data, synthesis)
    
    print("  ✓ Generated FranchiseScore™ (0-600), strengths, considerations, and summary")
    return synthesis


# ============================================================================
# MAIN PIPELINE
# ============================================================================

def process_pdf(pdf_path: Path) -> bool:
    """Process a single PDF with Item-by-Item approach"""
    franchise_name = pdf_path.stem # Use filename without extension as franchise name
    output_dir = Path(OUTPUT_DIR) / franchise_name
    items_dir = output_dir / "items"
    items_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n{'='*70}")
    print(f"ITEM-BY-ITEM PROCESSING: {franchise_name}")
    print(f"{'='*70}\n")
    print(f"Using model: {MODEL_NAME}")
    print(f"Synthesis API: {SYNTHESIS_API}")
    print(f"Approach: Analyzing each of the 23 Items separately.\n")
    
    # Step 1: Extract full PDF text
    try:
        full_text = extract_pdf_text(str(pdf_path))
        with open(output_dir / "full_text.txt", 'w', encoding='utf-8') as f:
            f.write(full_text)
        print("  ✓ Full PDF text extracted and saved.")
    except Exception as e:
        print(f"✗ PDF extraction failed: {e}")
        return False
    
    # Step 2: Extract all 23 Items
    print("\nStep 2: Extracting all 23 Items...")
    items = extract_all_items_with_ai(full_text)
    
    # Save each Item's raw text
    for item_num, item_text in items.items():
        with open(items_dir / f"item_{item_num:02d}.txt", 'w', encoding='utf-8') as f:
            f.write(item_text)
    
    print(f"\nStep 3: Analyzing each Item...")
    # Step 3: Analyze each Item with Gemini
    item_analyses = {}
    # Iterate through all possible item numbers (1-23)
    for item_num in range(1, 24):
        if item_num not in items:
            print(f"  ⚠ Item {item_num} not found in extracted text, skipping analysis.")
            continue
        
        # Perform analysis for the current item
        analysis = analyze_item(item_num, items[item_num], items_dir)
        if analysis:
            item_analyses[item_num] = analysis
            # Save individual Item analysis as JSON
            try:
                with open(items_dir / f"item_{item_num:02d}_analysis.json", 'w') as f:
                    json.dump(analysis, f, indent=2)
            except Exception as e:
                print(f"  [DEBUG] Could not save analysis for Item {item_num}: {e}")
    
    print(f"\n✓ Completed analysis for {len(item_analyses)}/{len(items)} found Items.")
    
    # Step 4: Combine all Item analyses
    print("\nStep 4: Combining analyses from all Items...")
    combined_analysis = combine_item_analyses(item_analyses)
    
    # Step 5: Synthesize final analysis (scores, strengths, considerations, summary)
    print("\nStep 5: Synthesizing final analysis...")
    synthesis = synthesize_analysis(combined_analysis)
    
    # Update combined analysis with synthesis results
    if synthesis:
        combined_analysis.update(synthesis)
    
    # Step 6: Save the final combined analysis
    print("\nStep 6: Saving final analysis...")
    try:
        with open(output_dir / "analysis.json", 'w', encoding='utf-8') as f:
            json.dump(combined_analysis, f, indent=2)
    except Exception as e:
        print(f"✗ Failed to save final analysis.json: {e}")
        return False
    
    print(f"\n{'='*70}")
    print(f"SUCCESS: {franchise_name}")
    print(f"{'='*70}\n")
    print(f"All results saved to: {output_dir}")
    print(f"  - full_text.txt: Complete PDF text extraction.")
    print(f"  - items/item_XX.txt: Raw text for each extracted Item.")
    print(f"  - items/item_XX_analysis.json: Structured analysis for each Item.")
    print(f"  - items/item_XX_failed_response.txt: Raw LLM response for failed JSON extractions.")
    print(f"  - analysis.json: Comprehensive final analysis including FranchiseScore™.")
    
    return True


def main():
    """Main entry point for the pipeline."""
    parser = argparse.ArgumentParser(description="Item-by-Item FDD Processing Pipeline using Vertex AI Gemini.")
    parser.add_argument("--pdf", type=str, required=True, help="Path to the input PDF FDD file.")
    args = parser.parse_args()
    
    print(f"\n{'='*70}")
    print(f"INITIATING ITEM-BY-ITEM FDD ANALYSIS PIPELINE")
    print(f"{'='*70}\n")
    print(f"Configuration:")
    print(f"  Gemini Model: {MODEL_NAME}")
    print(f"  Synthesis API: {SYNTHESIS_API}")
    print(f"  Output Directory: {OUTPUT_DIR}\n")
    
    pdf_file = Path(args.pdf)
    if not pdf_file.exists():
        print(f"✗ Error: PDF file not found at '{args.pdf}'")
        return
    
    # Ensure the output directory exists
    Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
    
    success = process_pdf(pdf_file)
    
    if success:
        print(f"\n{'='*70}")
        print(f"PIPELINE EXECUTION COMPLETE")
        print(f"{'='*70}\n")
    else:
        print(f"\n{'='*70}")
        print(f"PIPELINE EXECUTION FAILED")
        print(f"{'='*70}\n")


if __name__ == "__main__":
    main()
