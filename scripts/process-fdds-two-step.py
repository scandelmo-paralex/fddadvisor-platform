import os
import json
import time
from pathlib import Path
from openai import OpenAI
import base64
from tqdm import tqdm

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# ============================================
# STEP 1: ANALYTICAL PROMPT (Your Claude prompt)
# ============================================
ANALYTICAL_PROMPT = """
Analyze this Franchise Disclosure Document (FDD) and provide a comprehensive analysis covering:

1. **Franchise Overview**: Brand name, industry, business model, and value proposition
2. **Investment Analysis**: Initial investment range, breakdown of costs, ongoing fees
3. **Financial Performance (Item 19)**: Revenue data, profitability metrics, performance by location type
4. **Territory & Market**: Territory rights, protected areas, market saturation
5. **Training & Support**: Initial training, ongoing support, marketing assistance
6. **Legal Considerations**: Litigation history, bankruptcy history, restrictions
7. **Growth & Performance**: Unit count, growth rate, closure rate, franchisee satisfaction indicators
8. **Key Strengths**: What makes this franchise attractive
9. **Key Concerns**: Red flags or areas of concern
10. **Ideal Candidate**: Who would succeed with this franchise

Provide detailed, specific information with numbers and data points where available.
"""

# ============================================
# STEP 2: EXTRACTION PROMPT (Converts analysis to structured data)
# ============================================
EXTRACTION_PROMPT = """
Extract structured data from this FDD analysis and return ONLY valid JSON (no markdown, no explanation).

Required JSON structure:
{
  "franchise_name": "string",
  "brand_description": "string (2-3 sentences)",
  "industry": "string (e.g., 'Food & Beverage', 'Fitness', 'Retail')",
  "business_model": "string (brief description)",
  
  "initial_investment_low": number (in dollars),
  "initial_investment_high": number (in dollars),
  "liquid_capital_required": number (if available, null otherwise),
  "net_worth_required": number (if available, null otherwise),
  
  "royalty_fee": "string (e.g., '6%' or '$500/month')",
  "marketing_fee": "string (e.g., '2%')",
  "other_fees": "string (brief summary of other fees)",
  
  "item19_available": boolean,
  "item19_summary": "string (key financial performance data)",
  "average_revenue": number (if available, null otherwise),
  "top_quartile_revenue": number (if available, null otherwise),
  
  "territory_type": "string (e.g., 'Exclusive', 'Protected', 'Non-exclusive')",
  "territory_description": "string (brief description)",
  
  "training_duration": "string (e.g., '2 weeks')",
  "training_location": "string",
  "ongoing_support": "string (brief description)",
  
  "total_units": number,
  "franchised_units": number,
  "company_owned_units": number,
  "units_opened_last_year": number (if available),
  "units_closed_last_year": number (if available),
  
  "litigation_summary": "string (brief summary or 'None reported')",
  "bankruptcy_summary": "string (brief summary or 'None reported')",
  
  "key_strengths": ["string", "string", "string"],
  "key_concerns": ["string", "string"],
  "ideal_candidate": "string (description of ideal franchisee)",
  
  "fdd_issue_date": "string (YYYY-MM-DD format if available)",
  "contact_email": "string (if available)",
  "contact_phone": "string (if available)",
  "website": "string (if available)"
}

Extract all available data. Use null for missing numeric values, empty string for missing text, empty arrays for missing lists.
"""

# ============================================
# CONFIGURATION
# ============================================
FDD_DIRECTORY = "./fdds"  # Change to your Google Drive folder path
OUTPUT_DIRECTORY = "./fdd_processed"
CHECKPOINT_FILE = "./fdd_processing_checkpoint.json"

# Options:
# - "o1-mini" - Best value, good reasoning ($3-6 per FDD)
# - "o1-preview" - Best quality, expensive ($15-30 per FDD)
# - "gpt-4-turbo-preview" - Standard model, cheaper but less reasoning ($1-2 per FDD)
ANALYSIS_MODEL = "o1-mini"  # Recommended for quality + cost balance
EXTRACTION_MODEL = "gpt-4-turbo-preview"  # Standard model is fine for extraction

