"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { MessageCircle, X, Send, Lightbulb, Loader2, FileText, Eye, Globe } from "lucide-react"
import type { Franchise } from "@/lib/data"

interface Message {
  id: string
  type: "bot" | "user"
  content: string
  thinking?: string
  sources?: Array<string | { item?: string; page?: number; text?: string; url?: string }>
  confidence?: number
  usedVision?: boolean
  usedWebSearch?: boolean
}

interface FDDAIChatProps {
  franchise: Franchise
  onQuestionAsked: (question: string) => void
  questionsAsked: string[]
  onNavigateToPage?: (page: number) => void
  fddId?: string
  captureCurrentPage?: () => Promise<string | null>
  currentPage?: number
}

export function FDDAIChat({
  franchise,
  onQuestionAsked,
  questionsAsked,
  onNavigateToPage,
  fddId,
  captureCurrentPage,
  currentPage,
}: FDDAIChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [useVisionMode, setUseVisionMode] = useState(false)
  const [useWebSearch, setUseWebSearch] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setTimeout(() => {
        addBotMessage(
          `Hi! I'm here to help you understand the ${franchise.name} FDD. Ask me anything about their investment requirements, training, fees, territory rights, or financial performance disclosures.\n\n⚠️ This assistant is AI-powered and can make mistakes. Responses are based solely on FDD content and are not affiliated with ${franchise.name}. Always verify information and consult with professional advisors before making investment decisions.`,
        )
      }, 500)
    }
  }, [isOpen])

  const addBotMessage = (
    content: string,
    sources?: Array<string | { item?: string; page?: number; text?: string; url?: string }>,
    thinking?: string,
    confidence?: number,
    usedVision?: boolean,
    usedWebSearch?: boolean,
  ) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: "bot",
      content,
      thinking,
      sources,
      confidence,
      usedVision,
      usedWebSearch,
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

  const handleSuggestedQuestion = (question: string) => {
    handleAskQuestion(question)
  }

  const handleAskQuestion = async (question: string) => {
    if (!fddId) {
      console.error("[v0] AI Chat: No FDD ID provided")
      addBotMessage("Sorry, I cannot answer questions without an FDD ID.")
      return
    }

    console.log("[v0] AI Chat: Asking question with FDD ID:", fddId)
    console.log("[v0] AI Chat: Vision mode enabled:", useVisionMode)
    console.log("[v0] AI Chat: Web search enabled:", useWebSearch)
    addUserMessage(question)
    onQuestionAsked(question)
    setIsLoading(true)

    try {
      let pageImages: string[] = []
      if (captureCurrentPage) {
        console.log("[v0] AI Chat: Capturing current page for potential Vision fallback...")
        const pageImage = await captureCurrentPage()
        if (pageImage) {
          pageImages = [pageImage]
          console.log("[v0] AI Chat: Page captured successfully")
        } else {
          console.warn("[v0] AI Chat: Failed to capture page")
        }
      }

      console.log("[v0] AI Chat: Sending question to semantic search API:", question)
      console.log("[v0] AI Chat: Including", pageImages.length, "page images for fallback")

      const response = await fetch(`/api/fdd/${fddId}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: question,
          limit: 5,
          pageImages,
          currentPage,
          forceVision: useVisionMode,
          useWebSearch,
          franchiseName: franchise.name,
        }),
      })

      console.log("[v0] AI Chat: Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("[v0] AI Chat: API error response:", response.status, errorData)
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] AI Chat: Received response:")
      console.log("[v0] AI Chat: - Answer length:", data.answer?.length || 0)
      console.log("[v0] AI Chat: - Sources count:", data.sources?.length || 0)
      console.log("[v0] AI Chat: - Confidence:", data.confidence)
      console.log("[v0] AI Chat: - Used Vision:", data.usedVision)
      console.log("[v0] AI Chat: - Used Web Search:", data.usedWebSearch)

      if (!data.answer) {
        throw new Error("Invalid response from server - no answer provided")
      }

      setTimeout(() => {
        addBotMessage(
          data.answer,
          data.sources || [],
          data.thinking,
          data.confidence,
          data.usedVision,
          data.usedWebSearch,
        )
        setIsLoading(false)
      }, 500)
    } catch (error) {
      console.error("[v0] AI Chat: Error asking question:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

      setTimeout(() => {
        addBotMessage(
          `I'm sorry, I encountered an error: ${errorMessage}. Please try again or contact support if the issue persists.`,
        )
        setIsLoading(false)
      }, 500)
    }
  }

  const handleSendMessage = () => {
    if (!inputValue.trim() || isLoading) return
    handleAskQuestion(inputValue)
    setInputValue("")
  }

  const unusedSuggestions = SUGGESTED_QUESTIONS.filter((q) => !questionsAsked.includes(q))

  return (
    <>
      {/* AI Chat Button - Repositioned for mobile */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          data-tour="ai-chat-button"
          className="fixed z-50 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 shadow-xl hover:shadow-2xl hover:scale-105 transition-all border-2 border-blue-400/20
            /* Mobile: bottom center, smaller */
            bottom-4 left-1/2 -translate-x-1/2 h-14 w-14
            /* Desktop: bottom right, larger */
            md:bottom-20 md:right-24 md:left-auto md:translate-x-0 md:h-20 md:w-20"
          size="icon"
          title="Ask AI Assistant"
        >
          {/* Paralex Logo Icon */}
          <svg viewBox="200 250 500 500" className="h-10 w-10 md:h-16 md:w-16">
            <circle cx="287.3" cy="500" r="25.58" fill="#fff" />
            <circle cx="389.64" cy="500" r="38.38" fill="#fff" />
            <circle cx="632.7" cy="699.41" r="25.58" fill="#fff" />
            <circle cx="581.53" cy="610.78" r="38.38" fill="#fff" />
            <circle cx="632.7" cy="300.58" r="25.58" fill="#fff" />
            <circle cx="581.53" cy="389.21" r="38.38" fill="#fff" />
            <circle cx="517.57" cy="500" r="51.17" fill="#fff" />
          </svg>
        </Button>
      )}

      {/* Chat Panel - Full screen on mobile, positioned on desktop */}
      {isOpen && (
        <Card className="fixed z-50 flex flex-col shadow-2xl border-border/60 bg-white dark:bg-slate-900 overflow-hidden
          /* Mobile: full screen with safe area padding */
          inset-0 rounded-none
          /* Desktop: positioned bottom right */
          md:inset-auto md:bottom-20 md:right-24 md:w-[380px] md:h-[560px] md:rounded-2xl">
          <div className="flex items-center justify-between p-4 border-b border-border/60 bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border border-white/30 p-1.5">
                <svg viewBox="0 0 1000 1000" className="h-full w-full">
                  <circle cx="287.3" cy="500" r="25.58" fill="#fff" />
                  <circle cx="389.64" cy="500" r="38.38" fill="#fff" />
                  <circle cx="632.7" cy="699.41" r="25.58" fill="#fff" />
                  <circle cx="581.53" cy="610.78" r="38.38" fill="#fff" />
                  <circle cx="632.7" cy="300.58" r="25.58" fill="#fff" />
                  <circle cx="581.53" cy="389.21" r="38.38" fill="#fff" />
                  <circle cx="517.57" cy="500" r="51.17" fill="#fff" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">FDDHub Assistant</h3>
                <p className="text-xs text-blue-100">Powered by Paralex</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setUseVisionMode(!useVisionMode)}
                className={`h-9 w-9 ${useVisionMode ? "bg-white/30 text-white" : "text-white/70 hover:bg-white/20 hover:text-white"}`}
                title={
                  useVisionMode
                    ? "Vision Mode ON - Will analyze current page"
                    : "Vision Mode OFF - Using semantic search only"
                }
              >
                <Eye className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-9 w-9 text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {useWebSearch && (
            <div className="px-4 py-2 bg-green-50 dark:bg-green-950/30 border-b border-green-200 dark:border-green-800">
              <p className="text-xs text-green-700 dark:text-green-300 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                Web Search: I'll search the web for reviews, news, and additional context about {franchise.name}
              </p>
            </div>
          )}

          {useVisionMode && (
            <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                Vision Mode: I'll analyze page {currentPage || "?"} to answer your question
              </p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-blue-50/30 to-transparent dark:from-blue-950/20">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    message.type === "user"
                      ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md"
                      : "bg-white dark:bg-gray-800 text-foreground border border-border/60 shadow-sm"
                  }`}
                >
                  {message.type === "bot" && message.thinking && (
                    <div className="mb-2 pb-2 border-b border-border/40">
                      <p className="text-xs text-muted-foreground italic flex items-center gap-1">
                        {message.usedWebSearch ? (
                          <Globe className="h-3 w-3" />
                        ) : message.usedVision ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          "💭"
                        )}{" "}
                        {message.thinking}
                      </p>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  {message.type === "bot" && message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/40 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {message.usedWebSearch ? (
                          <Globe className="h-3.5 w-3.5" />
                        ) : (
                          <FileText className="h-3.5 w-3.5" />
                        )}
                        <span>Sources:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {message.sources.map((source, idx) => {
                          let pageNum: number | null = null
                          let displayText = "Source"
                          let url: string | null = null

                          if (typeof source === "object" && source !== null) {
                            if (source.url) {
                              url = source.url
                              displayText = source.text || new URL(source.url).hostname
                            } else if (source.item) {
                              displayText = `Item ${source.item}`
                              pageNum = source.page || null
                            } else if (source.page) {
                              displayText = `Page ${source.page}`
                              pageNum = source.page
                            }
                          } else if (typeof source === "string") {
                            const pageMatch = source.match(/(?:page|p\.?)\s*(\d+)/i)
                            pageNum = pageMatch ? Number.parseInt(pageMatch[1]) : null
                            displayText = source
                          }

                          return (
                            <Button
                              key={idx}
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs bg-transparent"
                              onClick={() => {
                                if (url) {
                                  window.open(url, "_blank", "noopener,noreferrer")
                                } else if (onNavigateToPage && pageNum) {
                                  console.log("[v0] AI Chat: Navigate to page:", pageNum)
                                  onNavigateToPage(pageNum)
                                  // Close chat on mobile after navigation
                                  if (window.innerWidth < 768) {
                                    setIsOpen(false)
                                  }
                                }
                              }}
                              disabled={!pageNum && !url}
                            >
                              {displayText}
                            </Button>
                          )
                        })}
                      </div>
                      {message.confidence !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          Confidence: {Math.round(message.confidence * 100)}%
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 border border-border/60 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-sm">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <p className="text-sm text-muted-foreground">
                    {useWebSearch
                      ? "Searching the web..."
                      : useVisionMode
                        ? "Analyzing page with Vision..."
                        : "Searching FDD..."}
                  </p>
                </div>
              </div>
            )}

            {unusedSuggestions.length > 0 && messages.length > 0 && !isLoading && (
              <div className="space-y-2 pt-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Lightbulb className="h-4 w-4" />
                  <span>Suggested questions ({unusedSuggestions.length} remaining):</span>
                </div>
                <div className="space-y-1.5">
                  {unusedSuggestions.slice(0, 3).map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start text-left h-9 py-2.5 px-3 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-700 text-xs bg-white dark:bg-gray-800 border-border/60 rounded-xl"
                      onClick={() => handleSuggestedQuestion(question)}
                      disabled={isLoading}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-border/60 bg-muted/30 pb-safe">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSendMessage()}
                placeholder={
                  useWebSearch
                    ? "Ask about this franchise (with web search)..."
                    : useVisionMode
                      ? "Ask about this page..."
                      : "Ask about this franchise..."
                }
                className="flex-1 rounded-xl border-border/60 bg-white dark:bg-gray-800"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                size="icon"
                disabled={!inputValue.trim() || isLoading}
                className="bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl h-10 w-10"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  )
}

const SUGGESTED_QUESTIONS = [
  "What are the initial investment requirements?",
  "What training and support does the franchisor provide?",
  "What are the ongoing fees and royalties?",
  "What are the territory rights and restrictions?",
  "How many franchisees have left the system recently?",
  "What financing options are available?",
  "What does Item 19 say about financial performance?",
]
