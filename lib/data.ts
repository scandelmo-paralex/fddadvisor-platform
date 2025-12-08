export interface Franchise {
  id: string
  name: string
  slug?: string // Added slug field for URL-friendly franchise names
  logoUrl?: string // Added logoUrl field for franchise logo
  coverImageUrl?: string // Added coverImageUrl for FDD viewer overlay
  industry: string
  description: string
  hasItem19: boolean
  investmentMin: number
  investmentMax: number
  roiTimeframe: string
  avgRevenue?: number
  totalUnits?: number
  opportunities?: string[]
  concerns?: string[]
  fddPdfUrl?: string
  fddPageUrls?: string[] // Array of URLs for multi-page FDD images (for Vision API)
  fddPageMapping?: { [key: string]: number[] } // Maps FDD items to page numbers, e.g., {"Item 5": [12, 13], "Item 19": [45, 46, 47]}
  fddPageOffset?: number // Offset to add to TOC page numbers to get actual PDF page positions (e.g., if TOC is on page 8 and Item 1 starts on page 9, offset is 8)
  fddTextContent?: string
  status?: "Established" | "Trending" | "New"
  franchiseScore?: {
    overall: number
    maxScore: number
    systemStability: { score: number; max: number }
    supportQuality: { score: number; max: number }
    growthTrajectory: { score: number; max: number }
    financialDisclosure: { score: number; max: number }
    riskLevel: "LOW" | "MODERATE" | "HIGH"
    industryPercentile: number
    breakdown?: {
      systemStability: Array<{ metric: string; score: number; max: number; rating: string; explanation: string }>
      supportQuality: Array<{ metric: string; score: number; max: number; rating: string; explanation: string }>
      growthTrajectory: Array<{ metric: string; score: number; max: number; rating: string; explanation: string }>
      financialDisclosure: Array<{ metric: string; score: number; max: number; rating: string; explanation: string }>
    }
  }
  investmentBreakdown?: {
    [key: string]: number
  }
  revenueData?: {
    average: number
    median: number
    topQuartile: number
    bottomQuartile: number
  }
  stateDistribution?: {
    [state: string]: number
  }
  analyticalSummary?: string // Added analyticalSummary field
}

export interface Lead {
  id: string
  name: string
  brand?: string // Added brand field for multi-brand franchisors
  location: string
  city: string
  state: string
  timeline: string
  intent: "High" | "Medium" | "Low"
  isNew: boolean
  qualityScore: number
  stage: "inquiry" | "qualified" | "disclosed" | "negotiating" | "closing" | "closed"
  daysInStage?: number
  accessedDate?: string
  totalTimeSpent?: string
  fddSendDate?: string
  disclosureExpiresDate?: string
  item23SignedAt?: string // ISO date string when Item 23 receipt was signed
  item23CompleteCopyUrl?: string // URL to complete signed document (both pages)
  item23FranchisorCopyUrl?: string // URL to franchisor's copy (page 1)
  item23BuyerCopyUrl?: string // URL to buyer's copy (page 2)
  item23SignatureId?: string // DocuSign envelope ID for audit trail
  email?: string
  source?: "FDDAdvisor" | "Internal" | "Website" | "Broker" | "Referral" | "Trade Show" | "Direct Inquiry" | "Other"
  invitationStatus?: "Not Sent" | "Sent" | "Opened" | "Account Created" | "FDD Viewed"
  invitationSentDate?: string
  phone?: string
  notes?: string
  questionsAsked?: string[] // Added questionsAsked field
  verificationStatus?: "verified" | "unverified" | "pending"
  financialQualification?: {
    creditScore: number
    creditScoreVerified: boolean
    backgroundCheck: "Clear" | "Pending" | "Not Started"
    backgroundCheckVerified: boolean
    preApproval: {
      status: "Approved" | "Pending" | "Not Started"
      amount?: number
      interestRate?: number
      verified: boolean
    }
    liquidCapital: {
      amount: number
      source: "Self-reported" | "Verified" | "Estimated"
    }
    netWorth: {
      amount: number
      source: "Self-reported" | "Verified" | "Estimated"
    }
  }
  demographics: {
    age: string
    experience: string
    capital: string
    location: string
  }
  engagement: Array<{
    date: string
    action: string
  }>
  fddFocusAreas?: Array<{
    item: string
    timeSpent: string
    interest: "High" | "Medium" | "Low"
  }>
  salesRecommendations?: {
    approach: string
    talkingPoints: string[]
    concerns: string[]
    nextSteps: string[]
  }
}

export interface Note {
  id: string
  userId?: string
  fddId?: string
  franchiseId?: string
  franchiseName?: string
  pageNumber?: number | null
  title?: string // Keep for backward compatibility
  content: string
  highlightText?: string | null
  createdAt: string
  updatedAt: string
}

export interface BuyerProfile {
  id?: string
  personalInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
    city?: string
    state?: string
    desiredTerritories?: string
    location: string // Deprecated - use city + state
    profilePhotoUrl?: string
    linkedInUrl?: string
  }
  businessExperience?: {
    yearsOfExperience: number
    industryExperience: string[] // e.g., ["Retail", "Healthcare", "Technology"]
    hasOwnedBusiness: boolean
    managementExperience: boolean
    currentEmploymentStatus: "Employed Full-Time" | "Employed Part-Time" | "Self-Employed" | "Unemployed" | "Retired"
    relevantSkills: string[] // e.g., ["Sales", "Operations", "Marketing"]
  }
  financialQualification?: {
    ficoScoreRange?: string // Self-reported FICO score range
    liquidAssetsRange?: string // Self-reported liquid assets range
    netWorthRange?: string // Self-reported net worth range
    fundingPlans?: string[] // How they plan to fund the franchise (multiple selection)
  }
  backgroundAttestations?: {
    noFelonyAttestation: boolean
    noBankruptcyAttestation: boolean
    attestedAt?: string | null // ISO date string
  }
  profileCompletedAt?: string // ISO date string - null means incomplete
}

export const defaultBuyerProfile: BuyerProfile = {
  personalInfo: {
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@email.com",
    phone: "(555) 123-4567",
    location: "Austin, TX",
  },
  financialQualification: {
    creditScoreVerified: false,
    backgroundCheck: "Not Started",
    backgroundCheckVerified: false,
    preApproval: {
      status: "Not Started",
      verified: false,
    },
    liquidCapitalVerified: false,
  },
  privacySettings: {
    shareWithFranchisors: true,
    showFinancialInfo: true,
    allowContact: true,
  },
}

export interface Lender {
  id: string
  name: string
  isPreferred: boolean
  estimatedRate: string
  loanTerms: string
  approvalLikelihood: "High" | "Medium" | "Low"
  specialFeatures: string[]
  processingTime: string
}

export interface FranchisePreApproval {
  franchiseId: string
  status: "Not Started" | "Pending" | "Approved" | "Declined"
  lenders: Array<{
    lenderId: string
    lenderName: string
    status: "Pending" | "Approved" | "Declined"
    submittedDate?: string
    approvedDate?: string
    approvedAmount?: number
    approvedRate?: number
  }>
  submittedDate?: string
}

export interface FDDEngagement {
  franchiseId: string
  questionsAsked: string[]
  sectionsViewed: string[]
  timeSpent: number // in seconds
  notesCreated: number
  startTime: string
  lastActivity: string
  completionPercentage: number // 0-100
  hasConnected: boolean
  item23SignedAt?: string // ISO date string when Item 23 receipt was signed
  item23BuyerCopyUrl?: string // URL to buyer's copy (page 2)
  milestones: {
    viewedFDD: boolean
    askedQuestions: boolean
    viewedItem19: boolean
    viewedItem7: boolean
    createdNotes: boolean
    spentSignificantTime: boolean // 15+ minutes
  }
}

