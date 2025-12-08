import os
import json
import time
import requests
from pathlib import Path
from typing import Dict, List, Optional
from google.auth import default
from google.auth.transport.requests import Request
from tqdm import tqdm

# Configuration
PROJECT_ID = "fddadvisor-fdd-processing"
LOCATION = "us-central1"
FDD_DIRECTORY = "/Users/stephen/Desktop/FDD_Extracted_TEST"
OUTPUT_DIRECTORY = "./fdd_processing_results"
CHECKPOINT_FILE = "./processing_checkpoint.json"

API_ENDPOINT = f"https://{LOCATION}-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/{LOCATION}/endpoints/openapi/chat/completions"
MODEL_NAME = "deepseek-ai/deepseek-r1-0528-maas"

# Step 1: Analytical Prompt (produces narrative analysis)
ANALYTICAL_PROMPT = """
You are an expert franchise analyst with deep knowledge of franchise disclosure documents (FDDs) and franchise business models. Your task is to analyze this FDD comprehensively and provide actionable insights for prospective franchisees.

**ANALYSIS FRAMEWORK:**

## 1. FranchiseScore™ Analysis (600 points total)

Calculate a weighted score across these dimensions. For EACH metric, provide:
- Score out of maximum
- Rating (Excellent/Good/Fair/Poor)
- 2-3 sentence explanation with specific data points
- Page citations

### System Stability Score (200 points)

Analyze 3-5 specific metrics:

**Franchisee Turnover Rate:** [Score]/[Max] - [Rating]
- Calculate from Item 20, Table 3: (Terminations + Non-renewals + Ceased Operations) ÷ Total Outlets
- Show calculation for 2022, 2023, 2024
- **Explanation:** [2-3 sentences with specific numbers and what they indicate]
- Cite page numbers

**Unit Closure Rate:** [Score]/[Max] - [Rating]
- Calculate from Item 20, Table 3: Total units closed ÷ Total outlets at start of year
- Show 3-year trend
- **Explanation:** [2-3 sentences explaining the trend]
- Cite page numbers

**Litigation History:** [Score]/[Max] - [Rating]
- Extract from Item 3
- State exact number of cases and types
- **Explanation:** [2-3 sentences explaining litigation risk level]
- Cite page number

**Financial Stability:** [Score]/[Max] - [Rating]
- Extract from Item 1, Special Risks section
- Quote any financial warnings verbatim
- **Explanation:** [2-3 sentences explaining financial health indicators]
- Cite page number

**[Additional metrics as applicable]**

**System Stability Total: [Sum]/200**

---

### Support Quality Score (150 points)

Analyze 3-5 specific metrics:

**Initial Training Quality:** [Score]/[Max] - [Rating]
- Extract from Item 11
- Total hours, location(s), topics covered
- **Explanation:** [2-3 sentences explaining training comprehensiveness]
- Cite page numbers

**Ongoing Support Programs:** [Score]/[Max] - [Rating]
- Extract from Item 11
- List specific ongoing support services
- Field visit frequency if stated
- **Explanation:** [2-3 sentences explaining support quality]
- Cite page numbers

**Marketing/Advertising Support:** [Score]/[Max] - [Rating]
- Extract from Items 6 and 11
- Ad Fund percentage, local requirements, grand opening support
- **Explanation:** [2-3 sentences explaining marketing support level]
- Cite page numbers

**Technology & Systems:** [Score]/[Max] - [Rating]
- Extract from Items 8 and 11
- Required systems by name, monthly costs
- **Explanation:** [2-3 sentences explaining technology infrastructure]
- Cite page numbers

**[Additional metrics as applicable]**

**Support Quality Total: [Sum]/150**

---

### Growth Trajectory Score (150 points)

Analyze 3-5 specific metrics:

**3-Year Growth Rate:** [Score]/[Max] - [Rating]
- Calculate from Item 20, Table 1: (2024 units - 2022 units) ÷ 2022 units
- Show calculation with actual numbers
- **Explanation:** [2-3 sentences explaining growth trend and sustainability]
- Cite page number

**Market Expansion:** [Score]/[Max] - [Rating]
- Extract from Item 20, Table 3
- Number of states, geographic diversification
- **Explanation:** [2-3 sentences explaining market penetration]
- Cite page number

**Development Pipeline:** [Score]/[Max] - [Rating]
- Extract from Item 20, Table 5
- Signed agreements not yet opened
- **Explanation:** [2-3 sentences explaining future growth potential]
- Cite page number

**Unit Economics Trend:** [Score]/[Max] - [Rating]
- Extract from Item 19 if available
- Same-store sales growth or performance indicators
- **Explanation:** [2-3 sentences explaining unit-level performance]
- Cite page number

**[Additional metrics as applicable]**

**Growth Trajectory Total: [Sum]/150**

---

### Financial Disclosure Score (100 points)

Analyze 3-5 specific metrics:

**Item 19 Comprehensiveness:** [Score]/[Max] - [Rating]
- Does Item 19 include financial data? What specific metrics?
- How many units included?
- **Explanation:** [2-3 sentences explaining quality of financial disclosures]
- Cite page numbers

**Investment Transparency:** [Score]/[Max] - [Rating]
- Extract from Item 7
- Is investment range clearly disclosed with all cost categories?
- **Explanation:** [2-3 sentences explaining investment disclosure quality]
- Cite page number

**Financial Statement Availability:** [Score]/[Max] - [Rating]
- Extract from Item 21
- Are audited financial statements provided?
- **Explanation:** [2-3 sentences explaining franchisor financial transparency]
- Cite page number

**[Additional metrics as applicable]**

**Financial Disclosure Total: [Sum]/100**

---

**OVERALL FRANCHISESCORE™: [Sum of all categories]/600**

---

## 2. Top 3 Opportunities

For EACH opportunity, provide:
- **Title:** Clear, specific title (5-8 words)
- **Description:** Detailed explanation (3-5 sentences) with specific data points, calculations, percentages, or metrics from the FDD
- **Rating:** High/Medium/Low
- **Citations:** Specific Item numbers and page numbers

Example format:
**1. Strong Item 19 Financial Performance Disclosure**
**Rating:** High
**Description:** The FDD provides comprehensive Item 19 financial performance data for 127 franchised locations (82% of system), showing median gross revenue of $1.2M with top quartile achieving $1.8M. The disclosure includes detailed expense breakdowns showing average operating costs of 68% of revenue, resulting in median EBITDA margins of 18-22%. This level of transparency, combined with 3-year same-store sales growth of 12%, provides strong evidence of unit-level profitability and system-wide performance consistency.
**Citations:** Item 19, pages 87-94

## 3. Top 3 Concerns

For EACH concern, provide:
- **Title:** Clear, specific title (5-8 words)
- **Description:** Detailed explanation (3-5 sentences) with specific data points, calculations, percentages, or metrics from the FDD
- **Rating:** High/Medium/Low
- **Citations:** Specific Item numbers and page numbers

Example format:
**1. High Franchisee Turnover Rate**
**Rating:** High
**Description:** Item 20 Table 3 reveals a concerning franchisee turnover rate of 18% in 2024, calculated from 23 terminations and 7 non-renewals out of 167 total outlets at year start. This represents a significant increase from 12% in 2023 and 9% in 2022, indicating deteriorating franchisee satisfaction. The FDD does not provide explanations for these terminations, and Item 3 discloses 8 pending litigation cases from former franchisees alleging misrepresentation of earnings potential. This trend suggests potential systemic issues with unit economics or franchisor support.
**Citations:** Item 20 Table 3, pages 112-115; Item 3, pages 15-18

---

## 4. Investment Breakdown (Item 7)
Extract complete investment breakdown with all categories, ranges, and notes.

## 5. Revenue Analysis (Item 19)
If Item 19 contains financial data, extract all metrics, averages, ranges, and sample sizes.
If Item 19 states "we do not make financial performance representations," state that clearly.

## 6. Unit Count & Distribution (Item 20)
Extract system totals, 3-year trends, state-by-state breakdown, and pipeline data.

---

**CRITICAL RULES:**
1. Only use data explicitly stated in the FDD - NO hallucinations or estimates
2. Cite page numbers for every claim
3. Show all calculations for scores and percentages
4. Use exact quotes for important disclosures
5. For each scoring metric, provide detailed 2-3 sentence explanations with specific data
6. For opportunities and concerns, provide 3-5 sentence descriptions with specific numbers and evidence

Analyze the FDD below:
"""

