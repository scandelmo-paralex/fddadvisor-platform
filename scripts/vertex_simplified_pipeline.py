#!/usr/bin/env python3
"""
Simplified FDD Analysis Pipeline with FranchiseScore™ Methodology

Architecture:
1. Extract all 23 Items with Python regex
2. Combine into one text file
3. Run one comprehensive analysis with FranchiseScore™ methodology
4. Generate complete analysis.json with 600-point scoring
"""

import os
import sys
import json
import re
import argparse
from pathlib import Path
from datetime import datetime
import fitz  # PyMuPDF
import google.generativeai as genai

# Configure Gemini API
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

def extract_text_from_pdf(pdf_path):
    """Extract text from PDF using PyMuPDF."""
    print(f"📄 Extracting text from PDF: {pdf_path}")
    doc = fitz.open(pdf_path)
    full_text = ""
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        full_text += page.get_text()
    
    print(f"✓ Extracted {len(full_text):,} characters from {len(doc)} pages")
    return full_text

def extract_all_items(text):
    """
    Extract all 23 Items from FDD text using precise regex.
    Returns dict with item numbers as keys and text as values.
    """
    print("\n📋 Extracting all 23 Items...")
    
    # Find all Item headers with their positions
    # Pattern matches "ITEM 1" or "ITEM 1:" or "ITEM 1." at start of line
    pattern = r'^\s*ITEM\s+(\d+)[\.\:]?\s*$'
    matches = []
    
    for match in re.finditer(pattern, text, re.MULTILINE | re.IGNORECASE):
        item_num = int(match.group(1))
        position = match.start()
        matches.append((item_num, position))
    
    print(f"✓ Found {len(matches)} Item headers")
    
    # Deduplicate - keep first occurrence of each Item number
    seen = set()
    unique_matches = []
    for item_num, position in matches:
        if item_num not in seen and 1 <= item_num <= 23:
            seen.add(item_num)
            unique_matches.append((item_num, position))
    
    # Sort by position
    unique_matches.sort(key=lambda x: x[1])
    
    print(f"✓ Found {len(unique_matches)} unique Items (1-23)")
    
    # Extract text for each Item
    items = {}
    for i, (item_num, start_pos) in enumerate(unique_matches):
        # Find end position (start of next Item or end of text)
        if i < len(unique_matches) - 1:
            end_pos = unique_matches[i + 1][1]
        else:
            end_pos = len(text)
        
        item_text = text[start_pos:end_pos].strip()
        
        # Validate minimum length
        if len(item_text) >= 500:
            items[item_num] = item_text
            print(f"  Item {item_num}: {len(item_text):,} characters")
        else:
            print(f"  ⚠ Item {item_num}: Too short ({len(item_text)} chars), skipping")
    
    return items

def combine_items(items):
    """Combine all Items into one text file with clear separators."""
    combined = []
    
    for item_num in sorted(items.keys()):
        combined.append(f"\n{'='*80}\n")
        combined.append(f"ITEM {item_num}\n")
        combined.append(f"{'='*80}\n\n")
        combined.append(items[item_num])
        combined.append("\n")
    
    return "".join(combined)

