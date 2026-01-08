# Pipeline Stages Feature Implementation Summary

**Date:** January 2, 2026  
**Status:** Implementation Complete - Pending Testing

---

## Overview

Custom pipeline stages for the FDDHub Franchisor Dashboard. This feature allows franchisors to customize their sales pipeline stages, enabling more granular lead tracking and reporting.

---

## Files Created/Modified

### Database

1. **`scripts/118-pipeline-stages-feature.sql`** - SQL migration script
   - Creates `pipeline_stages` table
   - Creates `lead_stage_history` table for audit trail
   - Adds `stage_id`, `stage_changed_at`, `stage_changed_by` columns to `lead_invitations`
   - RLS policies for franchisor and team member access
   - Default stages auto-creation function for new franchisors
   - Trigger to assign existing leads to default stage

### API Routes

2. **`app/api/pipeline-stages/route.ts`** - GET (list) and POST (create) stages
3. **`app/api/pipeline-stages/[id]/route.ts`** - PATCH (update) and DELETE stages
4. **`app/api/pipeline-stages/reorder/route.ts`** - POST to reorder stages
5. **`app/api/leads/[id]/stage/route.ts`** - PATCH to update a lead's stage

### Components

6. **`components/pipeline-stage-manager.tsx`** - New component for stage management
   - Drag-and-drop reordering with @dnd-kit
   - Add/Edit/Delete stage dialogs
   - Color picker (10 preset colors)
   - Default, Closed Won, Closed Lost indicators

### Modified Files

7. **`components/pipeline-view.tsx`** - Updated to use dynamic stages from API
   - Fetches stages on mount
   - Fallback to hardcoded stages if API fails
   - Supports both old `stage` string and new `stage_id`
   - Added `onLeadStageUpdate` prop for API calls

8. **`components/franchisor-dashboard.tsx`** - Added stage update handler
   - New `onLeadStageUpdate` callback that calls `/api/leads/[id]/stage`
   - Updates local state after successful API call

9. **`app/hub/company-settings/page.tsx`** - Added Pipeline Stages tab
   - Uses Tabs component for Brands/Pipeline Stages
   - Renders PipelineStageManager component

10. **`app/api/hub/leads/route.ts`** - Updated to include stage data
    - Joins with `pipeline_stages` table
    - Returns `stage_id`, `pipeline_stage`, `daysInStage`

11. **`lib/types/database.ts`** - Added new types
    - `PipelineStage`
    - `LeadStageHistory`
    - `LeadInvitationWithStage`
    - `LeadWithStage`

12. **`package.json`** - Added @dnd-kit packages
    - `@dnd-kit/core`
    - `@dnd-kit/sortable`
    - `@dnd-kit/utilities`

---

## Default Pipeline Stages

When a new franchisor is created, these 8 default stages are auto-generated:

| Position | Name | Color | Special |
|----------|------|-------|---------|
| 0 | New Lead | Blue (#3B82F6) | Default |
| 1 | Contacted | Purple (#8B5CF6) | |
| 2 | Qualified | Cyan (#06B6D4) | |
| 3 | Discovery Call | Amber (#F59E0B) | |
| 4 | FDD Review | Pink (#EC4899) | |
| 5 | Negotiation | Green (#10B981) | |
| 6 | Closed Won | Green (#22C55E) | Closed Won |
| 7 | Closed Lost | Red (#EF4444) | Closed Lost |

---

## Color Palette

10 preset colors available for stages:

- Blue (#3B82F6)
- Purple (#8B5CF6)
- Cyan (#06B6D4)
- Amber (#F59E0B)
- Pink (#EC4899)
- Green (#10B981)
- Red (#EF4444)
- Indigo (#6366F1)
- Teal (#14B8A6)
- Gray (#6B7280)

---

## API Endpoints

### Pipeline Stages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pipeline-stages` | List all stages for franchisor |
| POST | `/api/pipeline-stages` | Create a new stage |
| PATCH | `/api/pipeline-stages/[id]` | Update stage details |
| DELETE | `/api/pipeline-stages/[id]` | Delete stage (fails if has leads) |
| POST | `/api/pipeline-stages/reorder` | Reorder stages by position |

### Lead Stage Updates

| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/api/leads/[id]/stage` | Move lead to new stage |

---

## Testing Steps

### 1. Run Database Migration
```sql
-- Run in Supabase SQL Editor
-- Copy contents of scripts/118-pipeline-stages-feature.sql
```

### 2. Install Dependencies
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### 3. Test Stage Management
1. Go to Company Settings → Pipeline Stages tab
2. Verify default stages are created
3. Add a new stage
4. Edit an existing stage
5. Delete a stage (should fail if leads exist)
6. Drag to reorder stages

### 4. Test Pipeline View
1. Go to Leads → Pipeline view
2. Verify stages display from API
3. Drag a lead between stages
4. Verify stage change persists on refresh

### 5. Test Leads API
1. Fetch leads via API
2. Verify `stage_id` and `pipeline_stage` in response
3. Verify `daysInStage` calculated correctly

---

## Constraints & Rules

1. **Unique Stage Names:** Each franchisor can only have one stage with a given name
2. **One Default Stage:** Only one stage can be marked as default per franchisor
3. **One Closed Won:** Only one stage can be marked as Closed Won
4. **One Closed Lost:** Only one stage can be marked as Closed Lost
5. **Exclusive Status:** A stage cannot be both Closed Won and Closed Lost
6. **Delete Protection:** Cannot delete a stage that has leads assigned

---

## Future Enhancements

- [ ] Stage dropdown in table view (currently only Pipeline view supports drag)
- [ ] Stage filtering in leads list
- [ ] Stage-based reporting/analytics
- [ ] Stage change notifications
- [ ] Bulk lead stage updates
- [ ] Stage-specific automation rules
- [ ] Integration with CRM exports

---

## Notes

- Migration script includes backward compatibility for existing leads
- Existing leads will be assigned to the default "New Lead" stage
- Stage history tracking enabled for analytics
- Team members can move leads; only owners can manage stages
