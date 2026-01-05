# FDDHub Database Schema Reference

> **Last Updated:** January 5, 2026  
> **Source:** Supabase production introspection  
> **Version:** 2.1

---

## Tables Overview

| Table | Description |
|-------|-------------|
| `buyer_profiles` | Buyer user profiles with investment preferences and qualifications |
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
| `franchisor_team_members` | Team member roles and permissions for franchisors |
| `franchisor_users` | User-to-franchise role assignments |
| `lead_fdd_access` | Buyer FDD access permissions and tracking |
| `lead_invitations` | Franchisor-sent lead invitations with pipeline tracking |
| `lead_stage_history` | Audit trail for lead stage changes |
| `leads` | Lead/prospect records |
| `lender_profiles` | Lender partner profiles |
| `notifications` | User notifications |
| `pipeline_stages` | Custom pipeline stages per franchisor |
| `pre_approvals` | Financing pre-approval records |
| `questions` | Lead questions and answers |
| `saved_franchises` | Buyer saved/favorited franchises |
| `shared_access` | Shared FDD access tokens |
| `user_notes` | User notes on FDDs |
| `user_roles` | User role assignments (buyer, franchisor, admin, lender) |
| `white_label_settings` | Custom branding configurations per franchise |

---

## Detailed Column Definitions

### buyer_profiles
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `user_id` | uuid | NO | - | Links to auth.users |
| `first_name` | text | NO | - | |
| `last_name` | text | NO | - | |
| `email` | text | NO | - | |
| `phone` | text | YES | - | |
| `full_name` | text | YES | - | Computed or entered full name |
| `investment_range_min` | integer | YES | - | Minimum investment budget |
| `investment_range_max` | integer | YES | - | Maximum investment budget |
| `preferred_industries` | text[] | YES | - | Legacy field |
| `location_preferences` | text[] | YES | - | Legacy field |
| `industries_interested` | text[] | YES | - | Industries of interest |
| `buying_timeline` | text | YES | - | e.g., "0-3 months", "3-6 months" |
| `current_occupation` | text | YES | - | |
| `business_experience_years` | integer | YES | - | Years of business experience |
| `has_franchise_experience` | boolean | YES | false | Prior franchise ownership |
| `preferred_location` | text | YES | - | Target market location |
| `city_location` | text | YES | - | Current city |
| `state_location` | text | YES | - | Current state |
| `signup_source` | text | YES | 'fddadvisor' | 'fddadvisor' or 'fddhub' |
| `fico_score_range` | text | YES | - | Credit score range |
| `liquid_assets_range` | text | YES | - | Available liquid capital |
| `net_worth_range` | text | YES | - | Total net worth range |
| `funding_plan` | text | YES | - | How they plan to fund |
| `linkedin_url` | text | YES | - | LinkedIn profile URL |
| `no_felony_attestation` | boolean | YES | false | Legal attestation |
| `no_bankruptcy_attestation` | boolean | YES | false | Financial attestation |
| `profile_completed_at` | timestamptz | YES | - | When profile was completed |
| `franchisescore_consent_accepted` | boolean | YES | false | Global FranchiseScore consent |
| `franchisescore_consent_accepted_at` | timestamptz | YES | - | |
| `tos_privacy_accepted` | boolean | YES | false | Terms of Service acceptance |
| `tos_privacy_accepted_at` | timestamptz | YES | - | |
| `leadership_experience` | text | YES | - | Leadership background |
| `management_style` | text | YES | - | Preferred management approach |
| `team_building_interest` | text | YES | - | Interest in building teams |
| `operational_involvement` | text | YES | - | Desired level of involvement |
| `skills` | text[] | YES | - | Professional skills |
| `industry_expertise` | text[] | YES | - | Industries with expertise |
| `veteran_status` | text | YES | - | Military veteran status |
| `years_experience_range` | text | YES | - | Experience range category |
| `created_at` | timestamptz | YES | now() | |
| `updated_at` | timestamptz | YES | now() | |

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
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | |
| `fdd_id` | uuid | NO | - | Links to fdds table |
| `chunk_text` | text | NO | - | Text content of chunk |
| `chunk_index` | integer | NO | - | Sequential index within FDD |
| `item_number` | integer | YES | - | FDD Item number (1-23) |
| `page_number` | integer | NO | - | Primary page reference |
| `start_page` | integer | NO | - | Chunk start page |
| `end_page` | integer | NO | - | Chunk end page |
| `token_count` | integer | YES | - | Approximate token count |
| `embedding` | vector(768) | YES | - | Gemini text-embedding-004 |
| `metadata` | jsonb | YES | '{}' | Additional metadata |
| `created_at` | timestamptz | YES | now() | |
| `updated_at` | timestamptz | YES | now() | |

