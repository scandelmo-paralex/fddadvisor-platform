-- =====================================================
-- FDDHub Staging Database Schema Migration
-- Run this in your NEW staging Supabase project
-- =====================================================

-- Step 1: Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Step 2: Create user_role type if needed (for reference, auth.users handles this)
-- The users table references auth.users which Supabase creates automatically

-- =====================================================
-- TIER 1: Base tables (no foreign key dependencies)
-- =====================================================

CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role = ANY (ARRAY['buyer'::text, 'franchisor'::text, 'lender'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  signup_source text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.fdd_item_page_mappings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  franchise_slug text NOT NULL,
  mapping_type text NOT NULL CHECK (mapping_type = ANY (ARRAY['item'::text, 'exhibit'::text, 'quick_link'::text])),
  item_number integer CHECK (item_number IS NULL OR (item_number >= 1 AND item_number <= 23)),
  label text NOT NULL,
  page_number integer NOT NULL CHECK (page_number >= 1),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fdd_item_page_mappings_pkey PRIMARY KEY (id)
);

-- =====================================================
-- TIER 2: Profile tables (depend on users)
-- =====================================================

CREATE TABLE public.buyer_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  investment_range_min integer,
  investment_range_max integer,
  preferred_industries text[],
  location_preferences text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  industries_interested text[],
  buying_timeline text,
  current_occupation text,
  business_experience_years integer,
  has_franchise_experience boolean DEFAULT false,
  preferred_location text,
  signup_source text DEFAULT 'fddadvisor'::text,
  city_location text,
  state_location text,
  full_name text,
  fico_score_range text,
  liquid_assets_range text,
  net_worth_range text,
  funding_plan text,
  linkedin_url text,
  no_felony_attestation boolean DEFAULT false,
  no_bankruptcy_attestation boolean DEFAULT false,
  profile_completed_at timestamp with time zone,
  franchisescore_consent_accepted boolean DEFAULT false,
  franchisescore_consent_accepted_at timestamp with time zone,
  tos_privacy_accepted boolean DEFAULT false,
  tos_privacy_accepted_at timestamp with time zone,
  CONSTRAINT buyer_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT buyer_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE TABLE public.franchisor_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  website text,
  industry text,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  logo_url text,
  CONSTRAINT franchisor_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT franchisor_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE TABLE public.lender_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  loan_types text[],
  min_loan_amount integer,
  max_loan_amount integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lender_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT lender_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- =====================================================
-- TIER 3: Franchise tables (depend on franchisor_profiles)
-- =====================================================

CREATE TABLE public.franchises (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  industry text,
  franchise_score integer,
  score_financial_performance integer,
  score_business_model integer,
  score_support_training integer,
  score_legal_compliance integer,
  score_franchisee_satisfaction integer,
  risk_level text,
  industry_percentile integer,
  analytical_summary text,
  opportunities jsonb DEFAULT '[]'::jsonb,
  concerns jsonb DEFAULT '[]'::jsonb,
  initial_investment_low integer,
  initial_investment_high integer,
  total_investment_min integer,
  total_investment_max integer,
  franchise_fee integer,
  royalty_fee text,
  marketing_fee text,
  investment_breakdown jsonb DEFAULT '{}'::jsonb,
  average_revenue integer,
  revenue_data jsonb DEFAULT '{}'::jsonb,
  franchise_score_breakdown jsonb DEFAULT '{}'::jsonb,
  has_item19 boolean DEFAULT false,
  item19_revenue_low integer,
  item19_revenue_high integer,
  item19_revenue_median integer,
  item19_profit_margin numeric,
  item19_sample_size integer,
  item19_disclosure_quality text,
  total_units integer,
  franchised_units integer,
  company_owned_units integer,
  units_opened_last_year integer,
  units_closed_last_year integer,
  state_distribution jsonb DEFAULT '{}'::jsonb,
  litigation_count integer DEFAULT 0,
  bankruptcy_count integer DEFAULT 0,
  competitive_advantages jsonb DEFAULT '[]'::jsonb,
  training_details text,
  territory_info text,
  roi_timeframe text,
  status text DEFAULT 'active'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  slug text UNIQUE,
  logo_url text,
  franchisor_id uuid,
  cover_image_url text,
  docuseal_item23_template_url text,
  CONSTRAINT franchises_pkey PRIMARY KEY (id),
  CONSTRAINT franchises_franchisor_id_fkey FOREIGN KEY (franchisor_id) REFERENCES public.franchisor_profiles(id) ON DELETE SET NULL
);

CREATE TABLE public.white_label_settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  franchise_id uuid NOT NULL UNIQUE,
  franchisor_id uuid NOT NULL,
  logo_url text,
  primary_color text DEFAULT '#2563eb'::text,
  accent_color text DEFAULT '#10b981'::text,
  header_text text,
  contact_name text,
  contact_email text,
  contact_phone text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT white_label_settings_pkey PRIMARY KEY (id),
  CONSTRAINT white_label_settings_franchise_id_fkey FOREIGN KEY (franchise_id) REFERENCES public.franchises(id) ON DELETE CASCADE,
  CONSTRAINT white_label_settings_franchisor_id_fkey FOREIGN KEY (franchisor_id) REFERENCES public.franchisor_profiles(id) ON DELETE CASCADE
);

