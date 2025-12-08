#!/usr/bin/env python3
"""
Upload franchise analysis.json to Supabase
Usage: python3 upload_to_supabase.py --json pipeline_output/Top400\ -\ 284\ -\ Drybar/analysis.json --url YOUR_SUPABASE_URL --key YOUR_SERVICE_ROLE_KEY
"""

import json
import os
import sys
import argparse
from supabase import create_client, Client

def upload_franchise(json_path: str, supabase_url: str = None, supabase_key: str = None):
    """Upload franchise data from analysis.json to Supabase"""
    
    supabase_url = supabase_url or os.environ.get("SUPABASE_URL")
    supabase_key = supabase_key or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Error: Supabase credentials required")
        print("   Either set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables")
        print("   Or pass them as arguments: --url YOUR_URL --key YOUR_KEY")
        sys.exit(1)
    
    # Create Supabase client
    supabase: Client = create_client(supabase_url, supabase_key)
    
    # Load analysis.json
    print(f"📖 Loading {json_path}...")
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    # Extract legacy scores from franchise_score_breakdown for backward compatibility
    breakdown = data.get("franchise_score_breakdown", {})
    
    # Transform states array to state_distribution jsonb
    states = data.get("states", [])
    state_distribution = {state: 1 for state in states} if states else {}
    
    # Prepare franchise record matching existing schema
    franchise_record = {
        # Basic Info
        "name": data.get("franchise_name"),
        "description": data.get("description"),
        "industry": data.get("industry"),
        
        # FranchiseScore (600-point system)
        "franchise_score": data.get("franchise_score"),
        "franchise_score_breakdown": breakdown,
        
        # Legacy score fields (extracted from breakdown)
        "score_financial_performance": breakdown.get("financial_disclosure", {}).get("total_score"),
        "score_business_model": breakdown.get("system_stability", {}).get("total_score"),
        "score_support_training": breakdown.get("support_quality", {}).get("total_score"),
        "score_legal_compliance": breakdown.get("system_stability", {}).get("total_score"),  # Using system_stability as proxy
        "score_franchisee_satisfaction": breakdown.get("growth_trajectory", {}).get("total_score"),  # Using growth as proxy
        
        # Opportunities and Concerns
        "opportunities": data.get("opportunities", []),
        "concerns": data.get("concerns", []),
        
        # Analytical Summary
        "analytical_summary": data.get("analytical_summary"),
        
        # Investment Details
        "initial_investment_low": data.get("initial_investment_low"),
        "initial_investment_high": data.get("initial_investment_high"),
        "total_investment_min": data.get("initial_investment_low"),  # Same as initial_investment_low
        "total_investment_max": data.get("initial_investment_high"),  # Same as initial_investment_high
        "investment_breakdown": data.get("investment_breakdown"),
        
        # Fees
        "franchise_fee": data.get("franchise_fee"),
        "royalty_fee": data.get("royalty_fee"),
        "marketing_fee": data.get("marketing_fee"),
        
        # Financial Performance (Item 19)
        "has_item19": data.get("has_item19", False),
        "average_revenue": data.get("average_revenue"),
        "revenue_data": data.get("revenue_data"),
        
        # Extract Item 19 specific fields from revenue_data
        "item19_sample_size": data.get("revenue_data", {}).get("outlets_analyzed"),
        "item19_disclosure_quality": "High" if data.get("has_item19") else "None",
        
        # Unit Counts (Item 20)
        "total_units": data.get("total_units"),
        "franchised_units": data.get("franchised_units"),
        "company_owned_units": data.get("company_owned_units"),
        "units_opened_last_year": data.get("units_opened_last_year"),
        "units_closed_last_year": data.get("units_closed_last_year"),
        "state_distribution": state_distribution,
        
        # Status
        "status": "active"
    }
    
    # Check if franchise already exists
    print(f"🔍 Checking if {franchise_record['name']} exists...")
    existing = supabase.table("franchises").select("id").eq("name", franchise_record["name"]).execute()
    
    if existing.data:
        # Update existing franchise
        franchise_id = existing.data[0]["id"]
        print(f"📝 Updating existing franchise (ID: {franchise_id})...")
        result = supabase.table("franchises").update(franchise_record).eq("id", franchise_id).execute()
        print(f"✅ Updated {franchise_record['name']} successfully!")
    else:
        # Insert new franchise
        print(f"➕ Inserting new franchise...")
        result = supabase.table("franchises").insert(franchise_record).execute()
        print(f"✅ Inserted {franchise_record['name']} successfully!")
    
    # Display summary
    print("\n📊 Upload Summary:")
    print(f"   Name: {franchise_record['name']}")
    print(f"   Industry: {franchise_record['industry']}")
    print(f"   FranchiseScore: {franchise_record['franchise_score']}/600")
    print(f"   Average Revenue: ${franchise_record['average_revenue']:,}" if franchise_record['average_revenue'] else "   Average Revenue: N/A")
    print(f"   Total Units: {franchise_record['total_units']}")
    print(f"   Opportunities: {len(franchise_record['opportunities'])}")
    print(f"   Concerns: {len(franchise_record['concerns'])}")
    
    return result

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Upload franchise analysis to Supabase")
    parser.add_argument("--json", required=True, help="Path to analysis.json file")
    parser.add_argument("--url", help="Supabase URL (or set SUPABASE_URL env var)")
    parser.add_argument("--key", help="Supabase service role key (or set SUPABASE_SERVICE_ROLE_KEY env var)")
    args = parser.parse_args()
    
    upload_franchise(args.json, args.url, args.key)
