"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserPlus, X, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SharedAccess {
  id: string
  shared_with_email: string
  created_at: string
}

export function SharedAccessManager() {
  const [sharedAccess, setSharedAccess] = useState<SharedAccess[]>([])
  const [newEmail, setNewEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [featureUnavailable, setFeatureUnavailable] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSharedAccess()
  }, [])

  const fetchSharedAccess = async () => {
    try {
      const response = await fetch("/api/shared-access")
      const data = await response.json()

      if (response.ok) {
        setSharedAccess(data.sharedAccess || [])
        setFeatureUnavailable(false)
      } else if (response.status === 503) {
        setFeatureUnavailable(true)
      }
    } catch (error) {
      console.error("[v0] Error fetching shared access:", error)
      setFeatureUnavailable(true)
    }
  }

  const handleAddAccess = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newEmail || !newEmail.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/shared-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      })

      const data = await response.json()

      if (response.ok) {
        setSharedAccess([data.sharedAccess, ...sharedAccess])
        setNewEmail("")
        toast({
          title: "Access granted",
          description: `${newEmail} can now access your account`,
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to add access",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error adding access:", error)
      toast({
        title: "Error",
        description: "Failed to add access",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveAccess = async (id: string, email: string) => {
    try {
      const response = await fetch(`/api/shared-access?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSharedAccess(sharedAccess.filter((sa) => sa.id !== id))
        toast({
          title: "Access removed",
          description: `${email} no longer has access`,
        })
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to remove access",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error removing access:", error)
      toast({
        title: "Error",
        description: "Failed to remove access",
        variant: "destructive",
      })
    }
  }

  if (featureUnavailable) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Team Access</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Team access feature is not available yet. This feature will allow you to share access to your account with
          team members.
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Team Access</h3>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Share access to your account with team members. Anyone with access can view and manage your leads.
      </p>

      <form onSubmit={handleAddAccess} className="flex gap-2 mb-6">
        <Input
          type="email"
          placeholder="teammate@example.com"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          disabled={loading}
        />
        <Button type="submit" disabled={loading}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </form>

      {sharedAccess.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No team members yet. Add someone to get started.
        </p>
      ) : (
        <div className="space-y-2">
          {sharedAccess.map((access) => (
            <div key={access.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">{access.shared_with_email}</p>
                <p className="text-xs text-muted-foreground">
                  Added {new Date(access.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveAccess(access.id, access.shared_with_email)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
