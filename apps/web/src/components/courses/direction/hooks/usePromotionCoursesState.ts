'use client'

import { useState } from 'react'
import { linkCoursesToTermAction } from '@/services/course/actions'
import { toast } from 'sonner'

export function usePromotionCoursesState() {
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Map<string, string | null>>(new Map())
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleToggleCourse = (courseId: string, originalTermId: string | null, targetTermId: string | null) => {
    setPendingChanges((prev) => {
      const next = new Map(prev)
      if (originalTermId === targetTermId) {
        next.delete(courseId)
      } else {
        next.set(courseId, targetTermId)
      }
      return next
    })
  }

  const handleReset = () => {
    setPendingChanges(new Map())
  }

  const handleSave = async () => {
    if (pendingChanges.size === 0) return

    try {
      setIsSubmitting(true)
      const updates = new Map<string | null, string[]>()
      pendingChanges.forEach((newTermId, courseId) => {
        const list = updates.get(newTermId) ?? []
        list.push(courseId)
        updates.set(newTermId, list)
      })

      for (const [termId, courseIds] of updates.entries()) {
        const res = await linkCoursesToTermAction({
          courseIds,
          termId: termId === 'none' ? null : termId,
        })
        if ('error' in res && res.error) {
          toast.error(typeof res.error === 'string' ? res.error : "Erreur d'attribution")
          return
        }
      }

      toast.success("Attributions des semestres enregistrées")
      setPendingChanges(new Map())
      setIsEditing(false)
    } catch (err) {
      console.error(err)
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    selectedTermId,
    setSelectedTermId,
    isEditing,
    setIsEditing,
    pendingChanges,
    isSubmitting,
    handleToggleCourse,
    handleReset,
    handleSave,
  }
}
