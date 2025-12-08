// Sample FDD content structure
export interface FDDSection {
  item: number
  title: string
  content: string
}

export const fddSections: FDDSection[] = [
  {
    item: 1,
    title: "The Franchisor and Any Parents, Predecessors, and Affiliates",
    content: `The franchisor, {FRANCHISE_NAME}, is a corporation organized under the laws of Delaware on January 15, 2010. Our principal business address is 123 Main Street, Suite 500, New York, NY 10001.

We began offering franchises in 2012. Our parent company, {PARENT_COMPANY}, has been in the {INDUSTRY} business since 2008.

We offer franchises for the operation of {BUSINESS_TYPE} businesses under the {FRANCHISE_NAME} trademark and system. Our franchisees provide {SERVICES} to customers in their designated territories.`,
  },
  {
    item: 6,
    title: "Other Fees",
    content: `In addition to the initial franchise fee, you must pay us the following fees:

ROYALTY FEE: 6% of gross sales, payable monthly by the 10th day of each month.

MARKETING FEE: 2% of gross sales, payable monthly by the 10th day of each month. We may increase this fee to up to 4% with 90 days' notice.

TECHNOLOGY FEE: $500 per month for access to our proprietary software systems, point-of-sale system, and ongoing technology support.

TRAINING FEE: $2,500 per additional person beyond the initial training for two people included in the franchise fee.

TRANSFER FEE: $15,000 if you transfer your franchise to another party, plus our reasonable costs and expenses.

RENEWAL FEE: $10,000 to renew your franchise agreement for an additional term.`,
  },
  {
    item: 7,
    title: "Estimated Initial Investment",
    content: `YOUR ESTIMATED INITIAL INVESTMENT

The following table shows the estimated initial investment you will need to make to establish and open your franchise. These figures are estimates, and actual costs may vary.

Initial Franchise Fee: $45,000 (paid to us)
Real Estate & Improvements: $150,000 - $300,000
Equipment & Fixtures: $75,000 - $125,000
Initial Inventory: $15,000 - $25,000
Signage: $10,000 - $20,000
Insurance (3 months): $3,000 - $6,000
Professional Fees: $5,000 - $10,000
Training Expenses: $5,000 - $8,000
Additional Funds (3 months): $50,000 - $100,000

TOTAL ESTIMATED INITIAL INVESTMENT: $358,000 - $639,000

These estimates assume you will finance your investment and that you will have sufficient working capital. You should review these figures carefully with a business advisor before making any commitments.`,
  },
  {
    item: 19,
    title: "Financial Performance Representations",
    content: `FINANCIAL PERFORMANCE REPRESENTATIONS

We are providing you with historical financial performance information for our franchised and company-owned locations that were in operation for the full calendar year 2024.

AVERAGE GROSS SALES (2024):
- Top 25% of locations: $1,850,000
- Middle 50% of locations: $1,200,000
- Bottom 25% of locations: $750,000
- System-wide average: $1,150,000

AVERAGE OPERATING EXPENSES (as % of gross sales):
- Cost of Goods Sold: 28-32%
- Labor Costs: 25-30%
- Occupancy Costs: 8-12%
- Marketing (local): 3-5%
- Royalty Fee: 6%
- Marketing Fee: 2%
- Other Operating Expenses: 8-12%

ESTIMATED PROFIT MARGINS:
Based on the above, franchisees in the top 50% achieved EBITDA margins of 15-20% after the first year of operation. However, 45% of franchisees did not achieve these results.

IMPORTANT NOTES:
- These figures are historical and do not guarantee future performance
- Your results may differ based on location, management, competition, and other factors
- You should conduct your own independent investigation and analysis
- Substantiation of the data used in preparing this information will be made available upon reasonable request`,
  },
  {
    item: 20,
    title: "Outlets and Franchisee Information",
    content: `SYSTEM-WIDE OUTLET SUMMARY (2022-2024)

Total Outlets Operating:
- 2022: 487 outlets
- 2023: 523 outlets  
- 2024: 556 outlets

Franchised Outlets:
- 2022: 445 outlets
- 2023: 478 outlets
- 2024: 508 outlets

Company-Owned Outlets:
- 2022: 42 outlets
- 2023: 45 outlets
- 2024: 48 outlets

NEW FRANCHISED OUTLETS (2024):
- Opened: 42 outlets
- Terminated: 8 outlets
- Non-Renewed: 3 outlets
- Reacquired by Franchisor: 1 outlet
- Ceased Operations (other): 2 outlets

GROWTH RATE: The system has experienced steady growth of approximately 6-8% annually over the past three years. We project opening 50-60 new franchised locations in 2025.`,
  },
]

function getIndustryDetails(industry: string): {
  industryName: string
  businessType: string
  services: string
} {
  const industryMap: Record<string, { industryName: string; businessType: string; services: string }> = {
    "Food & Beverage": {
      industryName: "food and beverage service",
      businessType: "quick-service restaurant",
      services: "high-quality food and beverage products",
    },
    "Health & Fitness": {
      industryName: "health and fitness",
      businessType: "24/7 fitness center",
      services: "fitness training, equipment access, and wellness programs",
    },
    "Business Services": {
      industryName: "business and retail services",
      businessType: "retail shipping and business service center",
      services: "shipping, printing, mailbox, and business support services",
    },
    "Personal Services": {
      industryName: "personal care and beauty services",
      businessType: "no-appointment hair salon",
      services: "professional hair cutting and styling services",
    },
  }

  return (
    industryMap[industry] || {
      industryName: "service",
      businessType: "service business",
      services: "professional services",
    }
  )
}

export function getFDDContent(franchiseName: string, industry = "Food & Beverage"): FDDSection[] {
  const details = getIndustryDetails(industry)

  return fddSections.map((section) => ({
    ...section,
    content: section.content
      .replace(/\{FRANCHISE_NAME\}/g, franchiseName)
      .replace(/\{PARENT_COMPANY\}/g, `${franchiseName} Holdings LLC`)
      .replace(/\{INDUSTRY\}/g, details.industryName)
      .replace(/\{BUSINESS_TYPE\}/g, details.businessType)
      .replace(/\{SERVICES\}/g, details.services),
  }))
}