-- =====================================================
-- TIER 4: FDD tables (depend on franchises)
-- =====================================================

CREATE TABLE public.fdds (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  franchise_name text NOT NULL,
  pdf_url text,
  pdf_path text,
  is_public boolean DEFAULT true,
  chunks_processed boolean DEFAULT false,
  chunk_count integer DEFAULT 0,
  embeddings_generated_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  franchise_id uuid,
  CONSTRAINT fdds_pkey PRIMARY KEY (id),
  CONSTRAINT fdds_franchise_id_fkey FOREIGN KEY (franchise_id) REFERENCES public.franchises(id) ON DELETE SET NULL
);

CREATE TABLE public.fdd_chunks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  fdd_id uuid NOT NULL,
  chunk_text text NOT NULL,
  chunk_index integer NOT NULL,
  item_number integer CHECK (item_number >= 1 AND item_number <= 23),
  page_number integer NOT NULL,
  start_page integer NOT NULL,
  end_page integer NOT NULL,
  token_count integer,
  embedding vector(1536),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fdd_chunks_pkey PRIMARY KEY (id),
  CONSTRAINT fdd_chunks_fdd_id_fkey FOREIGN KEY (fdd_id) REFERENCES public.fdds(id) ON DELETE CASCADE
);

CREATE TABLE public.fdd_question_answers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  fdd_id uuid NOT NULL,
  question_text text NOT NULL,
  answer_text text NOT NULL,
  source_chunk_ids uuid[] DEFAULT '{}'::uuid[],
  confidence_score double precision CHECK (confidence_score >= 0::double precision AND confidence_score <= 1::double precision),
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  times_viewed integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fdd_question_answers_pkey PRIMARY KEY (id),
  CONSTRAINT fdd_question_answers_fdd_id_fkey FOREIGN KEY (fdd_id) REFERENCES public.fdds(id) ON DELETE CASCADE
);

CREATE TABLE public.fdd_search_queries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  query_text text NOT NULL,
  fdd_id uuid,
  results_returned integer,
  clicked_chunk_id uuid,
  session_id text,
  search_duration_ms integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fdd_search_queries_pkey PRIMARY KEY (id),
  CONSTRAINT fdd_search_queries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT fdd_search_queries_fdd_id_fkey FOREIGN KEY (fdd_id) REFERENCES public.fdds(id) ON DELETE SET NULL,
  CONSTRAINT fdd_search_queries_clicked_chunk_id_fkey FOREIGN KEY (clicked_chunk_id) REFERENCES public.fdd_chunks(id) ON DELETE SET NULL
);

