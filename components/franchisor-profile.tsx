"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Building2,
  Mail,
  Phone,
  Globe,
  Upload,
  FileText,
  CreditCard,
  Bell,
  CheckCircle2,
  Calendar,
  ArrowLeft,
  Trash2,
  Plus,
  FileSignature,
} from "lucide-react"
import type { FranchisorProfileType } from "@/lib/data"
import { FDDOnboardingWizard } from "@/components/fdd-onboarding-wizard" // Fixed import to use named export instead of default export

interface FranchisorProfileProps {
  profile: FranchisorProfileType
  onUpdateProfile: (profile: FranchisorProfileType) => void
  onBack: () => void
}

export function FranchisorProfile({ profile, onUpdateProfile, onBack }: FranchisorProfileProps) {
  const [editedProfile, setEditedProfile] = useState(profile)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [newFDD, setNewFDD] = useState({ brand: "", fileName: "" })
  const [item23ReceiptFile, setItem23ReceiptFile] = useState<string | null>(null)
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(profile.companyInfo.logoUrl || null)

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, etc.)")
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB")
      return
    }

    setIsUploadingLogo(true)

    try {
      // Upload to Blob storage
      const formData = new FormData()
      formData.append("file", file)

      const uploadResponse = await fetch("/api/upload-logo", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload logo")
      }

      const { url } = await uploadResponse.json()

      // Update franchisor profile and franchises with logo URL
      const updateResponse = await fetch("/api/franchisor/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: url }),
      })

      if (!updateResponse.ok) {
        throw new Error("Failed to update logo")
      }

      // Update local state
      setLogoPreview(url)
      setEditedProfile({
        ...editedProfile,
        companyInfo: { ...editedProfile.companyInfo, logoUrl: url },
      })

      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 3000)
    } catch (error) {
      console.error("[v0] Logo upload error:", error)
      alert("Failed to upload logo. Please try again.")
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleSave = () => {
    onUpdateProfile(editedProfile)
    setShowSuccessToast(true)
    setTimeout(() => setShowSuccessToast(false), 3000)
  }

  const handleUploadFDD = () => {
    if (!newFDD.brand || !newFDD.fileName) return

    const updatedFDDs = [
      ...editedProfile.fddManagement.fdds,
      {
        brand: newFDD.brand,
        currentVersion: "2025 FDD",
        uploadDate: new Date().toLocaleDateString(),
        fileName: newFDD.fileName,
      },
    ]

    setEditedProfile({
      ...editedProfile,
      fddManagement: { fdds: updatedFDDs },
    })
    setShowUploadModal(false)
    setNewFDD({ brand: "", fileName: "" })
    setShowSuccessToast(true)
    setTimeout(() => setShowSuccessToast(false), 3000)
  }

  const handleDeleteFDD = (index: number) => {
    const updatedFDDs = editedProfile.fddManagement.fdds.filter((_, i) => i !== index)
    setEditedProfile({
      ...editedProfile,
      fddManagement: { fdds: updatedFDDs },
    })
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Company Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account and company information</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Information */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-cta/10 p-2">
              <User className="h-5 w-5 text-cta" />
            </div>
            <h2 className="text-lg font-semibold">Personal Information</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <input
                type="text"
                className="w-full p-3 bg-muted/50 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-cta"
                value={editedProfile.personalInfo.name}
                onChange={(e) =>
                  setEditedProfile({
                    ...editedProfile,
                    personalInfo: { ...editedProfile.personalInfo, name: e.target.value },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <input
                type="text"
                className="w-full p-3 bg-muted/50 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-cta"
                value={editedProfile.personalInfo.title}
                onChange={(e) =>
                  setEditedProfile({
                    ...editedProfile,
                    personalInfo: { ...editedProfile.personalInfo, title: e.target.value },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  className="flex-1 bg-transparent focus:outline-none"
                  value={editedProfile.personalInfo.email}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      personalInfo: { ...editedProfile.personalInfo, email: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <input
                  type="tel"
                  className="flex-1 bg-transparent focus:outline-none"
                  value={editedProfile.personalInfo.phone}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      personalInfo: { ...editedProfile.personalInfo, phone: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Company Information */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-cta/10 p-2">
              <Building2 className="h-5 w-5 text-cta" />
            </div>
            <h2 className="text-lg font-semibold">Company Information</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company Name</label>
              <input
                type="text"
                className="w-full p-3 bg-muted/50 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-cta"
                value={editedProfile.companyInfo.companyName}
                onChange={(e) =>
                  setEditedProfile({
                    ...editedProfile,
                    companyInfo: { ...editedProfile.companyInfo, companyName: e.target.value },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Website</label>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <input
                  type="url"
                  className="flex-1 bg-transparent focus:outline-none"
                  value={editedProfile.companyInfo.website}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      companyInfo: { ...editedProfile.companyInfo, website: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Company Logo</label>
              {logoPreview ? (
                <div className="space-y-3">
                  <div className="relative w-full h-32 border-2 border-border rounded-lg overflow-hidden bg-muted/30">
                    <img
                      src={logoPreview || "/placeholder.svg"}
                      alt="Company logo"
                      className="w-full h-full object-contain p-4"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => document.getElementById("logo-upload")?.click()}
                      disabled={isUploadingLogo}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Change Logo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLogoPreview(null)
                        setEditedProfile({
                          ...editedProfile,
                          companyInfo: { ...editedProfile.companyInfo, logoUrl: undefined },
                        })
                      }}
                      disabled={isUploadingLogo}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center space-y-3">
                  <div className="flex justify-center">
                    <div className="rounded-full bg-muted p-3">
                      {isUploadingLogo ? (
                        <div className="h-6 w-6 border-2 border-cta border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{isUploadingLogo ? "Uploading..." : "Upload company logo"}</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("logo-upload")?.click()}
                    disabled={isUploadingLogo}
                  >
                    Choose File
                  </Button>
                </div>
              )}
              <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
          </div>
        </Card>

        {/* Item 23 Receipt Upload Section */}
        <Card className="p-6 space-y-6 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2">
              <FileSignature className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Item 23 Receipt Template</h2>
              <p className="text-sm text-muted-foreground">
                Upload your Item 23 receipt template. Leads must sign this before viewing your FDD.
              </p>
            </div>
          </div>

          {item23ReceiptFile || editedProfile.fddManagement.item23ReceiptUrl ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-emerald-600">Item 23 Receipt Uploaded</p>
                    <p className="text-sm text-muted-foreground">{item23ReceiptFile || "Item_23_Receipt.pdf"}</p>
                    <p className="text-xs text-muted-foreground">
                      Leads will be required to sign this receipt before viewing any FDD
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    setItem23ReceiptFile(null)
                    setEditedProfile({
                      ...editedProfile,
                      fddManagement: { ...editedProfile.fddManagement, item23ReceiptUrl: undefined },
                    })
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-amber-500/10 p-4">
                  <FileSignature className="h-8 w-8 text-amber-600" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-medium">Upload Item 23 Receipt Template</p>
                <p className="text-sm text-muted-foreground">PDF file required for FDD disclosure compliance</p>
              </div>
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => {
                  // Simulate file upload
                  setItem23ReceiptFile("Item_23_Receipt.pdf")
                  setEditedProfile({
                    ...editedProfile,
                    fddManagement: {
                      ...editedProfile.fddManagement,
                      item23ReceiptUrl: "/receipts/item_23_receipt.pdf",
                    },
                  })
                }}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Receipt Template
              </Button>
            </div>
          )}
        </Card>

        {/* FDD Management */}
        <Card className="p-6 space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-cta/10 p-2">
                <FileText className="h-5 w-5 text-cta" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">FDD Management</h2>
                <p className="text-sm text-muted-foreground">Upload and manage your Franchise Disclosure Documents</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowOnboardingWizard(true)}
                className="gap-2 bg-cta hover:bg-cta/90 text-cta-foreground"
              >
                <Plus className="h-4 w-4" />
                Add New FDD
              </Button>
            </div>
          </div>

          {editedProfile.fddManagement.fdds.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {editedProfile.fddManagement.fdds.map((fdd, index) => (
                <div key={index} className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1 min-w-0">
                        <p className="font-semibold text-emerald-600">{fdd.brand}</p>
                        <p className="text-sm text-muted-foreground truncate">{fdd.fileName}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                      onClick={() => handleDeleteFDD(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{fdd.uploadDate}</span>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      {fdd.currentVersion}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-muted-foreground">
                No FDDs uploaded yet. Upload your current FDDs to start sending to leads.
              </p>
            </div>
          )}
        </Card>

        {/* Billing */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-cta/10 p-2">
              <CreditCard className="h-5 w-5 text-cta" />
            </div>
            <h2 className="text-lg font-semibold">Billing & Subscription</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Plan</label>
              <div className="flex items-center justify-between p-3 bg-cta/10 border border-cta/20 rounded-lg">
                <span className="font-semibold text-cta">{editedProfile.billing.subscriptionTier}</span>
                <Button variant="outline" size="sm">
                  Upgrade
                </Button>
              </div>
            </div>

            {editedProfile.billing.paymentMethod && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Method</label>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Card ending in {editedProfile.billing.paymentMethod}</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    Update
                  </Button>
                </div>
              </div>
            )}

            {editedProfile.billing.nextBillingDate && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Next Billing Date</label>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{editedProfile.billing.nextBillingDate}</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6 space-y-6 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-cta/10 p-2">
              <Bell className="h-5 w-5 text-cta" />
            </div>
            <h2 className="text-lg font-semibold">Email Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="space-y-1">
                <p className="font-medium">New Leads</p>
                <p className="text-sm text-muted-foreground">Get notified when new leads view your FDD</p>
              </div>
              <input
                type="checkbox"
                checked={editedProfile.notifications.newLeads}
                onChange={(e) =>
                  setEditedProfile({
                    ...editedProfile,
                    notifications: { ...editedProfile.notifications, newLeads: e.target.checked },
                  })
                }
                className="h-5 w-5 rounded border-border text-cta focus:ring-cta"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="space-y-1">
                <p className="font-medium">Lead Engagement</p>
                <p className="text-sm text-muted-foreground">
                  Alerts when leads reach engagement milestones (3+ questions, ready to connect)
                </p>
              </div>
              <input
                type="checkbox"
                checked={editedProfile.notifications.leadEngagement}
                onChange={(e) =>
                  setEditedProfile({
                    ...editedProfile,
                    notifications: { ...editedProfile.notifications, leadEngagement: e.target.checked },
                  })
                }
                className="h-5 w-5 rounded border-border text-cta focus:ring-cta"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="space-y-1">
                <p className="font-medium">FDD Expiration Reminders</p>
                <p className="text-sm text-muted-foreground">
                  Reminders when 14-day disclosure period expires and leads can close
                </p>
              </div>
              <input
                type="checkbox"
                checked={editedProfile.notifications.fddExpiration}
                onChange={(e) =>
                  setEditedProfile({
                    ...editedProfile,
                    notifications: { ...editedProfile.notifications, fddExpiration: e.target.checked },
                  })
                }
                className="h-5 w-5 rounded border-border text-cta focus:ring-cta"
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onBack}>
          Cancel
        </Button>
        <Button onClick={handleSave} className="bg-cta hover:bg-cta/90 text-cta-foreground">
          Save Changes
        </Button>
      </div>

      {/* Upload FDD Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Upload FDD</h2>
              <p className="text-sm text-muted-foreground">Upload a Franchise Disclosure Document for a brand</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Brand Name</label>
              <input
                type="text"
                placeholder="e.g., Drybar, Lash Studio, Elements Massage"
                className="w-full p-3 bg-muted/50 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-cta"
                value={newFDD.brand}
                onChange={(e) => setNewFDD({ ...newFDD, brand: e.target.value })}
              />
            </div>

            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-cta/10 p-4">
                  <Upload className="h-8 w-8 text-cta" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-medium">Drop your FDD here or click to browse</p>
                <p className="text-sm text-muted-foreground">PDF files only, max 50MB</p>
              </div>
              <Button
                className="bg-cta hover:bg-cta/90 text-cta-foreground"
                onClick={() => setNewFDD({ ...newFDD, fileName: `${newFDD.brand}_FDD_2025.pdf` })}
              >
                Select File
              </Button>
              {newFDD.fileName && <p className="text-sm text-muted-foreground mt-2">Selected: {newFDD.fileName}</p>}
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadModal(false)
                  setNewFDD({ brand: "", fileName: "" })
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUploadFDD}
                disabled={!newFDD.brand || !newFDD.fileName}
                className="bg-cta hover:bg-cta/90 text-cta-foreground"
              >
                Upload FDD
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
          <Card className="p-4 bg-emerald-500/10 border-emerald-500/20 shadow-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <p className="font-medium text-emerald-600">Profile updated successfully</p>
            </div>
          </Card>
        </div>
      )}

      {showOnboardingWizard && (
        <FDDOnboardingWizard
          onClose={() => setShowOnboardingWizard(false)}
          onComplete={(fddData) => {
            console.log("[v0] FDD onboarding complete:", fddData)
            setShowOnboardingWizard(false)
            setShowSuccessToast(true)
            setTimeout(() => setShowSuccessToast(false), 3000)
          }}
        />
      )}
    </div>
  )
}