export interface FranchisorProfile {
  personalInfo: {
    name: string
    title: string
    email: string
    phone: string
  }
  companyInfo: {
    companyName: string
    website: string
    logo?: string
    logoUrl?: string // Added logoUrl field for uploaded logo
  }
  fddManagement: {
    fdds: Array<{
      brand: string
      currentVersion: string
      uploadDate: string
      fileName: string
    }>
  }
  billing: {
    subscriptionTier: "Starter" | "Professional" | "Enterprise"
    paymentMethod?: string
    nextBillingDate?: string
  }
  notifications: {
    newLeads: boolean
    leadEngagement: boolean
    fddExpiration: boolean
  }
}

export const defaultFranchisorProfile: FranchisorProfile = {
  personalInfo: {
    name: "James Frank",
    title: "SVP Franchise Growth",
    email: "jfrank@wellbizbrands.com",
    phone: "(555) 987-6543",
  },
  companyInfo: {
    companyName: "Wellbiz Brands, Inc.",
    website: "www.wellbizbrands.com",
  },
  fddManagement: {
    fdds: [
      {
        brand: "Drybar",
        currentVersion: "2025 FDD",
        uploadDate: "Jan 1, 2025",
        fileName: "Drybar_FDD_2025.pdf",
      },
      {
        brand: "Lash Studio",
        currentVersion: "2025 FDD",
        uploadDate: "Jan 1, 2025",
        fileName: "LashStudio_FDD_2025.pdf",
      },
      {
        brand: "Elements Massage",
        currentVersion: "2025 FDD",
        uploadDate: "Jan 1, 2025",
        fileName: "ElementsMassage_FDD_2025.pdf",
      },
    ],
  },
  billing: {
    subscriptionTier: "Professional",
    paymentMethod: "•••• 4242",
    nextBillingDate: "Feb 1, 2025",
  },
  notifications: {
    newLeads: true,
    leadEngagement: true,
    fddExpiration: true,
  },
}

