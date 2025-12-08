import { type NextRequest, NextResponse } from "next/server"

const FDD_TOPIC_MAPPING: Record<string, number[]> = {
  // Item 1: The Franchisor and Any Parents, Predecessors, and Affiliates
  franchisor: [1],
  "parent company": [1],
  affiliate: [1],
  predecessor: [1],
  "corporate structure": [1],
  "business entity": [1],

  // Item 2: Business Experience
  "business experience": [2],
  "management team": [2],
  executive: [2],
  officer: [2],
  director: [2],

  // Item 3: Litigation
  litigation: [3],
  lawsuit: [3],
  "legal action": [3],
  "court case": [3],
  "legal dispute": [3],

  // Item 4: Bankruptcy
  bankruptcy: [4],
  insolvency: [4],
  "financial distress": [4],

  // Item 5: Initial Fees
  "initial fee": [5],
  "franchise fee": [5],
  "initial payment": [5],
  "upfront fee": [5],
  "initial cost": [5],

  // Item 6: Other Fees
  royalty: [6],
  "royalty fee": [6],
  "advertising fee": [6],
  "marketing fee": [6],
  "ongoing fee": [6],
  "monthly fee": [6],
  "technology fee": [6],
  "support fee": [6],
  "service fee": [6],
  "brand fund": [6],
  "national advertising": [6],
  "local advertising": [6],

  // Item 7: Estimated Initial Investment
  "initial investment": [7],
  "total investment": [7],
  "startup cost": [7],
  "equipment cost": [7],
  "build-out": [7],
  "leasehold improvement": [7],
  inventory: [7],
  "working capital": [7],
  "opening cost": [7],

  // Item 8: Restrictions on Sources of Products and Services
  supplier: [8],
  vendor: [8],
  "approved supplier": [8],
  "product source": [8],
  purchasing: [8],

  // Item 9: Franchisee's Obligations
  obligation: [9],
  requirement: [9],
  "franchisee duty": [9],
  responsibility: [9],

  // Item 10: Financing
  financing: [10],
  loan: [10],
  "payment plan": [10],
  "financial assistance": [10],

  // Item 11: Franchisor's Assistance, Advertising, Computer Systems, and Training
  training: [11],
  support: [11],
  assistance: [11],
  "marketing support": [11],
  "advertising support": [11],
  "computer system": [11],
  "technology system": [11],
  software: [11],
  "pos system": [11],
  "point of sale": [11],
  "grand opening": [11],
  "opening assistance": [11],

  // Item 12: Territory
  territory: [12],
  "protected area": [12],
  "exclusive territory": [12],
  "geographic area": [12],
  location: [12],
  "site selection": [12],

  // Item 13: Trademarks
  trademark: [13],
  brand: [13],
  mark: [13],
  logo: [13],
  "trade name": [13],

  // Item 14: Patents, Copyrights, and Proprietary Information
  patent: [14],
  copyright: [14],
  proprietary: [14],
  "intellectual property": [14],
  "trade secret": [14],

  // Item 15: Obligation to Participate in the Actual Operation
  "owner participation": [15],
  "personal involvement": [15],
  "absentee owner": [15],
  "on-site management": [15],

  // Item 16: Restrictions on What the Franchisee May Sell
  "product restriction": [16],
  "service restriction": [16],
  menu: [16],
  offering: [16],

  // Item 17: Renewal, Termination, Transfer, and Dispute Resolution
  renewal: [17],
  termination: [17],
  transfer: [17],
  "sell franchise": [17],
  selling: [17],
  assignment: [17],
  "dispute resolution": [17],
  arbitration: [17],
  mediation: [17],
  "contract term": [17],
  "agreement term": [17],
  exit: [17],
  consent: [17],
  approval: [17],

  // Item 18: Public Figures
  celebrity: [18],
  "public figure": [18],
  endorsement: [18],

  // Item 19: Financial Performance Representations
  "financial performance": [19],
  earnings: [19],
  revenue: [19],
  sales: [19],
  profit: [19],
  income: [19],
  performance: [19],
  "average sales": [19],
  "gross sales": [19],
  "net income": [19],
  ebitda: [19],

  // Item 20: Outlets and Franchisee Information
  "number of franchises": [20],
  "franchise count": [20],
  outlet: [20],
  "location count": [20],
  "franchisee list": [20],
  "contact information": [20],

  // Item 21: Financial Statements
  "financial statement": [21],
  "balance sheet": [21],
  "income statement": [21],
  audit: [21],

  // Item 22: Contracts
  contract: [22],
  agreement: [22],
  "franchise agreement": [22],

  // Item 23: Receipts
  receipt: [23],
  acknowledgment: [23],
}

