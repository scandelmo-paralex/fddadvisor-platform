"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import SignatureCanvas from "react-signature-canvas"
import { useRef } from "react"

interface Item23ReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  onSign: (data: Item23SignatureData) => Promise<void>
  franchiseName: string
  franchiseId: string
}

export interface Item23SignatureData {
  entityType: "business" | "individual"
  businessName?: string
  businessSignature?: string
  businessTitle?: string
  businessPrintName?: string
  individualPrintName?: string
  signature: string
  dateSigned: string
}

export function Item23ReceiptModal({ isOpen, onClose, onSign, franchiseName }: Item23ReceiptModalProps) {
  const [step, setStep] = useState<"form" | "sign" | "review">("form")
  const [entityType, setEntityType] = useState<"business" | "individual">("individual")
  const [formData, setFormData] = useState({
    businessName: "",
    businessTitle: "",
    businessPrintName: "",
    individualPrintName: "",
    dateSigned: new Date().toISOString().split("T")[0],
  })
  const [signature, setSignature] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sigCanvas = useRef<SignatureCanvas>(null)

  const handleClearSignature = () => {
    sigCanvas.current?.clear()
    setSignature("")
  }

  const handleSaveSignature = () => {
    if (sigCanvas.current) {
      const dataUrl = sigCanvas.current.toDataURL()
      setSignature(dataUrl)
      setStep("review")
    }
  }

  const handleSubmit = async () => {
    if (!signature || !formData.dateSigned) {
      alert("Please complete all required fields and sign the receipt.")
      return
    }

    if (entityType === "individual" && !formData.individualPrintName) {
      alert("Please enter your printed name.")
      return
    }

    if (entityType === "business" && (!formData.businessName || !formData.businessPrintName)) {
      alert("Please complete all business entity fields.")
      return
    }

    setIsSubmitting(true)
    try {
      await onSign({
        entityType,
        businessName: entityType === "business" ? formData.businessName : undefined,
        businessTitle: entityType === "business" ? formData.businessTitle : undefined,
        businessPrintName: entityType === "business" ? formData.businessPrintName : undefined,
        individualPrintName: entityType === "individual" ? formData.individualPrintName : undefined,
        signature,
        dateSigned: formData.dateSigned,
      })
      onClose()
    } catch (error) {
      console.error("[v0] Error submitting Item 23 receipt:", error)
      alert("Failed to submit receipt. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-white">
        <DialogHeader>
          <DialogTitle>Item 23 Receipt - {franchiseName}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)]">
          {step === "form" && (
            <div className="space-y-6 p-4">
              <div className="space-y-4">
                <Label>Are you signing as a business entity or individual?</Label>
                <RadioGroup
                  value={entityType}
                  onValueChange={(value) => setEntityType(value as "business" | "individual")}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="individual" id="individual" />
                    <Label htmlFor="individual">Individual</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="business" id="business" />
                    <Label htmlFor="business">Business Entity</Label>
                  </div>
                </RadioGroup>
              </div>

              {entityType === "business" && (
                <div className="space-y-4 border-t pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Name of Business Entity *</Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      placeholder="Enter business name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessTitle">Title *</Label>
                    <Input
                      id="businessTitle"
                      value={formData.businessTitle}
                      onChange={(e) => setFormData({ ...formData, businessTitle: e.target.value })}
                      placeholder="e.g., CEO, President, Manager"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessPrintName">Print Name *</Label>
                    <Input
                      id="businessPrintName"
                      value={formData.businessPrintName}
                      onChange={(e) => setFormData({ ...formData, businessPrintName: e.target.value })}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                </div>
              )}

              {entityType === "individual" && (
                <div className="space-y-4 border-t pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="individualPrintName">Print Name *</Label>
                    <Input
                      id="individualPrintName"
                      value={formData.individualPrintName}
                      onChange={(e) => setFormData({ ...formData, individualPrintName: e.target.value })}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="dateSigned">Date * (Do not leave blank)</Label>
                <Input
                  id="dateSigned"
                  type="date"
                  value={formData.dateSigned}
                  onChange={(e) => setFormData({ ...formData, dateSigned: e.target.value })}
                  required
                />
              </div>

              <Button onClick={() => setStep("sign")} className="w-full">
                Continue to Signature
              </Button>
            </div>
          )}

          {step === "sign" && (
            <div className="space-y-6 p-4">
              <div className="space-y-2">
                <Label>Your Signature *</Label>
                <div className="border rounded-lg bg-white">
                  <SignatureCanvas
                    ref={sigCanvas}
                    canvasProps={{
                      className: "w-full h-40",
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleClearSignature}>
                    Clear
                  </Button>
                  <Button onClick={handleSaveSignature} className="flex-1">
                    Save Signature & Continue
                  </Button>
                </div>
              </div>
              <Button variant="ghost" onClick={() => setStep("form")}>
                Back to Form
              </Button>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-6 p-4">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Review Your Receipt</h3>

                {/* Display the actual receipt images with data overlay */}
                <div className="space-y-8">
                  {/* Franchisor Copy */}
                  <div className="relative border rounded-lg overflow-hidden">
                    <img
                      src="/images/design-mode/Drybar-FDD-%282025%29%28Receipts%29_1.png"
                      alt="Item 23 Receipt - Franchisor Copy"
                      className="w-full"
                    />
                    {/* Overlay signature and data on the image */}
                    <div className="absolute bottom-[180px] left-[50px] right-[50px]">
                      {entityType === "business" ? (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{formData.businessName}</p>
                          <img src={signature || "/placeholder.svg"} alt="Signature" className="h-12" />
                          <p className="text-sm">{formData.businessTitle}</p>
                          <p className="text-sm">{formData.businessPrintName}</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-sm">{formData.individualPrintName}</p>
                          <img src={signature || "/placeholder.svg"} alt="Signature" className="h-12" />
                        </div>
                      )}
                      <p className="text-sm mt-2">{formData.dateSigned}</p>
                    </div>
                  </div>

                  {/* Lead Copy */}
                  <div className="relative border rounded-lg overflow-hidden">
                    <img
                      src="/images/design-mode/Drybar-FDD-%282025%29%28Receipts%29_2.png"
                      alt="Item 23 Receipt - Your Copy"
                      className="w-full"
                    />
                    <div className="absolute bottom-[180px] left-[50px] right-[50px]">
                      {entityType === "business" ? (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{formData.businessName}</p>
                          <img src={signature || "/placeholder.svg"} alt="Signature" className="h-12" />
                          <p className="text-sm">{formData.businessTitle}</p>
                          <p className="text-sm">{formData.businessPrintName}</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-sm">{formData.individualPrintName}</p>
                          <img src={signature || "/placeholder.svg"} alt="Signature" className="h-12" />
                        </div>
                      )}
                      <p className="text-sm mt-2">{formData.dateSigned}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("form")}>
                  Edit Information
                </Button>
                <Button variant="outline" onClick={() => setStep("sign")}>
                  Change Signature
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? "Submitting..." : "Submit Receipt"}
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
