# FDD Advisor: Supabase Data Flow Guide

This document outlines the critical learnings from building the FDD Advisor platform's data pipeline from Supabase to UI components. It documents common issues and their solutions to help future developers avoid the same pitfalls.

---

## Table of Contents

1. [Database Schema Conventions](#database-schema-conventions)
2. [Data Fetching from Supabase](#data-fetching-from-supabase)
3. [Data Transformation Layer](#data-transformation-layer)
4. [Component Data Expectations](#component-data-expectations)
5. [Common Issues & Solutions](#common-issues--solutions)
6. [Best Practices](#best-practices)

---

## Database Schema Conventions

### Snake_case vs camelCase

**Issue**: Supabase/PostgreSQL uses `snake_case` for column names, but React components expect `camelCase`.

**Database Fields**:
\`\`\`sql
franchise_score
franchise_score_breakdown
analytical_summary
investment_breakdown
revenue_data
franchised_units
company_owned_units
\`\`\`

**Component Expectations**:
\`\`\`typescript
franchiseScore
franchiseScoreBreakdown
analyticalSummary
investmentBreakdown
revenueData
franchisedUnits
companyOwnedUnits
\`\`\`

**Solution**: Transform field names in the data fetching layer (see [Data Transformation Layer](#data-transformation-layer)).

---

## Data Fetching from Supabase

### 1. Always Select All Required Fields

**Issue**: API routes must explicitly select every field needed by components. Missing fields will be `undefined` in the frontend.

**Bad Example**:
\`\`\`typescript
// Missing analytical_summary!
.select(`
  id,
  name,
  franchise_score,
  opportunities
`)
\`\`\`

**Good Example**:
\`\`\`typescript
.select(`
  id,
  name,
  franchise_score,
  franchise_score_breakdown,
  analytical_summary,
  opportunities,
  concerns,
  investment_breakdown,
  revenue_data
`)
\`\`\`

### 2. Consistent API Response Format

**Issue**: Components expect consistent response formats. Mixing arrays and objects causes `.map()` and `.find()` errors.

**Solution**: Always return a consistent format:
\`\`\`typescript
// API Route
return NextResponse.json({
  franchises: franchises || [],
  error: error?.message || null
})

// Component
const response = await fetch('/api/franchises/public')
const data = await response.json()
const franchises = data.franchises || []
\`\`\`

### 3. Handle JSONB Fields Properly

**Issue**: JSONB fields from Supabase are already parsed as objects, not strings.

**Database Storage**:
\`\`\`json
{
  "system_stability": {
    "metrics": [...],
    "total_score": 165,
    "max_score": 200
  }
}
\`\`\`

**Fetching**:
\`\`\`typescript
// ✅ Already an object, no need to JSON.parse()
const breakdown = foundFranchise.franchise_score_breakdown

// ❌ Don't do this
const breakdown = JSON.parse(foundFranchise.franchise_score_breakdown)
\`\`\`

---

## Data Transformation Layer

### Location: `app/fdd/[id]/page.tsx`

All data transformation should happen in the page component before passing to UI components.

### 1. Transform Snake_case to CamelCase

\`\`\`typescript
const mappedFranchise = {
  id: foundFranchise.id,
  name: foundFranchise.name,
  
  // Transform snake_case to camelCase
  franchiseScore: foundFranchise.franchise_score,
  analyticalSummary: foundFranchise.analytical_summary,
  franchisedUnits: foundFranchise.franchised_units,
  companyOwnedUnits: foundFranchise.company_owned_units,
  
  // Keep both formats for compatibility
  franchise_score: foundFranchise.franchise_score,
  analytical_summary: foundFranchise.analytical_summary,
}
\`\`\`

### 2. Transform Nested JSONB Structures

**Issue**: Database stores breakdown data with snake_case keys and nested structures.

**Database Structure**:
\`\`\`json
{
  "system_stability": {
    "metrics": [
      {
        "metric_name": "Franchisee Turnover Rate",
        "score": 70,
        "max_score": 70,
        "rating": "Excellent",
        "explanation": "..."
      }
    ],
    "total_score": 165,
    "max_score": 200
  }
}
\`\`\`

**Component Expectation**:
\`\`\`typescript
{
  systemStability: {
    metrics: [
      {
        metric: "Franchisee Turnover Rate",  // Changed from metric_name
        score: 70,
        max: 70,  // Changed from max_score
        rating: "Excellent",
        explanation: "..."
      }
    ]
  }
}
\`\`\`

**Transformation Function**:
\`\`\`typescript
const transformBreakdown = (breakdown: any) => {
  if (!breakdown) return undefined

  const transformed: any = {}

  // Transform each category
  const categories = [
    { from: 'system_stability', to: 'systemStability' },
    { from: 'support_quality', to: 'supportQuality' },
    { from: 'growth_trajectory', to: 'growthTrajectory' },
    { from: 'financial_disclosure', to: 'financialDisclosure' }
  ]

  categories.forEach(({ from, to }) => {
    if (breakdown[from]) {
      transformed[to] = {
        ...breakdown[from],
        metrics: transformMetrics(breakdown[from].metrics || [])
      }
    }
  })

  return transformed
}

const transformMetrics = (metrics: any[]) => {
  return metrics.map(metric => ({
    metric: metric.metric_name,  // Rename field
    score: metric.score,
    max: metric.max_score,  // Rename field
    rating: metric.rating,
    explanation: metric.explanation,
    formula_used: metric.formula_used
  }))
}
\`\`\`

### 3. Cap Scores at Maximum Values

**Issue**: Database may contain scores that exceed their maximum values (e.g., 165/100).

**Solution**:
\`\`\`typescript
const franchiseScore = {
  overall: Math.min(foundFranchise.franchise_score || 0, 600),
  maxScore: 600,
  systemStability: {
    score: Math.min(foundFranchise.score_business_model || 0, 200),
    max: 200,
  },
  financialDisclosure: {
    score: Math.min(foundFranchise.score_legal_compliance || 0, 100),
    max: 100,
  },
  // ... other categories
}
\`\`\`

---

## Component Data Expectations

### FranchiseScore Component

**Expected Props**:
\`\`\`typescript
interface FranchiseScoreProps {
  score: {
    overall: number
    maxScore: number
    systemStability: { score: number; max: number }
    supportQuality: { score: number; max: number }
    growthTrajectory: { score: number; max: number }
    financialDisclosure: { score: number; max: number }
    riskLevel: "LOW" | "MODERATE" | "HIGH"
    industryPercentile: number
    breakdown?: {
      systemStability: {
        metrics: Array<{
          metric: string
          score: number
          max: number
          rating: string
          explanation: string
        }>
      }
      // ... other categories
    }
  }
}
\`\`\`

**Key Points**:
- `breakdown` is optional but required for accordion dropdowns
- Each category in breakdown must have a `metrics` array
- Metrics must have `metric` (not `metric_name`) and `max` (not `max_score`)

### FDD Viewer Component

**Expected Props**:
\`\`\`typescript
interface Franchise {
  id: string
  name: string
  
  // Both formats for compatibility
  franchiseScore?: FranchiseScoreData
  franchise_score?: number
  
  analyticalSummary?: string
  analytical_summary?: string
  
  // ... other fields
}
\`\`\`

---

## Common Issues & Solutions

### Issue 1: "Cannot read properties of undefined (reading 'score')"

**Cause**: Component expects `franchise.franchiseScore` but data has `franchise.franchise_score` (wrong format).

**Solution**: Ensure data transformation creates the camelCase version:
\`\`\`typescript
franchiseScore: {
  overall: foundFranchise.franchise_score,
  // ... full structure
}
\`\`\`

### Issue 2: "data.find is not a function"

**Cause**: API returns `{ franchises: [...] }` but component expects array directly.

**Solution**: Extract array from response:
\`\`\`typescript
const data = await response.json()
const franchises = data.franchises || []
const found = franchises.find(f => f.id === id)
\`\`\`

### Issue 3: "score.breakdown[category.key].map is not a function"

**Cause**: Breakdown data structure has `metrics` array nested inside category object.

**Solution**: Access the metrics array correctly:
\`\`\`typescript
// ❌ Wrong
score.breakdown[category.key].map(...)

// ✅ Correct
score.breakdown[category.key].metrics.map(...)
\`\`\`

### Issue 4: "Analytical summary not displaying"

**Causes**:
1. API route not selecting `analytical_summary` field
2. Database column doesn't exist (needs migration)
3. Data not uploaded after schema migration

**Solutions**:
1. Add to SELECT statement: `.select('..., analytical_summary')`
2. Run migration: `scripts/21-add-analytical-summary-and-details.sql`
3. Re-upload data: `python3 scripts/upload_to_supabase.py --json "path/to/analysis.json"`

### Issue 5: "Invalid re... is not valid JSON"

**Cause**: API route returns error as plain text instead of JSON.

**Solution**: Always return JSON, even for errors:
\`\`\`typescript
try {
  // ... fetch data
  return NextResponse.json({ franchises: data, error: null })
} catch (error) {
  return NextResponse.json({ 
    franchises: [], 
    error: error.message 
  }, { status: 500 })
}
\`\`\`

---

## Best Practices

### 1. Schema Migrations

When adding new columns:
1. Create migration SQL script
2. Run migration in Supabase
3. Re-upload all affected data
4. Update API routes to select new fields
5. Update TypeScript types

### 2. Data Transformation

- Transform data as close to the source as possible (in page components)
- Keep both snake_case and camelCase for compatibility during transitions
- Document transformation functions clearly
- Use TypeScript interfaces to catch mismatches early

### 3. Error Handling

- Always return consistent JSON formats from API routes
- Handle missing/null fields gracefully in components
- Use optional chaining: `franchise?.analyticalSummary`
- Provide fallback values: `franchise.score || 0`

### 4. Testing Data Flow

When adding new features:
1. Check database schema has required columns
2. Verify API route selects all fields
3. Confirm data transformation handles all cases
4. Test component with real data
5. Add console.log("[v0] ...") for debugging, remove after

### 5. Type Safety

Define clear interfaces:
\`\`\`typescript
// Database response (snake_case)
interface FranchiseDB {
  franchise_score: number
  analytical_summary: string
  franchise_score_breakdown: any
}

// Component props (camelCase)
interface FranchiseUI {
  franchiseScore: number
  analyticalSummary: string
  franchiseScoreBreakdown: BreakdownData
}
\`\`\`

---

## Checklist for New Data Fields

When adding a new data field to the system:

- [ ] Add column to database schema (migration script)
- [ ] Run migration in Supabase
- [ ] Update upload script to include field
- [ ] Re-upload data for existing records
- [ ] Add field to API route SELECT statement
- [ ] Add transformation logic if needed (snake_case → camelCase)
- [ ] Update TypeScript interfaces
- [ ] Update component to display field
- [ ] Test with real data
- [ ] Document in this README

---

## Summary

The key to successful data flow from Supabase to UI components:

1. **Consistency**: Use consistent naming and response formats
2. **Transformation**: Transform data in one place (page components)
3. **Completeness**: Always select all required fields in API routes
4. **Type Safety**: Use TypeScript to catch mismatches early
5. **Documentation**: Document transformations and expectations clearly

Following these patterns will prevent the most common issues and make the codebase more maintainable.
