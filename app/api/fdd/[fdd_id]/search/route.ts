import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import Anthropic from "@anthropic-ai/sdk"

const CONFIDENCE_THRESHOLD = 0.4

type FPRIntent =
  | "earnings_question" // "How much can I make?"
  | "roi_question" // "What's the ROI?"
  | "profitability_question" // "Is this profitable?"
  | "projection_request" // "Calculate my expected earnings"
  | "comparison_request" // "Which franchise earns more?"
  | "investment_advice" // "Is this a good investment?"
  | null

interface FPRDetectionResult {
  intent: FPRIntent
  shouldRedirect: boolean
  friendlyResponse: string
  suggestedAction?: "navigate_item19" | "navigate_item7" | "navigate_item20" | "show_fdd_data"
}

function detectFPRIntent(query: string): FPRDetectionResult {
  const lowerQuery = query.toLowerCase()

  // Earnings/Income questions - redirect to Item 19
  if (
    /how much (can|will|could|should|would) (i|we|someone) (make|earn|profit|take home)/i.test(query) ||
    /what (can|could|should|would) (i|we) expect to (make|earn)/i.test(query) ||
    /typical|average|expected|normal.*(earnings|income|salary|take.?home)/i.test(query)
  ) {
    return {
      intent: "earnings_question",
      shouldRedirect: true,
      suggestedAction: "navigate_item19",
      friendlyResponse: `That's one of the most important questions for any franchise buyer! While I can't predict what you'll earn (every owner's results are different), I can show you exactly what this franchisor has disclosed about existing locations.

**Here's what I can help with:**
- Walk you through Item 19's Financial Performance Representation
- Show you reported revenue ranges from actual locations
- Explain the sample sizes and time periods for the data

Would you like me to find the Item 19 financial data for you? You can also talk directly with existing franchisees listed in Item 20 to hear about their real experiences.`,
    }
  }

  // ROI/Payback questions - redirect to Item 7 + Item 19
  if (
    /what('s| is| are) (the |my )?(roi|return on investment|payback|break.?even)/i.test(query) ||
    /how (long|quickly|soon) (until|before|to|till) (break.?even|profit|profitable|recoup)/i.test(query)
  ) {
    return {
      intent: "roi_question",
      shouldRedirect: true,
      suggestedAction: "show_fdd_data",
      friendlyResponse: `ROI and breakeven timing depend on many factors unique to your situation—your location, local market, how you operate, and more. I can't calculate that for you, but I can give you the building blocks.

**Here's what the FDD tells us:**
- **Item 7** shows the initial investment range (what you'll spend to open)
- **Item 19** (if provided) shows historical financial performance of existing locations

With these figures, you and your accountant can model different scenarios. Would you like me to pull up the investment costs and any disclosed revenue data?`,
    }
  }

  // Profitability questions
  if (
    /is (this|it) (a )?(profitable|lucrative|money.?maker)/i.test(query) ||
    /how profitable/i.test(query) ||
    /will (i|we) make money/i.test(query) ||
    /can (i|you|we) make (good )?money/i.test(query)
  ) {
    return {
      intent: "profitability_question",
      shouldRedirect: true,
      suggestedAction: "navigate_item19",
      friendlyResponse: `Profitability varies significantly from one franchisee to another—even within the same brand. Location, market conditions, and how you run the business all play a role.

**What I can show you:**
- Disclosed financial performance data (if the franchisor provides Item 19)
- The number of locations and how that's changed over time
- Any litigation or franchisee turnover trends

The best insight often comes from talking to current and former franchisees. Item 20 lists their contact information. Want me to summarize what the FDD discloses about financial performance?`,
    }
  }

  // Projection/Calculation requests - firm but friendly
  if (
    /calculate|compute|estimate|project|predict/i.test(query) &&
    /earnings|income|revenue|profit|sales|money/i.test(query)
  ) {
    return {
      intent: "projection_request",
      shouldRedirect: true,
      suggestedAction: "show_fdd_data",
      friendlyResponse: `I can't calculate projected earnings—franchise regulations (and common sense!) prevent anyone from predicting your specific results. But here's the good news: the FDD contains real data that's more valuable than any projection.

**I can help you find:**
- Actual revenue figures from existing locations (Item 19)
- Total investment costs (Item 7)
- Franchise fee and ongoing royalty structure (Items 5 & 6)

Would you like me to gather this data so you can run your own analysis or work through the numbers with your accountant?`,
    }
  }

  // Comparison requests
  if (
    /(compare|versus|vs\.?|better than|which is better)/i.test(query) &&
    /profit|revenue|earnings|income|money|return/i.test(query)
  ) {
    return {
      intent: "comparison_request",
      shouldRedirect: true,
      suggestedAction: "navigate_item19",
      friendlyResponse: `Comparing franchise earnings is tricky—different brands report data differently (or not at all), and your results will depend on your specific situation.

**What I can do:**
- Show you exactly what this franchisor discloses in their Item 19
- Explain the methodology and sample sizes they use
- Help you understand what the numbers actually mean

For true comparisons, you'd want to review each brand's FDD independently and ideally speak with franchisees from each system. Would you like me to walk through this franchise's financial disclosures?`,
    }
  }

  // Investment advice questions
  if (
    /is (this|it) a good (investment|opportunity|idea|decision)/i.test(query) ||
    /should (i|we) (invest|buy|purchase|get)/i.test(query) ||
    /worth (it|the investment|buying)/i.test(query) ||
    /recommend.*(invest|buy|franchise)/i.test(query)
  ) {
    return {
      intent: "investment_advice",
      shouldRedirect: true,
      suggestedAction: "show_fdd_data",
      friendlyResponse: `That's a decision only you can make—but I can help you gather the facts! A franchise attorney and accountant are essential partners in evaluating any opportunity.

**Here's how the FDD can help you decide:**
- **Item 19**: Financial performance (if disclosed)
- **Item 20**: Contact info for current/former franchisees to interview
- **Item 3**: Litigation history
- **Item 4**: Bankruptcy history
- **Item 21**: Financial statements

Would you like me to help you explore any of these areas? Many buyers find speaking with existing franchisees to be the most valuable research.`,
    }
  }

  // No FPR issue detected
  return {
    intent: null,
    shouldRedirect: false,
    friendlyResponse: "",
  }
}

const FPR_SYSTEM_INSTRUCTIONS = `
You are a helpful FDD analyst assistant. Your role is to help franchise buyers understand disclosure documents.

IMPORTANT GUIDELINES:
1. Share FACTS from the FDD - actual disclosed figures, with proper context (source, sample size, dates)
2. Never predict, project, or estimate future financial performance
3. Never characterize a franchise as "good," "profitable," "lucrative," or "worth it"
4. When sharing Item 19 data, always note that individual results vary
5. Encourage users to consult with franchise attorneys and accountants
6. Suggest talking to existing franchisees (Item 20) for real-world insights

If asked for projections or advice, acknowledge the question warmly and redirect to what the FDD actually discloses.
`

const ITEM_19_DISCLAIMER = `

---
*This financial data is from the franchisor's FDD and shows historical performance of certain locations. Your results will vary based on location, market conditions, and how you operate. Review the complete Item 19 with a franchise attorney before making any decision.*`

export async function POST(request: Request, { params }: { params: Promise<{ fdd_id: string }> }) {
  try {
    console.log("[v0] AI Chat: Starting semantic search request")

    const { fdd_id } = await params
    console.log("[v0] AI Chat: FDD ID:", fdd_id)

    const { query, limit = 5, pageImages, currentPage, forceVision, useWebSearch, franchiseName } = await request.json()
    console.log("[v0] AI Chat: Query:", query)

    const fprResult = detectFPRIntent(query)
    if (fprResult.shouldRedirect) {
      console.log("[v0] AI Chat: FPR intent detected:", fprResult.intent, "- providing friendly redirect")
      return NextResponse.json({
        answer: fprResult.friendlyResponse,
        sources: [],
        confidence: 1,
        thinking: `Detected ${fprResult.intent} - redirecting to helpful FDD information`,
        usedVision: false,
        usedWebSearch: false,
        fprRedirect: true,
        suggestedAction: fprResult.suggestedAction,
      })
    }

    console.log("[v0] AI Chat: Limit:", limit)
    console.log("[v0] AI Chat: Has page images:", !!pageImages?.length)
    console.log("[v0] AI Chat: Current page:", currentPage)
    console.log("[v0] AI Chat: Force Vision:", forceVision)
    console.log("[v0] AI Chat: Use Web Search:", useWebSearch)
    console.log("[v0] AI Chat: Franchise Name:", franchiseName)

    if (useWebSearch && franchiseName) {
      console.log("[v0] AI Chat: Web search enabled, using Perplexity")
      return await handleWebSearch(query, franchiseName)
    }

    if (forceVision && pageImages?.length > 0) {
      console.log("[v0] AI Chat: User forced Vision mode, skipping semantic search")
      return await handleVisionFallback(query, pageImages, currentPage)
    }

    const googleApiKey = process.env.GOOGLE_API_KEY
    if (!googleApiKey) {
      console.error("[v0] AI Chat: GOOGLE_API_KEY not found")
      return NextResponse.json({ error: "Google API key not configured" }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(googleApiKey)

    console.log("[v0] AI Chat: Generating embedding for query...")
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" })
    const embeddingResult = await embeddingModel.embedContent(query)
    const queryEmbedding = embeddingResult.embedding.values
    console.log("[v0] AI Chat: Generated embedding with", queryEmbedding.length, "dimensions")

    console.log("[v0] AI Chat: Searching for similar chunks in database...")
    const supabase = await createClient()

    const { data: matches, error: searchError } = await supabase.rpc("match_fdd_chunks", {
      query_embedding: queryEmbedding,
      fdd_id_filter: fdd_id,
      match_threshold: 0.3,
      match_count: limit,
    })

    if (searchError) {
      console.error("[v0] AI Chat: Database search error:", searchError)
      if (pageImages?.length > 0) {
        console.log("[v0] AI Chat: Database error, trying Vision fallback...")
        return await handleVisionFallback(query, pageImages, currentPage)
      }
      return NextResponse.json({ error: "Failed to search document chunks" }, { status: 500 })
    }

    console.log("[v0] AI Chat: Found", matches?.length || 0, "matching chunks")

    if (matches?.length > 0) {
      console.log("[v0] AI Chat: First match structure:", JSON.stringify(matches[0], null, 2))
      console.log(
        "[v0] AI Chat: Item numbers in matches:",
        matches.map((m: any) => m.item_number),
      )
    }

    const avgSimilarity = matches?.length
      ? matches.reduce((sum: number, m: any) => sum + m.similarity, 0) / matches.length
      : 0
    console.log("[v0] AI Chat: Average similarity score:", avgSimilarity.toFixed(3))

    if (avgSimilarity < CONFIDENCE_THRESHOLD) {
      console.log("[v0] AI Chat: Low confidence, using vision fallback")
      if (pageImages?.length > 0) {
        return await handleVisionFallback(query, pageImages, currentPage)
      }
      return NextResponse.json({
        answer:
          "I couldn't find relevant information in the indexed sections. Try navigating to the relevant page and asking again - I can analyze the page directly using vision.",
        sources: [],
        confidence: 0,
        usedVision: false,
        usedWebSearch: false,
      })
    }

    const franchiseSlug = franchiseName
      ? franchiseName
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")
      : fdd_id.split("/").pop() || fdd_id
    console.log("[v0] AI Chat: Franchise slug:", franchiseSlug)

    console.log("[v0] AI Chat: Fetching Item starting pages from mappings...")
    const itemNumbers = [...new Set(matches.map((m: any) => m.item_number).filter(Boolean))]
    console.log("[v0] AI Chat: Extracted item numbers:", itemNumbers)

    let itemPageMap: Record<number, number> = {}
    if (itemNumbers.length > 0) {
      const { data: itemMappings, error: mappingError } = await supabase
        .from("fdd_item_page_mappings")
        .select("item_number, page_number")
        .eq("franchise_slug", franchiseSlug)
        .eq("mapping_type", "item")
        .in("item_number", itemNumbers)

      if (!mappingError && itemMappings) {
        itemPageMap = Object.fromEntries(itemMappings.map((m) => [m.item_number, m.page_number]))
        console.log("[v0] AI Chat: Loaded Item page mappings:", itemPageMap)
      }
    }

    const context = matches
      .map(
        (m: any, i: number) =>
          `[Chunk ${i + 1} - Item ${m.item_number || "Unknown"}, Page ${m.page_number}]\n${m.chunk_text}`,
      )
      .join("\n\n")

    console.log("[v0] AI Chat: Context length:", context.length, "characters")

    const isItem19Query = itemNumbers.includes(19) || /item.?19|financial|revenue|earnings|performance/i.test(query)

    console.log("[v0] AI Chat: Generating answer with Gemini...")
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const prompt = `You are an expert FDD (Franchise Disclosure Document) analyst. Answer the following question based ONLY on the provided context from the FDD.

${FPR_SYSTEM_INSTRUCTIONS}

Question: ${query}

Context from FDD:
${context}

Instructions:
- Provide a clear, concise answer (2-4 sentences)
- Only use information from the provided context
- If the context doesn't contain the information, say so clearly
- Do NOT add source citations or references in your answer
- If discussing financial data from Item 19, include the source, sample size, and time period if available
- Never project future performance or suggest expected earnings

Answer:`

    const result = await model.generateContent(prompt)
    let answer = result.response.text()

    if (isItem19Query) {
      answer = answer + ITEM_19_DISCLAIMER
    }

    console.log("[v0] AI Chat: Generated answer, length:", answer.length)

    const uniqueItems = new Map()
    matches.forEach((m: any) => {
      console.log("[v0] AI Chat: Processing match - item_number:", m.item_number, "page:", m.page_number)
      if (m.item_number && m.item_number !== 23 && !uniqueItems.has(m.item_number)) {
        uniqueItems.set(m.item_number, {
          item: m.item_number,
          page: itemPageMap[m.item_number] || m.page_number,
          text: `Item ${m.item_number}`,
        })
      }
    })

    const sources = Array.from(uniqueItems.values())

    console.log("[v0] AI Chat: Success! Returning response with", sources.length, "sources")

    return NextResponse.json({
      answer: answer.trim(),
      sources,
      confidence: avgSimilarity,
      thinking: `Found ${matches.length} relevant sections with avg similarity ${avgSimilarity.toFixed(2)}`,
      usedVision: false,
      usedWebSearch: false,
    })
  } catch (error) {
    console.error("[v0] AI Chat: Unhandled error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

async function handleWebSearch(query: string, franchiseName: string): Promise<NextResponse> {
  console.log("[v0] Web Search: Starting Perplexity search for", franchiseName)

  const perplexityApiKey = process.env.PERPLEXITY_API_KEY
  if (!perplexityApiKey) {
    console.error("[v0] Web Search: PERPLEXITY_API_KEY not found")
    return NextResponse.json(
      {
        answer: "Web search is not available. Please add PERPLEXITY_API_KEY to your environment variables.",
        sources: [],
        confidence: 0,
        usedVision: false,
        usedWebSearch: false,
      },
      { status: 200 },
    )
  }

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${perplexityApiKey}`,
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: `You are a franchise research assistant. The user is evaluating "${franchiseName}" as a potential franchise investment. 

${FPR_SYSTEM_INSTRUCTIONS}

Provide helpful, factual information from the web including:
- Recent news and reviews about the franchise
- Franchisee experiences and testimonials
- Industry analysis (without financial comparisons)
- Any red flags or concerns mentioned online

Be balanced and objective. Cite your sources when possible.
Do NOT provide earnings projections, profit estimates, or ROI calculations.`,
          },
          {
            role: "user",
            content: `${query} (regarding ${franchiseName} franchise)`,
          },
        ],
        max_tokens: 1500,
        temperature: 0.2,
        return_citations: true,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("[v0] Web Search: Perplexity API error:", response.status, errorData)
      return NextResponse.json(
        { error: `Web search failed: ${errorData.error?.message || response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("[v0] Web Search: Perplexity response received")

    const answer = data.choices?.[0]?.message?.content || "Unable to find relevant information."

    const citations = data.citations || []
    const sources = citations.slice(0, 5).map((url: string) => {
      try {
        const hostname = new URL(url).hostname.replace("www.", "")
        return {
          text: hostname,
          url: url,
        }
      } catch {
        return { text: "Source", url }
      }
    })

    console.log("[v0] Web Search: Success! Found", sources.length, "sources")

    return NextResponse.json({
      answer: answer.trim(),
      sources,
      confidence: 0.8,
      thinking: `Searched the web for information about ${franchiseName}`,
      usedVision: false,
      usedWebSearch: true,
    })
  } catch (error) {
    console.error("[v0] Web Search: Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Web search failed: ${errorMessage}` }, { status: 500 })
  }
}

async function handleVisionFallback(query: string, pageImages: string[], currentPage?: number): Promise<NextResponse> {
  console.log("[v0] Vision Fallback: Starting Claude Vision analysis")

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicApiKey) {
    console.log("[v0] Vision Fallback: ANTHROPIC_API_KEY not found, trying OpenAI...")
    return await handleOpenAIVisionFallback(query, pageImages, currentPage)
  }

  try {
    const anthropic = new Anthropic({
      apiKey: anthropicApiKey,
    })

    const imageBlocks = await Promise.all(
      pageImages.map(async (imageUrl: string) => {
        if (imageUrl.startsWith("data:")) {
          const matches = imageUrl.match(/^data:(.+);base64,(.+)$/)
          if (matches) {
            return {
              type: "image" as const,
              source: {
                type: "base64" as const,
                media_type: matches[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: matches[2],
              },
            }
          }
        }
        return {
          type: "image" as const,
          source: {
            type: "url" as const,
            url: imageUrl,
          },
        }
      }),
    )

    const isItem19Page = currentPage && currentPage >= 50 && currentPage <= 65

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [
            ...imageBlocks,
            {
              type: "text",
              text: `You are an expert FDD (Franchise Disclosure Document) analyst. You are viewing ${currentPage ? `page ${currentPage}` : "a page"} from an FDD document.

${FPR_SYSTEM_INSTRUCTIONS}

Question: ${query}

Instructions:
1. Carefully read and analyze ALL content visible on the page(s)
2. Answer the question based ONLY on what you can see
3. Be precise with any numbers, percentages, or financial data
4. If the information to answer the question is not visible on these pages, say so clearly
5. Provide a clear, concise answer (2-4 sentences)
6. If reporting Item 19 financial data, include any visible caveats, sample sizes, or time periods
7. NEVER project future performance or suggest expected earnings

Answer:`,
            },
          ],
        },
      ],
    })

    let answer = response.content[0].type === "text" ? response.content[0].text : "Unable to analyze the page."

    if (isItem19Page || /item.?19|financial|revenue|earnings|performance/i.test(query)) {
      answer = answer + ITEM_19_DISCLAIMER
    }

    console.log("[v0] Vision Fallback: Successfully analyzed page with Claude")

    return NextResponse.json({
      answer: answer.trim(),
      sources: currentPage ? [{ page: currentPage, text: `Page ${currentPage}` }] : [],
      confidence: 0.85,
      thinking: "Used Claude Vision to analyze the visible page content",
      usedVision: true,
      usedWebSearch: false,
    })
  } catch (error) {
    console.error("[v0] Vision Fallback: Claude error:", error)
    console.log("[v0] Vision Fallback: Trying OpenAI fallback...")
    return await handleOpenAIVisionFallback(query, pageImages, currentPage)
  }
}

async function handleOpenAIVisionFallback(
  query: string,
  pageImages: string[],
  currentPage?: number,
): Promise<NextResponse> {
  console.log("[v0] OpenAI Vision Fallback: Starting GPT-4o analysis")

  const openaiApiKey = process.env.OPENAI_API_KEY
  if (!openaiApiKey) {
    console.error("[v0] OpenAI Vision Fallback: OPENAI_API_KEY not found")
    return NextResponse.json({
      answer:
        "Vision analysis is not available. Please ensure ANTHROPIC_API_KEY or OPENAI_API_KEY is configured, or try asking about content in Items 1-23.",
      sources: [],
      confidence: 0,
      usedVision: false,
      usedWebSearch: false,
    })
  }

  try {
    const imageContent = pageImages.map((imageUrl: string) => ({
      type: "image_url" as const,
      image_url: {
        url: imageUrl,
        detail: "high" as const,
      },
    }))

    const isItem19Page = currentPage && currentPage >= 50 && currentPage <= 65

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              ...imageContent,
              {
                type: "text",
                text: `You are an expert FDD (Franchise Disclosure Document) analyst. You are viewing ${currentPage ? `page ${currentPage}` : "a page"} from an FDD document.

${FPR_SYSTEM_INSTRUCTIONS}

Question: ${query}

Instructions:
1. Carefully read and analyze ALL content visible on the page(s)
2. Answer the question based ONLY on what you can see
3. Be precise with any numbers, percentages, or financial data
4. If the information to answer the question is not visible on these pages, say so clearly
5. Provide a clear, concise answer (2-4 sentences)
6. If reporting Item 19 financial data, include any visible caveats, sample sizes, or time periods
7. NEVER project future performance or suggest expected earnings

Answer:`,
              },
            ],
          },
        ],
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("[v0] OpenAI Vision Fallback: API error:", response.status, errorData)
      return NextResponse.json(
        { error: `Vision analysis failed: ${errorData.error?.message || response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    let answer = data.choices?.[0]?.message?.content || "Unable to analyze the page."

    if (isItem19Page || /item.?19|financial|revenue|earnings|performance/i.test(query)) {
      answer = answer + ITEM_19_DISCLAIMER
    }

    console.log("[v0] OpenAI Vision Fallback: Successfully analyzed page")

    return NextResponse.json({
      answer: answer.trim(),
      sources: currentPage ? [{ page: currentPage, text: `Page ${currentPage}` }] : [],
      confidence: 0.8,
      thinking: "Used GPT-4o Vision to analyze the visible page content",
      usedVision: true,
      usedWebSearch: false,
    })
  } catch (error) {
    console.error("[v0] OpenAI Vision Fallback: Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Vision analysis failed: ${errorMessage}` }, { status: 500 })
  }
}