# Create output directories
Path(OUTPUT_DIRECTORY).mkdir(exist_ok=True)
Path(f"{OUTPUT_DIRECTORY}/analyses").mkdir(exist_ok=True)
Path(f"{OUTPUT_DIRECTORY}/structured").mkdir(exist_ok=True)

# ============================================
# HELPER FUNCTIONS
# ============================================

def load_checkpoint():
    """Load processing checkpoint"""
    if os.path.exists(CHECKPOINT_FILE):
        with open(CHECKPOINT_FILE, 'r') as f:
            return json.load(f)
    return {"processed": [], "failed": []}

def save_checkpoint(checkpoint):
    """Save processing checkpoint"""
    with open(CHECKPOINT_FILE, 'w') as f:
        json.dump(checkpoint, f, indent=2)

def extract_text_from_pdf(pdf_path):
    """Extract text from PDF for analysis"""
    # Note: You'll need to install PyPDF2: pip install PyPDF2
    import PyPDF2
    
    text = ""
    with open(pdf_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        # Extract first 50 pages (or all if less)
        for page_num in range(min(50, len(pdf_reader.pages))):
            text += pdf_reader.pages[page_num].extract_text()
    return text

def step1_analyze_fdd(pdf_path, franchise_name):
    """Step 1: Generate narrative analysis using reasoning model"""
    print(f"  [Step 1] Analyzing FDD with {ANALYSIS_MODEL}...")
    
    # Extract text from PDF
    fdd_text = extract_text_from_pdf(pdf_path)
    
    # Truncate if too long (adjust based on model limits)
    # o1 models have different token limits than GPT-4
    max_chars = 120000 if ANALYSIS_MODEL.startswith("o1") else 100000
    if len(fdd_text) > max_chars:
        fdd_text = fdd_text[:max_chars] + "\n\n[Document truncated due to length]"
    
    if ANALYSIS_MODEL.startswith("o1"):
        # o1 models don't support system messages or temperature
        response = client.chat.completions.create(
            model=ANALYSIS_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": f"{ANALYTICAL_PROMPT}\n\nFDD Text:\n{fdd_text}"
                }
            ],
            max_completion_tokens=16000  # o1 uses max_completion_tokens instead of max_tokens
        )
    else:
        # Standard GPT-4 call
        response = client.chat.completions.create(
            model=ANALYSIS_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert franchise analyst. Analyze FDDs thoroughly and provide detailed insights."
                },
                {
                    "role": "user",
                    "content": f"{ANALYTICAL_PROMPT}\n\nFDD Text:\n{fdd_text}"
                }
            ],
            temperature=0.3,
            max_tokens=4000
        )
    
    analysis = response.choices[0].message.content
    return analysis

def step2_extract_structured_data(analysis_text, franchise_name):
    """Step 2: Extract structured JSON from analysis"""
    print(f"  [Step 2] Extracting structured data with {EXTRACTION_MODEL}...")
    
    response = client.chat.completions.create(
        model=EXTRACTION_MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are a data extraction expert. Extract structured data and return ONLY valid JSON."
            },
            {
                "role": "user",
                "content": f"{EXTRACTION_PROMPT}\n\nAnalysis to extract from:\n{analysis_text}"
            }
        ],
        temperature=0,
        max_tokens=2000,
        response_format={"type": "json_object"}  # Ensures JSON output
    )
    
    structured_data = json.loads(response.choices[0].message.content)
    return structured_data