-- =====================================================
-- TIER 5: Lead & Invitation tables
-- =====================================================

CREATE TABLE public.lead_invitations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  franchisor_id uuid NOT NULL,
  franchise_id uuid NOT NULL,
  lead_email text NOT NULL,
  lead_name text,
  lead_phone text,
  invitation_token text NOT NULL UNIQUE,
  invitation_message text,
  status text NOT NULL DEFAULT 'sent'::text CHECK (status = ANY (ARRAY['sent'::text, 'viewed'::text, 'signed_up'::text, 'expired'::text])),
  sent_at timestamp with time zone DEFAULT now(),
  viewed_at timestamp with time zone,
  signed_up_at timestamp with time zone,
  expires_at timestamp with time zone DEFAULT (now() + '30 days'::interval),
  buyer_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  source text,
  timeline text,
  city text,
  state text,
  target_location text,
  brand text,
  CONSTRAINT lead_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT lead_invitations_franchisor_id_fkey FOREIGN KEY (franchisor_id) REFERENCES public.franchisor_profiles(id) ON DELETE CASCADE,
  CONSTRAINT lead_invitations_franchise_id_fkey FOREIGN KEY (franchise_id) REFERENCES public.franchises(id) ON DELETE CASCADE,
  CONSTRAINT lead_invitations_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.buyer_profiles(id) ON DELETE SET NULL
);

CREATE TABLE public.leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  franchisor_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  franchise_id uuid,
  status text DEFAULT 'new'::text CHECK (status = ANY (ARRAY['new'::text, 'contacted'::text, 'qualified'::text, 'proposal'::text, 'closed'::text, 'lost'::text])),
  source text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT leads_pkey PRIMARY KEY (id),
  CONSTRAINT leads_franchisor_id_fkey FOREIGN KEY (franchisor_id) REFERENCES public.franchisor_profiles(id) ON DELETE CASCADE,
  CONSTRAINT leads_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.buyer_profiles(id) ON DELETE CASCADE,
  CONSTRAINT leads_franchise_id_fkey FOREIGN KEY (franchise_id) REFERENCES public.franchises(id) ON DELETE SET NULL
);

CREATE TABLE public.lead_fdd_access (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  buyer_id uuid NOT NULL,
  franchise_id uuid NOT NULL,
  franchisor_id uuid NOT NULL,
  granted_via text NOT NULL CHECK (granted_via = ANY (ARRAY['invitation'::text, 'fddadvisor_signup'::text])),
  invitation_id uuid,
  first_viewed_at timestamp with time zone,
  last_viewed_at timestamp with time zone,
  total_views integer DEFAULT 0,
  total_time_spent_seconds integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  consent_given_at timestamp with time zone,
  receipt_signed_at timestamp with time zone,
  docuseal_submission_id text,
  receipt_pdf_url text,
  CONSTRAINT lead_fdd_access_pkey PRIMARY KEY (id),
  CONSTRAINT lead_fdd_access_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.buyer_profiles(id) ON DELETE CASCADE,
  CONSTRAINT lead_fdd_access_franchise_id_fkey FOREIGN KEY (franchise_id) REFERENCES public.franchises(id) ON DELETE CASCADE,
  CONSTRAINT lead_fdd_access_franchisor_id_fkey FOREIGN KEY (franchisor_id) REFERENCES public.franchisor_profiles(id) ON DELETE CASCADE,
  CONSTRAINT lead_fdd_access_invitation_id_fkey FOREIGN KEY (invitation_id) REFERENCES public.lead_invitations(id) ON DELETE SET NULL
);

-- =====================================================
-- TIER 6: Engagement & Activity tables
-- =====================================================

