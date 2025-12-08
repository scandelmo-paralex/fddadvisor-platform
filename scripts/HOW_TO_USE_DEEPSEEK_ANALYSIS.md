# How to Use DeepSeek for FDD Analysis

This guide walks you through the complete process of analyzing FDD documents with DeepSeek to generate detailed franchise scores, opportunities, and concerns with supporting explanations.

## Overview

The FDD analysis process has two steps:
1. **Analysis**: Use DeepSeek to analyze the FDD document and generate comprehensive insights
2. **Extraction**: Convert the analysis into SQL INSERT statements for your database

## Prerequisites

- Access to DeepSeek AI (or compatible LLM)
- Your FDD document in text format
- Access to your Supabase SQL Editor

## Step 1: Prepare Your FDD Document

1. Convert your FDD PDF to text format
   - Use a PDF-to-text converter that preserves page numbers
   - Ensure the text is clean and readable
   - Keep page number markers (e.g., "Page 1", "Page 2") for citation purposes

2. Save the text file with a descriptive name
   - Example: `kfc-non-traditional-fdd-2025.txt`

## Step 2: Run DeepSeek Analysis

1. Open your AI interface (DeepSeek, ChatGPT, Claude, etc.)

2. Copy the entire content of `scripts/FDD_ANALYSIS_PROMPT.md`

3. Paste the prompt into the AI interface

4. After the prompt, add your FDD document text:
   \`\`\`
   [Paste the FDD_ANALYSIS_PROMPT.md content here]
   
   ---
   
   FDD DOCUMENT TO ANALYZE:
   
   [Paste your FDD text here]
   \`\`\`

5. Submit and wait for the analysis to complete

6. The AI will generate a comprehensive analysis including:
   - **FranchiseScore™ Breakdown**: Detailed scoring for 4 categories with 3-5 metrics each
   - **Top 3 Opportunities**: With detailed explanations, ratings, and page citations
   - **Top 3 Concerns**: With detailed explanations, ratings, and page citations
   - **Investment Breakdown**: From Item 7
   - **Revenue Analysis**: From Item 19
   - **Unit Distribution**: From Item 20

7. Save the complete analysis output to a file
   - Example: `kfc-non-traditional-analysis.txt`

## Step 3: Extract Data for Database

1. Copy the entire content of `scripts/EXTRACTION_PROMPT.md`

2. Open a new AI conversation (or continue the same one)

3. Paste the extraction prompt followed by the analysis:
   \`\`\`
   [Paste the EXTRACTION_PROMPT.md content here]
   
   ---
   
   ANALYSIS TO EXTRACT:
   
   [Paste the DeepSeek analysis output here]
   \`\`\`

4. The AI will generate SQL INSERT statements with all the data properly formatted

5. Save the SQL output to a file
   - Example: `scripts/23-insert-kfc-detailed-analysis.sql`

## Step 4: Update Your Database

1. Open your Supabase SQL Editor

2. Copy the SQL INSERT statements from Step 3

3. **IMPORTANT**: If updating an existing franchise, first delete the old record:
   \`\`\`sql
   DELETE FROM franchises WHERE id = 'e5836360-09fe-453d-bb03-7e1bf4db487d';
   \`\`\`

4. Paste and run the new INSERT statement

5. Verify the data was inserted correctly:
   \`\`\`sql
   SELECT 
     name,
     franchise_score,
     opportunities,
     concerns,
     franchise_score_breakdown
   FROM franchises 
   WHERE id = 'e5836360-09fe-453d-bb03-7e1bf4db487d';
   \`\`\`

## Step 5: Verify in Your App

1. Refresh your FDD Advisor app

2. Navigate to the franchise FDD page

3. Check that:
   - **FranchiseScore** sections expand to show detailed metrics with explanations
   - **Top 3 Opportunities** expand to show detailed descriptions with citations
   - **Top 3 Concerns** expand to show detailed descriptions with citations
   - **Citation links** navigate to the correct pages in the PDF viewer

## Example: What Good Data Looks Like

### Opportunities (from DeepSeek analysis):
\`\`\`json
[
  {
    "title": "Strong Brand Recognition",
    "description": "KFC is one of the most recognized fast-food brands globally, with over 29,000 locations in 150+ countries. This brand strength provides immediate customer trust and reduces marketing costs for new franchisees. According to Item 1, KFC has been operating since 1952 and is part of Yum! Brands, the world's largest restaurant company. The non-traditional format leverages this brand recognition in high-traffic venues like airports, stadiums, and universities, where customers are already familiar with the brand and seeking quick, reliable food options.",
    "rating": "High",
    "citations": ["Page 1", "Page 3", "Page 15"]
  }
]
\`\`\`

### FranchiseScore Breakdown (from DeepSeek analysis):
\`\`\`json
{
  "systemStability": [
    {
      "metric": "Franchisee Turnover Rate",
      "score": 45,
      "max": 50,
      "rating": "Excellent",
      "explanation": "KFC Non-Traditional shows a very low franchisee turnover rate of 3.2% annually (Item 20, Page 87), significantly below the industry average of 8-12%. This indicates strong franchisee satisfaction and system stability. The low turnover is attributed to comprehensive training programs, ongoing support, and profitable unit economics. Only 12 out of 375 non-traditional units changed ownership in the past year, and 10 of those were planned retirements rather than forced exits."
    }
  ]
}
\`\`\`

## Troubleshooting

### Issue: Descriptions are too short
- **Cause**: The AI didn't follow the prompt properly
- **Solution**: Re-run the analysis with emphasis on "detailed explanations with specific data points"

### Issue: Missing page citations
- **Cause**: The FDD text doesn't have page markers
- **Solution**: Add page markers to your FDD text (e.g., "--- Page 1 ---", "--- Page 2 ---")

### Issue: SQL INSERT fails
- **Cause**: JSON formatting errors or special characters
- **Solution**: Validate the JSON using a JSON validator before inserting

### Issue: Data not showing in app
- **Cause**: Column names don't match or data structure is wrong
- **Solution**: Check that the JSON structure matches the database schema exactly

## Tips for Best Results

1. **Use the latest FDD**: Ensure you're analyzing the most recent FDD document
2. **Include all Items**: Make sure your FDD text includes all 23 Items
3. **Preserve formatting**: Keep tables, lists, and page numbers intact
4. **Review the analysis**: Read through the DeepSeek output before extracting to ensure quality
5. **Test with one franchise first**: Perfect the process with one franchise before scaling

## Next Steps

Once you have detailed analysis for your franchises:
1. The FDD Advisor app will automatically display the detailed breakdowns
2. Users can expand each opportunity/concern to see full explanations
3. Citation links will navigate to the relevant pages in the PDF viewer
4. The FranchiseScore sections will show detailed metrics with supporting evidence

For questions or issues, refer to the `FDD_PROCESSING_WORKFLOW.md` document.
