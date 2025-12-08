#!/usr/bin/env python3
"""
Direct upload of Drybar to Supabase
This script embeds the Drybar data and uploads it directly
"""

import os
import json
from supabase import create_client, Client

# Drybar analysis data (embedded)
DRYBAR_DATA = {
    "franchise_name": "Drybar",
    "description": "Drybar is a premier blowout salon franchise specializing in professional blowouts and hair styling services. Founded in 2010, Drybar has revolutionized the beauty industry by focusing exclusively on blowouts, creating a unique niche in the market.",
    "industry": "Beauty & Personal Care",
    "franchise_score": 462,
    "franchise_score_breakdown": {
        "financial_transparency": {
            "total_score": 120,
            "max_score": 150,
            "metrics": [
                {
                    "metric": "Fee Structure Transparency",
                    "score": 30,
                    "max": 30,
                    "rating": "Excellent",
                    "explanation": "Drybar provides comprehensive fee disclosure including franchise fee ($45,000), royalty fee (7% of gross sales), and marketing fee (2% of gross sales). All fees are clearly itemized with payment schedules."
                },
                {
                    "metric": "Investment Clarity",
                    "score": 30,
                    "max": 30,
                    "rating": "Excellent",
                    "explanation": "Item 7 provides detailed investment breakdown with 15+ categories, ranging from $308,500 to $467,500. Each line item includes low/high estimates, payment timing, and recipient information."
                },
                {
                    "metric": "Item 19 Performance Indicators",
                    "score": 60,
                    "max": 60,
                    "rating": "Good",
                    "explanation": "Item 19 discloses median gross sales of $1,089,000 based on 89 shops (out of 102 total). Distribution data shows top quartile at $1,400,000+. Revenue-only disclosure is standard industry practice."
                },
                {
                    "metric": "Clean Record",
                    "score": 0,
                    "max": 30,
                    "rating": "Poor",
                    "explanation": "Multiple litigation cases disclosed in Items 3-4, including franchisee disputes and regulatory matters. Significant penalties applied for litigation history."
                }
            ]
        },
        "system_strength": {
            "total_score": 138,
            "max_score": 150,
            "metrics": [
                {
                    "metric": "Franchisor Longevity",
                    "score": 48,
                    "max": 48,
                    "rating": "Excellent",
                    "explanation": "Drybar has been franchising since 2010 (14 years). Strong track record with consistent growth and brand recognition in the beauty industry."
                },
                {
                    "metric": "Management Experience",
                    "score": 48,
                    "max": 48,
                    "rating": "Excellent",
                    "explanation": "Executive team includes veterans from major beauty and retail brands. CEO has 20+ years experience in franchise operations and brand development."
                },
                {
                    "metric": "System Performance",
                    "score": 42,
                    "max": 54,
                    "rating": "Good",
                    "explanation": "102 total units with 2 openings and 4 closures last year. Net closure rate of -2% indicates some system challenges, but overall unit count remains stable."
                }
            ]
        },
        "franchisee_support": {
            "total_score": 108,
            "max_score": 150,
            "metrics": [
                {
                    "metric": "Training Quality",
                    "score": 36,
                    "max": 48,
                    "rating": "Good",
                    "explanation": "Comprehensive training program includes 2 weeks of classroom training and 2 weeks of on-site training. Covers operations, customer service, and product knowledge."
                },
                {
                    "metric": "Operational Support",
                    "score": 36,
                    "max": 48,
                    "rating": "Good",
                    "explanation": "Field support team provides ongoing assistance. Operations manual, technology platform, and marketing support included. Regular franchisee communications."
                },
                {
                    "metric": "Marketing Support",
                    "score": 36,
                    "max": 54,
                    "rating": "Good",
                    "explanation": "National marketing fund (2% of gross sales) supports brand advertising. Local marketing materials and digital marketing support provided. Strong brand recognition."
                }
            ]
        },
        "business_foundation": {
            "total_score": 96,
            "max_score": 150,
            "metrics": [
                {
                    "metric": "Territory Rights",
                    "score": 36,
                    "max": 48,
                    "rating": "Good",
                    "explanation": "Protected territory based on population demographics. Territory size varies by market density. Franchisor reserves rights for company-owned locations."
                },
                {
                    "metric": "Contract Terms",
                    "score": 30,
                    "max": 54,
                    "rating": "Fair",
                    "explanation": "10-year initial term with renewal options. Standard termination clauses. Transfer restrictions apply. Post-term non-compete for 2 years."
                },
                {
                    "metric": "Franchisee Input",
                    "score": 30,
                    "max": 48,
                    "rating": "Fair",
                    "explanation": "Franchisee advisory council exists but participation details limited. Some input on operations and marketing, but final decisions rest with franchisor."
                }
            ]
        }
    },
    "opportunities": [
        "Strong brand recognition in the beauty industry with a unique focus on blowouts",
        "Comprehensive training and operational support system",
        "Item 19 shows solid median revenue of $1,089,000 with top performers exceeding $1.4M"
    ],
    "concerns": [
        "Multiple litigation cases disclosed, indicating potential franchisee relationship challenges",
        "Net unit closures last year (-2%) suggest some system instability",
        "High initial investment ($308K-$468K) with 7% royalty may impact profitability"
    ],
    "analytical_summary": "Drybar presents a mixed investment opportunity in the beauty services sector. The brand has strong recognition and a unique market position focusing exclusively on blowouts. Financial disclosure is comprehensive with Item 19 showing median gross sales of $1,089,000 based on 89 shops. However, the FranchiseScore of 462/600 reflects concerns about litigation history and recent unit closures. The system has been franchising for 14 years with experienced management, but the net closure of 2 units last year and multiple litigation cases suggest potential operational challenges. Initial investment ranges from $308,500 to $467,500 with a 7% royalty fee. Prospective franchisees should carefully evaluate the litigation history and unit performance trends before investing.",
    "initial_investment_low": 308500,
    "initial_investment_high": 467500,
    "franchise_fee": 45000,
    "royalty_fee": "7%",
    "marketing_fee": "2%",
    "has_item19": True,
    "average_revenue": 1089000,
    "revenue_data": {
        "outlets_analyzed": 89,
        "total_outlets": 102,
        "median": 1089000,
        "top_quartile": 1400000,
        "has_distribution_data": True
    },
    "total_units": 102,
    "franchised_units": 100,
    "company_owned_units": 2,
    "units_opened_last_year": 2,
    "units_closed_last_year": 4,
    "states": ["CA", "TX", "FL", "NY", "IL", "AZ", "CO", "GA", "MA", "NC"]
}

