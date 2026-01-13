"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { User, Building2, Mail, Phone, Globe, FileText, ArrowLeft, CheckCircle2, Calendar, Bell, Loader2, AlertCircle, MessageSquare, X, Settings, Layers, DollarSign } from 'lucide-react'
import { createBrowserClient } from "@supabase/ssr"
import { TeamManagement } from "@/components/team-management"
import { WhiteLabelSettings } from "@/components/white-label-settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PipelineStageManager } from "@/components/pipeline-stage-manager"

export function CompanySettingsContent({
  user,
  franchisorProfile,
  franchises,
}: {
  user: any
  franchisorProfile: any
  franchises: any[]
}) {
  const router = useRouter()

  const [editedProfile, setEditedProfile] = useState({
    name: franchisorProfile?.contact_name || "",
    title: franchisorProfile?.title || "",
    email: franchisorProfile?.email || user.email || "",
    phone: franchisorProfile?.phone || "",
    companyName: franchisorProfile?.company_name || "",
    website: franchisorProfile?.website || "",
    pipelineLeadValue: franchisorProfile?.pipeline_lead_value || 50000,
  })

  // Email notification preferences state - DISABLED: Email notifications not yet implemented
  // const [notifications, setNotifications] = useState({
  //   newLeads: true,
  //   leadEngagement: true,
  //   fddExpiration: true,
  // })

  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [showErrorToast, setShowErrorToast] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [showUpdateRequestModal, setShowUpdateRequestModal] = useState(false)
  const [selectedFranchiseForUpdate, setSelectedFranchiseForUpdate] = useState<any>(null)
  const [selectedFranchiseForSettings, setSelectedFranchiseForSettings] = useState<any>(null)

  const handleSave = async () => {
    setIsSaving(true)
    setShowErrorToast(false)
    
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { error } = await supabase
        .from("franchisor_profiles")
        .update({
          contact_name: editedProfile.name,
          title: editedProfile.title,
          email: editedProfile.email,
          phone: editedProfile.phone,
          company_name: editedProfile.companyName,
          website: editedProfile.website,
          pipeline_lead_value: editedProfile.pipelineLeadValue,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      if (error) {
        console.error("[Company Settings] Save error:", error)
        setErrorMessage(error.message || "Failed to save settings")
        setShowErrorToast(true)
        setTimeout(() => setShowErrorToast(false), 5000)
      } else {
        console.log("[Company Settings] Saved successfully")
        setShowSuccessToast(true)
        setTimeout(() => setShowSuccessToast(false), 3000)
      }
    } catch (err) {
      console.error("[Company Settings] Unexpected error:", err)
      setErrorMessage("An unexpected error occurred")
      setShowErrorToast(true)
      setTimeout(() => setShowErrorToast(false), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleViewFDD = (franchiseId: string, franchiseName: string) => {
    console.log("[v0] Navigating to FDD viewer for franchise:", franchiseId, franchiseName)
    const franchise = franchises.find((f) => f.id === franchiseId)
    if (franchise?.slug) {
      router.push(`/fdd/${franchise.slug}`)
    } else {
      // If no slug exists, create one from the name as fallback
      const fallbackSlug = franchiseName.toLowerCase().replace(/\s+/g, "-")
      router.push(`/fdd/${fallbackSlug}`)
    }
  }

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto"> {/* Added max-width and increased spacing */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")} className="h-10 w-10 rounded-full hover:bg-muted"> {/* Styled back button */}
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Company Settings</h1> {/* Increased font size */}
          <p className="text-sm text-muted-foreground mt-1">Manage your account and franchise information</p>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="settings" className="gap-2">
            <Building2 className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="gap-2">
            <Layers className="h-4 w-4" />
            Pipeline Stages
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings">
      <div className="grid gap-8 lg:grid-cols-2"> {/* Increased grid gap */}
        {/* Personal Information */}
        <Card className="p-6 space-y-6 border-border/60 shadow-sm"> {/* Enhanced card styling */}
          <div className="flex items-center gap-3 pb-4 border-b border-border/40"> {/* Added separator */}
            <div className="rounded-xl bg-cta/10 p-2.5"> {/* Adjusted icon container */}
              <User className="h-5 w-5 text-cta" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Personal Information</h2>
              <p className="text-xs text-muted-foreground">Your contact details</p> {/* Added subtitle */}
            </div>
          </div>

          <div className="space-y-5"> {/* Increased spacing */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <Input // Replaced raw input with Shadcn Input
                type="text"
                className="h-11"
                value={editedProfile.name}
                onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Title</label>
              <Input
                type="text"
                className="h-11"
                placeholder="e.g., VP of Franchise Development"
                value={editedProfile.title}
                onChange={(e) => setEditedProfile({ ...editedProfile, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  className="h-11 pl-10"
                  value={editedProfile.email}
                  onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="tel"
                  className="h-11 pl-10"
                  value={editedProfile.phone}
                  onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Company Information */}
        <Card className="p-6 space-y-6 border-border/60 shadow-sm">
          <div className="flex items-center gap-3 pb-4 border-b border-border/40">
            {franchisorProfile?.logo_url ? (
              <img
                src={franchisorProfile.logo_url}
                alt={franchisorProfile.company_name || "Company logo"}
                className="h-12 w-12 rounded-xl object-contain border border-border/50 bg-white p-1"
              />
            ) : (
              <div className="rounded-xl bg-cta/10 p-2.5">
                <Building2 className="h-5 w-5 text-cta" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold">Company Information</h2>
              <p className="text-xs text-muted-foreground">Business details</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Company Name</label>
              <Input
                type="text"
                className="h-11"
                value={editedProfile.companyName}
                onChange={(e) => setEditedProfile({ ...editedProfile, companyName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Website</label>
              <div className="relative">
                <Globe className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="url"
                  className="h-11 pl-10"
                  placeholder="https://yourcompany.com"
                  value={editedProfile.website}
                  onChange={(e) => setEditedProfile({ ...editedProfile, website: e.target.value })}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-6 lg:col-span-2 border-border/60 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-cta/10 p-2.5">
                <FileText className="h-5 w-5 text-cta" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Your Franchises</h2>
                <p className="text-sm text-muted-foreground">
                  Manage FDD documents and updates for each franchise brand
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-muted text-foreground px-3 py-1">
              {franchises.length} {franchises.length === 1 ? "Brand" : "Brands"}
            </Badge>
          </div>

          {franchises.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {franchises.map((franchise) => (
                <Card
                  key={franchise.id}
                  className="p-5 space-y-4 hover:shadow-md hover:border-cta/30 transition-all cursor-pointer group bg-card"
                  onClick={() => handleViewFDD(franchise.id, franchise.name)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {franchise.logo_url ? (
                        <img
                          src={franchise.logo_url || "/placeholder.svg"}
                          alt={franchise.name}
                          className="h-14 w-14 rounded-xl object-cover flex-shrink-0 border border-border/50 bg-muted/20"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-xl bg-cta/5 flex items-center justify-center flex-shrink-0 border border-cta/10">
                          <Building2 className="h-7 w-7 text-cta" />
                        </div>
                      )}
                      <div className="space-y-1 min-w-0 pt-1">
                        <p className="font-semibold truncate text-foreground group-hover:text-cta transition-colors">{franchise.name}</p>
                        <p className="text-xs text-muted-foreground">{franchise.industry}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
                      <span>Current FDD</span>
                      <Badge variant="outline" className="text-[10px] bg-background">
                        2025
                      </Badge>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-background hover:bg-muted border-border/60"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFranchiseForUpdate(franchise)
                        setShowUpdateRequestModal(true)
                      }}
                    >
                      <MessageSquare className="mr-2 h-3.5 w-3.5" />
                      Request Update
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-background hover:bg-muted border-border/60"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFranchiseForSettings(franchise)
                      }}
                    >
                      <Settings className="mr-2 h-3.5 w-3.5" />
                      Customize
                    </Button>
                  </div>

                  <div className="pt-3 border-t border-border/40">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Added {new Date(franchise.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center border-2 border-dashed border-border/60 rounded-xl bg-muted/5">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-muted p-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <p className="font-medium mb-2 text-foreground">No franchises assigned yet</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Contact support to have franchise brands assigned to your account
              </p>
            </div>
          )}
        </Card>

        {/* Email Notifications - DISABLED: Feature not yet implemented
        <Card className="p-6 space-y-6 lg:col-span-2 border-border/60 shadow-sm">
          <div className="flex items-center gap-3 pb-4 border-b border-border/40">
            <div className="rounded-xl bg-cta/10 p-2.5">
              <Bell className="h-5 w-5 text-cta" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Email Notifications</h2>
              <p className="text-xs text-muted-foreground">Manage your alerts</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/40 hover:bg-muted/40 transition-colors">
              <div className="space-y-1">
                <p className="font-medium text-sm">New Leads</p>
                <p className="text-xs text-muted-foreground">Get notified when new leads view your FDD</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.newLeads}
                onChange={(e) => setNotifications({ ...notifications, newLeads: e.target.checked })}
                className="h-5 w-5 rounded border-border text-cta focus:ring-cta cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/40 hover:bg-muted/40 transition-colors">
              <div className="space-y-1">
                <p className="font-medium text-sm">Lead Engagement</p>
                <p className="text-xs text-muted-foreground">Alerts when leads reach engagement milestones</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.leadEngagement}
                onChange={(e) => setNotifications({ ...notifications, leadEngagement: e.target.checked })}
                className="h-5 w-5 rounded border-border text-cta focus:ring-cta cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/40 hover:bg-muted/40 transition-colors">
              <div className="space-y-1">
                <p className="font-medium text-sm">FDD Expiration Reminders</p>
                <p className="text-xs text-muted-foreground">Reminders when 14-day disclosure period expires</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.fddExpiration}
                onChange={(e) => setNotifications({ ...notifications, fddExpiration: e.target.checked })}
                className="h-5 w-5 rounded border-border text-cta focus:ring-cta cursor-pointer"
              />
            </div>
          </div>
        </Card>
        */}

        {/* Team Management */}
        <div className="lg:col-span-2">
          <TeamManagement
            franchisorId={franchisorProfile.id}
            companyName={franchisorProfile.company_name}
            currentUserRole="owner"
          />
        </div>
      </div>
        </TabsContent>

        {/* Pipeline Stages Tab */}
        <TabsContent value="pipeline" className="space-y-6">
          {/* Pipeline Lead Value Setting */}
          <Card className="p-6 border-border/60 shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-border/40 mb-6">
              <div className="rounded-xl bg-emerald-500/10 p-2.5">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Pipeline Value Settings</h2>
                <p className="text-xs text-muted-foreground">Configure how pipeline value is calculated</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Estimated Value Per Lead</label>
                <p className="text-xs text-muted-foreground mb-2">
                  This value is used to calculate the total pipeline value shown on your dashboard. 
                  Set this to your average franchise fee or expected revenue per closed deal.
                </p>
                <div className="relative max-w-xs">
                  <DollarSign className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    className="h-11 pl-10"
                    placeholder="50000"
                    value={editedProfile.pipelineLeadValue}
                    onChange={(e) => setEditedProfile({ ...editedProfile, pipelineLeadValue: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Current setting: <span className="font-medium text-foreground">${editedProfile.pipelineLeadValue.toLocaleString()}</span> per lead
                </p>
              </div>
              
              <div className="p-4 bg-muted/30 rounded-lg border border-border/40">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Example:</strong> If you have 10 leads in your pipeline and your value per lead is ${editedProfile.pipelineLeadValue.toLocaleString()}, 
                  your total pipeline value will show as <strong className="text-foreground">${(editedProfile.pipelineLeadValue * 10).toLocaleString()}</strong>
                </p>
              </div>
            </div>
          </Card>

          {/* Pipeline Stages */}
          <Card className="p-6 border-border/60 shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-border/40 mb-6">
              <div className="rounded-xl bg-cta/10 p-2.5">
                <Layers className="h-5 w-5 text-cta" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Pipeline Stages</h2>
                <p className="text-xs text-muted-foreground">Customize your lead pipeline stages</p>
              </div>
            </div>
            <PipelineStageManager />
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4 pt-4 border-t border-border/40">
        <Button variant="outline" onClick={() => router.push("/dashboard")} className="h-11 px-6">
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-cta hover:bg-cta/90 text-cta-foreground h-11 px-6 shadow-sm"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
          <Card className="p-4 bg-emerald-500/10 border-emerald-500/20 shadow-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <p className="font-medium text-emerald-600">Settings saved successfully</p>
            </div>
          </Card>
        </div>
      )}

      {/* Error Toast */}
      {showErrorToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
          <Card className="p-4 bg-red-500/10 border-red-500/20 shadow-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="font-medium text-red-600">{errorMessage || "Failed to save settings"}</p>
            </div>
          </Card>
        </div>
      )}

      {/* FDD Update Request Modal */}
      {showUpdateRequestModal && selectedFranchiseForUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-cta/10 p-2.5">
                  <FileText className="h-5 w-5 text-cta" />
                </div>
                <div>
                  <h3 className="font-semibold">Request FDD Update</h3>
                  <p className="text-xs text-muted-foreground">{selectedFranchiseForUpdate.name}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowUpdateRequestModal(false)
                  setSelectedFranchiseForUpdate(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Need to update your FDD with an amendment or new annual version? Our team will process your update within 24-48 hours.
              </p>

              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">To request an update:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Email your updated FDD to <a href="mailto:support@fddhub.com" className="text-cta hover:underline">support@fddhub.com</a></li>
                  <li>• Include the franchise name in the subject line</li>
                  <li>• Note if it's an amendment or full FDD replacement</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowUpdateRequestModal(false)
                    setSelectedFranchiseForUpdate(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-cta hover:bg-cta/90 text-cta-foreground"
                  onClick={() => {
                    window.location.href = `mailto:support@fddhub.com?subject=FDD Update Request - ${selectedFranchiseForUpdate.name}&body=Hi FDDHub Team,%0D%0A%0D%0AI'd like to request an FDD update for ${selectedFranchiseForUpdate.name}.%0D%0A%0D%0AUpdate type: [Amendment / New Annual FDD]%0D%0A%0D%0APlease let me know the next steps.%0D%0A%0D%0AThank you`
                    setShowUpdateRequestModal(false)
                    setSelectedFranchiseForUpdate(null)
                  }}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* White-Label Settings Modal */}
      {selectedFranchiseForSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setSelectedFranchiseForSettings(null)}
          />
          {/* Modal */}
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 bg-background rounded-lg shadow-xl">
            <div className="sticky top-0 bg-background z-10 flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                {selectedFranchiseForSettings.logo_url && (
                  <img
                    src={selectedFranchiseForSettings.logo_url}
                    alt={selectedFranchiseForSettings.name}
                    className="h-10 w-10 object-contain rounded-lg"
                  />
                )}
                <div>
                  <h2 className="font-semibold">{selectedFranchiseForSettings.name}</h2>
                  <p className="text-sm text-muted-foreground">White-Label Customization</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedFranchiseForSettings(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4">
              <WhiteLabelSettings 
                franchiseId={selectedFranchiseForSettings.id} 
                franchiseName={selectedFranchiseForSettings.name}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