def process_single_fdd(pdf_path, franchise_name):
    """Process a single FDD through both steps"""
    try:
        # Step 1: Generate analysis
        analysis = step1_analyze_fdd(pdf_path, franchise_name)
        
        # Save analysis
        analysis_file = f"{OUTPUT_DIRECTORY}/analyses/{franchise_name}.txt"
        with open(analysis_file, 'w', encoding='utf-8') as f:
            f.write(analysis)
        
        # Step 2: Extract structured data
        structured_data = step2_extract_structured_data(analysis, franchise_name)
        
        # Save structured data
        json_file = f"{OUTPUT_DIRECTORY}/structured/{franchise_name}.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(structured_data, f, indent=2)
        
        return {
            "success": True,
            "analysis_file": analysis_file,
            "json_file": json_file,
            "data": structured_data
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# ============================================
# MAIN PROCESSING LOOP
# ============================================

def main():
    print("=" * 60)
    print("FDD BATCH PROCESSOR - Two-Step Analysis & Extraction")
    print(f"Analysis Model: {ANALYSIS_MODEL}")
    print(f"Extraction Model: {EXTRACTION_MODEL}")
    print("=" * 60)
    
    # Get all PDF files
    pdf_files = list(Path(FDD_DIRECTORY).glob("*.pdf"))
    total_files = len(pdf_files)
    
    print(f"\nFound {total_files} FDD files to process")
    
    if ANALYSIS_MODEL == "o1-mini":
        estimated_cost = total_files * 4.5  # ~$4.50 per FDD
    elif ANALYSIS_MODEL == "o1-preview":
        estimated_cost = total_files * 22.5  # ~$22.50 per FDD
    else:
        estimated_cost = total_files * 1.5  # ~$1.50 per FDD
    
    print(f"Estimated cost: ${estimated_cost:,.2f}")
    print(f"Estimated time: {(total_files * 15) / 60:.1f} hours")
    
    # Load checkpoint
    checkpoint = load_checkpoint()
    processed_count = len(checkpoint["processed"])
    
    if processed_count > 0:
        print(f"Resuming from checkpoint: {processed_count} already processed")
    
    # Process each FDD
    all_structured_data = []
    
    for pdf_path in tqdm(pdf_files, desc="Processing FDDs"):
        franchise_name = pdf_path.stem  # Filename without extension
        
        # Skip if already processed
        if franchise_name in checkpoint["processed"]:
            # Load existing data
            json_file = f"{OUTPUT_DIRECTORY}/structured/{franchise_name}.json"
            if os.path.exists(json_file):
                with open(json_file, 'r') as f:
                    all_structured_data.append(json.load(f))
            continue
        
        print(f"\nProcessing: {franchise_name}")
        
        # Process FDD
        result = process_single_fdd(str(pdf_path), franchise_name)
        
        if result["success"]:
            checkpoint["processed"].append(franchise_name)
            all_structured_data.append(result["data"])
            print(f"  ✓ Success")
        else:
            checkpoint["failed"].append({
                "name": franchise_name,
                "error": result["error"]
            })
            print(f"  ✗ Failed: {result['error']}")
        
        # Save checkpoint
        save_checkpoint(checkpoint)
        
        time.sleep(3 if ANALYSIS_MODEL.startswith("o1") else 2)
    
    # Save combined output
    combined_file = f"{OUTPUT_DIRECTORY}/all_franchises.json"
    with open(combined_file, 'w', encoding='utf-8') as f:
        json.dump(all_structured_data, f, indent=2)
    
    print("\n" + "=" * 60)
    print("PROCESSING COMPLETE")
    print("=" * 60)
    print(f"Successfully processed: {len(checkpoint['processed'])}")
    print(f"Failed: {len(checkpoint['failed'])}")
    print(f"\nOutputs:")
    print(f"  - Analyses: {OUTPUT_DIRECTORY}/analyses/")
    print(f"  - Structured JSON: {OUTPUT_DIRECTORY}/structured/")
    print(f"  - Combined JSON: {combined_file}")
    
    if checkpoint['failed']:
        print(f"\nFailed files:")
        for failed in checkpoint['failed']:
            print(f"  - {failed['name']}: {failed['error']}")

if __name__ == "__main__":
    main()