CREATE TABLE public.fdd_engagements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  fdd_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  buyer_email text NOT NULL,
  buyer_name text,
  event_type text NOT NULL,
  page_number integer,
  section_name text,
  duration_seconds integer,
  metadata jsonb,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  consent_given boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  questions_asked integer DEFAULT 0,
  viewed_items integer[] DEFAULT '{}'::integer[],
  questions_list text[] DEFAULT '{}'::text[],
  franchise_id uuid,
  CONSTRAINT fdd_engagements_pkey PRIMARY KEY (id),
  CONSTRAINT fdd_engagements_fdd_id_fkey FOREIGN KEY (fdd_id) REFERENCES public.fdds(id) ON DELETE CASCADE,
  CONSTRAINT fdd_engagements_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fdd_engagements_franchise_id_fkey FOREIGN KEY (franchise_id) REFERENCES public.franchises(id) ON DELETE SET NULL
);

CREATE TABLE public.engagement_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type = ANY (ARRAY['email'::text, 'call'::text, 'meeting'::text, 'note'::text, 'document_sent'::text])),
  description text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT engagement_events_pkey PRIMARY KEY (id),
  CONSTRAINT engagement_events_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE,
  CONSTRAINT engagement_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TABLE public.questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  question_text text NOT NULL,
  answer_text text,
  asked_by uuid,
  answered_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  answered_at timestamp with time zone,
  CONSTRAINT questions_pkey PRIMARY KEY (id),
  CONSTRAINT questions_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE,
  CONSTRAINT questions_asked_by_fkey FOREIGN KEY (asked_by) REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT questions_answered_by_fkey FOREIGN KEY (answered_by) REFERENCES public.users(id) ON DELETE SET NULL
);

-- =====================================================
-- TIER 7: Consent & Auth-dependent tables
-- =====================================================

CREATE TABLE public.fdd_buyer_consents (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  fdd_id uuid NOT NULL,
  franchise_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  buyer_email text NOT NULL,
  consent_given boolean NOT NULL,
  consent_text text NOT NULL,
  ip_address inet,
  user_agent text,
  consented_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fdd_buyer_consents_pkey PRIMARY KEY (id),
  CONSTRAINT fdd_buyer_consents_fdd_id_fkey FOREIGN KEY (fdd_id) REFERENCES public.fdds(id) ON DELETE CASCADE,
  CONSTRAINT fdd_buyer_consents_franchise_id_fkey FOREIGN KEY (franchise_id) REFERENCES public.franchises(id) ON DELETE CASCADE,
  CONSTRAINT fdd_buyer_consents_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.fdd_buyer_invitations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  fdd_id uuid NOT NULL,
  franchise_id uuid NOT NULL,
  buyer_email text NOT NULL,
  invited_by uuid NOT NULL,
  invitation_token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  accepted_at timestamp with time zone,
  buyer_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fdd_buyer_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT fdd_buyer_invitations_fdd_id_fkey FOREIGN KEY (fdd_id) REFERENCES public.fdds(id) ON DELETE CASCADE,
  CONSTRAINT fdd_buyer_invitations_franchise_id_fkey FOREIGN KEY (franchise_id) REFERENCES public.franchises(id) ON DELETE CASCADE,
  CONSTRAINT fdd_buyer_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fdd_buyer_invitations_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE public.fdd_franchisescore_consents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  fdd_id text NOT NULL,
  consented boolean DEFAULT false,
  consented_at timestamp with time zone,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fdd_franchisescore_consents_pkey PRIMARY KEY (id),
  CONSTRAINT fdd_franchisescore_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fdd_franchisescore_consents_user_fdd_unique UNIQUE (user_id, fdd_id)
);

CREATE TABLE public.franchisor_users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  franchise_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'admin'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT franchisor_users_pkey PRIMARY KEY (id),
  CONSTRAINT franchisor_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT franchisor_users_franchise_id_fkey FOREIGN KEY (franchise_id) REFERENCES public.franchises(id) ON DELETE CASCADE
);

-- =====================================================
-- TIER 8: Remaining tables
-- =====================================================

