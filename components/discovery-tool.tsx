"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Send, Sparkles, DollarSign, TrendingUp } from "lucide-react"
import type { Franchise } from "@/lib/data"

interface DiscoveryToolProps {
  onNavigate: (view: string, franchiseId?: string) => void
  selectedForComparison: string[]
  onToggleComparison: (franchiseId: string) => void
}

interface Message {
  id: string
  type: "bot" | "user"
  content: string
}

interface Criteria {
  budget?: { min: number; max: number }
  industry?: string
  experience?: string
  timeline?: string
  status?: string
}

const QUESTIONS = [
  {
    id: "budget",
    question: "What's your investment budget range?",
    options: [
      { label: "Under $200K", value: { min: 0, max: 200000 } },
      { label: "$200K - $400K", value: { min: 200000, max: 400000 } },
      { label: "$400K - $700K", value: { min: 400000, max: 700000 } },
      { label: "Over $700K", value: { min: 700000, max: 10000000 } },
    ],
  },
  {
    id: "industry",
    question: "Which industry interests you most?",
    options: [
      { label: "Food & Beverage", value: "Food & Beverage" },
      { label: "Health & Fitness", value: "Health & Fitness" },
      { label: "Business Services", value: "Business Services" },
      { label: "Personal Services", value: "Personal Services" },
      { label: "Any Industry", value: "any" },
    ],
  },
  {
    id: "status",
    question: "What type of franchise are you interested in?",
    options: [
      { label: "Established (10+ years, proven track record)", value: "Established" },
      { label: "Trending (High growth, 10%+ unit expansion)", value: "Trending" },
      { label: "New (Emerging concepts, 2-3 years old)", value: "New" },
      { label: "Any Type", value: "any" },
    ],
  },
  {
    id: "experience",
    question: "What's your business experience level?",
    options: [
      { label: "First-time entrepreneur", value: "first-time" },
      { label: "Small business owner", value: "small-business" },
      { label: "Corporate management", value: "corporate" },
      { label: "Industry veteran", value: "veteran" },
    ],
  },
  {
    id: "timeline",
    question: "When are you looking to launch?",
    options: [
      { label: "1-3 months", value: "1-3 months" },
      { label: "3-6 months", value: "3-6 months" },
      { label: "6-12 months", value: "6-12 months" },
      { label: "12+ months", value: "12+ months" },
    ],
  },
]

