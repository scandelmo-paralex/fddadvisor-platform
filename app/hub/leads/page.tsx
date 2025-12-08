"use client"

import { useState } from "react"
import { FranchisorDashboard } from "@/components/franchisor-dashboard"
import { useRouter } from "next/navigation"
import { Modal } from "@/components/modals"

export default function LeadsPage() {
  const router = useRouter()
  const [activeModal, setActiveModal] = useState<{ type: string; leadId?: string } | null>(null)

  const handleOpenModal = (type: string, leadId?: string) => {
    console.log("[v0] LeadsPage: handleOpenModal called with:", { type, leadId })
    setActiveModal({ type, leadId })
    console.log("[v0] LeadsPage: activeModal state set to:", { type, leadId })
  }

  const handleNavigateToProfile = () => {
    router.push("/hub/company-settings")
  }

  console.log("[v0] LeadsPage: Rendering with activeModal:", activeModal)

  return (
    <div className="min-h-screen bg-background p-8">
      <FranchisorDashboard onOpenModal={handleOpenModal} onNavigateToProfile={handleNavigateToProfile} />

      {activeModal && (
        <>
          {console.log(
            "[v0] LeadsPage: Rendering Modal component with type:",
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
