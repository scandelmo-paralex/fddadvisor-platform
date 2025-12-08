"""
Batch FDD Processing Script
Processes 1,550 FDDs through your analytical prompt and outputs structured JSON
"""

import os
import json
import time
from pathlib import Path
from typing import Dict, List, Optional
import openai
from tqdm import tqdm
from datetime import datetime

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
INPUT_DIR = "fdds/input"  # Directory containing your FDD PDFs or images
OUTPUT_DIR = "fdds/output"  # Directory for JSON results
CHECKPOINT_FILE = "fdds/checkpoint.json"  # Track progress
BATCH_SIZE = 10  # Process in batches to handle rate limits
DELAY_BETWEEN_REQUESTS = 2  # Seconds between API calls

# Your analytical prompt template
ANALYTICAL_PROMPT = """
Analyze this Franchise Disclosure Document (FDD) and extract the following information in JSON format:

{
  "franchise_name": "string",
  "franchisor_name": "string",
  "industry": "string",
  "description": "string (2-3 sentences)",
  "initial_investment_low": number,
  "initial_investment_high": number,
  "liquid_capital_required": number,
  "net_worth_required": number,
  "royalty_fee": "string (e.g., '6%' or '$500/month')",
  "marketing_fee": "string",
  "item19_available": boolean,
  "item19_summary": "string (if available)",
  "item19_median_revenue": number (if available),
  "item19_median_profit": number (if available),
  "units_total": number,
  "units_franchised": number,
  "units_company_owned": number,
  "year_founded": number,
  "franchising_since": number,
  "territory_exclusive": boolean,
  "territory_protected": boolean,
  "training_duration_days": number,
  "training_location": "string",
  "ongoing_support": "string",
  "financing_available": boolean,
  "financing_details": "string (if available)",
  "veteran_discount": boolean,
  "multi_unit_discount": boolean,
  "fdd_issue_date": "YYYY-MM-DD",
  "fdd_expiration_date": "YYYY-MM-DD",
  "contact_email": "string",
  "contact_phone": "string",
  "website": "string"
}

Extract as much information as possible. If a field is not available, use null.
Be precise with numbers - remove $ signs and commas.
"""

class FDDProcessor:
    def __init__(self):
        self.client = openai.OpenAI(api_key=OPENAI_API_KEY)
        self.checkpoint = self.load_checkpoint()
        self.results = []
        self.errors = []
        
    def load_checkpoint(self) -> Dict:
        """Load processing checkpoint to resume if interrupted"""
        if os.path.exists(CHECKPOINT_FILE):
            with open(CHECKPOINT_FILE, 'r') as f:
                return json.load(f)
        return {"processed": [], "last_index": 0}
    
    def save_checkpoint(self):
        """Save current progress"""
        with open(CHECKPOINT_FILE, 'w') as f:
            json.dump(self.checkpoint, f, indent=2)
    
    def get_fdd_files(self) -> List[Path]:
        """Get all FDD files from input directory"""
        input_path = Path(INPUT_DIR)
        # Support both PDFs and image directories
        fdd_files = list(input_path.glob("*.pdf"))
        fdd_dirs = [d for d in input_path.iterdir() if d.is_dir()]
        return fdd_files + fdd_dirs
    
    def process_fdd(self, fdd_path: Path) -> Optional[Dict]:
        """Process a single FDD through the analytical prompt"""
        try:
            # Check if already processed
            if str(fdd_path) in self.checkpoint["processed"]:
                print(f"Skipping {fdd_path.name} (already processed)")
                return None
            
            # Determine if PDF or image directory
            if fdd_path.is_file():
                # PDF file - would need to convert to images first
                # For now, assume you have images
                print(f"PDF processing not implemented yet: {fdd_path.name}")
                return None
            else:
                # Image directory - use Vision API
                result = self.process_fdd_images(fdd_path)
            
            # Mark as processed
            self.checkpoint["processed"].append(str(fdd_path))
            self.save_checkpoint()
            
            return result
            
        except Exception as e:
            error_msg = f"Error processing {fdd_path.name}: {str(e)}"
            print(error_msg)
            self.errors.append({"file": str(fdd_path), "error": str(e)})
            return None
    
    def process_fdd_images(self, fdd_dir: Path) -> Dict:
        """Process FDD from image directory using Vision API"""
        # Get first few pages (cover page, Item 7, Item 19)
        images = sorted(fdd_dir.glob("*.png"))[:10]  # First 10 pages
        
        if not images:
            raise ValueError(f"No images found in {fdd_dir}")
        
        # Prepare image URLs (you'll need to upload to blob storage or use base64)
        # For now, using placeholder - you'd need to implement image handling
        image_urls = [f"file://{img}" for img in images]
        
        # Call OpenAI Vision API
        response = self.client.chat.completions.create(
            model="gpt-4o",  # or gpt-4-vision-preview
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": ANALYTICAL_PROMPT},
                        # Add images here - you'll need to convert to base64 or URLs
                        # {"type": "image_url", "image_url": {"url": url}} for each image
                    ]
                }
            ],
            response_format={"type": "json_object"},
            max_tokens=2000
        )
        
        # Parse JSON response
        result = json.loads(response.choices[0].message.content)
        result["source_file"] = fdd_dir.name
        result["processed_at"] = datetime.now().isoformat()
        
        return result
    
    def process_all(self):
        """Process all FDDs in batches"""
        fdd_files = self.get_fdd_files()
        total = len(fdd_files)
        
        print(f"Found {total} FDDs to process")
        print(f"Already processed: {len(self.checkpoint['processed'])}")
        print(f"Remaining: {total - len(self.checkpoint['processed'])}")
        
        # Process with progress bar
        for fdd_path in tqdm(fdd_files, desc="Processing FDDs"):
            result = self.process_fdd(fdd_path)
            
            if result:
                self.results.append(result)
                
                # Save individual result
                output_file = Path(OUTPUT_DIR) / f"{fdd_path.stem}.json"
                output_file.parent.mkdir(parents=True, exist_ok=True)
                with open(output_file, 'w') as f:
                    json.dump(result, f, indent=2)
            
            # Rate limiting
            time.sleep(DELAY_BETWEEN_REQUESTS)
        
        # Save combined results
        self.save_results()
        self.save_error_report()
    
    def save_results(self):
        """Save all results to a single JSON file"""
        output_file = Path(OUTPUT_DIR) / "all_franchises.json"
        with open(output_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        print(f"\nSaved {len(self.results)} results to {output_file}")
    
    def save_error_report(self):
        """Save error report"""
        if self.errors:
            error_file = Path(OUTPUT_DIR) / "errors.json"
            with open(error_file, 'w') as f:
                json.dump(self.errors, f, indent=2)
            print(f"Saved {len(self.errors)} errors to {error_file}")

def main():
    print("FDD Batch Processor")
    print("=" * 50)
    
    # Check API key
    if not OPENAI_API_KEY:
        print("ERROR: OPENAI_API_KEY environment variable not set")
        return
    
    # Create processor
    processor = FDDProcessor()
    
    # Process all FDDs
    processor.process_all()
    
    print("\nProcessing complete!")
    print(f"Successfully processed: {len(processor.results)}")
    print(f"Errors: {len(processor.errors)}")

if __name__ == "__main__":
    main()
