'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Edit } from 'lucide-react'
import { updateCourseAction } from '@/services/course'
import type { CourseInfoFields } from '../types'
import { Section, SectionHeader } from '../ui/Section'
import { DescriptionDialog } from '../ui/DescriptionDialog'

interface CourseInfoCardProps {
  courseId: string
  fields: CourseInfoFields
}

export function CourseInfoCard({ courseId, fields }: CourseInfoCardProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(fields.name)
  const [descOpen, setDescOpen] = useState(false)
  const [desc, setDesc] = useState(fields.description ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setName(fields.name)
    setDesc(fields.description ?? '')
  }, [fields.name, fields.description])

  async function persist(updates: { name?: string; description?: string | null }) {
    setSaving(true)
    setError(null)
    const res = await updateCourseAction(courseId, updates)
    setSaving(false)
    if ('error' in res) {
      setError(res.error)
      return false
    }
    router.refresh()
    return true
  }

  async function handleSave() {
    const ok = await persist({ name })
    if (ok) setEditing(false)
  }

  function handleCancel() {
    setName(fields.name)
    setEditing(false)
    setError(null)
  }

  async function handleDescSave() {
    const ok = await persist({ description: desc })
    if (ok) setDescOpen(false)
  }

  const excerpt =
    (fields.description ?? '').length > 40
      ? `${fields.description!.slice(0, 40)}…`
      : (fields.description ?? 'Aucune description.')

  const headerAction = editing ? (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={handleCancel}
        disabled={saving}
        className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-50"
      >
        Annuler
      </button>
      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={saving}
        className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? '…' : 'Enregistrer'}
      </button>
    </div>
  ) : (
    <Button
      variant="ghost"
      className="p-2 w-fit h-fit text-muted-foreground hover:text-foreground hover:bg-muted/30"
      onClick={() => setEditing(true)}
    >
      <Edit size={12} />
    </Button>
  )

  return (
    <>
      <Section>
        <SectionHeader title="Informations du cours" action={headerAction} />

        {error && (
          <p className="text-xs text-destructive mb-2 px-1" role="alert">
            {error}
          </p>
        )}

        <div className="space-y-0 divide-y divide-border/50">
          <div className="flex items-center justify-between py-2 gap-3">
            <span className="text-sm text-muted-foreground flex-shrink-0">Nom</span>
            {editing ? (
              <input
                className="text-sm font-medium text-foreground bg-muted/50 border border-border rounded-md px-2 py-1 outline-none w-full max-w-[220px] focus:border-ring"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            ) : (
              <span className="text-sm font-medium text-foreground text-right">{fields.name}</span>
            )}
          </div>

          <div className="flex items-center justify-between py-2 gap-3">
            <span className="text-sm text-muted-foreground flex-shrink-0">Volume horaire</span>
            <span className="text-sm font-medium text-foreground">{fields.ueCourse.duration}h</span>
          </div>

          <div className="flex items-center justify-between py-2 gap-3">
            <span className="text-sm text-muted-foreground flex-shrink-0">Crédits</span>
            <span className="text-sm font-medium text-foreground">{fields.credits} ECTS</span>
          </div>

          <div className="flex items-center justify-between py-2 gap-3">
            <span className="text-sm text-muted-foreground flex-shrink-0">Classe</span>
            <span className="text-sm font-medium text-foreground">
              {fields.class.level} — {fields.class.name}
            </span>
          </div>

          <div className="flex items-start justify-between py-2 gap-3">
            <span className="text-sm text-muted-foreground flex-shrink-0">Description</span>
            <span className="text-sm text-muted-foreground text-right leading-relaxed">
              {excerpt}{' '}
              <button
                type="button"
                onClick={() => setDescOpen(true)}
                className="text-primary text-xs hover:underline"
              >
                {fields.description ? 'Voir plus' : 'Ajouter'}
              </button>
            </span>
          </div>
        </div>
      </Section>

      <DescriptionDialog
        open={descOpen}
        value={desc}
        onChange={setDesc}
        onClose={() => setDescOpen(false)}
        onSave={() => void handleDescSave()}
      />
    </>
  )
}
