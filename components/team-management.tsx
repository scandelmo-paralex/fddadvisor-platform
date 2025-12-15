"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Users,
  UserPlus,
  Mail,
  MoreHorizontal,
  Shield,
  Briefcase,
  Crown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  UserMinus,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TeamMember {
  id: string
  email: string
  full_name: string
  role: "owner" | "admin" | "recruiter" | "viewer"
  is_active: boolean
  status: "active" | "pending" | "deactivated"
  invited_at: string
  accepted_at?: string
}

interface TeamManagementProps {
  franchisorId: string
  companyName: string
  currentUserRole?: "owner" | "admin" | "recruiter" | "viewer"
}

const roleConfig = {
  owner: {
    label: "Owner",
    icon: Crown,
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    description: "Full access, can manage everything",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    description: "Can manage team and all leads",
  },
  recruiter: {
    label: "Recruiter",
    icon: Briefcase,
    color: "bg-green-500/10 text-green-600 border-green-500/20",
    description: "Can send FDDs and manage their leads",
  },
}

const statusConfig = {
  active: {
    label: "Active",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  pending: {
    label: "Pending",
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  },
  deactivated: {
    label: "Deactivated",
    color: "bg-red-500/10 text-red-600 border-red-500/20",
  },
}

export function TeamManagement({ franchisorId, companyName, currentUserRole = "owner" }: TeamManagementProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: "",
    full_name: "",
    role: "recruiter" as "admin" | "recruiter",
  })
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const canManageTeam = currentUserRole === "owner" || currentUserRole === "admin"

  useEffect(() => {
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/team")
      const data = await response.json()
      if (data.team_members) {
        setTeamMembers(data.team_members)
      }
    } catch (error) {
      console.error("Error fetching team members:", error)
      showToast("error", "Failed to load team members")
    } finally {
      setIsLoading(false)
    }
  }

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const handleInvite = async () => {
    if (!inviteForm.email || !inviteForm.full_name) {
      showToast("error", "Please fill in all fields")
      return
    }

    setIsInviting(true)
    try {
      const response = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      })
      const data = await response.json()

      if (data.success) {
        showToast("success", `Invitation sent to ${inviteForm.email}`)
        setShowInviteModal(false)
        setInviteForm({ email: "", full_name: "", role: "recruiter" })
        fetchTeamMembers()
      } else {
        showToast("error", data.error || "Failed to send invitation")
      }
    } catch (error) {
      showToast("error", "Failed to send invitation")
    } finally {
      setIsInviting(false)
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/team/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      const data = await response.json()

      if (data.success) {
        showToast("success", "Role updated successfully")
        fetchTeamMembers()
      } else {
        showToast("error", data.error || "Failed to update role")
      }
    } catch (error) {
      showToast("error", "Failed to update role")
    }
  }

  const handleResendInvitation = async (memberId: string, email: string) => {
    try {
      const response = await fetch(`/api/team/${memberId}/resend`, {
        method: "POST",
      })
      const data = await response.json()

      if (data.success) {
        showToast("success", `Invitation resent to ${email}`)
      } else {
        showToast("error", data.error || "Failed to resend invitation")
      }
    } catch (error) {
      showToast("error", "Failed to resend invitation")
    }
  }

  const handleDeactivate = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      return
    }

    try {
      const response = await fetch(`/api/team/${memberId}`, {
        method: "DELETE",
      })
      const data = await response.json()

      if (data.success) {
        showToast("success", data.message || "Team member removed")
        fetchTeamMembers()
      } else {
        showToast("error", data.error || "Failed to remove team member")
      }
    } catch (error) {
      showToast("error", "Failed to remove team member")
    }
  }

  const activeMembers = teamMembers.filter((m) => m.is_active)
  const pendingMembers = activeMembers.filter((m) => m.status === "pending")

  return (
    <Card className="p-6 space-y-6 border-border/60 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cta/10 p-2.5">
            <Users className="h-5 w-5 text-cta" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Team Members</h2>
            <p className="text-xs text-muted-foreground">
              {activeMembers.length} member{activeMembers.length !== 1 ? "s" : ""}
              {pendingMembers.length > 0 && ` • ${pendingMembers.length} pending`}
            </p>
          </div>
        </div>
        {canManageTeam && (
          <Button
            onClick={() => setShowInviteModal(true)}
            className="bg-cta hover:bg-cta/90 text-cta-foreground"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Team List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : activeMembers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No team members yet</p>
          {canManageTeam && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowInviteModal(true)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Invite your first team member
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {activeMembers.map((member) => {
            const RoleIcon = roleConfig[member.role].icon
            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/40 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-full bg-cta/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-cta">
                      {member.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{member.full_name}</p>
                      {member.status === "pending" && (
                        <Badge variant="outline" className={statusConfig.pending.color}>
                          Pending
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {member.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Role Badge */}
                  <Badge variant="outline" className={roleConfig[member.role].color}>
                    <RoleIcon className="mr-1 h-3 w-3" />
                    {roleConfig[member.role].label}
                  </Badge>

                  {/* Actions */}
                  {canManageTeam && member.role !== "owner" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {member.status === "pending" && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleResendInvitation(member.id, member.email)}
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Resend Invitation
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleUpdateRole(member.id, "admin")}
                          disabled={member.role === "admin"}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Make Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdateRole(member.id, "recruiter")}
                          disabled={member.role === "recruiter"}
                        >
                          <Briefcase className="mr-2 h-4 w-4" />
                          Make Recruiter
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeactivate(member.id, member.full_name)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <UserMinus className="mr-2 h-4 w-4" />
                          Remove from Team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4 p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-cta/10 p-2.5">
                  <UserPlus className="h-5 w-5 text-cta" />
                </div>
                <div>
                  <h3 className="font-semibold">Invite Team Member</h3>
                  <p className="text-xs text-muted-foreground">Add someone to {companyName}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowInviteModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  placeholder="Jane Smith"
                  value={inviteForm.full_name}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, full_name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="jane@company.com"
                  value={inviteForm.email}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, email: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select
                  value={inviteForm.role}
                  onValueChange={(value: "admin" | "recruiter") =>
                    setInviteForm({ ...inviteForm, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currentUserRole === "owner" && (
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <span>Admin</span>
                        </div>
                      </SelectItem>
                    )}
                    <SelectItem value="recruiter">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-green-600" />
                        <span>Recruiter</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {roleConfig[inviteForm.role].description}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowInviteModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-cta hover:bg-cta/90 text-cta-foreground"
                onClick={handleInvite}
                disabled={isInviting}
              >
                {isInviting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Invitation
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
          <Card
            className={`p-4 shadow-lg ${
              toast.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20"
                : "bg-red-500/10 border-red-500/20"
            }`}
          >
            <div className="flex items-center gap-3">
              {toast.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <p
                className={`font-medium ${
                  toast.type === "success" ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {toast.message}
              </p>
            </div>
          </Card>
        </div>
      )}
    </Card>
  )
}
