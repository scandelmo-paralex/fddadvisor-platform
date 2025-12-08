# FDD Processing Workflow

## Overview
This document explains how to process a new FDD document and populate the database with comprehensive franchise analysis data.

## Two-Step Process

### Step 1: Analyze the FDD (Use FDD_ANALYSIS_PROMPT.md)
**Purpose:** Generate a comprehensive, citation-backed analysis of the FDD

**Input:** Raw FDD document (PDF or text)

**Output:** Detailed analysis report including:
- FranchiseScore™ with detailed breakdowns and calculations
- Opportunities and Concerns with ratings and page citations
- Investment breakdown from Item 7
- Revenue analysis from Item 19
- Unit count and distribution from Item 20

**Prompt to use:** `FDD_ANALYSIS_PROMPT.md`

**Example workflow:**
\`\`\`bash
# Send FDD to AI with the analysis prompt
AI_MODEL="deepseek" # or gpt-4, claude, etc.
./analyze_fdd.sh --model $AI_MODEL --fdd "path/to/fdd.pdf" --prompt "FDD_ANALYSIS_PROMPT.md"
\`\`\`

### Step 2: Extract to Database (Use EXTRACTION_PROMPT.md)
**Purpose:** Convert the analysis report into structured database format

**Input:** The analysis report from Step 1

**Output:** SQL INSERT statement ready for database

**Prompt to use:** `EXTRACTION_PROMPT.md`

**Example workflow:**
\`\`\`bash
# Convert analysis to SQL
./extract_to_sql.sh --analysis "analysis_report.md" --prompt "EXTRACTION_PROMPT.md"
\`\`\`

---

## Alternative: Single-Step Process

You can also combine both prompts into a single workflow by:

1. Using the FDD_ANALYSIS_PROMPT.md as the primary analysis framework
2. Adding the database schema requirements from EXTRACTION_PROMPT.md to the end
3. Requesting both the analysis report AND the SQL INSERT statement in one go

**Combined prompt structure:**
\`\`\`
[FDD_ANALYSIS_PROMPT.md content]

---

## FINAL OUTPUT: Database Format

After completing the analysis above, convert all data into the following SQL INSERT format:

[EXTRACTION_PROMPT.md database schema section]
\`\`\`

---

## Recommended Approach

**For production use:** Use the **two-step process**
- Step 1 creates a human-readable analysis report that can be reviewed
- Step 2 converts the verified analysis into database format
- Allows for quality control between analysis and database insertion

**For rapid prototyping:** Use the **single-step process**
- Faster but less opportunity for review
- Risk of errors propagating directly to database

---

## File Locations

- **FDD_ANALYSIS_PROMPT.md** - Comprehensive analysis prompt (to be created)
- **EXTRACTION_PROMPT.md** - Database extraction prompt (existing)
- **FDD_PROCESSING_WORKFLOW.md** - This file

---

## Next Steps

1. Save the FDD Analysis Prompt as `scripts/FDD_ANALYSIS_PROMPT.md`
2. Use it as the primary analysis tool for new FDDs
3. Feed the analysis output to EXTRACTION_PROMPT.md for database insertion
4. Review and verify data before running SQL scripts
