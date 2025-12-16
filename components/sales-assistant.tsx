"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Send, 
  Mail, 
  Phone, 
  Globe, 
  Loader2, 
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  X,
  MessageSquare
} from "lucide-react"

// Type definitions
interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: Array<{ type: string; detail: string; url?: string }>
  suggestedActions?: string[]
  timestamp: Date
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

interface SalesAssistantDrawerProps {
  isOpen: boolean
  onClose: () => void
  leadContext: LeadContext
  leadId: string
}

export function SalesAssistantDrawer({ 
  isOpen,
  onClose,
  leadContext, 
  leadId, 
}: SalesAssistantDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [useWebSearch, setUseWebSearch] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // Add initial welcome message when drawer opens with a new lead
  useEffect(() => {
    if (isOpen && messages.length === 0 && leadContext.lead.name) {
      const welcomeMessage: Message = {
        id: "welcome",
        role: "assistant",
        content: `👋 Hi! I'm here to help you work with **${leadContext.lead.name}**.\n\nI can:\n• **Draft personalized emails** based on their FDD engagement\n• **Prepare call talking points** tailored to their interests\n• **Research their market** with web search\n\nTry the quick actions below or ask me anything!`,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, leadContext.lead.name, messages.length])

  // Handle sending a message
  const handleSend = async (messageText?: string) => {
    const text = messageText || inputValue.trim()
    if (!text || isLoading) return

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      // Build history for multi-turn conversation
      const history = messages
        .filter(m => m.id !== "welcome")
        .map(m => ({
          role: m.role,
          content: m.content
        }))

      const response = await fetch("/api/hub/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          leadId,
          leadContext,
          useWebSearch,
          history
        })
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      // Add assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        suggestedActions: data.suggestedActions,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error("[SalesAssistant] Error:", error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle quick actions
  const handleQuickAction = (action: "email" | "call" | "market") => {
    const leadName = leadContext.lead.name.split(" ")[0] // First name
    const brand = leadContext.brand.name
    const location = leadContext.lead.location

    switch (action) {
      case "email":
        handleSend(`Draft a personalized follow-up email for ${leadName}`)
        break
      case "call":
        handleSend(`Prepare talking points for my call with ${leadName}`)
        break
      case "market":
        setUseWebSearch(true)
        handleSend(`What's the market like for ${brand} in ${location || "their area"}?`)
        break
    }
  }

  // Copy message content to clipboard
  const handleCopy = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  // Check if content looks like an email (has Subject: line)
  const isEmailContent = (content: string) => {
    return content.toLowerCase().includes("subject:") || 
           (content.toLowerCase().includes("dear ") && content.includes("[Your Name]")) ||
           (content.toLowerCase().includes("hi ") && content.includes("[Your Name]"))
  }

  // Render message content with markdown-like formatting
  const renderMessageContent = (content: string) => {
    const lines = content.split("\n")
    const elements: JSX.Element[] = []
    
    lines.forEach((line, index) => {
      // Bold text
      const boldParsed = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      
      // Bullet points
      if (line.trim().startsWith("•") || line.trim().startsWith("-") || line.trim().startsWith("*")) {
        elements.push(
          <div key={index} className="flex items-start gap-2 ml-2 my-1">
            <span className="text-primary mt-0.5">•</span>
            <span dangerouslySetInnerHTML={{ __html: boldParsed.replace(/^[•\-\*]\s*/, '') }} />
          </div>
        )
      } else if (line.trim()) {
        elements.push(
          <p key={index} dangerouslySetInnerHTML={{ __html: boldParsed }} className="my-1" />
        )
      } else {
        elements.push(<div key={index} className="h-2" />)
      }
    })
    
    return elements
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop - semi-transparent to still see the modal */}
      <div 
        className="fixed inset-0 bg-black/20 z-[60]"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={`fixed right-0 top-0 h-full w-[450px] max-w-[90vw] bg-white shadow-2xl z-[70] flex flex-col transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Sales Assistant</h2>
              <p className="text-sm text-muted-foreground">
                Working with {leadContext.lead.name}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl p-4 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="text-sm leading-relaxed">
                    {renderMessageContent(message.content)}
                  </div>

                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200/50">
                      <p className="text-xs text-muted-foreground mb-2">Sources:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {message.sources.map((source, idx) => (
                          <Badge 
                            key={idx} 
                            variant="outline" 
                            className="text-xs py-0.5"
                          >
                            {source.type === "engagement" && "📊"}
                            {source.type === "qualification" && "💰"}
                            {source.type === "web" && "🌐"}
                            {" "}{source.detail}
                            {source.url && (
                              <a 
                                href={source.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="ml-1"
                              >
                                <ExternalLink className="h-3 w-3 inline" />
                              </a>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Copy button for emails */}
                  {message.role === "assistant" && isEmailContent(message.content) && (
                    <div className="mt-3 pt-3 border-t border-gray-200/50">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(message.id, message.content)}
                        className="h-8 text-xs"
                      >
                        {copiedMessageId === message.id ? (
                          <>
                            <Check className="h-3 w-3 mr-1.5" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1.5" />
                            Copy Email
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        <div className="px-4 py-3 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground mb-2">Quick Actions</p>
          <div className="flex flex-wrap gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction("email")}
                    disabled={isLoading}
                    className="h-8"
                  >
                    <Mail className="h-3.5 w-3.5 mr-1.5" />
                    Draft Email
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Draft a personalized follow-up email</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction("call")}
                    disabled={isLoading}
                    className="h-8"
                  >
                    <Phone className="h-3.5 w-3.5 mr-1.5" />
                    Call Prep
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Prepare talking points for your call</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={useWebSearch ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleQuickAction("market")}
                    disabled={isLoading}
                    className="h-8"
                  >
                    <Globe className="h-3.5 w-3.5 mr-1.5" />
                    Market Intel
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Research their market with web search</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder={`Ask about ${leadContext.lead.name.split(" ")[0]}...`}
                disabled={isLoading}
                className="pr-10"
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUseWebSearch(!useWebSearch)}
                      className={`absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 ${
                        useWebSearch ? "text-primary bg-primary/10" : "text-muted-foreground"
                      }`}
                    >
                      <Globe className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{useWebSearch ? "Web search enabled" : "Enable web search"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isLoading}
              size="sm"
              className="h-10 px-4"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Web search indicator */}
          {useWebSearch && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-primary">
              <Globe className="h-3 w-3" />
              Web search enabled - will research market data
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Trigger button to open the drawer from the modal
interface SalesAssistantTriggerProps {
  onClick: () => void
  leadName: string
}

export function SalesAssistantTrigger({ onClick, leadName }: SalesAssistantTriggerProps) {
  return (
    <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold">Sales Assistant</h3>
            <p className="text-sm text-muted-foreground">
              Draft emails, prepare calls, research markets
            </p>
          </div>
        </div>
        <Button onClick={onClick} className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
          <MessageSquare className="h-4 w-4 mr-2" />
          Open Assistant
        </Button>
      </div>
    </div>
  )
}
