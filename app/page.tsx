"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { PublicHomepage } from "@/components/public-homepage"
import { BuyerDashboard } from "@/components/buyer-dashboard"
import { DiscoveryTool } from "@/components/discovery-tool"
import { UploadView } from "@/components/upload-view"
import { FDDViewer } from "@/components/fdd-viewer"
import { FranchisorDashboard } from "@/components/franchisor-dashboard"
import { ProfileSettings } from "@/components/profile-settings"
import { Modal } from "@/components/modals"
import { AIDiscoveryAssistant } from "@/components/ai-discovery-assistant"
import { ComparisonBar } from "@/components/comparison-bar"
import { FranchiseComparison } from "@/components/franchise-comparison"
import { FranchisorProfile } from "@/components/franchisor-profile"
import { defaultBuyerProfile, defaultFranchisorProfile } from "@/lib/data"
import type { Note, BuyerProfile, FDDEngagement, FranchisorProfile as FranchisorProfileType } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"

export default function Home() {
  const [currentView, setCurrentView] = useState("public-homepage")
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>("")
  const [modalState, setModalState] = useState<{ type: string; isOpen: boolean; leadId?: string }>({
    type: "",
    isOpen: false,
  })
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfile>(defaultBuyerProfile)
  const [fddEngagements, setFddEngagements] = useState<Record<string, FDDEngagement>>({})
  const [franchisorProfile, setFranchisorProfile] = useState<FranchisorProfileType>(defaultFranchisorProfile)
  const router = useRouter()

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    const initialTheme = savedTheme || "dark"
    setTheme(initialTheme)
    document.documentElement.classList.toggle("dark", initialTheme === "dark")

    const handleRedirect = async () => {
      const supabase = createBrowserClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        // Check user type and redirect accordingly
        const { data: profile } = await supabase
          .from("buyer_profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .single()

        const { data: franchisorProfile } = await supabase
          .from("franchisor_profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .single()

        if (franchisorProfile) {
          router.push("/dashboard")
        } else if (profile) {
          // Check if they have any invited FDDs (lead)
          const { data: fddAccess } = await supabase
            .from("lead_fdd_access")
            .select("*")
            .eq("buyer_id", profile.id)
            .limit(1)

          if (fddAccess && fddAccess.length > 0) {
            router.push("/hub/my-fdds")
          } else {
            router.push("/login")
          }
        } else {
          router.push("/login")
        }
      } else {
        router.push("/login")
      }
    }

    handleRedirect()
  }, [router])

  const handleNavigate = (view: string, franchiseId?: string) => {
    setCurrentView(view)
    if (franchiseId) {
      setSelectedFranchiseId(franchiseId)
    }
  }

  const handleBack = () => {
    if (currentView === "discovery" || currentView === "upload" || currentView === "profile-settings") {
      setCurrentView("buyer-dashboard")
    } else if (currentView === "fdd-viewer") {
      setCurrentView("discovery")
    } else if (currentView === "franchisor-profile") {
      setCurrentView("franchisor-dashboard")
    } else if (currentView === "buyer-dashboard") {
      setCurrentView("public-homepage")
    }
  }

  const handleOpenModal = (type: string, franchiseId?: string) => {
    setModalState({ type, isOpen: true, leadId: franchiseId })
  }

  const handleCloseModal = () => {
    setModalState({ type: "", isOpen: false })
  }

  const handleToggleComparison = (franchiseId: string) => {
    setSelectedForComparison((prev) => {
      if (prev.includes(franchiseId)) {
        return prev.filter((id) => id !== franchiseId)
      } else if (prev.length < 3) {
        return [...prev, franchiseId]
      }
      return prev
    })
  }

  const handleRemoveFromComparison = (franchiseId: string) => {
    setSelectedForComparison((prev) => prev.filter((id) => id !== franchiseId))
  }

  const handleClearComparison = () => {
    setSelectedForComparison([])
  }

  const handleShowComparison = () => {
    setShowComparison(true)
  }

  const handleCloseComparison = () => {
    setShowComparison(false)
  }

  const handleToggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  const handleAddNote = (franchiseId: string, title: string, content: string) => {
    const newNote: Note = {
      id: Date.now().toString(),
      franchiseId,
      title,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setNotes((prev) => [...prev, newNote])
  }

  const handleUpdateNote = (noteId: string, title: string, content: string) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId ? { ...note, title, content, updatedAt: new Date().toISOString() } : note,
      ),
    )
  }

  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== noteId))
  }

  const handleUpdateProfile = (profile: BuyerProfile) => {
    setBuyerProfile(profile)
    setCurrentView("buyer-dashboard")
  }

  const handleUpdateEngagement = (engagement: FDDEngagement) => {
    setFddEngagements((prev) => ({
      ...prev,
      [engagement.franchiseId]: engagement,
    }))
  }

  const handleUpdateFranchisorProfile = (profile: FranchisorProfileType) => {
    setFranchisorProfile(profile)
    setCurrentView("franchisor-dashboard")
  }

  const handleViewChange = (view: string) => {
    console.log("[v0] handleViewChange called with view:", view)
    setCurrentView(view)
    console.log("[v0] currentView state updated to:", view)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-primary/10 px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Info className="size-5 text-primary" />
            <p className="text-sm font-medium">
              This is a demo showcasing the full platform vision. Use the toggle to explore buyer and franchisor views.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>

      <Header
        currentView={currentView}
        onViewChange={handleViewChange}
        onBack={handleBack}
        onNavigate={handleNavigate}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {currentView === "public-homepage" && <PublicHomepage />}

        {currentView === "buyer-dashboard" && (
          <BuyerDashboard
            onNavigate={handleNavigate}
            onOpenModal={handleOpenModal}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            buyerProfile={buyerProfile}
          />
        )}

        {currentView === "discovery" && (
          <DiscoveryTool
            onNavigate={handleNavigate}
            selectedForComparison={selectedForComparison}
            onToggleComparison={handleToggleComparison}
          />
        )}

        {currentView === "upload" && <UploadView />}

        {currentView === "fdd-viewer" && (
          <FDDViewer
            franchiseId={selectedFranchiseId}
            onOpenModal={handleOpenModal}
            notes={notes}
            onAddNote={handleAddNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            engagement={fddEngagements[selectedFranchiseId]}
            onUpdateEngagement={handleUpdateEngagement}
          />
        )}

        {currentView === "profile-settings" && (
          <ProfileSettings profile={buyerProfile} onUpdateProfile={handleUpdateProfile} />
        )}

        {currentView === "franchisor-dashboard" && (
          <FranchisorDashboard
            onOpenModal={handleOpenModal}
            onNavigateToProfile={() => setCurrentView("franchisor-profile")}
          />
        )}

        {currentView === "franchisor-profile" && (
          <FranchisorProfile
            profile={franchisorProfile}
            onUpdateProfile={handleUpdateFranchisorProfile}
            onBack={() => setCurrentView("franchisor-dashboard")}
          />
        )}
      </main>

      <Modal
        type={modalState.type}
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        leadId={modalState.leadId}
        franchiseId={modalState.leadId}
      />

      {currentView !== "discovery" && currentView !== "fdd-viewer" && <AIDiscoveryAssistant />}

      {currentView === "discovery" && !showComparison && (
        <ComparisonBar
          selectedIds={selectedForComparison}
          onRemove={handleRemoveFromComparison}
          onCompare={handleShowComparison}
          onClear={handleClearComparison}
        />
      )}

      {showComparison && (
        <FranchiseComparison
          franchiseIds={selectedForComparison}
          onRemove={handleRemoveFromComparison}
          onClose={handleCloseComparison}
        />
      )}
    </div>
  )
}