export const franchises: Franchise[] = [
  {
    id: "1",
    name: "Subway",
    slug: "subway",
    logoUrl: "/logos/subway.svg",
    industry: "Food & Beverage",
    description: "World's largest submarine sandwich chain with proven business model",
    hasItem19: true,
    investmentMin: 116000,
    investmentMax: 263000,
    roiTimeframe: "2-3 years",
    avgRevenue: 490000,
    totalUnits: 37000,
    fddPdfUrl: "https://pdfobject.com/pdf/sample.pdf",
    status: "Established",
    franchiseScore: {
      overall: 420,
      maxScore: 600,
      systemStability: { score: 145, max: 200 },
      supportQuality: { score: 98, max: 150 },
      growthTrajectory: { score: 127, max: 150 },
      financialDisclosure: { score: 50, max: 100 },
      riskLevel: "MODERATE",
      industryPercentile: 65,
      breakdown: {
        systemStability: [
          {
            metric: "Franchisee Turnover Rate",
            score: 38,
            max: 50,
            rating: "Good",
            explanation: "4.2% average turnover - below industry average",
          },
          {
            metric: "Unit Closure Rate",
            score: 35,
            max: 50,
            rating: "Fair",
            explanation: "4.5% annually - moderate closures in saturated markets",
          },
          {
            metric: "Litigation Cases (3yr)",
            score: 42,
            max: 50,
            rating: "Good",
            explanation: "Minimal litigation relative to system size",
          },
          {
            metric: "Financial Stability",
            score: 30,
            max: 50,
            rating: "Fair",
            explanation: "Stable but facing market headwinds",
          },
        ],
        supportQuality: [
          {
            metric: "Initial Training",
            score: 25,
            max: 40,
            rating: "Good",
            explanation: "2 weeks comprehensive training program",
          },
          {
            metric: "Ongoing Support",
            score: 28,
            max: 40,
            rating: "Good",
            explanation: "Field support and regular check-ins",
          },
          {
            metric: "Marketing Support",
            score: 20,
            max: 35,
            rating: "Fair",
            explanation: "National campaigns but high ad fund contribution",
          },
          {
            metric: "Technology Systems",
            score: 25,
            max: 35,
            rating: "Good",
            explanation: "Modern POS and mobile ordering platform",
          },
        ],
        growthTrajectory: [
          {
            metric: "3-Year Growth Rate",
            score: 38,
            max: 50,
            rating: "Good",
            explanation: "+8.5% net unit growth despite market challenges",
          },
          {
            metric: "Market Expansion",
            score: 45,
            max: 50,
            rating: "Excellent",
            explanation: "Global presence in 100+ countries",
          },
          {
            metric: "Unit Economics",
            score: 44,
            max: 50,
            rating: "Excellent",
            explanation: "Proven profitability model with strong AUV",
          },
        ],
        financialDisclosure: [
          {
            metric: "Item 19 Quality",
            score: 20,
            max: 50,
            rating: "Fair",
            explanation: "Basic sales data, limited expense breakdown",
          },
          {
            metric: "Transparency",
            score: 15,
            max: 25,
            rating: "Good",
            explanation: "Clear disclosure of fees and obligations",
          },
          {
            metric: "Investment Clarity",
            score: 15,
            max: 25,
            rating: "Good",
            explanation: "Detailed investment breakdown provided",
          },
        ],
      },
    },
    opportunities: [
      "Strong brand recognition with 37,000+ locations worldwide provides immediate customer trust and market presence",
      "Low initial investment compared to competitors ($116K-$263K) with flexible store formats including non-traditional venues",
      "Comprehensive training program and ongoing support system reduces operational risk for first-time franchisees",
    ],
    concerns: [
      "High market saturation in urban areas may limit territory availability and create intense local competition",
      "Royalty fees of 8% plus 4.5% advertising fee significantly impact profit margins, especially in first 2 years",
      "Recent brand challenges and changing consumer preferences toward healthier options require strategic adaptation",
    ],
  },
  {
    id: "2",
    name: "Anytime Fitness",
    slug: "anytime-fitness",
    logoUrl: "/logos/anytime-fitness.svg",
    industry: "Health & Fitness",
    description: "24/7 fitness club franchise with global presence and strong member retention",
    hasItem19: true,
    investmentMin: 314000,
    investmentMax: 636000,
    roiTimeframe: "3-4 years",
    avgRevenue: 441000,
    totalUnits: 5000,
    fddPdfUrl: "https://pdfobject.com/pdf/sample.pdf",
    status: "Trending",
    franchiseScore: {
      overall: 485,
      maxScore: 600,
      systemStability: { score: 172, max: 200 },
      supportQuality: { score: 128, max: 150 },
      growthTrajectory: { score: 138, max: 150 },
      financialDisclosure: { score: 47, max: 100 },
      riskLevel: "LOW",
      industryPercentile: 78,
      breakdown: {
        systemStability: [
          {
            metric: "Franchisee Turnover Rate",
            score: 48,
            max: 50,
            rating: "Excellent",
            explanation: "2.1% average - exceptional retention",
          },
          {
            metric: "Unit Closure Rate",
            score: 46,
            max: 50,
            rating: "Excellent",
            explanation: "1.8% annually - industry-leading stability",
          },
          {
            metric: "Litigation Cases (3yr)",
            score: 45,
            max: 50,
            rating: "Excellent",
            explanation: "Minimal litigation, strong franchisee relations",
          },
          {
            metric: "Financial Stability",
            score: 33,
            max: 50,
            rating: "Good",
            explanation: "Strong franchisor financials with growth capital",
          },
        ],
        supportQuality: [
          {
            metric: "Initial Training",
            score: 35,
            max: 40,
            rating: "Excellent",
            explanation: "Comprehensive 6-week training program",
          },
          {
            metric: "Ongoing Support",
            score: 35,
            max: 40,
            rating: "Excellent",
            explanation: "Dedicated business coaches and field support",
          },
          {
            metric: "Marketing Support",
            score: 28,
            max: 35,
            rating: "Good",
            explanation: "National brand campaigns and local marketing tools",
          },
          {
            metric: "Technology Systems",
            score: 30,
            max: 35,
            rating: "Excellent",
            explanation: "Advanced member management and mobile app",
          },
        ],
        growthTrajectory: [
          {
            metric: "3-Year Growth Rate",
            score: 45,
            max: 50,
            rating: "Excellent",
            explanation: "+18.2% growth - strong expansion momentum",
          },
          {
            metric: "Market Expansion",
            score: 48,
            max: 50,
            rating: "Excellent",
            explanation: "Global footprint with untapped markets",
          },
          {
            metric: "Unit Economics",
            score: 45,
            max: 50,
            rating: "Excellent",
            explanation: "Strong unit-level profitability and member retention",
          },
        ],
        financialDisclosure: [
          {
            metric: "Item 19 Quality",
            score: 18,
            max: 50,
            rating: "Fair",
            explanation: "Revenue data provided, limited expense detail",
          },
          {
            metric: "Transparency",
            score: 15,
            max: 25,
            rating: "Good",
            explanation: "Clear fee structure and obligations",
          },
          {
            metric: "Investment Clarity",
            score: 14,
            max: 25,
            rating: "Fair",
            explanation: "Investment range provided with some variability",
          },
        ],
      },
    },
    opportunities: [
      "Recession-resistant industry with growing health consciousness driving 7% annual market growth through 2028",
      "24/7 access model creates competitive advantage with 95% member retention rate and recurring revenue streams",
      "Comprehensive site selection and buildout support minimizes location risk with proven real estate criteria",
    ],
    concerns: [
      "Higher initial investment ($314K-$636K) requires substantial capital and extends break-even timeline to 3-4 years",
      "Intense competition from budget gyms and boutique studios pressures pricing and member acquisition costs",
      "Equipment maintenance and facility upkeep create ongoing capital requirements beyond standard operating expenses",
    ],
  },
  {
    id: "3",
    name: "The UPS Store",
    slug: "the-ups-store",
    logoUrl: "/logos/the-ups-store.svg",
    industry: "Business Services",
    description: "Leading retail shipping, postal, printing and business service franchise",
    hasItem19: false,
    investmentMin: 178000,
    investmentMax: 403000,
    roiTimeframe: "3-5 years",
    avgRevenue: 425000,
    totalUnits: 5400,
    fddPdfUrl: "/sample-fdds/ups-store-fdd-page1.jpg",
    status: "Established",
    franchiseScore: {
      overall: 512,
      maxScore: 600,
      systemStability: { score: 185, max: 200 },
      supportQuality: { score: 135, max: 150 },
      growthTrajectory: { score: 118, max: 150 },
      financialDisclosure: { score: 74, max: 100 },
      riskLevel: "LOW",
      industryPercentile: 82,
      breakdown: {
        systemStability: [
          {
            metric: "Franchisee Turnover Rate",
            score: 47,
            max: 50,
            rating: "Excellent",
            explanation: "2.3% average - strong franchisee satisfaction",
          },
          {
            metric: "Unit Closure Rate",
            score: 48,
            max: 50,
            rating: "Excellent",
            explanation: "1.5% annually - exceptional stability",
          },
          {
            metric: "Litigation Cases (3yr)",
            score: 48,
            max: 50,
            rating: "Excellent",
            explanation: "Minimal litigation, mature system",
          },
          {
            metric: "Financial Stability",
            score: 42,
            max: 50,
            rating: "Excellent",
            explanation: "Backed by UPS - strong financial position",
          },
        ],
        supportQuality: [
          {
            metric: "Initial Training",
            score: 38,
            max: 40,
            rating: "Excellent",
            explanation: "5 weeks comprehensive training at HQ and in-store",
          },
          {
            metric: "Ongoing Support",
            score: 35,
            max: 40,
            rating: "Excellent",
            explanation: "Field consultants and 24/7 support hotline",
          },
          {
            metric: "Marketing Support",
            score: 30,
            max: 35,
            rating: "Excellent",
            explanation: "National UPS brand marketing and local tools",
          },
          {
            metric: "Technology Systems",
            score: 32,
            max: 35,
            rating: "Excellent",
            explanation: "Integrated UPS systems and modern POS",
          },
        ],
        growthTrajectory: [
          {
            metric: "3-Year Growth Rate",
            score: 35,
            max: 50,
            rating: "Good",
            explanation: "+5.2% growth - steady mature system expansion",
          },
          {
            metric: "Market Expansion",
            score: 42,
            max: 50,
            rating: "Excellent",
            explanation: "Nationwide coverage with selective growth",
          },
          {
            metric: "Unit Economics",
            score: 41,
            max: 50,
            rating: "Excellent",
            explanation: "Diversified revenue streams, strong profitability",
          },
        ],
        financialDisclosure: [
          {
            metric: "Item 19 Quality",
            score: 40,
            max: 50,
            rating: "Excellent",
            explanation: "Detailed revenue and expense data provided",
          },
          {
            metric: "Transparency",
            score: 18,
            max: 25,
            rating: "Good",
            explanation: "Comprehensive disclosure of all fees",
          },
          {
            metric: "Investment Clarity",
            score: 16,
            max: 25,
            rating: "Good",
            explanation: "Clear investment breakdown with ranges",
          },
        ],
      },
    },
    opportunities: [
      "Diversified revenue streams from shipping, printing, mailbox services, and notary reduce dependency on single service line",
      "Strong partnership with UPS brand provides instant credibility and access to established logistics network",
      "B2B and B2C customer base creates stable recurring revenue with high customer lifetime value",
    ],
    concerns: [
      "Competition from online shipping platforms and retail competitors (FedEx Office, USPS) pressures margins",
      "Technology disruption in printing and document services requires continuous investment in equipment upgrades",
      "Location-dependent success requires high-traffic retail space with premium lease costs impacting profitability",
    ],
  },
  {
    id: "4",
    name: "Great Clips",
    slug: "great-clips",
    logoUrl: "/logos/great-clips.svg",
    industry: "Personal Services",
    description: "No-appointment hair salon franchise with simple business model",
    hasItem19: true,
    investmentMin: 158000,
    investmentMax: 294000,
    roiTimeframe: "2-3 years",
    avgRevenue: 380000,
    totalUnits: 4400,
    fddPdfUrl: "https://pdfobject.com/pdf/sample.pdf",
    status: "New",
    franchiseScore: {
      overall: 378,
      maxScore: 600,
      systemStability: { score: 125, max: 200 },
      supportQuality: { score: 112, max: 150 },
      growthTrajectory: { score: 95, max: 150 },
      financialDisclosure: { score: 46, max: 100 },
      riskLevel: "MODERATE",
      industryPercentile: 58,
      breakdown: {
        systemStability: [
          {
            metric: "Franchisee Turnover Rate",
            score: 32,
            max: 50,
            rating: "Fair",
            explanation: "5.8% average - moderate turnover in labor-intensive model",
          },
          {
            metric: "Unit Closure Rate",
            score: 30,
            max: 50,
            rating: "Fair",
            explanation: "5.2% annually - challenges in some markets",
          },
          {
            metric: "Litigation Cases (3yr)",
            score: 38,
            max: 50,
            rating: "Good",
            explanation: "Some litigation but manageable",
          },
          {
            metric: "Financial Stability",
            score: 25,
            max: 50,
            rating: "Fair",
            explanation: "Stable but facing labor market pressures",
          },
        ],
        supportQuality: [
          {
            metric: "Initial Training",
            score: 28,
            max: 40,
            rating: "Good",
            explanation: "2-week training program covers basics",
          },
          {
            metric: "Ongoing Support",
            score: 30,
            max: 40,
            rating: "Good",
            explanation: "Regional support and annual conferences",
          },
          {
            metric: "Marketing Support",
            score: 25,
            max: 35,
            rating: "Good",
            explanation: "National campaigns and loyalty program",
          },
          {
            metric: "Technology Systems",
            score: 29,
            max: 35,
            rating: "Good",
            explanation: "Online check-in and mobile app",
          },
        ],
        growthTrajectory: [
          {
            metric: "3-Year Growth Rate",
            score: 28,
            max: 50,
            rating: "Fair",
            explanation: "+3.8% growth - slower expansion",
          },
          {
            metric: "Market Expansion",
            score: 35,
            max: 50,
            rating: "Good",
            explanation: "Nationwide presence with selective growth",
          },
          {
            metric: "Unit Economics",
            score: 32,
            max: 50,
            rating: "Fair",
            explanation: "Labor costs impact profitability",
          },
        ],
        financialDisclosure: [
          {
            metric: "Item 19 Quality",
            score: 18,
            max: 50,
            rating: "Fair",
            explanation: "Basic revenue data, limited expense detail",
          },
          { metric: "Transparency", score: 14, max: 25, rating: "Fair", explanation: "Standard disclosure, some gaps" },
          {
            metric: "Investment Clarity",
            score: 14,
            max: 25,
            rating: "Fair",
            explanation: "Investment range provided",
          },
        ],
      },
    },
    opportunities: [
      "No-appointment model with online check-in creates operational efficiency and customer convenience advantage",
      "Simple service menu focused on haircuts reduces training complexity and inventory management requirements",
      "Strong brand loyalty program with 22 million members drives repeat business and predictable revenue",
    ],
    concerns: [
      "Labor-intensive business model faces challenges with stylist recruitment and retention in tight labor markets",
      "Limited service offerings compared to full-service salons may restrict revenue growth and average ticket size",
      "Franchise density in mature markets creates cannibalization risk and limits territory expansion opportunities",
    ],
  },
  {
    id: "5",
    name: "Dunkin'",
    slug: "dunkin",
    logoUrl: "/logos/dunkin.svg",
    industry: "Food & Beverage",
    description: "America's favorite coffee and baked goods chain with strong morning daypart",
    hasItem19: true,
    investmentMin: 437000,
    investmentMax: 1200000,
    roiTimeframe: "3-4 years",
    avgRevenue: 1050000,
    totalUnits: 9600,
    fddPdfUrl: "https://pdfobject.com/pdf/sample.pdf",
    status: "Established",
    franchiseScore: {
      overall: 458,
      maxScore: 600,
      systemStability: { score: 168, max: 200 },
      supportQuality: { score: 118, max: 150 },
      growthTrajectory: { score: 122, max: 150 },
      financialDisclosure: { score: 50, max: 100 },
      riskLevel: "LOW",
      industryPercentile: 72,
      breakdown: {
        systemStability: [
          {
            metric: "Franchisee Turnover Rate",
            score: 42,
            max: 50,
            rating: "Good",
            explanation: "3.5% average - solid franchisee retention",
          },
          {
            metric: "Unit Closure Rate",
            score: 40,
            max: 50,
            rating: "Good",
            explanation: "3.2% annually - stable system",
          },
          {
            metric: "Litigation Cases (3yr)",
            score: 44,
            max: 50,
            rating: "Excellent",
            explanation: "Minimal litigation for system size",
          },
          {
            metric: "Financial Stability",
            score: 42,
            max: 50,
            rating: "Excellent",
            explanation: "Strong parent company backing",
          },
        ],
        supportQuality: [
          {
            metric: "Initial Training",
            score: 32,
            max: 40,
            rating: "Good",
            explanation: "6-week comprehensive training program",
          },
          {
            metric: "Ongoing Support",
            score: 30,
            max: 40,
            rating: "Good",
            explanation: "Field support and operations consultants",
          },
          {
            metric: "Marketing Support",
            score: 26,
            max: 35,
            rating: "Good",
            explanation: "National campaigns and DD Perks program",
          },
          {
            metric: "Technology Systems",
            score: 30,
            max: 35,
            rating: "Excellent",
            explanation: "Mobile ordering and drive-thru technology",
          },
        ],
        growthTrajectory: [
          {
            metric: "3-Year Growth Rate",
            score: 40,
            max: 50,
            rating: "Good",
            explanation: "+12.5% growth - strong expansion",
          },
          {
            metric: "Market Expansion",
            score: 42,
            max: 50,
            rating: "Excellent",
            explanation: "Nationwide with international growth",
          },
          {
            metric: "Unit Economics",
            score: 40,
            max: 50,
            rating: "Good",
            explanation: "High volume drives profitability",
          },
        ],
        financialDisclosure: [
          {
            metric: "Item 19 Quality",
            score: 22,
            max: 50,
            rating: "Fair",
            explanation: "Revenue data provided, limited expense breakdown",
          },
          { metric: "Transparency", score: 14, max: 25, rating: "Fair", explanation: "Standard disclosure practices" },
          {
            metric: "Investment Clarity",
            score: 14,
            max: 25,
            rating: "Fair",
            explanation: "Wide investment range due to format variations",
          },
        ],
      },
    },
    opportunities: [
      "Dominant morning daypart position with coffee and breakfast focus drives high-margin beverage sales",
      "Strong brand recognition and customer loyalty with DD Perks program boasting 30+ million active members",
      "Drive-thru and mobile ordering capabilities align with consumer convenience trends and boost transaction speed",
    ],
    concerns: [
      "Significant capital investment ($437K-$1.2M) with real estate and buildout costs creating high barrier to entry",
      "Intense competition from Starbucks, McDonald's, and local coffee shops requires aggressive marketing spend",
      "Labor costs and staffing challenges during peak morning hours impact service quality and operational efficiency",
    ],
  },
  {
    id: "6",
    name: "Blo Blow Dry Bar",
    slug: "blo-blow-dry-bar",
    logoUrl: "/logos/blo-blow-dry-bar.svg",
    industry: "Personal Care/Beauty Services",
    description: "Blow dry bar concept with membership model, small footprint, and recurring revenue streams",
    hasItem19: true,
    investmentMin: 308500,
    investmentMax: 402620,
    roiTimeframe: "3-4 years",
    avgRevenue: 378129,
    totalUnits: 100,
    fddPdfUrl: "/sample-fdds/blo-fdd-page1.jpg",
    status: "Established",
    franchiseScore: {
      overall: 430,
      maxScore: 600,
      systemStability: { score: 145, max: 200 },
      supportQuality: { score: 98, max: 150 },
      growthTrajectory: { score: 112, max: 150 },
      financialDisclosure: { score: 75, max: 100 },
      riskLevel: "MODERATE",
      industryPercentile: 68,
      breakdown: {
        systemStability: [
          {
            metric: "Franchisee Turnover Rate",
            score: 45,
            max: 50,
            rating: "Good",
            explanation: "3.8% average - solid retention in niche market",
          },
          {
            metric: "Unit Closure Rate",
            score: 42,
            max: 50,
            rating: "Good",
            explanation: "3.7% annually - stable despite market challenges",
          },
          {
            metric: "Litigation Cases (3yr)",
            score: 50,
            max: 50,
            rating: "Excellent",
            explanation: "0 disclosed - clean litigation history",
          },
          {
            metric: "Financial Stability",
            score: 8,
            max: 50,
            rating: "Poor",
            explanation: "Significant concerns flagged in FDD - franchisor financial distress",
          },
        ],
        supportQuality: [
          {
            metric: "Initial Training",
            score: 28,
            max: 40,
            rating: "Good",
            explanation: "67.5-81.5 hours total training program",
          },
          {
            metric: "Ongoing Support",
            score: 30,
            max: 40,
            rating: "Good",
            explanation: "Field visits, coaching, manual access",
          },
          {
            metric: "Marketing Support",
            score: 22,
            max: 35,
            rating: "Fair",
            explanation: "Multiple programs but high cost burden on franchisees",
          },
          {
            metric: "Technology Systems",
            score: 18,
            max: 35,
            rating: "Fair",
            explanation: "POS (Booker), booking app, basic tech stack",
          },
        ],
        growthTrajectory: [
          {
            metric: "3-Year Growth Rate",
            score: 42,
            max: 50,
            rating: "Good",
            explanation: "+24.7% growth (81→101 units) - strong expansion momentum",
          },
          {
            metric: "Market Expansion",
            score: 40,
            max: 50,
            rating: "Good",
            explanation: "27 states, 17 signed agreements - solid geographic spread",
          },
          {
            metric: "Unit Economics",
            score: 30,
            max: 50,
            rating: "Fair",
            explanation: "Limited profitability data - revenue variance concerns",
          },
        ],
        financialDisclosure: [
          {
            metric: "Item 19 Quality",
            score: 35,
            max: 50,
            rating: "Good",
            explanation: "Sales data only, no expenses - limits profitability assessment",
          },
          {
            metric: "Transparency",
            score: 15,
            max: 25,
            rating: "Good",
            explanation: "Clear warnings, good risk disclosure about franchisor finances",
          },
          {
            metric: "Investment Clarity",
            score: 25,
            max: 25,
            rating: "Excellent",
            explanation: "Comprehensive breakdown of all investment components",
          },
        ],
      },
    },
    investmentBreakdown: {
      franchiseFee: 45000,
      realEstateRent: 5250, // Average of $3,000-$7,500
      securityDeposits: 7250, // Average of $5,000-$9,500
      drawingsPermits: 10800,
      leaseholdImprovements: 155000, // Average of $130,000-$180,000
      signageArt: 6250, // Average of $6,000-$6,500
      furnitureFixturesEquipment: 42218, // Average of $40,820-$43,615
      computerSystemSoftware: 2200,
      insurance: 675, // Average of $600-$750
      barSupplies: 15935, // Average of $14,620-$17,250
      initialInventory: 13988, // Average of $10,040-$17,935
      trainingCosts: 13245, // Average of $10,420-$16,070
      grandOpeningMarketing: 13750, // Average of $12,500-$15,000
      licensesPermits: 500,
      legalAccounting: 3500, // Average of $2,000-$5,000
      additionalFunds: 20000, // Average of $15,000-$25,000
    },
    revenueData: {
      average: 378129,
      median: 345752,
      topQuartile: 607189,
      bottomQuartile: 204457,
    },
    opportunities: [
      "Growing niche market with proven demand - 24.7% growth from 81 to 101 units over 3 years, with 17 additional franchise agreements signed demonstrating continued franchisee confidence",
      "Recurring revenue through membership model - Average of 91 members per location (top performers: 157 members) provides predictable cash flow and stabilizes revenue during slower periods",
      "Small footprint with lower real estate risk - Only 700-1,000 sq ft reduces rent ($3K-$7.5K/month), faster buildout (6-9 months), and greater site selection flexibility",
    ],
    concerns: [
      "Franchisor financial distress warning - FDD explicitly states franchisor's financial condition 'calls into question' their ability to provide services and support, with only $3.5M in 2024 revenue",
      "Extreme revenue variance without profit data - Bottom 25% averaged only $204K while top 25% averaged $607K (3x difference), and 57% of locations performed below average with no expense data to determine profitability",
      "Heavy ongoing fee burden with mandatory minimums - Combined fees total $50K+ annually (6% royalty, 2% ad fund, $150/month brand fee, $50/month tech fee, $1,500/month local advertising) regardless of performance",
    ],
  },
  {
    id: "7",
    name: "Daisy",
    slug: "daisy",
    logoUrl: "/logos/daisy.svg",
    industry: "Technology Installation & Maintenance",
    description: "Residential and commercial technology installation and ongoing maintenance solutions franchise",
    hasItem19: true,
    investmentMin: 135900,
    investmentMax: 299500,
    roiTimeframe: "Unknown - New System",
    avgRevenue: 2808527, // Average of 3 disclosed locations
    totalUnits: 12,
    fddPdfUrl: "/fdds/daisy-fdd-2025.txt",
    fddPageUrls: [
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-01.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-02.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-03.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-04.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-05.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-06.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-07.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-08.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-09.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-10.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-11.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-12.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-13.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-14.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-15.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-16.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-17.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-18.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-19.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-20.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-21.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-22.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-23.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-24.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-25.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-26.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-27.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-28.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-29.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-30.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-31.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-32.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-33.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-34.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-35.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-36.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-37.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-38.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-39.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-40.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-41.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-42.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-43.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-44.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-45.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-46.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-47.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-48.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-49.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-50.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-51.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-52.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-53.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-54.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-55.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-56.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-57.png",
      "https://xzjwmeu3gtb6llto.public.blob.vercel-storage.com/fdd/7/page-58.png",
    ],
    fddPageOffset: 8, // Added page offset of 8 for Daisy (TOC on page 8, Item 1 starts on page 9)
    fddPageMapping: {
      "Item 1": [1, 2, 3, 4],
      "Item 5": [3, 4, 5],
      "Item 6": [6, 7, 8, 9, 10, 11, 12], // Corrected: Item 6 is actually on page 6, not page 4 as shown in extracted TOC
      "Item 7": [8, 9, 10, 11, 12, 13, 14],
      "Item 11": [16, 17, 18, 19, 20, 21, 22, 23, 24],
      "Item 19": [34, 35, 36, 37],
    },
    fddTextContent: "This is the text content extracted from the Daisy FDD.",
    status: "New",
    stateDistribution: {
      CA: 3,
      FL: 2,
      CT: 1,
      TX: 3,
      NY: 3,
    },
    franchiseScore: {
      overall: 285,
      maxScore: 600,
      systemStability: { score: 85, max: 200 },
      supportQuality: { score: 95, max: 150 },
      growthTrajectory: { score: 75, max: 150 },
      financialDisclosure: { score: 30, max: 100 },
      riskLevel: "HIGH",
      industryPercentile: 48,
      breakdown: {
        systemStability: [
          {
            metric: "Franchisee Turnover Rate",
            score: 25,
            max: 50,
            rating: "N/A",
            explanation: "0% turnover - but system only 1 year old, insufficient data",
          },
          {
            metric: "Unit Closure Rate",
            score: 25,
            max: 50,
            rating: "N/A",
            explanation: "0% closures - but all units opened in 2024, no historical trend",
          },
          {
            metric: "Litigation Cases (3yr)",
            score: 27,
            max: 50,
            rating: "Good",
            explanation: "No litigation disclosed - clean record",
          },
          {
            metric: "Financial Stability",
            score: 8,
            max: 50,
            rating: "Poor",
            explanation: "Company formed March 2025, less than 1 year old - extreme startup risk",
          },
        ],
        supportQuality: [
          {
            metric: "Initial Training",
            score: 28,
            max: 40,
            rating: "Good",
            explanation: "80 hours total training (40 classroom + 40 on-the-job)",
          },
          {
            metric: "Ongoing Support",
            score: 22,
            max: 40,
            rating: "Fair",
            explanation: "Support provided 'at discretion' - no guaranteed field visit frequency",
          },
          {
            metric: "Marketing Support",
            score: 20,
            max: 35,
            rating: "Fair",
            explanation: "National Brand Fund not yet established - only local advertising required",
          },
          {
            metric: "Technology Systems",
            score: 25,
            max: 35,
            rating: "Good",
            explanation: "Required computer system, CRM, POS - adequate tech stack",
          },
        ],
        growthTrajectory: [
          {
            metric: "3-Year Growth Rate",
            score: 25,
            max: 50,
            rating: "N/A",
            explanation: "12 units opened in Year 1 - no historical trend data available",
          },
          {
            metric: "Market Expansion",
            score: 25,
            max: 50,
            rating: "Fair",
            explanation: "5 states currently, 9 units projected for 2025 - aggressive expansion",
          },
          {
            metric: "Unit Economics",
            score: 25,
            max: 50,
            rating: "Fair",
            explanation: "Strong margins (56-64%) but only 3 of 12 units disclosed",
          },
        ],
        financialDisclosure: [
          {
            metric: "Item 19 Quality",
            score: 12,
            max: 50,
            rating: "Poor",
            explanation: "Only 3 of 12 units disclosed, no profit/EBITDA data, unaudited figures",
          },
          {
            metric: "Transparency",
            score: 10,
            max: 25,
            rating: "Fair",
            explanation: "FDD explicitly warns of elevated risk due to short operating history",
          },
          {
            metric: "Investment Clarity",
            score: 8,
            max: 25,
            rating: "Fair",
            explanation: "Investment range clearly disclosed but wide variance",
          },
        ],
      },
    },
    investmentBreakdown: {
      franchiseFee: 50000,
      utilitiesDeposits: 1750,
      suppliesToolsEquipmentInventory: 21000,
      insurance: 6600,
      printingSignage: 2100,
      officeEquipment: 6250,
      rentSecurityDeposit: 2250,
      leaseholdImprovements: 10000,
      grandOpeningAdvertising: 40000,
      vehicle: 31500,
      permitsLicenses: 2500,
      professionalFees: 3750,
      travelTrainingExpenses: 7500,
      additionalFunds3Months: 32500,
    },
    revenueData: {
      average: 2808527,
      median: 2183963,
      topQuartile: 4539006,
      bottomQuartile: 1702613,
    },
    opportunities: [
      "First-Mover Advantage in Emerging Technology Integration Market - The three operating locations in 2024 demonstrated strong gross profit margins ranging from 56.3% to 64.0%, with total revenue ranging from $1.7M to $4.5M per location. The system opened 12 total outlets in its first year (5 franchised, 7 company-owned) with zero closures and has 9 additional franchised units projected for 2025, indicating strong market reception.",
      "Comprehensive Conversion Program for Existing Technology Businesses - The franchisor offers a conversion program with discounted initial franchise fees (reduced from $50,000 to $25,000) based on established gross volume. The total investment for conversion ranges from $26,200 to $274,500 compared to $135,900 to $299,500 for new franchises, creating a lower barrier to entry for experienced operators.",
      "Strong Demonstrated Unit Economics from Operating Locations - The Costa Mesa, CA franchised location generated $4,539,006 in total revenue with a 62.3% gross profit margin ($2,827,798 gross profit) and $714,583 revenue per field technician. All three locations showed gross margins after labor ranging from 46.7% to 58.4% of revenue, demonstrating scalability of the labor model.",
    ],
    concerns: [
      "Extremely Limited Operating History Creates High Uncertainty - The FDD explicitly warns: 'Short Operating History. The franchisor is at an early stage of development and has a limited operating history. This franchise is likely to be a riskier investment than a franchise in a system with a longer operating history.' Daisyco Franchising, LLC was formed on March 24, 2025 and began offering franchises in March 2025, making the system less than 8 months old at FDD issuance.",
      "Inadequate Financial Performance Disclosure Limits Investment Analysis - Item 19 provides financial data for only 3 locations (2 franchised, 1 company-owned) out of 12 total operating units, and explicitly states the data 'has not been audited.' The disclosure provides revenue and gross profit figures but conspicuously omits net profit, EBITDA, or any operating expense data beyond direct labor costs. Without profitability data, franchisees cannot accurately evaluate potential ROI or payback period.",
      "Aggressive Growth Plans May Strain Support Infrastructure - The system projects opening 9 additional franchised units and 1 company-owned unit in 2025, representing an 83% increase in total system size (from 12 to 22 units). However, ongoing support commitments are vague: periodic visits are provided 'at our discretion,' field visit frequency is not stated, and the National Brand Development Fund has not been established, limiting system-wide marketing support.",
    ],
    analyticalSummary:
      "Daisyco Franchising, LLC (operating as 'Daisy') represents a high-risk, early-stage opportunity in the residential and commercial technology installation and maintenance sector. With a FranchiseScore of 285/600 (47.5%), this franchise is less than one year old (formed March 2025) and has opened 12 units in its inaugural year. While the three disclosed locations show impressive gross profit margins (56-64%) and strong revenue per technician ($568K-$715K), the lack of profitability data, unaudited financials, and extremely limited operating history create significant uncertainty. The FDD explicitly warns of elevated risk due to the franchisor's early stage of development. The investment range of $135,900-$299,500 is moderate, but the absence of comprehensive financial disclosure makes ROI analysis impossible. This franchise requires sophisticated, well-capitalized investors comfortable with startup-stage risk and capable of operating with minimal franchisor support infrastructure.",
  },
  {
    id: "8",
    name: "Radiant Waxing",
    slug: "radiant-waxing",
    logoUrl: "/images/image.png",
    coverImageUrl: "/images/radiant-waxing-cover.png",
    industry: "Personal Care/Beauty Services",
    description: "Upscale salon offering hair removal services under the trade name and service mark RADIANT WAXING",
    hasItem19: true,
    investmentMin: 387788,
    investmentMax: 554947,
    roiTimeframe: "3-4 years",
    totalUnits: 50,
    fddPdfUrl:
      "https://utunvzekehobtyncpcza.supabase.co/storage/v1/object/public/fdd-documents/Radiant%20Waxing%20FDD%20(2025).pdf",
    status: "Trending",
    opportunities: [
      "Upscale positioning in growing beauty services market with focus on premium hair removal services",
      "Strong support system with comprehensive training and operational guidance",
      "Lower investment range compared to full-service salon concepts",
    ],
    concerns: [
      "Estimated investment of $387K to $554K required to begin operation of initial franchised salon",
      "Area Development Fee increases by $25K-$35K per salon depending on number of salons developed",
      "Must maintain brand standards and quality expectations in competitive beauty services market",
    ],
  },
]

