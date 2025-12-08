export type UserRole = "buyer" | "franchisor" | "lender" | "admin"
export type SubscriptionStatus = "trial" | "active" | "past_due" | "canceled"
export type SubscriptionTier = "starter" | "growth" | "enterprise"
export type LeadSource = "FDDAdvisor" | "Broker" | "Website" | "Referral" | "Trade Show" | "Other"
export type LeadStage =
  | "inquiry"
  | "researching"
  | "qualified"
  | "connected"
  | "negotiating"
  | "closing"
  | "closed"
  | "lost"
export type PreApprovalStatus = "not_started" | "pending" | "approved" | "declined"
export type LenderResponseStatus = "pending" | "approved" | "declined"
export type VerificationStatus = "not_started" | "pending" | "verified" | "failed"
export type CreditRange = "Excellent" | "Good" | "Fair" | "Poor"
export type InvoiceStatus = "pending" | "invoiced" | "paid"

export interface User {
  id: string
  email: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface BuyerProfile {
  id: string
  user_id: string
  first_name?: string
  last_name?: string
  full_name?: string
  phone?: string
  location?: string

  city?: string
  state?: string
  zip_code?: string

  liquid_capital?: number
  liquid_capital_verified: boolean
  capital_verified_at?: string
  capital_verification_expiry?: string
  plaid_access_token?: string

  net_worth?: number

  credit_score?: number
  credit_score_range?: CreditRange
  credit_score_verified: boolean
  credit_verified_at?: string
  credit_verification_expiry?: string

  background_check: VerificationStatus
  background_check_date?: string

  years_experience?: number
  industries?: string[]
  management_experience: boolean

  industries_of_interest?: string[]
  min_investment?: number
  max_investment?: number
  timeline?: string

  share_financial_info: boolean
  allow_contact: boolean

  investment_range_min?: number
  investment_range_max?: number
  industries_interested?: string[]
  buying_timeline?: string
  current_occupation?: string
  business_experience_years?: number
  has_franchise_experience?: boolean
  preferred_location?: string
  city_location?: string
  state_location?: string
  signup_source?: "fddadvisor" | "fddhub"

  fico_score_range?: string
  liquid_assets_range?: string
  net_worth_range?: string
  funding_plan?: string
  linkedin_url?: string
  no_felony_attestation?: boolean
  no_bankruptcy_attestation?: boolean
  profile_completed_at?: string

  created_at: string
  updated_at: string
}

export interface FranchisorProfile {
  id: string
  user_id: string
  company_name: string
  description?: string
  logo_url?: string
  website?: string

  primary_contact_name?: string
  primary_contact_email?: string
  primary_contact_phone?: string

  subscription_status: SubscriptionStatus
  subscription_tier: SubscriptionTier
  subscription_start_date?: string
  next_billing_date?: string
  stripe_customer_id?: string

  created_at: string
  updated_at: string
}

export interface Franchise {
  id: string
  franchisor_id: string

  name: string
  industry: string
  description?: string
  logo_url?: string

  min_investment: number
  max_investment: number
  franchise_fee: number
  royalty_rate?: number

  training_provided?: string
  marketing_support?: string
  territory_protection: boolean

  experience_required?: string
  min_liquid_capital?: number
  min_credit_score?: number

  fdd_url?: string
  fdd_upload_date?: string
  fdd_expiration_date?: string
  has_item_19: boolean

  status: string

  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  buyer_id: string
  franchise_id: string
  franchisor_id: string

  lead_source: LeadSource
  lead_stage: LeadStage
  quality_score: number

  questions_asked: number
  item_19_viewed: boolean
  time_spent_seconds: number
  is_qualified: boolean
  qualified_at?: string

  connected: boolean
  connected_at?: string

  last_activity_at: string
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  lead_id: string
  buyer_id: string
  franchise_id: string

  question_text: string
  answer_text?: string
  answered_by?: "ai" | "franchisor"
  answered_at?: string

  created_at: string
}

export interface PreApproval {
  id: string
  buyer_id: string
  franchise_id: string
  lead_id?: string

  overall_status: PreApprovalStatus

  created_at: string
  updated_at: string
}

export interface LeadInvitation {
  id: string
  franchisor_id: string
  franchise_id: string
  lead_email: string
  lead_name?: string
  lead_phone?: string
  invitation_token: string
  invitation_message?: string
  status: "sent" | "viewed" | "signed_up" | "expired"
  sent_at: string
  viewed_at?: string
  signed_up_at?: string
  expires_at: string
  buyer_id?: string
  created_at: string
  updated_at: string
}

export interface LeadFDDAccess {
  id: string
  buyer_id: string
  franchise_id: string
  franchisor_id: string
  granted_via: "invitation" | "fddadvisor_signup"
  invitation_id?: string
  first_viewed_at?: string
  last_viewed_at?: string
  total_views: number
  total_time_spent_seconds: number
  created_at: string
  updated_at: string
}

export interface WhiteLabelSettings {
  id: string
  franchise_id: string
  franchisor_id: string
  logo_url?: string
  primary_color: string
  accent_color: string
  header_text?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  created_at: string
  updated_at: string
}

export interface FDD {
  id: string
  franchise_name: string
  pdf_url?: string
  pdf_path?: string
  is_public: boolean
  chunks_processed: boolean
  chunk_count: number
  embeddings_generated_at?: string
  created_at: string
  updated_at: string
}

export interface FDDChunk {
  id: string
  fdd_id: string
  chunk_text: string
  chunk_index: number
  item_number?: number
  page_number: number
  start_page: number
  end_page: number
  token_count?: number
  embedding?: number[] // 768-dimensional vector from Gemini text-embedding-004
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface FDDSearchQuery {
  id: string
  user_id?: string
  query_text: string
  fdd_id?: string
  results_returned?: number
  clicked_chunk_id?: string
  session_id?: string
  search_duration_ms?: number
  created_at: string
}

export interface FDDQuestionAnswer {
  id: string
  fdd_id: string
  question_text: string
  answer_text: string
  source_chunk_ids: string[]
  confidence_score?: number
  upvotes: number
  downvotes: number
  times_viewed: number
  created_at: string
  updated_at: string
}

// Type for match_fdd_chunks function result
export interface FDDChunkMatch {
  id: string
  chunk_text: string
  item_number?: number
  page_number: number
  start_page: number
  end_page: number
  metadata: Record<string, any>
  similarity: number
}

// Type for search_fdd_chunks_with_filters function result
export interface FDDChunkSearchResult {
  id: string
  chunk_text: string
  item_number?: number
  page_number: number
  similarity: number
}
