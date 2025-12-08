/**
 * Bulk Import Script for Vertex AI Processed FDDs
 * Imports processed FDD data from all_franchises.json into Supabase
 */

import { createClient } from "@supabase/supabase-js"
import * as fs from "fs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface VertexAIFranchiseData {
  franchise_name: string
  brand_description: string
  industry: string
  initial_investment_low: number
  initial_investment_high: number
  liquid_capital_required: number
  net_worth_required: number
  royalty_fee: string
  marketing_fee: string
  technology_fee?: string | null
  item19_available: boolean
  item19_summary: string
  average_revenue?: number | null
  average_profit?: number | null
  units_total: number
  units_franchised: number
  units_company_owned: number
  year_founded: number
  franchising_since: number
  territory_protected: boolean
  territory_description: string
  training_duration: string
  training_location: string
  ongoing_support: string
  litigation_count: number
  bankruptcy_count: number
  red_flags: string[]
  competitive_advantages: string[]
  target_market: string
  fdd_issue_date: string
  contact_name: string
  contact_email: string
  contact_phone: string
  website: string
}

async function importFranchises(jsonFile: string) {
  console.log("Reading franchise data from Vertex AI output...")
  const data = JSON.parse(fs.readFileSync(jsonFile, "utf-8")) as VertexAIFranchiseData[]

  console.log(`Found ${data.length} franchises to import`)

  let successCount = 0
  let errorCount = 0
  const errors: any[] = []

  for (let i = 0; i < data.length; i++) {
    const franchise = data[i]

    try {
      const dbRecord = {
        name: franchise.franchise_name,
        brand_description: franchise.brand_description,
        industry: franchise.industry,
        description: franchise.brand_description, // Use brand_description as description

        // Investment details
        initial_investment_min: franchise.initial_investment_low,
        initial_investment_max: franchise.initial_investment_high,
        liquid_capital_required: franchise.liquid_capital_required,
        net_worth_required: franchise.net_worth_required,
        royalty_fee: franchise.royalty_fee,
        marketing_fee: franchise.marketing_fee,
        technology_fee: franchise.technology_fee,

        // Item 19 financials
        item19_available: franchise.item19_available,
        item19_summary: franchise.item19_summary,
        average_revenue: franchise.average_revenue,
        average_profit: franchise.average_profit,

        // Unit counts
        units_total: franchise.units_total,
        units_franchised: franchise.units_franchised,
        units_company_owned: franchise.units_company_owned,

        // Company history
        year_founded: franchise.year_founded,
        franchising_since: franchise.franchising_since,

        // Territory
        territory_protected: franchise.territory_protected,
        territory_description: franchise.territory_description,

        // Training & support
        training_duration: franchise.training_duration,
        training_location: franchise.training_location,
        ongoing_support: franchise.ongoing_support,

        // Legal
        litigation_count: franchise.litigation_count,
        bankruptcy_count: franchise.bankruptcy_count,
        red_flags: franchise.red_flags,

        // Marketing
        competitive_advantages: franchise.competitive_advantages,
        target_market: franchise.target_market,

        // FDD metadata
        fdd_issue_date: franchise.fdd_issue_date,

        // Contact info
        contact_name: franchise.contact_name,
        contact_email: franchise.contact_email,
        contact_phone: franchise.contact_phone,
        website: franchise.website,

        // Status
        is_active: true,
        franchisor_id: null, // Will be claimed later
      }

      const { error } = await supabase.from("franchises").insert(dbRecord)

      if (error) throw error

      successCount++
      console.log(`[${i + 1}/${data.length}] ✓ Imported: ${franchise.franchise_name}`)
    } catch (error: any) {
      errorCount++
      errors.push({
        franchise: franchise.franchise_name,
        error: error.message,
      })
      console.error(`[${i + 1}/${data.length}] ✗ Error importing ${franchise.franchise_name}:`, error.message)
    }
  }

  console.log("\n" + "=".repeat(60))
  console.log(`IMPORT COMPLETE`)
  console.log("=".repeat(60))
  console.log(`Successfully imported: ${successCount}`)
  console.log(`Errors: ${errorCount}`)

  if (errors.length > 0) {
    const errorFile = "import-errors.json"
    fs.writeFileSync(errorFile, JSON.stringify(errors, null, 2))
    console.log(`\nError details saved to ${errorFile}`)
  }

  console.log("\nNext steps:")
  console.log("1. Check your Supabase dashboard to verify the franchises")
  console.log("2. Update your app to fetch from the database instead of static data")
  console.log("3. Build the unclaimed profile system for franchisors to claim their listings")
}

// Run import
const jsonFile = process.argv[2] || "fdd_processing_results/all_franchises.json"

console.log("=".repeat(60))
console.log("FDD BULK IMPORT - VERTEX AI PROCESSED DATA")
console.log("=".repeat(60))
console.log(`Input file: ${jsonFile}`)
console.log(`Target: Supabase (${supabaseUrl})`)
console.log("=".repeat(60))
console.log("")

importFranchises(jsonFile).catch(console.error)