### fdd_engagements
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | uuid_generate_v4() | |
| `fdd_id` | uuid | NO | - | |
| `franchise_id` | uuid | YES | - | |
| `buyer_id` | uuid | NO | - | |
| `buyer_email` | text | NO | - | |
| `buyer_name` | text | YES | - | |
| `event_type` | text | NO | - | 'view', 'question', 'download', etc. |
| `page_number` | integer | YES | - | |
| `section_name` | text | YES | - | |
| `duration_seconds` | integer | YES | - | Time spent |
| `metadata` | jsonb | YES | - | Additional event data |
| `timestamp` | timestamptz | NO | now() | |
| `consent_given` | boolean | NO | true | |
| `questions_asked` | integer | YES | 0 | Count of questions |
| `viewed_items` | integer[] | YES | '{}' | Items viewed array |
| `questions_list` | text[] | YES | '{}' | List of questions asked |
| `created_at` | timestamptz | YES | now() | |

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
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | |
| `franchise_slug` | text | NO | - | Links to franchise by slug |
| `mapping_type` | text | NO | - | 'item' or 'exhibit' |
| `item_number` | integer | YES | - | Item number (1-23) |
| `label` | text | NO | - | Display label |
| `page_number` | integer | NO | - | Starting page |
| `created_at` | timestamptz | YES | now() | |
| `updated_at` | timestamptz | YES | now() | |

### fdds
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | |
| `franchise_id` | uuid | YES | - | Links to franchises |
| `franchise_name` | text | NO | - | Denormalized name |
| `pdf_url` | text | YES | - | Supabase storage URL |
| `pdf_path` | text | YES | - | Storage path |
| `is_public` | boolean | YES | true | Public visibility |
| `chunks_processed` | boolean | YES | false | Embeddings generated |
| `chunk_count` | integer | YES | 0 | Number of chunks |
| `embeddings_generated_at` | timestamptz | YES | - | |
| `created_at` | timestamptz | YES | now() | |
| `updated_at` | timestamptz | YES | now() | |

