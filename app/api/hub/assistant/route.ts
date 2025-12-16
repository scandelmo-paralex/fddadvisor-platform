import { getSupabaseRouteClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Type definitions
interface Message {
  role: "user" | "assistant"
  content: string
}

interface LeadContext {
  lead: {
    name: string
    email: string
    phone?: string
    location?: string
    timeline?: string
    source?: string
  }
  brand: {
    name: string
    industry?: string
    investmentRange?: string
  }
  engagement: {
    totalTime: string
    sessions: number
    sectionsViewed: string[]
    questionsAsked: string[]
  }
  qualification: {
    liquidCapital?: string
    netWorth?: string
    experience?: string
    financialFit?: string
    yearsOfExperience?: number
    hasOwnedBusiness?: boolean
    managementExperience?: boolean
  }
  computed: {
    qualityScore: number
    intentLevel: string
    engagementTier: string
  }
}

interface AssistantRequest {
  question: string
  leadId: string
  leadContext: LeadContext
  useWebSearch: boolean
  history: Message[]
}

interface WebSearchResult {
  title: string
  url: string
  snippet: string
}

// Perplexity API for web search
async function searchWeb(query: string): Promise<{ answer: string; sources: WebSearchResult[] }> {
  const perplexityApiKey = process.env.PERPLEXITY_API_KEY
  
  if (!perplexityApiKey) {
    console.warn("[SalesAssistant] No Perplexity API key configured")
    return { answer: "", sources: [] }
  }

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${perplexityApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content: "You are a market research assistant. Provide concise, factual information about markets, demographics, and business opportunities. Focus on data that would help franchise sales decisions."
          },
          {
            role: "user",
            content: query
          }
        ],
        temperature: 0.2,
        max_tokens: 1024,
        return_citations: true,
      }),
    })

    if (!response.ok) {
      console.error("[SalesAssistant] Perplexity API error:", response.status)
      return { answer: "", sources: [] }
    }

    const data = await response.json()
    const answer = data.choices?.[0]?.message?.content || ""
    
    // Extract citations if available
    const sources: WebSearchResult[] = (data.citations || []).map((citation: string, index: number) => ({
      title: `Source ${index + 1}`,
      url: citation,
      snippet: ""
    }))

    return { answer, sources }
  } catch (error) {
    console.error("[SalesAssistant] Web search error:", error)
    return { answer: "", sources: [] }
  }
}

