# FDDHub Database Schema Reference

> **Last Updated:** December 5, 2024  
> **Source:** Supabase introspection query

## Tables Overview

| Table | Description |
|-------|-------------|
| `buyer_profiles` | Buyer user profiles with investment preferences |
| `closed_deals` | Completed franchise deals |
| `engagement_events` | Lead engagement tracking events |
| `fdd_buyer_consents` | FDD viewing consent records |
| `fdd_buyer_invitations` | Invitations sent to buyers for FDD access |
| `fdd_chunks` | Chunked FDD text with vector embeddings for AI search |
| `fdd_embedding_stats` | Statistics view for embedding processing |
| `fdd_engagements` | Buyer engagement analytics for FDD viewing |
| `fdd_franchisescore_consents` | Per-FDD FranchiseScore disclaimer consents |
| `fdd_item_page_mappings` | PDF page mappings for Items and Exhibits |
| `fdd_question_answers` | Cached Q&A pairs from AI interactions |
| `fdd_search_queries` | Search query analytics |
| `fdds` | FDD documents with processing status |
| `franchises` | Franchise brands with FranchiseScore data |
| `franchisor_profiles` | Franchisor company profiles |
| `franchisor_users` | User-to-franchise role assignments |
| `lead_fdd_access` | Buyer FDD access permissions and tracking |
| `lead_invitations` | Franchisor-sent lead invitations |
| `leads` | Lead/prospect records |
| `lender_profiles` | Lender partner profiles |
| `notifications` | User notifications |
| `pre_approvals` | Financing pre-approval records |
| `questions` | Lead questions and answers |
| `saved_franchises` | Buyer saved/favorited franchises |
| `shared_access` | Shared FDD access tokens |
| `user_notes` | User notes on FDDs |
| `user_roles` | User role assignments (buyer, franchisor, admin, lender) |

---

## Detailed Column Definitions

### buyer_profiles
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO | - |
| `first_name` | text | NO | - |
| `last_name` | text | NO | - |
| `email` | text | NO | - |
| `phone` | text | YES | - |
| `investment_range_min` | integer | YES | - |
| `investment_range_max` | integer | YES | - |
| `preferred_industries` | text[] | YES | - |
| `location_preferences` | text[] | YES | - |
| `industries_interested` | text[] | YES | - |
| `buying_timeline` | text | YES | - |
| `current_occupation` | text | YES | - |
| `business_experience_years` | integer | YES | - |
| `has_franchise_experience` | boolean | YES | false |
| `preferred_location` | text | YES | - |
| `signup_source` | text | YES | 'fddadvisor' |
| `city_location` | text | YES | - |
| `state_location` | text | YES | - |
| `full_name` | text | YES | - |
| `fico_score_range` | text | YES | - |
| `liquid_assets_range` | text | YES | - |
| `net_worth_range` | text | YES | - |
| `funding_plan` | text | YES | - |
| `linkedin_url` | text | YES | - |
| `no_felony_attestation` | boolean | YES | false |
| `no_bankruptcy_attestation` | boolean | YES | false |
| `profile_completed_at` | timestamptz | YES | - |
| `franchisescore_consent_accepted` | boolean | YES | false |
| `franchisescore_consent_accepted_at` | timestamptz | YES | - |
| `tos_privacy_accepted` | boolean | YES | false |
| `tos_privacy_accepted_at` | timestamptz | YES | - |
| `created_at` | timestamptz | YES | now() |
| `updated_at` | timestamptz | YES | now() |

### closed_deals
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `lead_id` | uuid | NO | - |
| `franchise_id` | uuid | YES | - |
| `buyer_id` | uuid | NO | - |
| `franchisor_id` | uuid | NO | - |
| `deal_value` | integer | NO | - |
| `commission_amount` | integer | YES | - |
| `closed_date` | date | YES | CURRENT_DATE |
| `notes` | text | YES | - |
| `created_at` | timestamptz | YES | now() |

### fdd_chunks
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `fdd_id` | uuid | NO | - |
| `chunk_text` | text | NO | - |
| `chunk_index` | integer | NO | - |
| `item_number` | integer | YES | - |
| `page_number` | integer | NO | - |
| `start_page` | integer | NO | - |
| `end_page` | integer | NO | - |
| `token_count` | integer | YES | - |
| `embedding` | vector | YES | - |
| `metadata` | jsonb | YES | '{}' |
| `created_at` | timestamptz | YES | now() |
| `updated_at` | timestamptz | YES | now() |

