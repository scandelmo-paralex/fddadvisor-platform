"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  FileText,
  Clock,
  Eye,
  ArrowRight,
  CheckCircle2,
  Shield,
  FileSignature,
  Search,
  UserCircle,
  AlertCircle,
} from "lucide-react"
import { TrackingConsentModal } from "@/components/tracking-consent-modal"
import { Item23ReceiptModalDocuSeal } from "@/components/item-23-receipt-modal-docuseal"
import { Input } from "@/components/ui/input"

interface FDDAccess {
  id: string
  franchise_id: string
  franchise_slug: string
  franchise_name: string
  franchise_logo?: string
  franchisor_name: string
  first_viewed_at?: string
  last_viewed_at?: string
  total_views: number
  total_time_spent_seconds: number
  granted_via: "invitation" | "fddadvisor_signup"
  created_at: string
  consent_given_at?: string
  receipt_signed_at?: string
  buyer_id?: string
  docuseal_template_url?: string
}

export default function MyFDDsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [fdds, setFdds] = useState<FDDAccess[]>([])
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [profileIncomplete, setProfileIncomplete] = useState(false)

  const [selectedFdd, setSelectedFdd] = useState<FDDAccess | null>(null)
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [buyerId, setBuyerId] = useState<string>("")
  const [buyerEmail, setBuyerEmail] = useState<string>("")

  useEffect(() => {
    loadFDDs()
  }, [])

  const loadFDDs = async () => {
    try {
      const supabase = createBrowserClient()

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        router.push("/login")
        return
      }

      setBuyerEmail(user.email || "")

      const { data: profile, error: profileError } = await supabase
        .from("buyer_profiles")
        .select(
          "id, profile_completed_at, fico_score_range, liquid_assets_range, net_worth_range, funding_plans, no_felony_attestation, no_bankruptcy_attestation, first_name, last_name, phone",
        )
        .eq("user_id", user.id)
        .single()

      if (profileError || !profile) {
        setError("Profile not found")
        setLoading(false)
        return
      }

      const isComplete = !!(
        profile.profile_completed_at ||
        (profile.first_name &&
          profile.last_name &&
          profile.phone &&
          profile.fico_score_range &&
          profile.liquid_assets_range &&
          profile.net_worth_range &&
          profile.funding_plans &&
          Array.isArray(profile.funding_plans) &&
          profile.funding_plans.length > 0 &&
          profile.no_felony_attestation &&
          profile.no_bankruptcy_attestation)
      )

      if (!isComplete) {
        setProfileIncomplete(true)
        setLoading(false)
        return
      }

      setBuyerId(profile.id)

      const { data: accessData, error: accessError } = await supabase
        .from("lead_fdd_access")
        .select(
          "id, franchise_id, franchisor_id, first_viewed_at, last_viewed_at, total_views, total_time_spent_seconds, granted_via, created_at, consent_given_at, receipt_signed_at",
        )
        .eq("buyer_id", profile.id)
        .order("created_at", { ascending: false })

      if (accessError) {
        console.error("Error loading FDD access:", accessError)
        setError("Failed to load FDDs")
        setLoading(false)
        return
      }

      if (!accessData || accessData.length === 0) {
        setFdds([])
        setLoading(false)
        return
      }

      const franchiseIds = [...new Set(accessData.map((item) => item.franchise_id))]
      const franchisorIds = [...new Set(accessData.map((item) => item.franchisor_id))]

      const { data: franchises, error: franchiseError } = await supabase
        .from("franchises")
        .select("id, name, logo_url, slug, docuseal_item23_template_url")
        .in("id", franchiseIds)

      const { data: franchisors } = await supabase
        .from("franchisor_profiles")
        .select("id, company_name")
        .in("id", franchisorIds)

      const franchiseMap = new Map(franchises?.map((f) => [f.id, f]) || [])
      const franchisorMap = new Map(franchisors?.map((f) => [f.id, f]) || [])

      const transformedFdds: FDDAccess[] = accessData.map((item) => {
        const franchise = franchiseMap.get(item.franchise_id)
        const franchisor = franchisorMap.get(item.franchisor_id)

        return {
          id: item.id,
          franchise_id: item.franchise_id,
          franchise_slug: franchise?.slug || "",
          franchise_name: franchise?.name || "Unknown Franchise",
          franchise_logo: franchise?.logo_url,
          franchisor_name: franchisor?.company_name || "Unknown Franchisor",
          first_viewed_at: item.first_viewed_at,
          last_viewed_at: item.last_viewed_at,
          total_views: item.total_views,
          total_time_spent_seconds: item.total_time_spent_seconds,
          granted_via: item.granted_via,
          created_at: item.created_at,
          consent_given_at: item.consent_given_at,
          receipt_signed_at: item.receipt_signed_at,
          buyer_id: profile.id,
          docuseal_template_url: franchise?.docuseal_item23_template_url,
        }
      })

      setFdds(transformedFdds)
      setLoading(false)
    } catch (err) {
      console.error("Load FDDs error:", err)
      setError("An error occurred")
      setLoading(false)
    }
  }

  const filteredFdds = fdds.filter(
    (fdd) =>
      fdd.franchise_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fdd.franchisor_name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleConsent = async () => {
    if (!selectedFdd) return

    try {
      const supabase = createBrowserClient()
      const { error } = await supabase
        .from("lead_fdd_access")
        .update({ consent_given_at: new Date().toISOString() })
        .eq("id", selectedFdd.id)

      if (error) throw error

      setShowConsentModal(false)
      await loadFDDs()
    } catch (err) {
      console.error("Consent error:", err)
      alert("Failed to save consent. Please try again.")
    }
  }

  const handleReceiptComplete = async () => {
    setShowReceiptModal(false)
    await loadFDDs()
  }

  const canViewFdd = (fdd: FDDAccess) => {
    return !!fdd.consent_given_at && !!fdd.receipt_signed_at
  }

  const handleFddClick = (fdd: FDDAccess) => {
    if (canViewFdd(fdd)) {
      router.push(`/hub/fdd/${fdd.franchise_id}`)
    }
  }

  const formatTimeSpent = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (profileIncomplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-lg border-amber-200 bg-amber-50/30">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 p-4 rounded-full bg-amber-100 w-fit">
              <UserCircle className="h-12 w-12 text-amber-600" />
            </div>
            <CardTitle className="text-2xl text-foreground">Complete Your Profile</CardTitle>
            <CardDescription className="text-base mt-2">
              Before you can access your FDDs, please complete your buyer profile. This helps franchisors understand
              your qualifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white rounded-lg border border-amber-200 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Required Information:</p>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li>- Personal information (name, phone)</li>
                    <li>- Financial qualification (FICO score, assets, net worth)</li>
                    <li>- Funding plan</li>
                    <li>- Background attestation</li>
                  </ul>
                </div>
              </div>
            </div>
            <Button onClick={() => router.push("/profile")} className="w-full bg-primary hover:bg-primary/90" size="lg">
              <UserCircle className="mr-2 h-5 w-5" />
              Complete My Profile
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              This only takes a few minutes to complete.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border-destructive/20 bg-destructive/5">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Error Loading FDDs</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => router.push("/login")} variant="outline">
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">My FDDs</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Review franchise disclosure documents shared with you
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search franchises..."
                  className="pl-9 h-9 bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Badge variant="secondary" className="h-9 px-4 text-sm font-medium bg-muted text-foreground">
                {fdds.length} {fdds.length === 1 ? "Document" : "Documents"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {fdds.length === 0 ? (
          <Card className="text-center py-16 border-dashed border-2 bg-muted/5">
            <CardContent>
              <div className="bg-muted/20 p-4 rounded-full w-fit mx-auto mb-6">
                <FileText className="h-12 w-12 text-muted-foreground/50" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No FDDs Yet</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                You haven't received any franchise disclosure documents yet. Check your email for invitations from
                franchisors or explore our directory.
              </p>
              <Button onClick={() => router.push("/")} variant="outline" className="gap-2">
                <Search className="h-4 w-4" />
                Explore Franchises
              </Button>
            </CardContent>
          </Card>
        ) : filteredFdds.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No franchises found matching "{searchQuery}"</p>
            <Button variant="link" onClick={() => setSearchQuery("")} className="mt-2">
              Clear search
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredFdds.map((fdd) => {
              const hasConsent = !!fdd.consent_given_at
              const hasReceipt = !!fdd.receipt_signed_at
              const canView = canViewFdd(fdd)

              return (
                <Card
                  key={fdd.id}
                  className={`group transition-all duration-200 border-border/60 flex flex-col h-full ${
                    canView ? "hover:shadow-md hover:border-primary/30 cursor-pointer bg-card" : "bg-muted/10"
                  }`}
                  onClick={() => handleFddClick(fdd)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      {fdd.franchise_logo ? (
                        <div className="h-14 w-14 rounded-xl border border-border/50 bg-white p-1 flex items-center justify-center overflow-hidden">
                          <img
                            src={fdd.franchise_logo || "/placeholder.svg"}
                            alt={fdd.franchise_name}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="h-14 w-14 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      {!fdd.first_viewed_at && (
                        <Badge className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">New</Badge>
                      )}
                    </div>
                    <CardTitle
                      className={`text-lg font-bold line-clamp-1 ${canView ? "group-hover:text-primary transition-colors" : ""}`}
                    >
                      {fdd.franchise_name}
                    </CardTitle>
                    <CardDescription className="line-clamp-1">From {fdd.franchisor_name}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-3">
                      {!canView && (
                        <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 rounded-lg p-3">
                          <p className="text-[11px] uppercase tracking-wider text-amber-600 dark:text-amber-500 font-semibold mb-2">
                            Action Required
                          </p>
                          <div className="space-y-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className={`w-full justify-start h-8 text-xs ${hasConsent ? "bg-emerald-50/50 text-emerald-700 border-emerald-200" : "bg-background"}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedFdd(fdd)
                                setShowConsentModal(true)
                              }}
                              disabled={hasConsent}
                            >
                              {hasConsent ? (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                                  Consent Given
                                </>
                              ) : (
                                <>
                                  <Shield className="h-3.5 w-3.5 mr-2" />
                                  Give Consent
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`w-full justify-start h-8 text-xs ${hasReceipt ? "bg-emerald-50/50 text-emerald-700 border-emerald-200" : "bg-background"}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedFdd(fdd)
                                setShowReceiptModal(true)
                              }}
                              disabled={!hasConsent || hasReceipt}
                            >
                              {hasReceipt ? (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                                  Receipt Signed
                                </>
                              ) : (
                                <>
                                  <FileSignature className="h-3.5 w-3.5 mr-2" />
                                  Sign Receipt
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* HIDDEN FOR DEMO - Stats showing 0 views / 0s
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/30 p-1.5 rounded-md">
                          <Eye className="h-3.5 w-3.5" />
                          <span>{fdd.total_views} views</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/30 p-1.5 rounded-md">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatTimeSpent(fdd.total_time_spent_seconds)}</span>
                        </div>
                      </div>
                      */}

                      <div className="space-y-1 pt-1">
                        {/* Last viewed */}
                        {fdd.last_viewed_at && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                            Last viewed {formatDate(fdd.last_viewed_at)}
                          </p>
                        )}

                        {/* Received date */}
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                          Received {formatDate(fdd.created_at)}
                        </p>
                      </div>
                    </div>

                    <Button
                      className={`w-full transition-all shadow-sm ${
                        canView
                          ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                          : "opacity-50 cursor-not-allowed"
                      }`}
                      disabled={!canView}
                      onClick={(e) => {
                        if (canView) {
                          e.stopPropagation()
                          router.push(`/hub/fdd/${fdd.franchise_id}`)
                        }
                      }}
                    >
                      {canView ? (
                        <>
                          {fdd.first_viewed_at ? "Continue Reading" : "View FDD"}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      ) : (
                        "Complete Steps Above"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {selectedFdd && (
        <>
          <TrackingConsentModal
            isOpen={showConsentModal}
            franchiseName={selectedFdd.franchise_name}
            franchiseId={selectedFdd.franchise_id}
            buyerId={buyerId}
            onConsent={handleConsent}
            onDecline={() => {
              setShowConsentModal(false)
              setSelectedFdd(null)
            }}
          />
          <Item23ReceiptModalDocuSeal
            isOpen={showReceiptModal}
            onClose={() => {
              setShowReceiptModal(false)
              setSelectedFdd(null)
            }}
            onComplete={handleReceiptComplete}
            franchiseName={selectedFdd.franchise_name}
            franchiseId={selectedFdd.franchise_id}
            buyerId={buyerId}
            buyerEmail={buyerEmail}
            templateUrl={selectedFdd.docuseal_template_url || ""}
          />
        </>
      )}
    </div>
  )
}
