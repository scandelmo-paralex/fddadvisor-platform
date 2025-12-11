import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import Anthropic from "@anthropic-ai/sdk"

const CONFIDENCE_THRESHOLD = 0.4

type FPRIntent =
  | "personal_earnings_projection" // "How much will I make?"
  | "calculation_request" // "Calculate my expected earnings"
  | "investment_advice" // "Should I invest?", "Is this worth it?"
  | null

interface FPRDetectionResult {
  intent: FPRIntent
  shouldRedirect: boolean
  friendlyResponse: string
  suggestedAction?: "navigate_item19" | "navigate_item7" | "navigate_item20" | "show_fdd_data"
}

function detectFPRIntent(query: string): FPRDetectionResult {
  const lowerQuery = query.toLowerCase()

  // ALLOW these patterns - legitimate questions about FDD content:
  // - "What does Item 19 say?"
  // - "What is the average revenue disclosed?"
  // - "Show me the financial performance data"
  // - "What are the gross sales figures?"
  // - "How many locations are profitable?"
  const allowedPatterns = [
    /what (does|do|is|are|did).*(item.?19|fdd|disclose|say|show|report|state)/i,
    /show me.*(item.?19|financial|data|disclosure|figures)/i,
    /what.*(disclosed|reported|stated|shown)/i,
    /tell me about.*(item.?19|financial performance|disclosure)/i,
    /explain.*(item.?19|financial|data)/i,
    /summarize.*(item.?19|financial)/i,
    /how many.*(locations?|franchisees?|units?)/i,
    /what is the.*(average|median|range|breakdown).*(revenue|sales|figure)/i,
  ]
  
  for (const pattern of allowedPatterns) {
    if (pattern.test(query)) {
      console.log("[v0] FPR Check: Query matches allowed pattern, proceeding with answer")
      return { intent: null, shouldRedirect: false, friendlyResponse: "" }
    }
  }

  // BLOCK: Personal earnings projections - "How much will/can I make?"
  if (
    /how much (can|will|could|would|should) (i|we|you|someone|a franchisee) (make|earn|profit|take home|expect)/i.test(query) ||
    /what (can|could|will|would|should) (i|we|my|someone) expect to (make|earn)/i.test(query) ||
    /what (will|would) (i|we|my) (earnings|income|profit|salary) be/i.test(query)
  ) {
    return {
      intent: "personal_earnings_projection",
      shouldRedirect: true,
      suggestedAction: "navigate_item19",
      friendlyResponse: `I can't predict what you'll personally earn—every franchisee's results depend on location, market, and how they operate.

**But I can show you the actual data:**
Item 19 contains the franchisor's disclosed financial performance figures from existing locations. Would you like me to walk you through what they've reported?

You can also contact current franchisees listed in Item 20 for firsthand insights.`,
    }
  }

  // BLOCK: Calculation/projection requests
  if (
    /(calculate|compute|estimate|project|predict|forecast) (my|the|expected|potential|likely|projected)/i.test(query) &&
    /(earnings|income|revenue|profit|sales|return|roi)/i.test(query)
  ) {
    return {
      intent: "calculation_request",
      shouldRedirect: true,
      suggestedAction: "show_fdd_data",
      friendlyResponse: `I can't calculate projected earnings—regulations prevent predictions of individual results.

**What I can do:**
- Show you Item 19's disclosed financial figures
- Pull up Item 7's investment breakdown
- Help you understand the data so you can run your own analysis

Would you like me to gather the disclosed figures for you?`,
    }
  }

  // BLOCK: Direct investment advice requests
  if (
    /should (i|we) (invest|buy|purchase|get into|do this)/i.test(query) ||
    /is (this|it) (a )?(good|bad|smart|wise|worth|worthwhile) (investment|opportunity|idea|decision|franchise)/i.test(query) ||
    /do you recommend/i.test(query) ||
    /worth (it|buying|the investment|my money)/i.test(query)
  ) {
    return {
      intent: "investment_advice",
      shouldRedirect: true,
      suggestedAction: "show_fdd_data",
      friendlyResponse: `That's a decision only you can make—I can't advise on whether to invest.

**Here's how I can help you decide:**
- Walk through Item 19's financial disclosures (if provided)
- Show you the investment costs in Item 7
- Highlight litigation history (Item 3) and unit turnover (Item 20)

A franchise attorney and accountant are essential partners in evaluating this. What data would be most helpful for you to review?`,
    }
  }

  // No FPR issue detected - allow the question
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