### fdd_engagements
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | uuid_generate_v4() |
| `fdd_id` | uuid | NO | - |
| `franchise_id` | uuid | YES | - |
| `buyer_id` | uuid | NO | - |
| `buyer_email` | text | NO | - |
| `buyer_name` | text | YES | - |
| `event_type` | text | NO | - |
| `page_number` | integer | YES | - |
| `section_name` | text | YES | - |
| `duration_seconds` | integer | YES | - |
| `metadata` | jsonb | YES | - |
| `timestamp` | timestamptz | NO | now() |
| `consent_given` | boolean | NO | true |
| `questions_asked` | integer | YES | 0 |
| `viewed_items` | integer[] | YES | '{}' |
| `questions_list` | text[] | YES | '{}' |
| `created_at` | timestamptz | YES | now() |

### fdd_franchisescore_consents
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO | - |
| `fdd_id` | text | NO | - |
| `consented` | boolean | YES | false |
| `consented_at` | timestamptz | YES | - |
| `ip_address` | text | YES | - |
| `user_agent` | text | YES | - |
| `created_at` | timestamptz | YES | now() |
| `updated_at` | timestamptz | YES | now() |

### fdd_item_page_mappings
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `franchise_slug` | text | NO | - |
| `mapping_type` | text | NO | - |
| `item_number` | integer | YES | - |
| `label` | text | NO | - |
| `page_number` | integer | NO | - |
| `created_at` | timestamptz | YES | now() |
| `updated_at` | timestamptz | YES | now() |

### fdds
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `franchise_id` | uuid | YES | - |
| `franchise_name` | text | NO | - |
| `pdf_url` | text | YES | - |
| `pdf_path` | text | YES | - |
| `is_public` | boolean | YES | true |
| `chunks_processed` | boolean | YES | false |
| `chunk_count` | integer | YES | 0 |
| `embeddings_generated_at` | timestamptz | YES | - |
| `created_at` | timestamptz | YES | now() |
| `updated_at` | timestamptz | YES | now() |

### franchises
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `name` | text | NO | - |
| `slug` | text | YES | - |
| `description` | text | YES | - |
| `industry` | text | YES | - |
| `logo_url` | text | YES | - |
| `cover_image_url` | text | YES | - |
| `franchisor_id` | uuid | YES | - |
| `status` | text | YES | 'active' |
| `franchise_score` | integer | YES | - |
| `score_financial_performance` | integer | YES | - |
| `score_business_model` | integer | YES | - |
| `score_support_training` | integer | YES | - |
| `score_legal_compliance` | integer | YES | - |
| `score_franchisee_satisfaction` | integer | YES | - |
| `franchise_score_breakdown` | jsonb | YES | '{}' |
| `risk_level` | text | YES | - |
| `industry_percentile` | integer | YES | - |
| `analytical_summary` | text | YES | - |
| `opportunities` | jsonb | YES | '[]' |
| `concerns` | jsonb | YES | '[]' |
| `initial_investment_low` | integer | YES | - |
| `initial_investment_high` | integer | YES | - |
| `total_investment_min` | integer | YES | - |
| `total_investment_max` | integer | YES | - |
| `franchise_fee` | integer | YES | - |
| `royalty_fee` | text | YES | - |
| `marketing_fee` | text | YES | - |
| `investment_breakdown` | jsonb | YES | '{}' |
| `has_item19` | boolean | YES | false |
| `item19_revenue_low` | integer | YES | - |
| `item19_revenue_high` | integer | YES | - |
| `item19_revenue_median` | integer | YES | - |
| `item19_profit_margin` | numeric(5) | YES | - |
| `item19_sample_size` | integer | YES | - |
| `item19_disclosure_quality` | text | YES | - |
| `average_revenue` | integer | YES | - |
| `revenue_data` | jsonb | YES | '{}' |
| `total_units` | integer | YES | - |
| `franchised_units` | integer | YES | - |
| `company_owned_units` | integer | YES | - |
| `units_opened_last_year` | integer | YES | - |
| `units_closed_last_year` | integer | YES | - |
| `state_distribution` | jsonb | YES | '{}' |
| `litigation_count` | integer | YES | 0 |
| `bankruptcy_count` | integer | YES | 0 |
| `competitive_advantages` | jsonb | YES | '[]' |
| `training_details` | text | YES | - |
| `territory_info` | text | YES | - |
| `roi_timeframe` | text | YES | - |
| `docuseal_item23_template_url` | text | YES | - |
| `created_at` | timestamptz | YES | now() |
| `updated_at` | timestamptz | YES | now() |