// Build system prompt for the assistant
function buildSystemPrompt(context: LeadContext, franchisorName: string): string {
  const { lead, brand, engagement, qualification, computed } = context

  return `You are a helpful sales assistant for ${franchisorName}, helping franchise sales professionals work with leads for ${brand.name}.

## YOUR ROLE
You help franchisors:
1. Draft personalized follow-up emails based on lead engagement
2. Prepare talking points and questions for discovery calls
3. Analyze lead behavior and suggest approaches
4. Research markets when web search is enabled

## LEAD CONTEXT
**Lead Name:** ${lead.name}
**Email:** ${lead.email}
**Phone:** ${lead.phone || "Not provided"}
**Location:** ${lead.location || "Not provided"}
**Timeline:** ${lead.timeline || "Not specified"}
**Lead Source:** ${lead.source || "Direct"}

## BRAND
**Franchise:** ${brand.name}
${brand.industry ? `**Industry:** ${brand.industry}` : ""}
${brand.investmentRange ? `**Investment Range:** ${brand.investmentRange}` : ""}

## ENGAGEMENT DATA
**Quality Score:** ${computed.qualityScore}/100 (${computed.intentLevel})
**Engagement Tier:** ${computed.engagementTier}
**Total Viewing Time:** ${engagement.totalTime}
**Sessions:** ${engagement.sessions}
**Sections Viewed:** ${engagement.sectionsViewed.length > 0 ? engagement.sectionsViewed.join(", ") : "None recorded"}
**Questions Asked to FDD AI:** ${engagement.questionsAsked.length > 0 ? engagement.questionsAsked.map(q => `"${q}"`).join(", ") : "None"}

## QUALIFICATION DATA
${qualification.liquidCapital ? `**Liquid Capital:** ${qualification.liquidCapital}` : ""}
${qualification.netWorth ? `**Net Worth:** ${qualification.netWorth}` : ""}
${qualification.financialFit ? `**Financial Fit:** ${qualification.financialFit}` : ""}
${qualification.yearsOfExperience ? `**Experience:** ${qualification.yearsOfExperience} years` : ""}
${qualification.hasOwnedBusiness ? "**Previous Business Owner:** Yes" : ""}
${qualification.managementExperience ? "**Management Experience:** Yes" : ""}

## IMPORTANT RULES
1. **Be specific** - Reference their actual questions, viewing behavior, and qualification data
2. **Keep emails concise** - Professional, ready to send (no [brackets] or placeholders)
3. **Never make financial projections** - No earnings claims, ROI promises, or revenue estimates
4. **Personalize everything** - Use their name, location, timeline, and specific interests
5. **When drafting emails:**
   - Subject line included
   - Professional greeting
   - Reference specific things they looked at
   - Clear call to action
   - Your signature placeholder: [Your Name]
6. **For call prep:**
   - Bullet point talking points
   - Questions to ask them
   - Anticipated objections
7. **Be helpful and actionable** - Every response should give the salesperson something they can use immediately`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseRouteClient()

    if (!supabase) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is a franchisor (owner or team member)
    const { data: profile } = await supabase
      .from("franchisor_profiles")
      .select("id, company_name")
      .eq("user_id", user.id)
      .single()

    let franchisorId: string
    let franchisorName: string = "Your Team"

    if (profile) {
      franchisorId = profile.id
      franchisorName = profile.company_name || "Your Team"
    } else {
      // Check if team member
      const { data: teamMember } = await supabase
        .from("franchisor_team_members")
        .select("franchisor_id, franchisor_profiles(company_name)")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single()

      if (!teamMember) {
        return NextResponse.json({ error: "Not authorized as franchisor" }, { status: 403 })
      }

      franchisorId = teamMember.franchisor_id
      // @ts-ignore - nested select returns object
      franchisorName = teamMember.franchisor_profiles?.company_name || "Your Team"
    }

    // Parse request body
    const body: AssistantRequest = await request.json()
    const { question, leadId, leadContext, useWebSearch, history } = body

    if (!question || !leadContext) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Initialize Gemini
    const googleApiKey = process.env.GOOGLE_API_KEY
    if (!googleApiKey) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(googleApiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    // Build conversation history for multi-turn
    const conversationHistory = history.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }))

    // If web search is enabled and the question seems like a market research query
    let webContext = ""
    let webSources: WebSearchResult[] = []
    
    if (useWebSearch) {
      const searchQuery = `${leadContext.brand.name} franchise market opportunity in ${leadContext.lead.location || "the United States"}: ${question}`
      const webResult = await searchWeb(searchQuery)
      
      if (webResult.answer) {
        webContext = `\n\n## WEB SEARCH RESULTS\nThe following market research was found:\n\n${webResult.answer}`
        webSources = webResult.sources
      }
    }

    // Build the system prompt with lead context
    const systemPrompt = buildSystemPrompt(leadContext, franchisorName)
    
    // Create the full prompt with context
    const fullPrompt = `${systemPrompt}${webContext}

## USER REQUEST
${question}

Please provide a helpful, specific response. If drafting an email, make it complete and ready to send.`

    try {
      // Start chat with history
      const chat = model.startChat({
        history: conversationHistory.length > 0 ? conversationHistory : undefined,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      })

      const result = await chat.sendMessage(fullPrompt)
      const responseText = result.response.text()

      // Build sources array
      const sources: Array<{ type: string; detail: string; url?: string }> = []
      
      // Add engagement source
      if (leadContext.engagement.sectionsViewed.length > 0 || leadContext.engagement.questionsAsked.length > 0) {
        sources.push({
          type: "engagement",
          detail: `Based on ${leadContext.engagement.totalTime} of FDD review across ${leadContext.engagement.sessions} sessions`
        })
      }

      // Add qualification source
      if (leadContext.qualification.liquidCapital || leadContext.qualification.netWorth) {
        sources.push({
          type: "qualification",
          detail: "Self-reported financial qualification data"
        })
      }

      // Add web sources
      for (const webSource of webSources) {
        sources.push({
          type: "web",
          detail: webSource.title,
          url: webSource.url
        })
      }

      // Generate suggested actions based on context
      const suggestedActions: string[] = []
      
      if (leadContext.computed.engagementTier === "high" || leadContext.computed.engagementTier === "meaningful") {
        suggestedActions.push("Schedule a discovery call")
      }
      
      if (leadContext.engagement.questionsAsked.length > 0) {
        suggestedActions.push("Review their FDD questions")
      }
      
      if (!leadContext.qualification.liquidCapital) {
        suggestedActions.push("Request financial qualification")
      }

      return NextResponse.json({
        answer: responseText,
        sources: sources.length > 0 ? sources : undefined,
        suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined
      })

    } catch (aiError: any) {
      console.error("[SalesAssistant] AI generation error:", aiError)
      return NextResponse.json(
        { error: "Failed to generate response", details: aiError.message },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error("[SalesAssistant] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