function identifyRelevantItems(question: string): number[] {
  const questionLower = question.toLowerCase()
  const relevantItems = new Set<number>()

  // Check each topic keyword against the question
  for (const [topic, items] of Object.entries(FDD_TOPIC_MAPPING)) {
    if (questionLower.includes(topic.toLowerCase())) {
      items.forEach((item) => relevantItems.add(item))
    }
  }

  // If no specific items identified, return common items that answer general questions
  if (relevantItems.size === 0) {
    console.log("[v0] API Route: No specific items identified, using default items")
    return [5, 6, 7, 11, 19] // Most commonly asked about items
  }

  return Array.from(relevantItems).sort((a, b) => a - b)
}

function extractItemSections(fddContent: string, itemNumbers: number[]): string {
  let extractedContent = ""

  for (const itemNum of itemNumbers) {
    // This prevents matching numbered paragraphs like "6. We do business..."
    const pattern = new RegExp(`ITEM\\s+${itemNum}:\\s+[A-Z][\\s\\S]*?(?=\\n\\s*ITEM\\s+\\d+:|$)`, "i")

    const match = fddContent.match(pattern)
    if (match && match[0].length > 100) {
      extractedContent += `\n\n=== ITEM ${itemNum} ===\n${match[0]}\n`
      console.log(`[v0] API Route: Extracted Item ${itemNum}, length: ${match[0].length}`)
      console.log(`[v0] API Route: Item ${itemNum} preview:`, match[0].substring(0, 500))
    } else {
      console.warn(`[v0] API Route: Could not extract Item ${itemNum} or content too short`)
    }
  }

  return extractedContent
}