### lead_fdd_access
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | uuid_generate_v4() |
| `buyer_id` | uuid | NO | - |
| `franchise_id` | uuid | NO | - |
| `franchisor_id` | uuid | NO | - |
| `granted_via` | text | NO | - |
| `invitation_id` | uuid | YES | - |
| `first_viewed_at` | timestamptz | YES | - |
| `last_viewed_at` | timestamptz | YES | - |
| `total_views` | integer | YES | 0 |
| `total_time_spent_seconds` | integer | YES | 0 |
| `consent_given_at` | timestamptz | YES | - |
| `receipt_signed_at` | timestamptz | YES | - |
| `docuseal_submission_id` | text | YES | - |
| `receipt_pdf_url` | text | YES | - |
| `created_at` | timestamptz | YES | now() |
| `updated_at` | timestamptz | YES | now() |

### lead_invitations
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | uuid_generate_v4() |
| `franchisor_id` | uuid | NO | - |
| `franchise_id` | uuid | NO | - |
| `lead_email` | text | NO | - |
| `lead_name` | text | YES | - |
| `lead_phone` | text | YES | - |
| `invitation_token` | text | NO | - |
| `invitation_message` | text | YES | - |
| `status` | text | NO | 'sent' |
| `sent_at` | timestamptz | YES | now() |
| `viewed_at` | timestamptz | YES | - |
| `signed_up_at` | timestamptz | YES | - |
| `expires_at` | timestamptz | YES | now() + 30 days |
| `buyer_id` | uuid | YES | - |
| `source` | text | YES | - |
| `timeline` | text | YES | - |
| `city` | text | YES | - |
| `state` | text | YES | - |
| `target_location` | text | YES | - |
| `brand` | text | YES | - |
| `created_at` | timestamptz | YES | now() |
| `updated_at` | timestamptz | YES | now() |

### leads
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `franchisor_id` | uuid | NO | - |
| `buyer_id` | uuid | NO | - |
| `franchise_id` | uuid | YES | - |
| `status` | text | YES | 'new' |
| `source` | text | YES | - |
| `notes` | text | YES | - |
| `created_at` | timestamptz | YES | now() |
| `updated_at` | timestamptz | YES | now() |

### user_notes
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO | - |
| `fdd_id` | uuid | NO | - |
| `page_number` | integer | YES | - |
| `note_text` | text | NO | - |
| `highlight_text` | text | YES | - |
| `created_at` | timestamptz | YES | now() |
| `updated_at` | timestamptz | YES | now() |

### user_roles
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO | - |
| `role` | user_role | NO | - |
| `created_at` | timestamptz | YES | now() |

---

## Enums

### user_role
\`\`\`sql
'buyer' | 'franchisor' | 'admin' | 'lender'
\`\`\`

---

## Key Relationships

| Parent Table | Child Table | Foreign Key |
|--------------|-------------|-------------|
| `franchises` | `fdds` | `franchise_id` |
| `franchises` | `leads` | `franchise_id` |
| `franchises` | `lead_invitations` | `franchise_id` |
| `franchises` | `lead_fdd_access` | `franchise_id` |
| `franchises` | `saved_franchises` | `franchise_id` |
| `franchises` | `franchisor_users` | `franchise_id` |
| `fdds` | `fdd_chunks` | `fdd_id` |
| `fdds` | `fdd_engagements` | `fdd_id` |
| `fdds` | `fdd_buyer_consents` | `fdd_id` |
| `fdds` | `user_notes` | `fdd_id` |
| `buyer_profiles` | `leads` | `buyer_id` |
| `buyer_profiles` | `lead_fdd_access` | `buyer_id` |
| `buyer_profiles` | `saved_franchises` | `buyer_id` |
| `franchisor_profiles` | `leads` | `franchisor_id` |
| `leads` | `engagement_events` | `lead_id` |
| `leads` | `questions` | `lead_id` |
| `leads` | `closed_deals` | `lead_id` |

---

## Important Indexes

- `fdd_chunks`: `idx_fdd_chunks_fdd_id`, `idx_fdd_chunks_embedding` (ivfflat for vector search)
- `fdd_engagements`: `idx_fdd_engagements_fdd_id`, `idx_fdd_engagements_buyer_id`
- `fdd_item_page_mappings`: `idx_fdd_item_page_mappings_franchise_slug`
- `franchises`: `idx_franchises_slug`
- `leads`: `idx_leads_franchisor_id`, `idx_leads_buyer_id`