def get_comprehensive_analysis_prompt():
    """
    Comprehensive analysis prompt with full FranchiseScore™ methodology.
    """
    return """You are an expert franchise analyst. Analyze this Franchise Disclosure Document (FDD) and provide a comprehensive analysis with detailed scoring.

# FRANCHISESCORE™ METHODOLOGY (0-600 Points)

## 1. SYSTEM STABILITY SCORE (0-200 points)

### 1.1 Franchisee Turnover Rate (0-70 points)
**Data Source:** Item 20, Table 3 (Transfers)
**Formula:** (Number of Transfers / Average Total Outlets) × 100
**Scoring:**
- 0-2%: 70 points (Excellent)
- 2-5%: 50 points (Good)
- 5-8%: 30 points (Fair)
- 8-12%: 15 points (Poor)
- >12%: 0 points (Critical)

### 1.2 Unit Closure Rate (0-65 points)
**Data Source:** Item 20, Table 4 (Terminations/Non-Renewals/Reacquisitions/Ceased Operations)
**Formula:** (Total Closures / Average Total Outlets) × 100
**Scoring:**
- 0-3%: 65 points (Excellent)
- 3-6%: 45 points (Good)
- 6-10%: 25 points (Fair)
- 10-15%: 10 points (Poor)
- >15%: 0 points (Critical)

### 1.3 Litigation Risk Factor (0-40 points)
**Data Source:** Item 3 (Litigation History)
**Scoring:**
- No litigation: 40 points
- 1-2 cases: 30 points
- 3-5 cases: 20 points
- 6-10 cases: 10 points
- >10 cases: 0 points

### 1.4 Transfer Activity (0-25 points)
**Data Source:** Item 20, Table 3
**Formula:** (Transfers / Total Outlets) × 100
**Scoring:**
- 0-3%: 25 points (Healthy)
- 3-6%: 18 points (Moderate)
- 6-10%: 10 points (Elevated)
- >10%: 0 points (High)

## 2. SUPPORT QUALITY SCORE (0-150 points)

### 2.1 Training Program Score (0-60 points)
**Data Source:** Item 11 (Training and Support)
**Evaluation Criteria:**
- Initial training duration (0-20 pts): >2 weeks = 20, 1-2 weeks = 15, <1 week = 5
- Ongoing training availability (0-20 pts): Comprehensive = 20, Moderate = 10, Minimal = 5
- Training location and format (0-20 pts): On-site + classroom = 20, Classroom only = 15, Online only = 10

### 2.2 Operational Support Score (0-50 points)
**Data Source:** Item 11
**Evaluation Criteria:**
- Field support frequency (0-20 pts): Monthly+ = 20, Quarterly = 15, Annual = 10, As-needed = 5
- Support staff availability (0-15 pts): Dedicated = 15, Shared = 10, Limited = 5
- Technology/systems support (0-15 pts): Comprehensive = 15, Moderate = 10, Basic = 5

### 2.3 Marketing Support Score (0-40 points)
**Data Source:** Item 11, Item 6 (Marketing Fees)
**Evaluation Criteria:**
- National marketing fund (0-15 pts): >2% = 15, 1-2% = 10, <1% = 5
- Local marketing support (0-15 pts): Comprehensive = 15, Moderate = 10, Minimal = 5
- Marketing materials provided (0-10 pts): Extensive = 10, Moderate = 7, Basic = 3

## 3. GROWTH TRAJECTORY SCORE (0-150 points)

### 3.1 Net Unit Growth Rate (0-60 points)
**Data Source:** Item 20, Tables 1-4
**Formula:** ((Units Opened - Units Closed) / Total Units) × 100
**Scoring:**
- >10%: 60 points (Exceptional)
- 5-10%: 45 points (Strong)
- 0-5%: 30 points (Moderate)
- -5-0%: 15 points (Declining)
- <-5%: 0 points (Critical)

### 3.2 Market Expansion Diversity (0-45 points)
**Data Source:** Item 20, Table 1 (by state/province)
**Scoring:**
- >20 states: 45 points (National)
- 10-20 states: 35 points (Regional)
- 5-10 states: 20 points (Multi-state)
- <5 states: 10 points (Limited)

### 3.3 Development Pipeline Strength (0-45 points)
**Data Source:** Item 20, Table 5 (Signed but not opened)
**Formula:** (Signed Not Opened / Total Outlets) × 100
**Scoring:**
- >15%: 45 points (Strong)
- 10-15%: 35 points (Good)
- 5-10%: 20 points (Moderate)
- <5%: 10 points (Weak)

## 4. FINANCIAL DISCLOSURE SCORE (0-100 points)

### 4.1 Item 19 Quality Score (0-60 points)
**Data Source:** Item 19 (Financial Performance Representations)
**Scoring:**
- Full disclosure with quartiles: 60 points
- Average/median only: 40 points
- Limited data: 20 points
- No disclosure: 0 points

### 4.2 Investment Efficiency Score (0-40 points)
**Data Source:** Item 7 (Initial Investment), Item 19 (Revenue)
**Formula:** Average Revenue / Average Initial Investment
**Scoring:**
- >2.0x: 40 points (Excellent)
- 1.5-2.0x: 30 points (Good)
- 1.0-1.5x: 20 points (Fair)
- 0.5-1.0x: 10 points (Poor)
- <0.5x: 0 points (Critical)

# ANALYSIS INSTRUCTIONS

Analyze the FDD and extract the following information in JSON format:

## Basic Information
- franchise_name: Official franchise brand name
- description: Business description (2-3 sentences)
- industry: Industry category
- parent_company: Parent company name (if applicable)
- year_founded: Year franchise was founded

## Financial Data
- franchise_fee: Initial franchise fee
- royalty_fee: Ongoing royalty fee (percentage or amount)
- marketing_fee: Marketing/advertising fee
- initial_investment_low: Minimum initial investment
- initial_investment_high: Maximum initial investment
- investment_breakdown: Array of investment categories with amounts

## Item 19 - Financial Performance
- has_item19: true/false (check for "Other than the preceding financial performance representation")
- revenue_data: {
    has_data: boolean,
    outlets_analyzed: number,
    time_period: string,
    average_revenue: number,
    median_revenue: number,
    top_quartile_revenue: number,
    tables: [array of table data with quartile breakdowns]
  }

## Item 20 - Unit Counts
- total_units: Total number of outlets
- franchised_units: Number of franchised outlets
- company_owned_units: Number of company-owned outlets
- units_opened_last_year: Units opened in most recent year
- units_closed_last_year: Units closed in most recent year
- states_operating: Number of states/provinces

## FranchiseScore™ Calculation
Calculate each metric using the formulas above and provide:

franchise_score_breakdown: {
  system_stability: {
    total_score: number (0-200),
    max_score: 200,
    metrics: [
      {
        name: "Franchisee Turnover Rate",
        score: number (0-70),
        max_score: 70,
        value: "X.X%",
        calculation: "Show formula with actual numbers",
        rating: "Excellent/Good/Fair/Poor/Critical",
        explanation: "Detailed explanation with context",
        citation: "Item 20, Table 3"
      },
      // ... other metrics
    ]
  },
  support_quality: {
    total_score: number (0-150),
    max_score: 150,
    metrics: [...]
  },
  growth_trajectory: {
    total_score: number (0-150),
    max_score: 150,
    metrics: [...]
  },
  financial_disclosure: {
    total_score: number (0-100),
    max_score: 100,
    metrics: [...]
  }
}

franchise_score: number (sum of all category scores, 0-600)

## Opportunities and Concerns
Generate 3-5 opportunities and 3-5 concerns based on the analysis:

opportunities: [
  {
    title: string,
    description: string (2-3 sentences),
    citation: "Item X, Table Y",
    impact: "High/Medium/Low"
  }
]

concerns: [
  {
    title: string,
    description: string (2-3 sentences),
    citation: "Item X, Table Y",
    impact: "High/Medium/Low"
  }
]

## Analytical Summary
analytical_summary: Comprehensive 3-4 paragraph analysis covering:
- Overall franchise strength and positioning
- Key financial performance insights
- Support and training quality
- Growth trajectory and market presence
- Risk factors and considerations
- Investment value proposition

# OUTPUT FORMAT

Return ONLY valid JSON with all fields populated. Use null for missing data.
Include detailed calculations and explanations for all FranchiseScore™ metrics.
Cite specific Items and Tables for all data points.

Begin your analysis now:"""