### franchises
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | |
| `name` | text | NO | - | Franchise brand name |
| `slug` | text | YES | - | URL-friendly identifier |
| `description` | text | YES | - | AI-generated description |
| `industry` | text | YES | - | Industry category |
| `logo_url` | text | YES | - | Logo image URL |
| `cover_image_url` | text | YES | - | Cover/hero image URL |
| `franchisor_id` | uuid | YES | - | Owning franchisor |
| `status` | text | YES | 'active' | 'active', 'inactive' |
| `franchise_score` | integer | YES | - | Total FranchiseScore (0-600) |
| `score_financial_performance` | integer | YES | - | Legacy field |
| `score_business_model` | integer | YES | - | Legacy field |
| `score_support_training` | integer | YES | - | Legacy field |
| `score_legal_compliance` | integer | YES | - | Legacy field |
| `score_franchisee_satisfaction` | integer | YES | - | Legacy field |
| `franchise_score_breakdown` | jsonb | YES | '{}' | Full FranchiseScore 2.1 breakdown |
| `risk_level` | text | YES | - | Risk assessment |
| `industry_percentile` | integer | YES | - | Ranking within industry |
| `analytical_summary` | text | YES | - | AI-generated summary |
| `opportunities` | jsonb | YES | '[]' | Array of 3 opportunities |
| `concerns` | jsonb | YES | '[]' | Array of 3 concerns |
| `initial_investment_low` | integer | YES | - | Item 7 low estimate |
| `initial_investment_high` | integer | YES | - | Item 7 high estimate |
| `total_investment_min` | integer | YES | - | |
| `total_investment_max` | integer | YES | - | |
| `franchise_fee` | integer | YES | - | Initial franchise fee |
| `royalty_fee` | text | YES | - | e.g., "6%" |
| `marketing_fee` | text | YES | - | e.g., "2%" |
| `investment_breakdown` | jsonb | YES | '{}' | Detailed Item 7 breakdown |
| `has_item19` | boolean | YES | false | Item 19 disclosed |
| `item19_revenue_low` | integer | YES | - | |
| `item19_revenue_high` | integer | YES | - | |
| `item19_revenue_median` | integer | YES | - | |
| `item19_profit_margin` | numeric(5,2) | YES | - | |
| `item19_sample_size` | integer | YES | - | |
| `item19_disclosure_quality` | text | YES | - | |
| `average_revenue` | integer | YES | - | |
| `revenue_data` | jsonb | YES | '{}' | |
| `total_units` | integer | YES | - | From Item 20 |
| `franchised_units` | integer | YES | - | |
| `company_owned_units` | integer | YES | - | |
| `units_opened_last_year` | integer | YES | - | |
| `units_closed_last_year` | integer | YES | - | |
| `state_distribution` | jsonb | YES | '{}' | |
| `litigation_count` | integer | YES | 0 | From Item 3 |
| `bankruptcy_count` | integer | YES | 0 | From Item 4 |
| `competitive_advantages` | jsonb | YES | '[]' | |
| `training_details` | text | YES | - | From Item 11 |
| `territory_info` | text | YES | - | From Item 12 |
| `roi_timeframe` | text | YES | - | |
| `docuseal_item23_template_url` | text | YES | - | DocuSeal template for receipts |
| `created_at` | timestamptz | YES | now() | |
| `updated_at` | timestamptz | YES | now() | |

### franchisor_profiles
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO | - |
| `company_name` | text | NO | - |
| `contact_email` | text | NO | - |
| `contact_phone` | text | YES | - |
| `website` | text | YES | - |
| `logo_url` | text | YES | - |
| `description` | text | YES | - |
| `title` | text | YES | - |
| `ideal_candidate_profile` | jsonb | YES | - |
| `created_at` | timestamptz | YES | now() |
| `updated_at` | timestamptz | YES | now() |

### franchisor_team_members
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | |
| `franchisor_id` | uuid | NO | - | Links to franchisor_profiles |
| `user_id` | uuid | YES | - | Links to auth.users (after accept) |
| `email` | text | NO | - | Invitation email |
| `first_name` | text | YES | - | |
| `last_name` | text | YES | - | |
| `role` | text | NO | 'recruiter' | 'admin', 'recruiter', 'viewer' |
| `status` | text | NO | 'invited' | 'invited', 'active', 'deactivated' |
| `invitation_token` | text | YES | - | For invitation acceptance |
| `invited_at` | timestamptz | YES | now() | |
| `accepted_at` | timestamptz | YES | - | |
| `deactivated_at` | timestamptz | YES | - | |
| `notification_preferences` | jsonb | YES | '{}' | |
| `created_at` | timestamptz | YES | now() | |
| `updated_at` | timestamptz | YES | now() | |

### lead_fdd_access
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | uuid_generate_v4() | |
| `buyer_id` | uuid | NO | - | Links to buyer_profiles |
| `franchise_id` | uuid | NO | - | |
| `franchisor_id` | uuid | NO | - | |
| `granted_via` | text | NO | - | 'invitation' or 'fddadvisor_signup' |
| `invitation_id` | uuid | YES | - | Links to lead_invitations |
| `first_viewed_at` | timestamptz | YES | - | |
| `last_viewed_at` | timestamptz | YES | - | |
| `total_views` | integer | YES | 0 | |
| `total_time_spent_seconds` | integer | YES | 0 | |
| `consent_given_at` | timestamptz | YES | - | FDD consent timestamp |
| `receipt_signed_at` | timestamptz | YES | - | Item 23 receipt signed |
| `docuseal_submission_id` | text | YES | - | DocuSeal submission ID |
| `receipt_pdf_url` | text | YES | - | Signed receipt PDF |
| `created_at` | timestamptz | YES | now() | |
| `updated_at` | timestamptz | YES | now() | |