# Step 2: Extraction Prompt (converts analysis to structured JSON)
EXTRACTION_PROMPT = """
You are a data extraction specialist. Convert the FDD analysis into structured JSON for database storage.

**CRITICAL:** Extract the DETAILED scoring breakdowns with all metrics, explanations, and ratings.

**OUTPUT STRUCTURE:**

{
  "franchise_name": "string",
  "brand_description": "string (2-3 sentences)",
  "industry": "string",
  "franchise_score": number (0-600),
  
  "franchise_score_breakdown": {
    "systemStability": [
      {
        "metric": "Franchisee Turnover Rate",
        "score": number,
        "max": number,
        "rating": "Excellent|Good|Fair|Poor",
        "explanation": "string (2-3 sentences with specific data)"
      },
      {
        "metric": "Unit Closure Rate",
        "score": number,
        "max": number,
        "rating": "Excellent|Good|Fair|Poor",
        "explanation": "string (2-3 sentences)"
      }
      // ... 3-5 metrics total for systemStability
    ],
    "supportQuality": [
      {
        "metric": "Initial Training Quality",
        "score": number,
        "max": number,
        "rating": "Excellent|Good|Fair|Poor",
        "explanation": "string (2-3 sentences)"
      }
      // ... 3-5 metrics total for supportQuality
    ],
    "growthTrajectory": [
      {
        "metric": "3-Year Growth Rate",
        "score": number,
        "max": number,
        "rating": "Excellent|Good|Fair|Poor",
        "explanation": "string (2-3 sentences)"
      }
      // ... 3-5 metrics total for growthTrajectory
    ],
    "financialDisclosure": [
      {
        "metric": "Item 19 Comprehensiveness",
        "score": number,
        "max": number,
        "rating": "Excellent|Good|Fair|Poor",
        "explanation": "string (2-3 sentences)"
      }
      // ... 3-5 metrics total for financialDisclosure
    ]
  },
  
  "opportunities": [
    {
      "title": "string (5-8 words)",
      "description": "string (3-5 sentences with specific data, calculations, and evidence)",
      "rating": "High|Medium|Low",
      "citations": ["Item X, pages Y-Z"]
    }
    // Exactly 3 opportunities
  ],
  
  "concerns": [
    {
      "title": "string (5-8 words)",
      "description": "string (3-5 sentences with specific data, calculations, and evidence)",
      "rating": "High|Medium|Low",
      "citations": ["Item X, pages Y-Z"]
    }
    // Exactly 3 concerns
  ],
  
  "analytical_summary": "string (2-3 paragraph executive summary of the franchise opportunity)",
  
  "initial_investment_low": number,
  "initial_investment_high": number,
  "franchise_fee": number,
  "royalty_fee": "string",
  "marketing_fee": "string",
  
  "avg_revenue": number or null,
  "investment_breakdown": {
    "categories": [
      {
        "category": "string",
        "low": number,
        "high": number,
        "notes": "string"
      }
    ]
  },
  "revenue_data": {
    "item19_available": boolean,
    "median_revenue": number or null,
    "average_revenue": number or null,
    "top_quartile": number or null,
    "sample_size": number or null
  },
  
  "units_total": number,
  "units_franchised": number,
  "units_company_owned": number,
  "units_opened_last_year": number or null,
  "units_closed_last_year": number or null,
  
  "litigation_count": number,
  "bankruptcy_count": number,
  
  "year_founded": number or null,
  "franchising_since": number or null,
  "fdd_issue_date": "YYYY-MM-DD" or null
}

**EXTRACTION RULES:**
1. Extract ALL metrics from the franchise_score_breakdown with their scores, ratings, and explanations
2. Ensure opportunities and concerns have DETAILED 3-5 sentence descriptions with specific data
3. Include all citations in array format
4. Use null for missing data
5. Ensure all JSON is valid

**OUTPUT:**
Return ONLY the JSON object. No markdown, no explanations, just valid JSON.
"""