export function DiscoveryTool({ onNavigate, selectedForComparison, onToggleComparison }: DiscoveryToolProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [criteria, setCriteria] = useState<Criteria>({})
  const [inputValue, setInputValue] = useState("")
  const [showOptions, setShowOptions] = useState(false)
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filteredFranchises, setFilteredFranchises] = useState<Franchise[]>([])
  const [showingRecommendations, setShowingRecommendations] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (messages.length === 0) {
      setTimeout(() => {
        addBotMessage(
          "Hi! I'm your AI Discovery Assistant. You can browse all franchises on the right, or I can help you find the perfect match based on your specific criteria. Would you like me to help you filter?",
        )
        setTimeout(() => {
          setShowOptions(true)
          addBotMessage("Would you like personalized recommendations?")
        }, 1000)
      }, 500)
    }
  }, [])

  const addBotMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: "bot",
      content,
    }
    setMessages((prev) => [...prev, newMessage])
  }

  const addUserMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content,
    }
    setMessages((prev) => [...prev, newMessage])
  }

  const askNextQuestion = () => {
    if (currentQuestion < QUESTIONS.length) {
      const question = QUESTIONS[currentQuestion]
      addBotMessage(question.question)
      setShowOptions(true)
    } else {
      showRecommendations()
    }
  }

  const handleOptionClick = (questionId: string, option: any) => {
    const question = QUESTIONS.find((q) => q.id === questionId)
    if (!question) return

    addUserMessage(option.label)
    setShowOptions(false)

    const newCriteria = { ...criteria }
    if (questionId === "budget") {
      newCriteria.budget = option.value
    } else if (questionId === "industry") {
      newCriteria.industry = option.value
    } else if (questionId === "status") {
      newCriteria.status = option.value
    } else if (questionId === "experience") {
      newCriteria.experience = option.value
    } else if (questionId === "timeline") {
      newCriteria.timeline = option.value
    }
    setCriteria(newCriteria)

    setTimeout(() => {
      setCurrentQuestion((prev) => prev + 1)
      if (currentQuestion + 1 < QUESTIONS.length) {
        setTimeout(() => {
          askNextQuestion()
        }, 500)
      } else {
        setTimeout(() => {
          showRecommendations(newCriteria)
        }, 500)
      }
    }, 300)
  }

  const filterFranchises = (criteriaToUse: Criteria = criteria): Franchise[] => {
    return franchises.filter((franchise) => {
      if (criteriaToUse.budget) {
        const { min, max } = criteriaToUse.budget
        if (franchise.investmentMin > max || franchise.investmentMax < min) {
          return false
        }
      }

      if (criteriaToUse.industry && criteriaToUse.industry !== "any") {
        if (franchise.industry !== criteriaToUse.industry) {
          return false
        }
      }

      if (criteriaToUse.status && criteriaToUse.status !== "any") {
        if (franchise.status !== criteriaToUse.status) {
          return false
        }
      }

      return true
    })
  }

  const showRecommendations = (criteriaToUse: Criteria = criteria) => {
    const filtered = filterFranchises(criteriaToUse)

    if (filtered.length === 0) {
      addBotMessage(
        "I couldn't find exact matches for your criteria, but let me show you some alternatives that might interest you.",
      )
      setFilteredFranchises(franchises.slice(0, 6))
    } else {
      const budgetText = criteriaToUse.budget
        ? `$${(criteriaToUse.budget.min / 1000).toFixed(0)}K-$${(criteriaToUse.budget.max / 1000).toFixed(0)}K`
        : "your budget"
      const industryText =
        criteriaToUse.industry && criteriaToUse.industry !== "any" ? criteriaToUse.industry : "various industries"

      addBotMessage(
        `Great! Based on your criteria (${budgetText}, ${industryText}), I found ${filtered.length} franchise${filtered.length > 1 ? "s" : ""} that match your goals. Check out the recommendations on the right!`,
      )
      setFilteredFranchises(filtered)
    }

    setShowingRecommendations(true)

    setTimeout(() => {
      addBotMessage(
        "Feel free to ask me any questions about these franchises, or let me know if you'd like to adjust your criteria!",
      )
    }, 1000)
  }

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    addUserMessage(inputValue)
    const userQuestion = inputValue.toLowerCase()
    setInputValue("")

    setTimeout(() => {
      if (userQuestion.includes("roi") || userQuestion.includes("return")) {
        addBotMessage(
          "ROI timeframes vary by franchise. For example, Subway typically sees ROI in 2-3 years, while Anytime Fitness takes 3-4 years. Would you like to see franchises with faster ROI?",
        )
      } else if (userQuestion.includes("support") || userQuestion.includes("training")) {
        addBotMessage(
          "All franchises offer training and support, but the level varies. Franchises with Item 19 data (like Subway and Anytime Fitness) typically provide more comprehensive support systems. Would you like to filter for franchises with Item 19?",
        )
      } else if (
        userQuestion.includes("change") ||
        userQuestion.includes("adjust") ||
        userQuestion.includes("different") ||
        userQuestion.includes("restart") ||
        userQuestion.includes("start over")
      ) {
        addBotMessage("I'd be happy to help you adjust your criteria! Let's start fresh.")
        setTimeout(() => {
          setCurrentQuestion(0)
          setCriteria({})
          setShowOptions(false)
          setFilteredFranchises(franchises)
          setMessages([])
          setTimeout(() => {
            addBotMessage(
              "Hi! I'm your AI Discovery Assistant. You can browse all franchises on the right, or I can help you find the perfect match based on your specific criteria. Would you like me to help you filter?",
            )
            setTimeout(() => {
              setShowOptions(true)
              addBotMessage("Would you like personalized recommendations?")
            }, 1000)
          }, 500)
        }, 1000)
      } else if (
        userQuestion.includes("more") ||
        userQuestion.includes("other") ||
        userQuestion.includes("additional") ||
        userQuestion.includes("all")
      ) {
        const currentFiltered = filterFranchises()
        if (currentFiltered.length > 0) {
          addBotMessage("Here are all the franchises that match your criteria - check the right panel!")
          setFilteredFranchises(currentFiltered)
          setShowingRecommendations(true)
        } else {
          addBotMessage("Let me show you more options!")
          setFilteredFranchises(franchises)
          setShowingRecommendations(true)
        }
      } else {
        addBotMessage(
          "That's a great question! I can help you with information about investment ranges, ROI timeframes, industry options, and more. You can also ask me to adjust your search criteria or show you different franchises.",
        )
      }
    }, 800)
  }

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Established":
        return "bg-blue-100 text-blue-700 hover:bg-blue-100"
      case "Trending":
        return "bg-purple-100 text-purple-700 hover:bg-purple-100"
      case "New":
        return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
      default:
        return ""
    }
  }

  useEffect(() => {
    const fetchFranchises = async () => {
      try {
        console.log("[v0] Fetching franchises from API...")
        const response = await fetch("/api/franchises/public")

        const data = await response.json()

        if (!response.ok) {
          console.error("[v0] API response not OK:", response.status, data.error)
          setIsLoading(false)
          return
        }

        const franchises = data.franchises || data || []
        console.log("[v0] Received franchise data:", franchises.length)

        if (!franchises || franchises.length === 0) {
          console.log("[v0] No franchises found in database")
          setFranchises([])
          setFilteredFranchises([])
          setIsLoading(false)
          return
        }

        const mappedFranchises: Franchise[] = franchises.map((f: any) => ({
          id: f.id,
          slug: f.slug,
          name: f.name,
          industry: f.industry || "Business Services",
          description: f.description || "",
          hasItem19: f.revenue_data?.item19_available || false,
          investmentMin: f.initial_investment_low || 0,
          investmentMax: f.initial_investment_high || 0,
          roiTimeframe: "3-5 years", // Default since not in schema
          avgRevenue: f.average_revenue,
          totalUnits: f.total_units,
          franchisedUnits: f.franchised_units,
          companyOwnedUnits: f.company_owned_units,
          status: "Established", // Default since not in schema
          opportunities: f.opportunities,
          concerns: f.concerns,
          investmentBreakdown: f.investment_breakdown,
          revenueData: f.revenue_data,
          stateDistribution: null, // Not in current schema
          analyticalSummary: null, // Not in current schema
          franchiseScore: f.franchise_score
            ? {
                overall: f.franchise_score,
                maxScore: 600,
                systemStability: { score: f.score_financial_performance || 0, max: 100 },
                supportQuality: { score: f.score_support_training || 0, max: 150 },
                growthTrajectory: { score: f.score_business_model || 0, max: 150 },
                financialDisclosure: { score: f.score_legal_compliance || 0, max: 100 },
                riskLevel: "MODERATE", // Default since not in schema
                industryPercentile: 50, // Default since not in schema
                breakdown: f.franchise_score_breakdown,
              }
            : undefined,
        }))

        console.log("[v0] Mapped franchises:", mappedFranchises.length)
        setFranchises(mappedFranchises)
        setFilteredFranchises(mappedFranchises)
      } catch (error) {
        console.error("[v0] Error fetching franchises:", error)
        // Don't crash the app, just show empty state
        setFranchises([])
        setFilteredFranchises([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchFranchises()
  }, [])

  return (
    <div className="grid gap-6 lg:grid-cols-2 h-[calc(100vh-12rem)]">
      {/* Left Panel - AI Chat Interface */}
      <Card className="flex flex-col bg-card border-border/50">
        {/* Chat Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-muted/30">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">AI Discovery Assistant</h3>
            <p className="text-xs text-muted-foreground">Find your perfect franchise match</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-lg px-4 py-3 ${
                  message.type === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground border border-border/30"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}

          {showOptions && messages.length === 2 && (
            <div className="flex justify-start">
              <div className="max-w-[85%] space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-primary/10 hover:border-primary/50 transition-all bg-transparent"
                  onClick={() => {
                    addUserMessage("Yes, help me find the best match")
                    setShowOptions(false)
                    setTimeout(() => {
                      setCurrentQuestion(0)
                      askNextQuestion()
                    }, 500)
                  }}
                >
                  <span className="text-sm font-medium">Yes, help me find the best match</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-primary/10 hover:border-primary/50 transition-all bg-transparent"
                  onClick={() => {
                    addUserMessage("No thanks, I'll browse on my own")
                    setShowOptions(false)
                    setTimeout(() => {
                      addBotMessage(
                        "No problem! Browse all franchises on the right. Feel free to ask me any questions about specific franchises or if you'd like help filtering later!",
                      )
                    }, 500)
                  }}
                >
                  <span className="text-sm font-medium">No thanks, I'll browse on my own</span>
                </Button>
              </div>
            </div>
          )}

          {showOptions && currentQuestion < QUESTIONS.length && messages.length > 2 && (
            <div className="flex justify-start">
              <div className="max-w-[85%] space-y-2">
                {QUESTIONS[currentQuestion].options.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-primary/10 hover:border-primary/50 transition-all bg-transparent"
                    onClick={() => handleOptionClick(QUESTIONS[currentQuestion].id, option)}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border/50 bg-muted/30">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask a question..."
              className="flex-1"
            />
            <Button onClick={handleSendMessage} size="icon" disabled={!inputValue.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Right Panel - Dynamic Recommendations */}
      <div className="space-y-4 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading franchises...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {filteredFranchises.length} Franchise{filteredFranchises.length !== 1 ? "s" : ""}
                {criteria.budget || criteria.industry ? " (Filtered)" : ""}
              </h3>
              {(criteria.budget || criteria.industry) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentQuestion(0)
                    setCriteria({})
                    setShowOptions(false)
                    setShowingRecommendations(true)
                    setFilteredFranchises(franchises)
                    addBotMessage("I've reset your filters. You're now viewing all franchises!")
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {filteredFranchises.map((franchise) => (
              <Card key={franchise.id} className="p-5 transition-all hover:shadow-lg hover:border-primary/50">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <Checkbox
                      checked={selectedForComparison.includes(franchise.id)}
                      onCheckedChange={() => onToggleComparison(franchise.id)}
                      disabled={!selectedForComparison.includes(franchise.id) && selectedForComparison.length >= 3}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{franchise.name}</h3>
                      <p className="text-sm text-muted-foreground">{franchise.industry}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {franchise.status && (
                      <Badge className={getStatusBadgeStyle(franchise.status)}>{franchise.status}</Badge>
                    )}
                    {franchise.hasItem19 && (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Item 19</Badge>
                    )}
                  </div>
                </div>

                <p className="mb-4 text-sm leading-relaxed">{franchise.description}</p>

                <div className="mb-4 flex gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>
                      ${(franchise.investmentMin / 1000).toFixed(0)}K - ${(franchise.investmentMax / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span>{franchise.roiTimeframe}</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-cta hover:bg-cta/90 text-cta-foreground font-medium"
                  onClick={() => onNavigate("fdd-viewer", franchise.slug || franchise.id)}
                >
                  View FDD Analysis →
                </Button>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