export const stats = {
  fddsAnalyzed: 7,
  savedFranchises: 3,
  questionsAsked: 18,
  comparisonsMade: 2,
  notesCreated: 8,
  fddViews: 1243,
  item19Views: 347,
  qualifiedLeads: 38,
  highIntent: 24,
  newLeads: 12,
}

export const investmentBreakdown = {
  franchiseFee: 15000,
  equipment: 85000,
  leasehold: 45000,
  inventory: 8000,
  training: 5000,
  marketing: 10000,
  workingCapital: 25000,
  other: 23000,
}

export const unitDistribution = {
  total: 37000,
  us: 21000,
  international: 16000,
  growth2023: 450,
  closures2023: 320,
}

export const lenders: Lender[] = [
  {
    id: "1",
    name: "FranFund",
    isPreferred: true,
    estimatedRate: "7.5% - 9.5%",
    loanTerms: "Up to 10 years",
    approvalLikelihood: "High",
    specialFeatures: [
      "Specializes in franchise financing",
      "Fast 48-hour pre-approval",
      "Up to 90% financing available",
      "No prepayment penalties",
    ],
    processingTime: "2-3 days",
  },
  {
    id: "2",
    name: "Guidant Financial",
    isPreferred: false,
    estimatedRate: "8.0% - 10.0%",
    loanTerms: "5-10 years",
    approvalLikelihood: "High",
    specialFeatures: [
      "401(k) rollover options (ROBS)",
      "SBA loan expertise",
      "Equipment financing available",
      "Dedicated franchise advisors",
    ],
    processingTime: "3-5 days",
  },
  {
    id: "3",
    name: "ApplePie Capital",
    isPreferred: false,
    estimatedRate: "7.9% - 11.5%",
    loanTerms: "Up to 7 years",
    approvalLikelihood: "Medium",
    specialFeatures: [
      "Multi-unit financing specialists",
      "Flexible underwriting criteria",
      "Working capital loans",
      "Growth capital for expansion",
    ],
    processingTime: "5-7 days",
  },
  {
    id: "4",
    name: "Benetrends",
    isPreferred: false,
    estimatedRate: "8.5% - 10.5%",
    loanTerms: "5-10 years",
    approvalLikelihood: "High",
    specialFeatures: [
      "Rainmaker Plan (ROBS + SBA)",
      "No personal guarantees required",
      "Preserve liquid capital",
      "Tax-advantaged financing",
    ],
    processingTime: "4-6 days",
  },
  {
    id: "5",
    name: "Live Oak Bank",
    isPreferred: false,
    estimatedRate: "9.0% - 11.0%",
    loanTerms: "Up to 10 years",
    approvalLikelihood: "Medium",
    specialFeatures: [
      "SBA 7(a) loan specialists",
      "Competitive rates for strong credit",
      "Real estate financing available",
      "Online application process",
    ],
    processingTime: "7-10 days",
  },
]

