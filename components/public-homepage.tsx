"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Upload, MessageSquare, CheckCircle } from "lucide-react"
import Link from "next/link"
import { franchises } from "@/lib/data"

export function PublicHomepage() {
  const popularFranchises = [
    franchises.find((f) => f.name === "Subway"),
    franchises.find((f) => f.name === "Dunkin'"),
    franchises.find((f) => f.name === "The UPS Store"),
    franchises.find((f) => f.name === "Anytime Fitness"),
    franchises.find((f) => f.name === "Daisy"),
    franchises.find((f) => f.name === "Blo Blow Dry Bar"),
  ].filter(Boolean)

  return (
    <div className="space-y-32 pb-24">
      <section className="relative overflow-hidden bg-gradient-to-b from-muted/30 to-background pt-20 pb-28">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight text-balance">
              Find Your Perfect <span className="text-primary">Franchise Match</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto text-pretty">
              AI-powered discovery and analysis to help you find the franchise opportunity that's right for you. Free,
              instant, and comprehensive.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button asChild size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90">
                <Link href="https://mailchi.mp/paralex/fdd-advisor-early-access" target="_blank">
                  Request Early Access - Free
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg bg-transparent">
                <Link href="/discover">View Sample Report</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground pt-4">Coming Soon in Fall of 2025</p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">How It Works</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
          <div className="space-y-6 text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold">Explore or Upload</h3>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Upload your own FDD or explore and receive recommendations for the right franchises for you
            </p>
          </div>

          <div className="space-y-6 text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold">Get AI Analysis</h3>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Instant breakdown of fees, Item 19, red flags, and more
            </p>
          </div>

          <div className="space-y-6 text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold">Ask Questions</h3>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Chat with AI about the FDD and connect with the Franchisor or helpful experts
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Popular Franchises</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {popularFranchises.map((franchise) => (
            <Card
              key={franchise.id}
              className="p-6 border-border hover:shadow-xl hover:border-primary/30 transition-all group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-xl group-hover:text-primary transition-colors">
                      {franchise.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1.5">{franchise.industry}</p>
                  </div>
                  {franchise.status && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
                      {franchise.status === "Trending" ? "Fast Growing" : franchise.status}
                    </Badge>
                  )}
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Investment</span>
                    <span className="font-semibold">
                      ${(franchise.investmentMin / 1000).toFixed(0)}K-${(franchise.investmentMax / 1000).toFixed(0)}K
                    </span>
                  </div>
                  {franchise.totalUnits && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Units</span>
                      <span className="font-semibold">{franchise.totalUnits.toLocaleString()}+</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">ROI</span>
                    <span className="font-semibold">{franchise.roiTimeframe}</span>
                  </div>
                </div>

                <Button
                  asChild
                  className="w-full mt-4 bg-primary hover:bg-primary/90"
                  onClick={() => window.open("https://mailchi.mp/paralex/fdd-advisor-early-access", "_blank")}
                >
                  <Link href="https://mailchi.mp/paralex/fdd-advisor-early-access" target="_blank">
                    Request Report
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">What You'll Get</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {[
            {
              title: "Complete investment breakdown",
              description: "Detailed analysis of initial fees, ongoing costs, and total investment required",
            },
            {
              title: "Item 19 earnings analysis",
              description: "In-depth review of franchisee earnings data and financial performance metrics",
            },
            {
              title: "Red flags and risk factors",
              description: "Identification of potential concerns, litigation history, and franchise risks",
            },
            {
              title: "Territory and growth analysis",
              description: "Territory rights, expansion plans, and market saturation insights",
            },
            {
              title: "Q&A with AI about the FDD",
              description: "Ask questions and get instant answers about any aspect of the disclosure",
            },
            {
              title: "Citations to exact FDD pages",
              description: "Every insight linked directly to source pages for easy verification",
            },
          ].map((item, index) => (
            <Card key={index} className="p-6 border-border hover:shadow-lg transition-all">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4">
        <Card className="p-12 md:p-16 border-border bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="text-center space-y-8 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">Ready to analyze your FDD?</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90">
                <Link href="https://mailchi.mp/paralex/fdd-advisor-early-access" target="_blank">
                  Request Early Access
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg bg-transparent">
                <Link href="/discover">View Sample Report</Link>
              </Button>
            </div>
            <p className="text-muted-foreground pt-4">
              Are you a franchisor?{" "}
              <Link href="/franchisors" className="text-primary hover:underline">
                Learn more
              </Link>
            </p>
          </div>
        </Card>
      </section>
    </div>
  )
}