def upload_drybar():
    """Upload Drybar data to Supabase"""
    
    # Get Supabase credentials from environment
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Error: Supabase credentials not found in environment variables")
        print("   Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        return False
    
    try:
        # Create Supabase client
        print("🔌 Connecting to Supabase...")
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Prepare franchise record
        breakdown = DRYBAR_DATA.get("franchise_score_breakdown", {})
        states = DRYBAR_DATA.get("states", [])
        state_distribution = {state: 1 for state in states} if states else {}
        
        franchise_record = {
            # Basic Info
            "name": DRYBAR_DATA.get("franchise_name"),
            "description": DRYBAR_DATA.get("description"),
            "industry": DRYBAR_DATA.get("industry"),
            
            # FranchiseScore
            "franchise_score": DRYBAR_DATA.get("franchise_score"),
            "franchise_score_breakdown": breakdown,
            
            # Legacy score fields
            "score_financial_performance": breakdown.get("financial_transparency", {}).get("total_score"),
            "score_business_model": breakdown.get("system_strength", {}).get("total_score"),
            "score_support_training": breakdown.get("franchisee_support", {}).get("total_score"),
            "score_legal_compliance": breakdown.get("system_strength", {}).get("total_score"),
            "score_franchisee_satisfaction": breakdown.get("business_foundation", {}).get("total_score"),
            
            # Opportunities and Concerns
            "opportunities": DRYBAR_DATA.get("opportunities", []),
            "concerns": DRYBAR_DATA.get("concerns", []),
            
            # Analytical Summary
            "analytical_summary": DRYBAR_DATA.get("analytical_summary"),
            
            # Investment Details
            "initial_investment_low": DRYBAR_DATA.get("initial_investment_low"),
            "initial_investment_high": DRYBAR_DATA.get("initial_investment_high"),
            "total_investment_min": DRYBAR_DATA.get("initial_investment_low"),
            "total_investment_max": DRYBAR_DATA.get("initial_investment_high"),
            
            # Fees
            "franchise_fee": DRYBAR_DATA.get("franchise_fee"),
            "royalty_fee": DRYBAR_DATA.get("royalty_fee"),
            "marketing_fee": DRYBAR_DATA.get("marketing_fee"),
            
            # Financial Performance
            "has_item19": DRYBAR_DATA.get("has_item19", False),
            "average_revenue": DRYBAR_DATA.get("average_revenue"),
            "revenue_data": DRYBAR_DATA.get("revenue_data"),
            
            # Unit Counts
            "total_units": DRYBAR_DATA.get("total_units"),
            "franchised_units": DRYBAR_DATA.get("franchised_units"),
            "company_owned_units": DRYBAR_DATA.get("company_owned_units"),
            "units_opened_last_year": DRYBAR_DATA.get("units_opened_last_year"),
            "units_closed_last_year": DRYBAR_DATA.get("units_closed_last_year"),
            "state_distribution": state_distribution,
            
            # Status
            "status": "active"
        }
        
        # Check if Drybar already exists
        print(f"🔍 Checking if {franchise_record['name']} exists...")
        existing = supabase.table("franchises").select("id").eq("name", franchise_record["name"]).execute()
        
        if existing.data:
            # Update existing
            franchise_id = existing.data[0]["id"]
            print(f"📝 Updating existing franchise (ID: {franchise_id})...")
            result = supabase.table("franchises").update(franchise_record).eq("id", franchise_id).execute()
            print(f"✅ Updated {franchise_record['name']} successfully!")
        else:
            # Insert new
            print(f"➕ Inserting new franchise...")
            result = supabase.table("franchises").insert(franchise_record).execute()
            print(f"✅ Inserted {franchise_record['name']} successfully!")
        
        # Display summary
        print("\n📊 Upload Summary:")
        print(f"   Name: {franchise_record['name']}")
        print(f"   Industry: {franchise_record['industry']}")
        print(f"   FranchiseScore: {franchise_record['franchise_score']}/600")
        print(f"   Average Revenue: ${franchise_record['average_revenue']:,}")
        print(f"   Total Units: {franchise_record['total_units']}")
        print(f"   Opportunities: {len(franchise_record['opportunities'])}")
        print(f"   Concerns: {len(franchise_record['concerns'])}")
        
        return True
        
    except Exception as e:
        print(f"❌ Upload failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Starting Drybar upload to Supabase...")
    print("=" * 50)
    success = upload_drybar()
    print("=" * 50)
    if success:
        print("✅ Drybar upload complete!")
    else:
        print("❌ Drybar upload failed!")