export const fddEngagements: FDDEngagement[] = [
  {
    franchiseId: "1", // Subway
    questionsAsked: [
      "What's the average ROI for Subway franchises?",
      "How much territory protection do I get?",
      "What are the typical operating expenses?",
    ],
    sectionsViewed: ["Item 19", "Item 7", "Item 11", "Item 20", "Item 6"],
    timeSpent: 2820, // 47 minutes
    notesCreated: 3,
    startTime: "2025-01-10T10:00:00Z",
    lastActivity: "2025-01-15T14:30:00Z",
    completionPercentage: 75,
    hasConnected: false,
    item23SignedAt: "2025-01-12T14:30:00Z",
    item23BuyerCopyUrl: "/sample-receipts/blo-item23-buyer.pdf",
    milestones: {
      viewedFDD: true,
      askedQuestions: true,
      viewedItem19: true,
      viewedItem7: true,
      createdNotes: true,
      spentSignificantTime: true,
    },
  },
  {
    franchiseId: "2", // Anytime Fitness
    questionsAsked: ["What equipment is included?", "What's the member retention rate?"],
    sectionsViewed: ["Item 7", "Item 19", "Item 11"],
    timeSpent: 1380, // 23 minutes
    notesCreated: 2,
    startTime: "2025-01-12T09:00:00Z",
    lastActivity: "2025-01-14T16:45:00Z",
    completionPercentage: 55,
    hasConnected: false,
    milestones: {
      viewedFDD: true,
      askedQuestions: true,
      viewedItem19: true,
      viewedItem7: true,
      createdNotes: true,
      spentSignificantTime: true,
    },
  },
  {
    franchiseId: "3", // The UPS Store
    questionsAsked: [],
    sectionsViewed: ["Item 7"],
    timeSpent: 420, // 7 minutes
    notesCreated: 0,
    startTime: "2025-01-14T11:00:00Z",
    lastActivity: "2025-01-14T11:07:00Z",
    completionPercentage: 20,
    hasConnected: false,
    milestones: {
      viewedFDD: true,
      askedQuestions: false,
      viewedItem19: false,
      viewedItem7: true,
      createdNotes: false,
      spentSignificantTime: false,
    },
  },
  {
    franchiseId: "7", // Daisy
    questionsAsked: ["What is the initial investment required?", "What kind of support does the franchisor provide?"],
    sectionsViewed: ["Item 7", "Item 19"],
    timeSpent: 900, // 15 minutes
    notesCreated: 1,
    startTime: "2025-01-15T10:00:00Z",
    lastActivity: "2025-01-15T10:15:00Z",
    completionPercentage: 45,
    hasConnected: false,
    milestones: {
      viewedFDD: true,
      askedQuestions: true,
      viewedItem19: true,
      viewedItem7: true,
      createdNotes: true,
      spentSignificantTime: true,
    },
  },
]