### lead_invitations
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | uuid_generate_v4() | |
| `franchisor_id` | uuid | NO | - | |
| `franchise_id` | uuid | NO | - | |
| `lead_email` | text | NO | - | |
| `lead_name` | text | YES | - | |
| `lead_phone` | text | YES | - | |
| `invitation_token` | text | NO | - | Unique magic link token |
| `invitation_message` | text | YES | - | Custom message |
| `status` | text | NO | 'sent' | 'sent', 'viewed', 'signed_up', 'expired' |
| `sent_at` | timestamptz | YES | now() | |
| `viewed_at` | timestamptz | YES | - | |
| `signed_up_at` | timestamptz | YES | - | |
| `expires_at` | timestamptz | YES | now() + 30 days | |
| `buyer_id` | uuid | YES | - | Linked after signup |
| `source` | text | YES | - | Lead source |
| `timeline` | text | YES | - | Buying timeline |
| `city` | text | YES | - | |
| `state` | text | YES | - | |
| `target_location` | text | YES | - | Target market |
| `brand` | text | YES | - | Brand name |
| `stage_id` | uuid | YES | - | Current pipeline stage |
| `stage_changed_at` | timestamptz | YES | - | Last stage change |
| `stage_changed_by` | uuid | YES | - | Who changed the stage |
| `assigned_to` | uuid | YES | - | Assigned team member |
| `created_by` | uuid | YES | - | Team member who created |
| `lead_value` | integer | YES | - | Estimated deal value |
| `created_at` | timestamptz | YES | now() | |
| `updated_at` | timestamptz | YES | now() | |

### lead_stage_history
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | |
| `lead_invitation_id` | uuid | NO | - | |
| `from_stage_id` | uuid | YES | - | Previous stage (null if first) |
| `to_stage_id` | uuid | NO | - | New stage |
| `changed_by` | uuid | YES | - | User who made change |
| `changed_at` | timestamptz | NO | now() | |
| `notes` | text | YES | - | Optional change notes |

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

### pipeline_stages
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | |
| `franchisor_id` | uuid | NO | - | |
| `name` | text | NO | - | Stage display name |
| `color` | text | NO | '#3B82F6' | Hex color code |
| `position` | integer | NO | 0 | Sort order |
| `is_default` | boolean | NO | false | Auto-assign new leads |
| `is_closed_won` | boolean | NO | false | Marks successful close |
| `is_closed_lost` | boolean | NO | false | Marks lost deal |
| `created_at` | timestamptz | YES | now() | |
| `updated_at` | timestamptz | YES | now() | |

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

### white_label_settings
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | |
| `franchise_id` | uuid | NO | - | |
| `logo_url` | text | YES | - | Custom logo |
| `primary_color` | text | YES | '#3B82F6' | Brand primary color |
| `accent_color` | text | YES | '#1E40AF' | Brand accent color |
| `header_text` | text | YES | - | Custom header message |
| `contact_email` | text | YES | - | Override contact email |
| `contact_phone` | text | YES | - | Override contact phone |
| `created_at` | timestamptz | YES | now() | |
| `updated_at` | timestamptz | YES | now() | |

---

## Enums

### user_role
```sql
'buyer' | 'franchisor' | 'admin' | 'lender'
```

### team_member_role (application-level)
```
'admin' | 'recruiter' | 'viewer'
```

### invitation_status
```
'sent' | 'viewed' | 'signed_up' | 'expired'
```

---

## Key Relationships

