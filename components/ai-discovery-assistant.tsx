"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { MessageCircle, X, Send, Sparkles } from "lucide-react"
import { franchises, type Franchise } from "@/lib/data"

interface Message {
  id: string
  type: "bot" | "user"
  content: string
  recommendations?: Franchise[]
}

interface Criteria {
  budget?: { min: number; max: number }
  industry?: string
  status?: string
  experience?: string
  location?: string
  timeline?: string
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

export function AIDiscoveryAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [criteria, setCriteria] = useState<Criteria>({})
  const [inputValue, setInputValue] = useState("")
  const [showOptions, setShowOptions] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initial greeting
      setTimeout(() => {
        addBotMessage(
          "Hi! I'm your AI Discovery Assistant. I'll help you find the perfect franchise match based on your goals and criteria. Let's get started!",
        )
        setTimeout(() => {
          askNextQuestion()
        }, 1000)
      }, 500)
    }
  }, [isOpen])

  const addBotMessage = (content: string, recommendations?: Franchise[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: "bot",
      content,
      recommendations,
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
      // All questions answered, show recommendations
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
        franchises.slice(0, 3),
      )
    } else {
      const budgetText = criteriaToUse.budget
        ? `$${(criteriaToUse.budget.min / 1000).toFixed(0)}K-$${(criteriaToUse.budget.max / 1000).toFixed(0)}K`
        : "your budget"
      const industryText =
        criteriaToUse.industry && criteriaToUse.industry !== "any" ? criteriaToUse.industry : "various industries"
      const statusText = criteriaToUse.status && criteriaToUse.status !== "any" ? criteriaToUse.status : "any type"

      addBotMessage(
        `Great! Based on your criteria (${budgetText}, ${industryText}, ${statusText}), I found ${filtered.length} franchise${filtered.length > 1 ? "s" : ""} that match your goals. Here are my top recommendations:`,
        filtered,
      )
    }

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
        userQuestion.includes("different")
      ) {
        addBotMessage("I'd be happy to help you adjust your criteria! What would you like to change?")
        setTimeout(() => {
          setCurrentQuestion(0)
          setCriteria({})
          setShowOptions(false)
          setTimeout(() => {
            askNextQuestion()
          }, 500)
        }, 1000)
      } else if (
        userQuestion.includes("more") ||
        userQuestion.includes("other") ||
        userQuestion.includes("additional")
      ) {
        const currentFiltered = filterFranchises()
        if (currentFiltered.length > 0) {
          addBotMessage("Here are all the franchises that match your criteria:", currentFiltered)
        } else {
          addBotMessage("Let me show you more options:", franchises)
        }
      } else {
        addBotMessage(
          "That's a great question! I can help you with information about investment ranges, ROI timeframes, industry options, and more. You can also ask me to adjust your search criteria or show you different franchises.",
        )
      }
    }, 800)
  }

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary shadow-lg hover:bg-primary/90 hover:shadow-xl transition-all"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-[400px] h-[600px] flex flex-col shadow-2xl border-border/50 bg-card">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">AI Discovery Assistant</h3>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>

                  {/* Recommendations */}
                  {message.recommendations && message.recommendations.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.recommendations.map((franchise) => (
                        <div key={franchise.id} className="bg-background/50 rounded-lg p-3 border border-border/30">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm">{franchise.name}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">{franchise.industry}</p>
                              <p className="text-xs mt-1">
                                ${(franchise.investmentMin / 1000).toFixed(0)}K - $
                                {(franchise.investmentMax / 1000).toFixed(0)}K
                              </p>
                            </div>
                            {franchise.hasItem19 && (
                              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Item 19</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Options */}
            {showOptions && currentQuestion < QUESTIONS.length && (
              <div className="flex justify-start">
                <div className="max-w-[80%] space-y-2">
                  {QUESTIONS[currentQuestion].options.map((option, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-2 px-3 hover:bg-primary/10 hover:border-primary/50 bg-transparent"
                      onClick={() => handleOptionClick(QUESTIONS[currentQuestion].id, option)}
                    >
                      <span className="text-sm">{option.label}</span>
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
      )}
    </>
  )
}
