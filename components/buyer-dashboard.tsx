"use client"

import { useState } from "react"
import {
  TrendingUp,
  Heart,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Upload,
  Clock,
  ChevronDown,
  GitCompare,
  FileText,
  AlertCircle,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { PreApprovalModal } from "@/components/pre-approval-modal"
import { FranchiseProgressCard } from "@/components/franchise-progress-card"
import { franchises, stats, fddEngagements, franchisePreApprovals } from "@/lib/data"
import type { BuyerProfile } from "@/lib/data"

interface BuyerDashboardProps {
  onNavigate: (view: string, franchiseId?: string) => void
  onOpenModal: (type: string) => void
  theme: "light" | "dark"
  onToggleTheme: () => void
  buyerProfile: BuyerProfile
}

export function BuyerDashboard({ onNavigate, onOpenModal, theme, onToggleTheme, buyerProfile }: BuyerDashboardProps) {
  const hasAnalyzedFDDs = stats.fddsAnalyzed > 0
  const hasSavedFranchises = stats.savedFranchises > 0
  const hasAskedQuestions = stats.questionsAsked > 0
  const hasComparisons = stats.comparisonsMade > 0
  const hasNotes = stats.notesCreated > 0

  const recentAnalyses = hasAnalyzedFDDs ? franchises.filter((f) => ["1", "2", "7"].includes(f.id)) : []
  const savedFranchises = hasSavedFranchises ? franchises.slice(0, 4) : []

  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [preApprovalFranchise, setPreApprovalFranchise] = useState<(typeof franchises)[0] | null>(null)

  const toggleCard = (cardType: string) => {
    setExpandedCard(expandedCard === cardType ? null : cardType)
  }

  const sampleQuestions = [
    {
      q: "What's the average ROI for food franchises?",
      a: "Most food franchises show ROI within 2-3 years, with QSR averaging 18-24 months.",
    },
    {
      q: "Which franchises have the lowest initial investment?",
      a: "Service-based franchises like cleaning or tutoring typically start at $50K-$100K.",
    },
  ]

  const profileCompletionPercentage = () => {
    let completed = 0
    const total = 8

    if (buyerProfile.personalInfo.firstName) completed++
    if (buyerProfile.personalInfo.email) completed++
    if (buyerProfile.personalInfo.phone) completed++
    if (buyerProfile.financialQualification.creditScore) completed++
    if (buyerProfile.financialQualification.backgroundCheck === "Clear") completed++
    if (buyerProfile.financialQualification.liquidCapital) completed++
    if (buyerProfile.financialQualification.netWorth) completed++
    if (buyerProfile.financialQualification.preApproval.status === "Approved") completed++

    return Math.round((completed / total) * 100)
  }

  const isProfileComplete = profileCompletionPercentage() === 100

  const hasPreApproval = buyerProfile.financialQualification.preApproval.status === "Approved"

  const handleOpenLenderModal = (franchiseId: string) => {
    const franchise = franchises.find((f) => f.id === franchiseId)
    if (franchise) {
      setPreApprovalFranchise(franchise)
    }
  }

  return (
    <div className="space-y-12 pb-24">
      <div className="flex items-start justify-between gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back{buyerProfile.personalInfo.firstName ? `, ${buyerProfile.personalInfo.firstName}` : ""}
          </h1>
          {/* </CHANGE> */}
          <p className="text-base text-muted-foreground mt-3 leading-relaxed">
            Here's what's happening with your franchise search
          </p>
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      {!isProfileComplete && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
          <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">
              <span className="font-medium">Profile {profileCompletionPercentage()}% complete</span>
              <span className="text-muted-foreground ml-2">
                — Verified credentials increase franchisor response rates
              </span>
            </p>
          </div>
          <div className="flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onNavigate("profile-settings")}
              className="text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 h-8"
            >
              Complete
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="relative overflow-hidden p-8 border-border/50 bg-gradient-to-br from-cta/10 via-cta/5 to-transparent hover:shadow-xl hover:shadow-cta/10 hover:border-cta/40 transition-all duration-200 group">
          <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          <div className="relative space-y-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-cta/20 p-4 group-hover:scale-110 transition-transform duration-200">
                <Sparkles className="h-8 w-8 text-cta" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-xl">AI Discovery Assistant</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1.5">
                  Get personalized franchise recommendations
                </p>
                <p className="text-xs text-muted-foreground/80 leading-relaxed mt-2">
                  Not sure which franchise is right for you? Answer a few questions to get AI-powered recommendations
                  based on your goals, budget, and experience.
                </p>
              </div>
            </div>
            <Button
              onClick={() => onNavigate("discovery")}
              className="w-full bg-cta hover:bg-cta-hover text-cta-foreground transition-all duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 h-12 text-base font-semibold"
            >
              Start Discovery
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </Card>

        <Card className="relative overflow-hidden p-8 border-border/50 hover:shadow-xl hover:border-border transition-all duration-200 group">
          <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          <div className="relative space-y-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-muted p-4 group-hover:scale-110 transition-transform duration-200">
                <Upload className="h-8 w-8 text-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-xl">Analyze Your FDD</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1.5">
                  Upload and get instant AI-powered insights
                </p>
                <p className="text-xs text-muted-foreground/80 leading-relaxed mt-2">
                  Already have an FDD from a franchisor? Upload it to get instant analysis, insights, and answers to
                  your questions about the opportunity.
                </p>
              </div>
            </div>
            <Button
              onClick={() => onNavigate("upload")}
              variant="outline"
              className="w-full hover:bg-accent/50 transition-all duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 h-12 text-base font-semibold"
            >
              Upload Document
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-center gap-12 py-8 border-y border-border/50">
        <button
          onClick={() => hasAnalyzedFDDs && toggleCard("analyzed")}
          className={`group flex items-center gap-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 rounded-lg px-4 py-2 ${
            hasAnalyzedFDDs ? "hover:bg-muted/30 cursor-pointer" : "cursor-default"
          }`}
          disabled={!hasAnalyzedFDDs}
        >
          <div className="rounded-xl bg-cta/10 p-3">
            <TrendingUp className="h-6 w-6 text-cta" />
          </div>
          <div className="text-left">
            <p className="text-sm text-muted-foreground">FDDs Analyzed</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-3xl font-bold tracking-tight">{stats.fddsAnalyzed}</p>
              {hasAnalyzedFDDs && (
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    expandedCard === "analyzed" ? "rotate-180" : ""
                  }`}
                />
              )}
            </div>
            {!hasAnalyzedFDDs && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onNavigate("discovery")
                }}
                className="text-xs text-cta hover:text-cta-hover mt-1 flex items-center gap-1 transition-colors"
              >
                Start exploring
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </button>

        <div className="h-16 w-px bg-border/50" />

        <button
          onClick={() => hasSavedFranchises && toggleCard("saved")}
          className={`group flex items-center gap-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 rounded-lg px-4 py-2 ${
            hasSavedFranchises ? "hover:bg-muted/30 cursor-pointer" : "cursor-default"
          }`}
          disabled={!hasSavedFranchises}
        >
          <div className="rounded-xl bg-cta/10 p-3">
            <Heart className="h-6 w-6 text-cta" />
          </div>
          <div className="text-left">
            <p className="text-sm text-muted-foreground">Saved Franchises</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-3xl font-bold tracking-tight">{stats.savedFranchises}</p>
              {hasSavedFranchises && (
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    expandedCard === "saved" ? "rotate-180" : ""
                  }`}
                />
              )}
            </div>
            {!hasSavedFranchises && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onNavigate("discovery")
                }}
                className="text-xs text-cta hover:text-cta-hover mt-1 flex items-center gap-1 transition-colors"
              >
                Browse franchises
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </button>

        <div className="h-16 w-px bg-border/50" />

        <button
          onClick={() => hasAskedQuestions && toggleCard("questions")}
          className={`group flex items-center gap-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 rounded-lg px-4 py-2 ${
            hasAskedQuestions ? "hover:bg-muted/30 cursor-pointer" : "cursor-default"
          }`}
          disabled={!hasAskedQuestions}
        >
          <div className="rounded-xl bg-cta/10 p-3">
            <MessageSquare className="h-6 w-6 text-cta" />
          </div>
          <div className="text-left">
            <p className="text-sm text-muted-foreground">AI Questions</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-3xl font-bold tracking-tight">{stats.questionsAsked}</p>
              {hasAskedQuestions && (
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    expandedCard === "questions" ? "rotate-180" : ""
                  }`}
                />
              )}
            </div>
            {!hasAskedQuestions && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onNavigate("discovery")
                }}
                className="text-xs text-cta hover:text-cta-hover mt-1 flex items-center gap-1 transition-colors"
              >
                Ask AI assistant
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </button>

        <div className="h-16 w-px bg-border/50" />

        <button
          onClick={() => hasComparisons && toggleCard("comparisons")}
          className={`group flex items-center gap-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 rounded-lg px-4 py-2 ${
            hasComparisons ? "hover:bg-muted/30 cursor-pointer" : "cursor-default"
          }`}
          disabled={!hasComparisons}
        >
          <div className="rounded-xl bg-cta/10 p-3">
            <GitCompare className="h-6 w-6 text-cta" />
          </div>
          <div className="text-left">
            <p className="text-sm text-muted-foreground">Comparisons</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-3xl font-bold tracking-tight">{stats.comparisonsMade}</p>
              {hasComparisons && (
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    expandedCard === "comparisons" ? "rotate-180" : ""
                  }`}
                />
              )}
            </div>
            {!hasComparisons && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onNavigate("discovery")
                }}
                className="text-xs text-cta hover:text-cta-hover mt-1 flex items-center gap-1 transition-colors"
              >
                Compare franchises
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </button>

        <div className="h-16 w-px bg-border/50" />

        <button
          onClick={() => hasNotes && toggleCard("notes")}
          className={`group flex items-center gap-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 rounded-lg px-4 py-2 ${
            hasNotes ? "hover:bg-muted/30 cursor-pointer" : "cursor-default"
          }`}
          disabled={!hasNotes}
        >
          <div className="rounded-xl bg-cta/10 p-3">
            <FileText className="h-6 w-6 text-cta" />
          </div>
          <div className="text-left">
            <p className="text-sm text-muted-foreground">Notes</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-3xl font-bold tracking-tight">{stats.notesCreated}</p>
              {hasNotes && (
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    expandedCard === "notes" ? "rotate-180" : ""
                  }`}
                />
              )}
            </div>
            {!hasNotes && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onNavigate("discovery")
                }}
                className="text-xs text-cta hover:text-cta-hover mt-1 flex items-center gap-1 transition-colors"
              >
                Add your first note
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </button>
      </div>

      {expandedCard === "analyzed" && hasAnalyzedFDDs && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recentAnalyses.map((franchise) => (
            <Card
              key={franchise.id}
              className="p-6 border-border/50 hover:shadow-lg hover:border-cta/30 transition-all duration-200 cursor-pointer group"
              onClick={() => onNavigate("fdd-viewer", franchise.id)}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate group-hover:text-cta transition-colors">
                      {franchise.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{franchise.industry}</p>
                  </div>
                  {franchise.hasItem19 && (
                    <Badge variant="secondary" className="bg-cta/10 text-cta border-cta/20 text-xs flex-shrink-0">
                      Earnings
                    </Badge>
                  )}
                </div>
                <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Investment</p>
                    <p className="text-sm font-semibold mt-1">
                      ${(franchise.investmentMin / 1000).toFixed(0)}K - ${(franchise.investmentMax / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-cta group-hover:translate-x-1 transition-all duration-200" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {expandedCard === "saved" && hasSavedFranchises && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {savedFranchises.map((franchise) => (
            <Card
              key={franchise.id}
              className="p-6 border-border/50 hover:shadow-lg hover:border-cta/30 transition-all duration-200 cursor-pointer group"
              onClick={() => onNavigate("fdd-viewer", franchise.id)}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate group-hover:text-cta transition-colors">
                      {franchise.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{franchise.industry}</p>
                  </div>
                  {franchise.hasItem19 && (
                    <Badge variant="secondary" className="bg-cta/10 text-cta border-cta/20 text-xs flex-shrink-0">
                      Earnings
                    </Badge>
                  )}
                </div>
                <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Investment</p>
                    <p className="text-sm font-semibold mt-1">
                      ${(franchise.investmentMin / 1000).toFixed(0)}K - ${(franchise.investmentMax / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-cta group-hover:translate-x-1 transition-all duration-200" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {expandedCard === "questions" && hasAskedQuestions && (
        <Card className="p-8 border-border/50">
          <div className="space-y-6">
            {sampleQuestions.map((item, idx) => (
              <div key={idx} className={`space-y-3 ${idx !== 0 ? "pt-6 border-t border-border/50" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-cta/10 p-2 mt-0.5">
                    <MessageSquare className="h-4 w-4 text-cta" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-semibold leading-relaxed">{item.q}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {expandedCard === "comparisons" && hasComparisons && (
        <Card className="p-8 border-border/50">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-cta/10 p-2 mt-0.5">
                  <GitCompare className="h-4 w-4 text-cta" />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-semibold leading-relaxed">Subway vs Anytime Fitness</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Compared 2 days ago</p>
                </div>
              </div>
            </div>
            <div className="space-y-3 pt-6 border-t border-border/50">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-cta/10 p-2 mt-0.5">
                  <GitCompare className="h-4 w-4 text-cta" />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-semibold leading-relaxed">The UPS Store vs Great Clips</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Compared 5 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {expandedCard === "notes" && hasNotes && (
        <Card className="p-8 border-border/50">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-cta/10 p-2 mt-0.5">
                  <FileText className="h-4 w-4 text-cta" />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-semibold leading-relaxed">Subway - Location considerations</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Need to research high-traffic areas in Austin...
                  </p>
                  <p className="text-xs text-muted-foreground">Updated 1 day ago</p>
                </div>
              </div>
            </div>
            <div className="space-y-3 pt-6 border-t border-border/50">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-cta/10 p-2 mt-0.5">
                  <FileText className="h-4 w-4 text-cta" />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-semibold leading-relaxed">Anytime Fitness - Equipment costs</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Initial equipment investment seems high, need to clarify...
                  </p>
                  <p className="text-xs text-muted-foreground">Updated 3 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {hasSavedFranchises && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Saved Franchises</h2>
              <p className="text-sm text-muted-foreground mt-1.5">Track your research progress</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2"
              onClick={() => onOpenModal("saved")}
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {savedFranchises.slice(0, 3).map((franchise) => {
              const engagement = fddEngagements.find((e) => e.franchiseId === franchise.id)
              const preApproval = franchisePreApprovals.find((p) => p.franchiseId === franchise.id)
              if (!engagement) return null
              return (
                <FranchiseProgressCard
                  key={franchise.id}
                  franchise={franchise}
                  engagement={engagement}
                  preApproval={preApproval}
                  onNavigate={onNavigate}
                  onOpenLenderModal={handleOpenLenderModal}
                />
              )
            })}
          </div>
        </div>
      )}

      {hasAnalyzedFDDs && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Recent Analyses</h2>
              <p className="text-sm text-muted-foreground mt-1.5">FDDs you've recently reviewed</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2"
              onClick={() => onNavigate("discovery")}
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentAnalyses.map((franchise) => (
              <Card
                key={franchise.id}
                className="p-6 border-border/50 hover:shadow-lg hover:border-cta/30 transition-all duration-200 cursor-pointer group"
                onClick={() => onNavigate("fdd-viewer", franchise.id)}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate group-hover:text-cta transition-colors">
                        {franchise.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{franchise.industry}</p>
                    </div>
                    {franchise.hasItem19 && (
                      <Badge variant="secondary" className="bg-cta/10 text-cta border-cta/20 text-xs flex-shrink-0">
                        Earnings
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Analyzed 2 days ago</span>
                  </div>
                  <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Investment</p>
                      <p className="text-sm font-semibold mt-1">
                        ${(franchise.investmentMin / 1000).toFixed(0)}K - ${(franchise.investmentMax / 1000).toFixed(0)}
                        K
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-cta group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {preApprovalFranchise && (
        <PreApprovalModal franchise={preApprovalFranchise} onClose={() => setPreApprovalFranchise(null)} />
      )}
    </div>
  )
}