| Parent Table | Child Table | Foreign Key | Description |
|--------------|-------------|-------------|-------------|
| `franchises` | `fdds` | `franchise_id` | FDD belongs to franchise |
| `franchises` | `leads` | `franchise_id` | Lead interested in franchise |
| `franchises` | `lead_invitations` | `franchise_id` | Invitation for franchise FDD |
| `franchises` | `lead_fdd_access` | `franchise_id` | Access granted to franchise |
| `franchises` | `saved_franchises` | `franchise_id` | Buyer saved franchise |
| `franchises` | `franchisor_users` | `franchise_id` | User manages franchise |
| `franchises` | `white_label_settings` | `franchise_id` | Branding for franchise |
| `fdds` | `fdd_chunks` | `fdd_id` | Embeddings for FDD |
| `fdds` | `fdd_engagements` | `fdd_id` | Engagement on FDD |
| `fdds` | `fdd_buyer_consents` | `fdd_id` | Consent for FDD |
| `fdds` | `user_notes` | `fdd_id` | Notes on FDD |
| `buyer_profiles` | `leads` | `buyer_id` | Lead from buyer |
| `buyer_profiles` | `lead_fdd_access` | `buyer_id` | Buyer's FDD access |
| `buyer_profiles` | `saved_franchises` | `buyer_id` | Buyer's saved list |
| `buyer_profiles` | `fdd_engagements` | `buyer_id` | Buyer's engagement |
| `franchisor_profiles` | `leads` | `franchisor_id` | Franchisor's leads |
| `franchisor_profiles` | `lead_invitations` | `franchisor_id` | Franchisor's invitations |
| `franchisor_profiles` | `franchisor_team_members` | `franchisor_id` | Team members |
| `franchisor_profiles` | `pipeline_stages` | `franchisor_id` | Custom stages |
| `pipeline_stages` | `lead_invitations` | `stage_id` | Lead's current stage |
| `pipeline_stages` | `lead_stage_history` | `to_stage_id` | Stage change history |
| `franchisor_team_members` | `lead_invitations` | `assigned_to` | Lead assignment |
| `lead_invitations` | `lead_fdd_access` | `invitation_id` | Access from invitation |
| `lead_invitations` | `lead_stage_history` | `lead_invitation_id` | Stage history |
| `leads` | `engagement_events` | `lead_id` | Legacy events |
| `leads` | `questions` | `lead_id` | Lead questions |
| `leads` | `closed_deals` | `lead_id` | Closed deal |

---

## Important Indexes

### Vector Search
- `fdd_chunks`: `idx_fdd_chunks_embedding` (ivfflat for cosine similarity)

### Performance Indexes
- `fdd_chunks`: `idx_fdd_chunks_fdd_id`
- `fdd_engagements`: `idx_fdd_engagements_fdd_id`, `idx_fdd_engagements_buyer_id`
- `fdd_item_page_mappings`: `idx_fdd_item_page_mappings_franchise_slug`
- `franchises`: `idx_franchises_slug` (unique)
- `leads`: `idx_leads_franchisor_id`, `idx_leads_buyer_id`
- `lead_invitations`: `idx_lead_invitations_franchisor_id`, `idx_lead_invitations_token`
- `pipeline_stages`: `idx_pipeline_stages_franchisor_id`
- `franchisor_team_members`: `idx_team_members_franchisor_id`

---

## Row Level Security (RLS) Policies

### Key Policies

**buyer_profiles**
- Buyers can read/update their own profile
- Franchisors can read profiles of their leads

**lead_invitations**
- Franchisors can CRUD their own invitations
- Admin team members have same access as franchisor owner
- Recruiters can only see leads assigned to them

**lead_fdd_access**
- Buyers can read their own access records
- Franchisors can read access for their franchises

**fdd_engagements**
- Buyers can insert their own engagement events
- Franchisors can read engagements for their franchises

**franchisor_team_members**
- Owners have full CRUD access
- Admin team members have same access as owners
- Recruiters can only read their own record

**pipeline_stages**
- Only franchisor owners can manage stages
- Team members can read stages

---

## Functions

### Semantic Search
```sql
match_fdd_chunks(
  query_embedding vector(768),
  match_fdd_id uuid,
  match_threshold float,
  match_count int
) RETURNS TABLE (...)
```

### Default Stage Creation
```sql
create_default_pipeline_stages(franchisor_uuid uuid)
RETURNS void
```
Creates 8 default pipeline stages for new franchisors.

---

## Migration History

| Version | Date | Description |
|---------|------|-------------|
| 001-050 | Oct 2025 | Initial schema, buyer/franchisor setup |
| 051-100 | Nov 2025 | FDD processing, embeddings, engagements |
| 101-111 | Dec 2025 | Lead intelligence, consent tracking |
| 112-117 | Dec 2025 | Team member management |
| 118-119 | Jan 2026 | Pipeline stages feature |

---

*Schema documentation generated: January 5, 2026*