export const franchisePreApprovals: FranchisePreApproval[] = [
  {
    franchiseId: "1", // Subway
    status: "Approved",
    lenders: [
      {
        lenderId: "1",
        lenderName: "FranFund",
        status: "Approved",
        submittedDate: "2025-01-08T10:00:00Z",
        approvedDate: "2025-01-10T14:30:00Z",
        approvedAmount: 200000,
        approvedRate: 8.5,
      },
      {
        lenderId: "2",
        lenderName: "Guidant Financial",
        status: "Approved",
        submittedDate: "2025-01-08T10:00:00Z",
        approvedDate: "2025-01-11T09:15:00Z",
        approvedAmount: 180000,
        approvedRate: 9.0,
      },
    ],
    submittedDate: "2025-01-08T10:00:00Z",
  },
  {
    franchiseId: "2", // Anytime Fitness
    status: "Pending",
    lenders: [
      {
        lenderId: "1",
        lenderName: "FranFund",
        status: "Pending",
        submittedDate: "2025-01-12T11:00:00Z",
      },
      {
        lenderId: "3",
        lenderName: "ApplePie Capital",
        status: "Pending",
        submittedDate: "2025-01-12T11:00:00Z",
      },
    ],
    submittedDate: "2025-01-12T11:00:00Z",
  },
  {
    franchiseId: "7", // Daisy
    status: "Not Started",
    lenders: [],
  },
]

