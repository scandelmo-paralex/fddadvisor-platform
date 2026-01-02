"use client"

import { useState, useEffect } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { 
  GripVertical, 
  Plus, 
  Pencil, 
  Trash2, 
  Star, 
  CheckCircle2, 
  XCircle,
  Loader2
} from "lucide-react"
import { PipelineStage } from "@/lib/types/database"

// Preset colors for stage selection
const PRESET_COLORS = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Amber", value: "#F59E0B" },
  { name: "Pink", value: "#EC4899" },
  { name: "Green", value: "#10B981" },
  { name: "Red", value: "#EF4444" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Gray", value: "#6B7280" },
]

interface SortableStageItemProps {
  stage: PipelineStage
  onEdit: (stage: PipelineStage) => void
  onDelete: (stage: PipelineStage) => void
}

function SortableStageItem({ stage, onEdit, onDelete }: SortableStageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-white border rounded-lg shadow-sm ${
        isDragging ? "ring-2 ring-blue-500" : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div
        className="w-4 h-4 rounded-full flex-shrink-0"
        style={{ backgroundColor: stage.color }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 truncate">{stage.name}</span>
          {stage.is_default && (
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <Star className="h-3 w-3" />
              Default
            </Badge>
          )}
          {stage.is_closed_won && (
            <Badge variant="default" className="text-xs bg-green-100 text-green-700 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Won
            </Badge>
          )}
          {stage.is_closed_lost && (
            <Badge variant="destructive" className="text-xs flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              Lost
            </Badge>
          )}
        </div>
        {stage.description && (
          <p className="text-sm text-gray-500 truncate">{stage.description}</p>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(stage)}
          className="h-8 w-8 p-0"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(stage)}
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

interface StageFormData {
  name: string
  description: string
  color: string
  is_default: boolean
  is_closed_won: boolean
  is_closed_lost: boolean
}

const defaultFormData: StageFormData = {
  name: "",
  description: "",
  color: "#3B82F6",
  is_default: false,
  is_closed_won: false,
  is_closed_lost: false,
}

export function PipelineStageManager() {
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null)
  const [deletingStage, setDeletingStage] = useState<PipelineStage | null>(null)
  const [formData, setFormData] = useState<StageFormData>(defaultFormData)
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Fetch stages on mount
  useEffect(() => {
    fetchStages()
  }, [])

  const fetchStages = async () => {
    try {
      const response = await fetch("/api/pipeline-stages")
      if (!response.ok) throw new Error("Failed to fetch stages")
      const data = await response.json()
      setStages(data)
    } catch (error) {
      console.error("Error fetching stages:", error)
      toast({
        title: "Error",
        description: "Failed to load pipeline stages",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = stages.findIndex((s) => s.id === active.id)
      const newIndex = stages.findIndex((s) => s.id === over.id)

      const newStages = arrayMove(stages, oldIndex, newIndex)
      setStages(newStages)

      // Save new order to server
      try {
        const response = await fetch("/api/pipeline-stages/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stageIds: newStages.map((s) => s.id) }),
        })

        if (!response.ok) throw new Error("Failed to reorder stages")

        toast({
          title: "Success",
          description: "Stage order updated",
        })
      } catch (error) {
        console.error("Error reordering stages:", error)
        // Revert on error
        fetchStages()
        toast({
          title: "Error",
          description: "Failed to update stage order",
          variant: "destructive",
        })
      }
    }
  }

  const handleAddStage = () => {
    setEditingStage(null)
    setFormData(defaultFormData)
    setIsDialogOpen(true)
  }

  const handleEditStage = (stage: PipelineStage) => {
    setEditingStage(stage)
    setFormData({
      name: stage.name,
      description: stage.description || "",
      color: stage.color,
      is_default: stage.is_default,
      is_closed_won: stage.is_closed_won,
      is_closed_lost: stage.is_closed_lost,
    })
    setIsDialogOpen(true)
  }

  const handleDeleteStage = (stage: PipelineStage) => {
    setDeletingStage(stage)
    setIsDeleteDialogOpen(true)
  }

  const handleSaveStage = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Stage name is required",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      const url = editingStage
        ? `/api/pipeline-stages/${editingStage.id}`
        : "/api/pipeline-stages"

      const method = editingStage ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save stage")
      }

      toast({
        title: "Success",
        description: editingStage ? "Stage updated" : "Stage created",
      })

      setIsDialogOpen(false)
      fetchStages()
    } catch (error: any) {
      console.error("Error saving stage:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save stage",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingStage) return

    setSaving(true)

    try {
      const response = await fetch(`/api/pipeline-stages/${deletingStage.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete stage")
      }

      toast({
        title: "Success",
        description: "Stage deleted",
      })

      setIsDeleteDialogOpen(false)
      setDeletingStage(null)
      fetchStages()
    } catch (error: any) {
      console.error("Error deleting stage:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete stage",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Pipeline Stages</h3>
          <p className="text-sm text-gray-500">
            Drag to reorder stages. Leads will move through these stages in your pipeline.
          </p>
        </div>
        <Button onClick={handleAddStage} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Stage
        </Button>
      </div>

      {stages.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-gray-50">
          <p className="text-gray-500">No pipeline stages configured.</p>
          <Button onClick={handleAddStage} variant="outline" className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Stage
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={stages.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {stages.map((stage) => (
                <SortableStageItem
                  key={stage.id}
                  stage={stage}
                  onEdit={handleEditStage}
                  onDelete={handleDeleteStage}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add/Edit Stage Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingStage ? "Edit Stage" : "Add Pipeline Stage"}
            </DialogTitle>
            <DialogDescription>
              {editingStage
                ? "Update the stage details below."
                : "Create a new stage for your sales pipeline."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Stage Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Discovery Call"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="e.g., Initial phone consultation scheduled"
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, color: color.value })
                    }
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color.value
                        ? "border-gray-900 scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_default: checked as boolean })
                  }
                />
                <Label htmlFor="is_default" className="text-sm font-normal">
                  Default stage for new leads
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_closed_won"
                  checked={formData.is_closed_won}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      is_closed_won: checked as boolean,
                      is_closed_lost: checked ? false : formData.is_closed_lost,
                    })
                  }
                />
                <Label htmlFor="is_closed_won" className="text-sm font-normal">
                  Mark as "Closed Won" stage
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_closed_lost"
                  checked={formData.is_closed_lost}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      is_closed_lost: checked as boolean,
                      is_closed_won: checked ? false : formData.is_closed_won,
                    })
                  }
                />
                <Label htmlFor="is_closed_lost" className="text-sm font-normal">
                  Mark as "Closed Lost" stage
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveStage} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingStage ? "Save Changes" : "Create Stage"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pipeline Stage</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingStage?.name}"? This action
              cannot be undone.
              <br />
              <br />
              <strong>Note:</strong> If there are leads in this stage, you'll need
              to move them to another stage first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Stage
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