def call_gemini_api(text, prompt, model_name="gemini-2.0-flash-exp"):
    """Call Gemini API with text and prompt."""
    print(f"\n🤖 Calling Gemini API ({model_name})...")
    print(f"   Text length: {len(text):,} characters")
    
    # Truncate if needed (Gemini has context limits)
    max_chars = 200000  # Conservative limit
    if len(text) > max_chars:
        print(f"   ⚠ Truncating text to {max_chars:,} characters")
        text = text[:max_chars]
    
    try:
        model = genai.GenerativeModel(model_name)
        full_prompt = f"{prompt}\n\n# FDD TEXT:\n\n{text}"
        
        response = model.generate_content(
            full_prompt,
            generation_config={
                "temperature": 0.1,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 8192,
            }
        )
        
        response_text = response.text
        print(f"✓ Received response: {len(response_text):,} characters")
        
        return response_text
        
    except Exception as e:
        print(f"✗ API call failed: {e}")
        return None

def extract_json_from_response(response_text):
    """Extract JSON from Gemini response."""
    # Try to find JSON in code blocks
    json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
    if json_match:
        json_str = json_match.group(1)
    else:
        # Try to find JSON without code blocks
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
        else:
            return None
    
    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"✗ JSON parsing error: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description='Simplified FDD Analysis Pipeline')
    parser.add_argument('--pdf', required=True, help='Path to PDF file')
    args = parser.parse_args()
    
    pdf_path = args.pdf
    if not os.path.exists(pdf_path):
        print(f"✗ PDF file not found: {pdf_path}")
        sys.exit(1)
    
    # Extract franchise name from filename
    pdf_name = Path(pdf_path).stem
    
    # Create output directory
    output_dir = Path("pipeline_output") / pdf_name
    output_dir.mkdir(parents=True, exist_ok=True)
    items_dir = output_dir / "items"
    items_dir.mkdir(exist_ok=True)
    
    print(f"\n{'='*80}")
    print(f"FDD ANALYSIS PIPELINE - SIMPLIFIED")
    print(f"{'='*80}")
    print(f"PDF: {pdf_path}")
    print(f"Output: {output_dir}")
    print(f"{'='*80}\n")
    
    # Step 1: Extract text from PDF
    full_text = extract_text_from_pdf(pdf_path)
    
    # Save full text
    full_text_path = output_dir / "full_text.txt"
    with open(full_text_path, 'w', encoding='utf-8') as f:
        f.write(full_text)
    print(f"✓ Saved full text to {full_text_path}")
    
    # Step 2: Extract all 23 Items
    items = extract_all_items(full_text)
    
    if len(items) < 20:
        print(f"\n⚠ Warning: Only found {len(items)} Items (expected 23)")
    
    # Save individual Items
    for item_num, item_text in items.items():
        item_path = items_dir / f"item_{item_num:02d}.txt"
        with open(item_path, 'w', encoding='utf-8') as f:
            f.write(item_text)
    print(f"✓ Saved {len(items)} individual Item files to {items_dir}")
    
    # Step 3: Combine all Items
    combined_text = combine_items(items)
    combined_path = output_dir / "all_items_combined.txt"
    with open(combined_path, 'w', encoding='utf-8') as f:
        f.write(combined_text)
    print(f"✓ Saved combined Items to {combined_path}")
    print(f"   Combined text: {len(combined_text):,} characters")
    
    # Step 4: Run comprehensive analysis
    print(f"\n{'='*80}")
    print("RUNNING COMPREHENSIVE ANALYSIS")
    print(f"{'='*80}")
    
    prompt = get_comprehensive_analysis_prompt()
    response_text = call_gemini_api(combined_text, prompt)
    
    if not response_text:
        print("✗ Analysis failed")
        sys.exit(1)
    
    # Save raw response
    response_path = output_dir / "raw_response.txt"
    with open(response_path, 'w', encoding='utf-8') as f:
        f.write(response_text)
    print(f"✓ Saved raw response to {response_path}")
    
    # Step 5: Extract and save JSON
    analysis = extract_json_from_response(response_text)
    
    if not analysis:
        print("✗ Could not extract JSON from response")
        failed_path = output_dir / f"failed_response_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        with open(failed_path, 'w', encoding='utf-8') as f:
            f.write(response_text)
        print(f"✓ Saved failed response to {failed_path}")
        sys.exit(1)
    
    # Save analysis JSON
    analysis_path = output_dir / "analysis.json"
    with open(analysis_path, 'w', encoding='utf-8') as f:
        json.dump(analysis, indent=2, fp=f)
    print(f"✓ Saved analysis to {analysis_path}")
    
    # Print summary
    print(f"\n{'='*80}")
    print("ANALYSIS COMPLETE")
    print(f"{'='*80}")
    print(f"Franchise: {analysis.get('franchise_name', 'N/A')}")
    print(f"FranchiseScore: {analysis.get('franchise_score', 'N/A')}/600")
    print(f"Opportunities: {len(analysis.get('opportunities', []))}")
    print(f"Concerns: {len(analysis.get('concerns', []))}")
    print(f"{'='*80}\n")

if __name__ == "__main__":
    main()