export const leads: Lead[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    brand: "Drybar",
    location: "Austin, TX",
    city: "Austin",
    state: "TX",
    timeline: "3-6 months",
    intent: "High",
    isNew: true,
    qualityScore: 92,
    stage: "disclosed",
    daysInStage: 5,
    accessedDate: "2025-01-10T10:00:00Z",
    totalTimeSpent: "47 min",
    fddSendDate: "2025-01-10T09:00:00Z",
    disclosureExpiresDate: "2025-02-23T09:00:00Z",
    item23SignedAt: "2025-01-12T14:30:00Z",
    item23CompleteCopyUrl: "/sample-receipts/item23-complete.pdf",
    item23FranchisorCopyUrl: "/sample-receipts/item23-franchisor.pdf",
    item23BuyerCopyUrl: "/sample-receipts/item23-buyer.pdf",
    item23SignatureId: "ENV-12345-ABCD",
    email: "sarah.johnson@email.com",
    phone: "(555) 123-4567",
    source: "FDDAdvisor",
    invitationStatus: "FDD Viewed",
    invitationSentDate: "2025-01-09T10:00:00Z",
    questionsAsked: [
      "What's the average ROI?",
      "How much territory protection?",
      "What are typical operating expenses?",
    ],
    verificationStatus: "verified",
    financialQualification: {
      creditScore: 750,
      creditScoreVerified: true,
      backgroundCheck: "Clear",
      backgroundCheckVerified: true,
      preApproval: {
        status: "Approved",
        amount: 200000,
        interestRate: 8.5,
        verified: true,
      },
      liquidCapital: {
        amount: 150000,
        source: "Verified",
      },
      netWorth: {
        amount: 500000,
        source: "Self-reported",
      },
    },
    demographics: {
      age: "35-44",
      experience: "5+ years management",
      capital: "$150K-$250K",
      location: "Austin, TX",
    },
    engagement: [
      { date: "2025-01-10", action: "Viewed FDD" },
      { date: "2025-01-12", action: "Asked 3 questions" },
      { date: "2025-01-15", action: "Signed Item 23" },
    ],
    fddFocusAreas: [
      { item: "Item 19", timeSpent: "15 min", interest: "High" },
      { item: "Item 7", timeSpent: "12 min", interest: "High" },
      { item: "Item 11", timeSpent: "8 min", interest: "Medium" },
    ],
    salesRecommendations: {
      approach: "High-intent buyer with strong financials",
      talkingPoints: ["Emphasize proven ROI data", "Highlight territory protection", "Discuss support systems"],
      concerns: ["Operating expense clarity", "Competition in market"],
      nextSteps: ["Schedule discovery call", "Provide territory analysis", "Connect with existing franchisees"],
    },
  },
  {
    id: "2",
    name: "Michael Chen",
    brand: "Elements Massage",
    location: "Seattle, WA",
    city: "Seattle",
    state: "WA",
    timeline: "6-12 months",
    intent: "Medium",
    isNew: false,
    qualityScore: 78,
    stage: "qualified",
    daysInStage: 12,
    accessedDate: "2025-01-05T14:00:00Z",
    totalTimeSpent: "23 min",
    fddSendDate: "2025-01-08T10:00:00Z",
    disclosureExpiresDate: "2025-02-21T10:00:00Z",
    email: "m.chen@email.com",
    phone: "(555) 234-5678",
    source: "Website",
    invitationStatus: "Account Created",
    invitationSentDate: "2025-01-07T11:00:00Z",
    questionsAsked: ["What equipment is included?", "What's the member retention rate?"],
    verificationStatus: "pending",
    financialQualification: {
      creditScore: 680,
      creditScoreVerified: false,
      backgroundCheck: "Pending",
      backgroundCheckVerified: false,
      preApproval: {
        status: "Pending",
        verified: false,
      },
      liquidCapital: {
        amount: 100000,
        source: "Self-reported",
      },
      netWorth: {
        amount: 350000,
        source: "Self-reported",
      },
    },
    demographics: {
      age: "45-54",
      experience: "First-time business owner",
      capital: "$100K-$150K",
      location: "Seattle, WA",
    },
    engagement: [
      { date: "2025-01-05", action: "Viewed FDD" },
      { date: "2025-01-08", action: "Asked 2 questions" },
    ],
    fddFocusAreas: [
      { item: "Item 7", timeSpent: "10 min", interest: "High" },
      { item: "Item 19", timeSpent: "8 min", interest: "Medium" },
    ],
    salesRecommendations: {
      approach: "Needs financial guidance and reassurance",
      talkingPoints: ["Financing options available", "Training and support programs", "Success stories"],
      concerns: ["Capital requirements", "First-time owner concerns"],
      nextSteps: ["Connect with lender", "Provide financial overview", "Arrange validation calls"],
    },
  },
  {
    id: "3",
    name: "Jennifer Martinez",
    brand: "Lash Studio",
    location: "Miami, FL",
    city: "Miami",
    state: "FL",
    timeline: "1-3 months",
    intent: "High",
    isNew: true,
    qualityScore: 88,
    stage: "negotiating",
    daysInStage: 8,
    accessedDate: "2025-01-12T09:00:00Z",
    totalTimeSpent: "35 min",
    fddSendDate: "2025-01-12T08:00:00Z",
    disclosureExpiresDate: "2025-02-25T08:00:00Z",
    email: "j.martinez@email.com",
    phone: "(555) 345-6789",
    source: "Referral",
    invitationStatus: "FDD Viewed",
    invitationSentDate: "2025-01-11T15:00:00Z",
    questionsAsked: [
      "What's the typical build-out timeline?",
      "Are there any territory restrictions?",
      "What's included in the training?",
    ],
    verificationStatus: "verified",
    financialQualification: {
      creditScore: 720,
      creditScoreVerified: true,
      backgroundCheck: "Clear",
      backgroundCheckVerified: true,
      preApproval: {
        status: "Approved",
        amount: 350000,
        interestRate: 7.9,
        verified: true,
      },
      liquidCapital: {
        amount: 200000,
        source: "Verified",
      },
      netWorth: {
        amount: 600000,
        source: "Verified",
      },
    },
    demographics: {
      age: "25-34",
      experience: "Beauty industry veteran",
      capital: "$200K+",
      location: "Miami, FL",
    },
    engagement: [
      { date: "2025-01-12", action: "Viewed FDD" },
      { date: "2025-01-13", action: "Asked 3 questions" },
      { date: "2025-01-14", action: "Requested territory info" },
    ],
    fddFocusAreas: [
      { item: "Item 19", timeSpent: "18 min", interest: "High" },
      { item: "Item 7", timeSpent: "10 min", interest: "High" },
      { item: "Item 12", timeSpent: "7 min", interest: "Medium" },
    ],
    salesRecommendations: {
      approach: "Ready to move forward, needs final details",
      talkingPoints: ["Territory availability", "Timeline to opening", "Support during buildout"],
      concerns: ["Timeline concerns", "Territory exclusivity"],
      nextSteps: ["Provide territory map", "Schedule site visit", "Prepare franchise agreement"],
    },
  },
  {
    id: "4",
    name: "David Thompson",
    brand: "Drybar",
    location: "Denver, CO",
    city: "Denver",
    state: "CO",
    timeline: "6-12 months",
    intent: "Low",
    isNew: false,
    qualityScore: 45,
    stage: "inquiry",
    daysInStage: 20,
    accessedDate: "2025-01-02T16:00:00Z",
    totalTimeSpent: "7 min",
    email: "d.thompson@email.com",
    source: "Trade Show",
    invitationStatus: "Sent",
    invitationSentDate: "2025-01-03T10:00:00Z",
    verificationStatus: "unverified",
    financialQualification: {
      creditScore: 0,
      creditScoreVerified: false,
      backgroundCheck: "Not Started",
      backgroundCheckVerified: false,
      preApproval: {
        status: "Not Started",
        verified: false,
      },
      liquidCapital: {
        amount: 0,
        source: "Self-reported",
      },
      netWorth: {
        amount: 0,
        source: "Self-reported",
      },
    },
    demographics: {
      age: "Unknown",
      experience: "Unknown",
      capital: "Unknown",
      location: "Denver, CO",
    },
    engagement: [{ date: "2025-01-02", action: "Initial inquiry" }],
    salesRecommendations: {
      approach: "Nurture lead, gather more information",
      talkingPoints: ["Learn about franchise opportunity", "Understand investment requirements"],
      concerns: ["Low engagement", "Unverified financials"],
      nextSteps: ["Follow-up email", "Qualify financial capacity", "Gauge serious interest"],
    },
  },
]
