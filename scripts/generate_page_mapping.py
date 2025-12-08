#!/usr/bin/env python3
"""
Generate page_mapping.json from an FDD PDF
Scans the PDF for Item headers and records the first page each Item appears on

Usage:
  python3 generate_page_mapping.py "path/to/FDD.pdf" "output_directory"
  
Example:
  python3 generate_page_mapping.py "pipeline_output/Top400 - 251 - Ace Handyman/Ace Handyman FDD (2025).pdf" "pipeline_output/Top400 - 251 - Ace Handyman"
"""

import pdfplumber
import json
import re
import sys
from pathlib import Path


def extract_page_mapping(pdf_path: str) -> dict:
    """
    Extract Item-to-page mapping from PDF by finding ITEM X headers
    Returns: dict like {"Item 1": 5, "Item 2": 12, ...}
    """
    print(f"Scanning PDF for Item headers: {pdf_path}")
    
    page_mapping = {}
    
    with pdfplumber.open(pdf_path) as pdf:
        num_pages = len(pdf.pages)
        print(f"Processing {num_pages} pages...")
        
        for page_num, page in enumerate(pdf.pages):
            page_text = page.extract_text()
            if page_text:
                # Look for "ITEM X" or "Item X" patterns
                item_matches = re.findall(r'\bITEM\s+(\d+)\b', page_text, re.IGNORECASE)
                for item_num_str in item_matches:
                    item_num = int(item_num_str)
                    item_key = f"Item {item_num}"
                    # Only record the first occurrence of each Item
                    if item_key not in page_mapping:
                        page_mapping[item_key] = page_num + 1  # 1-indexed
                        print(f"  Found {item_key} on page {page_num + 1}")
                
                # Also look for Exhibits
                exhibit_matches = re.findall(r'\bEXHIBIT\s+([A-Z])\b', page_text, re.IGNORECASE)
                for exhibit_letter in exhibit_matches:
                    exhibit_key = f"Exhibit {exhibit_letter.upper()}"
                    if exhibit_key not in page_mapping:
                        page_mapping[exhibit_key] = page_num + 1
                        print(f"  Found {exhibit_key} on page {page_num + 1}")
            
            if (page_num + 1) % 50 == 0:
                print(f"  Processed {page_num + 1}/{num_pages} pages...")
    
    print(f"\n✓ Found {len(page_mapping)} mappings")
    return page_mapping


def main():
    if len(sys.argv) < 3:
        print("Usage: python3 generate_page_mapping.py <pdf_path> <output_directory>")
        print("Example: python3 generate_page_mapping.py 'FDD.pdf' 'pipeline_output/Ace Handyman'")
        sys.exit(1)
    
    pdf_path = Path(sys.argv[1])
    output_dir = Path(sys.argv[2])
    
    if not pdf_path.exists():
        print(f"Error: PDF not found: {pdf_path}")
        sys.exit(1)
    
    if not output_dir.exists():
        output_dir.mkdir(parents=True)
    
    # Generate the page mapping
    page_mapping = extract_page_mapping(str(pdf_path))
    
    # Sort by page number for readability
    sorted_mapping = dict(sorted(page_mapping.items(), key=lambda x: x[1]))
    
    # Save to JSON
    output_file = output_dir / "page_mapping.json"
    with open(output_file, 'w') as f:
        json.dump(sorted_mapping, f, indent=2)
    
    print(f"\n✓ Saved page mapping to: {output_file}")
    print(f"\nMapping contents:")
    for item, page in sorted_mapping.items():
        print(f"  {item}: page {page}")


if __name__ == "__main__":
    main()