function parseTableOfContents(fddContent: string): Record<string, number> {
  const itemToPageMap: Record<string, number> = {}

  // Find the TABLE OF CONTENTS section
  const tocMatch = fddContent.match(/TABLE OF CONTENTS[\s\S]*?(?=\n\s*ITEM 1:|EXHIBITS:)/i)

  if (!tocMatch) {
    console.warn("[v0] API Route: Could not find Table of Contents in FDD")
    return itemToPageMap
  }

  const tocContent = tocMatch[0]
  console.log("[v0] API Route: Found Table of Contents, parsing...")

  // Match lines like "ITEM 6  OTHER FEES 4" or "ITEM 6 OTHER FEES 4"
  const itemPattern = /ITEM\s+(\d+)\s+[A-Z\s,]+?(\d+)\s*$/gim

  let match
  while ((match = itemPattern.exec(tocContent)) !== null) {
    const itemNumber = Number.parseInt(match[1])
    const pageNumber = Number.parseInt(match[2])
    itemToPageMap[`Item ${itemNumber}`] = pageNumber
    console.log(`[v0] API Route: Parsed TOC - Item ${itemNumber} -> Page ${pageNumber}`)
  }

  return itemToPageMap
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] API Route: Received POST request")

    const body = await request.json()
    console.log("[v0] API Route: Parsed request body")

    const {
      question,
      franchiseName,
      franchiseContext,
      useVision,
      imageUrl,
      imageUrls,
      fddTextContent,
      fddPageMapping,
    } = body

    console.log("[v0] API Route: Request details:", {
      question,
      franchiseName,
      useVision,
      hasFddContent: !!fddTextContent,
      fddContentLength: fddTextContent?.length || 0,
      imageCount: imageUrls?.length || (imageUrl ? 1 : 0),
      hasPageMapping: !!fddPageMapping,
    })

    if (!question || !franchiseName) {
      console.error("[v0] API Route: Missing required fields")
      return NextResponse.json(
        { error: "Missing required fields: question and franchiseName are required" },
        { status: 400 },
      )
    }

    console.log("[v0] API Route: Checking OpenAI API key...")
    if (!process.env.OPENAI_API_KEY) {
      console.error("[v0] API Route: OpenAI API key not found")
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }
    console.log("[v0] API Route: OpenAI API key found")

    if (useVision && (imageUrls || imageUrl)) {
      const imagesToAnalyze = imageUrls || [imageUrl]
      console.log("[v0] API Route: Analyzing", imagesToAnalyze.length, "image(s)")

      const systemPrompt = `You are an expert FDD (Franchise Disclosure Document) analyst with deep knowledge of franchise law and disclosure requirements.

You are analyzing ${imagesToAnalyze.length > 1 ? "multiple pages" : "a page"} from ${franchiseName}'s FDD. Pay special attention to:
- Table structures (which are legally mandated formats)
- Financial data and Item 19 disclosures
- Fee schedules and investment breakdowns
- Exact numbers, percentages, and specific details mentioned in your answer

${imagesToAnalyze.length > 1 ? "Review all provided pages to find the most relevant information." : ""}

Provide clear, accurate answers based ONLY on what you can see in the document image${imagesToAnalyze.length > 1 ? "s" : ""}.

IMPORTANT: At the end of your response, include a source citation in this format:
[SOURCE: Item X, Page Y]

Where X is the FDD Item number (1-23) visible in the image, and Y is the page number if visible.`

      try {
        console.log("[v0] API Route: Calling OpenAI Vision API...")

        const contentArray: any[] = [{ type: "text", text: question }]

        for (const imgUrl of imagesToAnalyze) {
          contentArray.push({
            type: "image_url",
            image_url: {
              url: imgUrl,
              detail: "high",
            },
          })
        }

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
                content: contentArray,
              },
            ],
            temperature: 0.3,
            max_tokens: 1000,
          }),
        })

        console.log("[v0] API Route: Vision API response status:", response.status)

        if (!response.ok) {
          const errorData = await response.json()
          console.error("[v0] API Route: Vision API error:", errorData)
          return NextResponse.json(
            { error: `Vision API error (${response.status}). Please try again.` },
            { status: 500 },
          )
        }

        const data = await response.json()
        const fullAnswer = data.choices?.[0]?.message?.content

        if (!fullAnswer) {
          console.error("[v0] API Route: No content in Vision API response")
          return NextResponse.json({ error: "No response from Vision API" }, { status: 500 })
        }

        const sourceMatch = fullAnswer.match(/\[SOURCE:\s*Item\s*(\d+),\s*Page\s*(\d+)\]/i)
        let answer = fullAnswer
        let source = null

        if (sourceMatch) {
          const itemNumber = Number.parseInt(sourceMatch[1])
          const pageNumber = Number.parseInt(sourceMatch[2])
          answer = fullAnswer.replace(/\[SOURCE:.*?\]/i, "").trim()
          source = { item: itemNumber, page: pageNumber }
        }

        console.log("[v0] API Route: Vision API response generated successfully")
        return NextResponse.json({ answer, source })
      } catch (visionError) {
        console.error("[v0] API Route: Vision API error:", visionError)
        return NextResponse.json({ error: "Failed to process document with Vision API" }, { status: 500 })
      }
    }

    if (!fddTextContent) {
      console.error("[v0] API Route: No FDD text content provided")
      return NextResponse.json(
        { error: "FDD content not provided. Please ensure the FDD document is loaded." },
        { status: 400 },
      )
    }

    const tocPageMapping = parseTableOfContents(fddTextContent)
    console.log("[v0] API Route: Parsed page mapping from TOC:", tocPageMapping)

    // Use TOC mapping if available, otherwise fall back to provided mapping
    const effectivePageMapping = Object.keys(tocPageMapping).length > 0 ? tocPageMapping : fddPageMapping

    const relevantItems = identifyRelevantItems(question)
    console.log(`[v0] API Route: Identified relevant Items: ${relevantItems.join(", ")}`)

    const focusedContent = extractItemSections(fddTextContent, relevantItems)

    let contentToAnalyze: string
    if (focusedContent.length === 0) {
      console.warn("[v0] API Route: No sections extracted, falling back to full content")
      // Fallback to full content if extraction fails
      contentToAnalyze = fddTextContent
    } else {
      console.log(
        `[v0] API Route: Extracted ${focusedContent.length} characters from Items ${relevantItems.join(", ")}`,
      )
      console.log("[v0] API Route: Content preview being sent to OpenAI:", focusedContent.substring(0, 800))
      contentToAnalyze = focusedContent
    }

    const contextInfo = franchiseContext || `Information about ${franchiseName} franchise`

    const systemPrompt = `You are an expert FDD (Franchise Disclosure Document) analyst helping potential franchisees understand ${franchiseName}'s franchise opportunity.

Context about ${franchiseName}:
${contextInfo}

Below are the relevant sections from the FDD (Items ${relevantItems.join(", ")}). Analyze them carefully to answer the user's question.

FDD Content:
${contentToAnalyze}

Provide clear, concise answers (2-4 sentences) based ONLY on the FDD content provided above. If the information is not in the provided sections, say so clearly.

IMPORTANT: At the end of your response, include a source citation in this format:
[SOURCE: Item X]

Where X is the FDD Item number (1-23) that contains the information you used to answer the question.`

    console.log("[v0] API Route: Calling OpenAI API with focused FDD content...")

    let response: Response
    try {
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: question },
          ],
          temperature: 0.3,
          max_tokens: 800,
        }),
      })
      console.log("[v0] API Route: OpenAI API response status:", response.status)
    } catch (fetchError) {
      console.error("[v0] API Route: Network error:", fetchError)
      return NextResponse.json({ error: "Network error connecting to AI service. Please try again." }, { status: 500 })
    }

    if (!response.ok) {
      let errorDetails = ""
      try {
        const errorData = await response.json()
        errorDetails = JSON.stringify(errorData)
        console.error("[v0] API Route: OpenAI error response:", errorData)
      } catch {
        errorDetails = await response.text()
        console.error("[v0] API Route: OpenAI error text:", errorDetails)
      }

      return NextResponse.json(
        {
          error: `AI service error (${response.status}). Please try again.`,
        },
        { status: 500 },
      )
    }

    console.log("[v0] API Route: Parsing OpenAI response...")
    let data
    try {
      data = await response.json()
      console.log("[v0] API Route: Response parsed successfully")
    } catch (parseError) {
      console.error("[v0] API Route: Parse error:", parseError)
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 })
    }

    const fullAnswer = data.choices?.[0]?.message?.content

    if (!fullAnswer) {
      console.error("[v0] API Route: No content in response")
      return NextResponse.json({ error: "No response generated from AI service" }, { status: 500 })
    }

    console.log("[v0] API Route: Full answer:", fullAnswer.substring(0, 500))
    console.log("[v0] API Route: Extracting source citation...")

    const sourceMatch = fullAnswer.match(/\[SOURCE:\s*Item\s*(\d+)\]/i)

    let answer = fullAnswer
    let source = null

    if (sourceMatch) {
      const itemNumber = Number.parseInt(sourceMatch[1])
      answer = fullAnswer.replace(/\[SOURCE:.*?\]/i, "").trim()
      source = {
        item: itemNumber,
      }
      console.log(`[v0] API Route: Extracted source - Item ${itemNumber}`)
    } else {
      console.warn("[v0] API Route: No source citation found in response")
    }

    console.log("[v0] API Route: Success! Returning response")

    return NextResponse.json({ answer, source })
  } catch (error) {
    console.error("[v0] API Route: Unhandled error - Type:", typeof error)
    console.error("[v0] API Route: Unhandled error - Details:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    if (error instanceof Error && error.stack) {
      console.error("[v0] API Route: Stack trace:", error.stack)
    }

    return NextResponse.json(
      {
        error: `Failed to generate response: ${errorMessage}`,
      },
      { status: 500 },
    )
  }
}
