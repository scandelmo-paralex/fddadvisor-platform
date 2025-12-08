"use client"

import { useState } from "react"
import { FranchisorDashboard } from "@/components/franchisor-dashboard"
import { Header } from "@/components/header"
import { useRouter } from "next/navigation"
import { Modal } from "@/components/modals"

export function FranchisorDashboardView({ userId }: { userId: string }) {
  const router = useRouter()
  const [activeModal, setActiveModal] = useState<{ type: string; leadId?: string } | null>(null)

  const handleNavigateToProfile = () => {
    router.push("/company-settings")
  }

  const handleViewChange = (view: string) => {
    if (view === "profile-settings") {
      router.push("/profile")
    } else if (view === "franchisor-profile") {
      router.push("/company-settings")
    } else if (view === "franchisor-dashboard") {
      router.push("/dashboard")
    }
  }

  const handleOpenModal = (type: string, leadId?: string) => {
    console.log("[v0] FranchisorDashboardView: handleOpenModal called with:", { type, leadId })
    setActiveModal({ type, leadId })
    console.log("[v0] FranchisorDashboardView: activeModal state set to:", { type, leadId })
  }

  console.log("[v0] FranchisorDashboardView: Rendering with activeModal:", activeModal)

  return (
    <div className="min-h-screen bg-background">
      <Header
        currentView="franchisor-dashboard"
        onViewChange={handleViewChange}
        onBack={() => router.back()}
        onNavigate={() => {}}
      />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <FranchisorDashboard onOpenModal={handleOpenModal} onNavigateToProfile={handleNavigateToProfile} />
      </main>

      {activeModal && (
        <>
          {console.log(
            "[v0] FranchisorDashboardView: Rendering Modal component with type:",
            activeModal.type,
            "leadId:",
            activeModal.leadId,
          )}
          <Modal
            type={activeModal.type}
            isOpen={true}
            onClose={() => setActiveModal(null)}
            leadId={activeModal.leadId}
          />
        </>
      )}
    </div>
  )
}