def read_text_file(txt_path: str) -> str:
    """Read text content from pre-extracted .txt file"""
    try:
        with open(txt_path, 'r', encoding='utf-8') as file:
            text = file.read()
            return text
    except Exception as e:
        print(f"Error reading text from {txt_path}: {e}")
        return ""


def load_checkpoint() -> Dict:
    """Load processing checkpoint"""
    if os.path.exists(CHECKPOINT_FILE):
        with open(CHECKPOINT_FILE, 'r') as f:
            return json.load(f)
    return {"completed": [], "failed": []}


def save_checkpoint(checkpoint: Dict):
    """Save processing checkpoint"""
    with open(CHECKPOINT_FILE, 'w') as f:
        json.dump(checkpoint, f, indent=2)


def get_access_token():
    """Get Google Cloud access token for API authentication"""
    credentials, _ = default()
    credentials.refresh(Request())
    return credentials.token


def call_deepseek_api(prompt: str, max_retries: int = 3) -> Optional[str]:
    """Call DeepSeek R1 via OpenAI-compatible API"""
    headers = {
        "Authorization": f"Bearer {get_access_token()}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "stream": False,
        "max_tokens": 16000,
        "temperature": 0.7
    }
    
    for attempt in range(max_retries):
        try:
            response = requests.post(API_ENDPOINT, headers=headers, json=payload, timeout=300)
            response.raise_for_status()
            
            result = response.json()
            return result["choices"][0]["message"]["content"]
            
        except Exception as e:
            print(f"API call failed (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(5 * (attempt + 1))  # Exponential backoff
            else:
                return None


def step1_analyze_fdd(fdd_text: str, fdd_name: str) -> Optional[str]:
    """Step 1: Generate narrative analysis using DeepSeek-R1"""
    try:
        prompt = f"{ANALYTICAL_PROMPT}\n\nFDD Content:\n{fdd_text[:100000]}"
        analysis = call_deepseek_api(prompt)
        return analysis
        
    except Exception as e:
        print(f"Error analyzing {fdd_name}: {e}")
        return None


def step2_extract_structured_data(analysis: str, fdd_name: str) -> Optional[Dict]:
    """Step 2: Extract structured JSON from analysis"""
    try:
        prompt = f"{EXTRACTION_PROMPT}\n\nAnalysis:\n{analysis}"
        json_text = call_deepseek_api(prompt)
        
        if not json_text:
            return None
        
        # Remove markdown code blocks
        if "\`\`\`json" in json_text:
            json_text = json_text.split("\`\`\`json")[1].split("\`\`\`")[0]
        elif "\`\`\`" in json_text:
            json_text = json_text.split("\`\`\`")[1].split("\`\`\`")[0]
        
        # Remove any leading/trailing whitespace
        json_text = json_text.strip()
        
        # Try to find JSON object if there's extra text
        if not json_text.startswith("{"):
            # Look for the first { and last }
            start_idx = json_text.find("{")
            end_idx = json_text.rfind("}")
            if start_idx != -1 and end_idx != -1:
                json_text = json_text[start_idx:end_idx+1]
        
        # Debug: Save raw response for inspection
        debug_file = Path(OUTPUT_DIRECTORY) / "debug" / f"{fdd_name}_extraction_response.txt"
        debug_file.parent.mkdir(parents=True, exist_ok=True)
        with open(debug_file, 'w', encoding='utf-8') as f:
            f.write(f"Raw API Response:\n{json_text}\n")
        
        # Parse JSON
        structured_data = json.loads(json_text.strip())
        return structured_data
        
    except json.JSONDecodeError as e:
        print(f"JSON parsing error for {fdd_name}: {e}")
        print(f"Response preview: {json_text[:500] if json_text else 'Empty response'}")
        return None
    except Exception as e:
        print(f"Error extracting data from {fdd_name}: {e}")
        return None


def process_single_fdd(txt_path: Path, output_dir: Path) -> bool:
    """Process a single FDD through both steps"""
    fdd_name = txt_path.stem
    
    print(f"\n{'='*60}")
    print(f"Processing: {fdd_name}")
    print(f"{'='*60}")
    
    print("Reading pre-extracted text file...")
    fdd_text = read_text_file(str(txt_path))
    if not fdd_text:
        print(f"Failed to read text from {fdd_name}")
        return False
    
    print("Step 1: Generating narrative analysis with DeepSeek-R1...")
    analysis = step1_analyze_fdd(fdd_text, fdd_name)
    if not analysis:
        return False
    
    analysis_file = output_dir / "analyses" / f"{fdd_name}_analysis.txt"
    analysis_file.parent.mkdir(parents=True, exist_ok=True)
    with open(analysis_file, 'w', encoding='utf-8') as f:
        f.write(analysis)
    print(f"✓ Analysis saved to {analysis_file}")
    
    print("Step 2: Extracting structured data...")
    structured_data = step2_extract_structured_data(analysis, fdd_name)
    if not structured_data:
        return False
    
    json_file = output_dir / "structured_data" / f"{fdd_name}.json"
    json_file.parent.mkdir(parents=True, exist_ok=True)
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(structured_data, f, indent=2)
    print(f"✓ Structured data saved to {json_file}")
    
    return True


def main():
    """Main processing function"""
    output_dir = Path(OUTPUT_DIRECTORY)
    output_dir.mkdir(exist_ok=True)
    
    fdd_dir = Path(FDD_DIRECTORY)
    txt_files = sorted(list(fdd_dir.glob("*.txt")))
    
    print(f"\n{'='*60}")
    print(f"FDD BATCH PROCESSOR - VERTEX AI (DeepSeek-R1)")
    print(f"Processing Pre-Extracted Text Files")
    print(f"{'='*60}")
    print(f"Total FDD text files found: {len(txt_files)}")
    print(f"Output directory: {output_dir}")
    print(f"Using Google Cloud Project: {PROJECT_ID}")
    print(f"Model: DeepSeek-R1 via Vertex AI")
    print(f"Cost: Covered by your Google Cloud credits!")
    print(f"{'='*60}\n")
    
    checkpoint = load_checkpoint()
    completed = set(checkpoint["completed"])
    failed = set(checkpoint["failed"])
    
    remaining_files = [f for f in txt_files if f.stem not in completed]
    
    print(f"Already completed: {len(completed)}")
    print(f"Previously failed: {len(failed)}")
    print(f"Remaining to process: {len(remaining_files)}\n")
    
    if not remaining_files:
        print("All FDDs have been processed!")
        return
    
    for txt_file in tqdm(remaining_files, desc="Processing FDDs"):
        fdd_name = txt_file.stem
        
        if fdd_name in failed:
            print(f"Skipping {fdd_name} (previously failed)")
            continue
        
        success = process_single_fdd(txt_file, output_dir)
        
        if success:
            checkpoint["completed"].append(fdd_name)
            print(f"✓ Successfully processed {fdd_name}")
        else:
            checkpoint["failed"].append(fdd_name)
            print(f"✗ Failed to process {fdd_name}")
        
        save_checkpoint(checkpoint)
        
        time.sleep(2)
    
    print(f"\n{'='*60}")
    print(f"PROCESSING COMPLETE")
    print(f"{'='*60}")
    print(f"Successfully processed: {len(checkpoint['completed'])}")
    print(f"Failed: {len(checkpoint['failed'])}")
    print(f"\nResults saved to: {output_dir}")
    print(f"- Analyses: {output_dir}/analyses/")
    print(f"- Structured data: {output_dir}/structured_data/")
    
    combined_file = output_dir / "all_franchises.json"
    all_data = []
    for json_file in (output_dir / "structured_data").glob("*.json"):
        with open(json_file, 'r') as f:
            all_data.append(json.load(f))
    
    with open(combined_file, 'w') as f:
        json.dump(all_data, f, indent=2)
    
    print(f"\nCombined data saved to: {combined_file}")
    print(f"Ready for database import!")


if __name__ == "__main__":
    main()
