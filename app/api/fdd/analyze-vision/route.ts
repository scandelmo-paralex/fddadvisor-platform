import { type NextRequest, NextResponse } from "next/server"

interface VisionAnalysisRequest {
  imageUrl: string
  franchiseName: string
  analysisType?: "full" | "item19" | "fees" | "investment"
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, franchiseName, analysisType = "full" }: VisionAnalysisRequest = await request.json()

    console.log("[v0] Vision analysis request:", { franchiseName, analysisType })

    if (!imageUrl || !franchiseName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    // Build analysis prompt based on type
    const analysisPrompts = {
      full: `Analyze this FDD document page comprehensively. Extract:
- Item number and title
- All financial data (fees, costs, ranges)
- Table structures with exact values
- Key terms and conditions
- Any footnotes or disclaimers

Preserve the exact table format and structure as it appears.`,

      item19: `This is an Item 19 Financial Performance Representation page. Extract:
- All revenue/earnings data with exact figures
- Sample sizes and time periods
- Table structure showing performance tiers (top quartile, median, etc.)
- All footnotes and disclaimers
- Percentage of franchisees achieving results

Maintain the exact table format as legally required.`,

      fees: `Extract all fee information from this page:
- Initial franchise fee
- Ongoing royalties (percentage or flat fee)
- Advertising/marketing fees
- Technology fees
- Any other recurring fees
- Payment schedules and terms

Preserve table structures showing fee breakdowns.`,

      investment: `Extract initial investment information:
- Investment range (low to high)
- Breakdown by category (equipment, inventory, etc.)
- Required liquid capital
- Required net worth
- Financing options mentioned

Maintain table format showing investment breakdown.`,
    }

    const systemPrompt = `You are an expert FDD analyst specializing in extracting structured data from Franchise Disclosure Documents.

FDD tables follow legally mandated formats under FTC regulations. Your job is to:
1. Preserve exact table structures and formatting
2. Extract all numerical data with precision
3. Capture footnotes and disclaimers
4. Identify the Item number and section

Return your analysis in a structured JSON format with these fields:
{
  "itemNumber": number,
  "itemTitle": string,
  "tables": [
    {
      "title": string,
      "headers": string[],
      "rows": string[][],
      "footnotes": string[]
    }
  ],
  "keyFindings": string[],
  "disclaimers": string[]
}

Be extremely precise with numbers, percentages, and ranges.`

    const userPrompt = analysisPrompts[analysisType]

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "text", text: userPrompt },
                {
                  type: "image_url",
                  image_url: {
                    url: imageUrl,
                    detail: "high",
                  },
                },
              ],
            },
          ],
          temperature: 0.1, // Very low for maximum accuracy
          max_tokens: 2000,
          response_format: { type: "json_object" },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Vision API error:", errorData)
        return NextResponse.json(
          { error: `Vision analysis failed: ${errorData.error?.message || "Unknown error"}` },
          { status: response.status },
        )
      }

      const data = await response.json()
      const analysisResult = JSON.parse(data.choices?.[0]?.message?.content || "{}")

      console.log("[v0] Vision analysis completed successfully")

      return NextResponse.json({
        success: true,
        franchiseName,
        analysisType,
        data: analysisResult,
        processedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error("[v0] Vision processing error:", error)
      return NextResponse.json({ error: "Failed to process document with Vision API" }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Vision analysis API error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