CREATE TABLE public.closed_deals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  franchise_id uuid,
  buyer_id uuid NOT NULL,
  franchisor_id uuid NOT NULL,
  deal_value integer NOT NULL,
  commission_amount integer,
  closed_date date DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT closed_deals_pkey PRIMARY KEY (id),
  CONSTRAINT closed_deals_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE,
  CONSTRAINT closed_deals_franchise_id_fkey FOREIGN KEY (franchise_id) REFERENCES public.franchises(id) ON DELETE SET NULL,
  CONSTRAINT closed_deals_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.buyer_profiles(id) ON DELETE CASCADE,
  CONSTRAINT closed_deals_franchisor_id_fkey FOREIGN KEY (franchisor_id) REFERENCES public.franchisor_profiles(id) ON DELETE CASCADE
);

CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info'::text CHECK (type = ANY (ARRAY['info'::text, 'success'::text, 'warning'::text, 'error'::text])),
  read boolean DEFAULT false,
  link text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE TABLE public.pre_approvals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  lender_id uuid NOT NULL,
  amount integer NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'denied'::text])),
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pre_approvals_pkey PRIMARY KEY (id),
  CONSTRAINT pre_approvals_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.buyer_profiles(id) ON DELETE CASCADE,
  CONSTRAINT pre_approvals_lender_id_fkey FOREIGN KEY (lender_id) REFERENCES public.lender_profiles(id) ON DELETE CASCADE
);

CREATE TABLE public.saved_franchises (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  franchise_id uuid NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT saved_franchises_pkey PRIMARY KEY (id),
  CONSTRAINT saved_franchises_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.buyer_profiles(id) ON DELETE CASCADE,
  CONSTRAINT saved_franchises_franchise_id_fkey FOREIGN KEY (franchise_id) REFERENCES public.franchises(id) ON DELETE CASCADE
);

CREATE TABLE public.shared_access (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  franchisor_id uuid NOT NULL,
  shared_with_email text NOT NULL,
  shared_by_user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT shared_access_pkey PRIMARY KEY (id),
  CONSTRAINT shared_access_franchisor_id_fkey FOREIGN KEY (franchisor_id) REFERENCES public.franchisor_profiles(id) ON DELETE CASCADE,
  CONSTRAINT shared_access_shared_by_user_id_fkey FOREIGN KEY (shared_by_user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- =====================================================
-- INDEXES (for performance)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_franchises_slug ON public.franchises(slug);
CREATE INDEX IF NOT EXISTS idx_franchises_industry ON public.franchises(industry);
CREATE INDEX IF NOT EXISTS idx_fdds_franchise_id ON public.fdds(franchise_id);
CREATE INDEX IF NOT EXISTS idx_fdd_chunks_fdd_id ON public.fdd_chunks(fdd_id);
CREATE INDEX IF NOT EXISTS idx_fdd_chunks_item_number ON public.fdd_chunks(item_number);
CREATE INDEX IF NOT EXISTS idx_fdd_engagements_buyer_id ON public.fdd_engagements(buyer_id);
CREATE INDEX IF NOT EXISTS idx_fdd_engagements_fdd_id ON public.fdd_engagements(fdd_id);
CREATE INDEX IF NOT EXISTS idx_leads_franchisor_id ON public.leads(franchisor_id);
CREATE INDEX IF NOT EXISTS idx_leads_buyer_id ON public.leads(buyer_id);
CREATE INDEX IF NOT EXISTS idx_lead_invitations_token ON public.lead_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_lead_invitations_franchisor_id ON public.lead_invitations(franchisor_id);
CREATE INDEX IF NOT EXISTS idx_fdd_item_page_mappings_slug ON public.fdd_item_page_mappings(franchise_slug);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_buyer_profiles_user_id ON public.buyer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_franchisor_profiles_user_id ON public.franchisor_profiles(user_id);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Schema migration completed successfully!' as status, 
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as tables_created;
