'use client'
import { useRef } from 'react'
import { useClasses } from '@/hooks/data/classes/useClasses'
import { input } from '@/styles/input'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { FormDialog } from '@/components/ui/FormDialog'
import { DialogFooter } from '@/components/ui/dialog'
import { LEVELS, LEVEL_LABEL } from '@/services/class/constants'

type Level = typeof LEVELS[number]

type ProgramTrack = { id: string; name: string }
type CurrentYear  = { id: string; name: string } | null

function Form({
  programTracks,
  currentYear,
  close,
}: {
  programTracks: ProgramTrack[]
  currentYear: CurrentYear
  close: () => void
}) {
  const { create, isCreating } = useClasses({ yearId: currentYear?.id })
  const ref = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!create) return
    const fd = new FormData(e.currentTarget)
    await create({
      name:           fd.get('name') as string,
      programTrackId: fd.get('programTrackId') as string,
      level:          (fd.get('level') as Level) || undefined,
      academicYearId: currentYear?.id,
    })
    ref.current?.reset()
    close()
  }

  return (
    <form ref={ref} onSubmit={handleSubmit} className="flex flex-col gap-4">
      {currentYear && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-text-subtle">
          Année : <span className="font-medium text-text-primary">{currentYear.name}</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="cls-name" className={input.label}>Nom de la promotion *</label>
        <input
          id="cls-name"
          name="name"
          type="text"
          required
          autoFocus
          placeholder="GL-L1-A"
          className={input.base}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="cls-track" className={input.label}>Filière *</label>
        <select id="cls-track" name="programTrackId" required className={input.base}>
          <option value="">Sélectionner une filière</option>
          {programTracks.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="cls-level" className={input.label}>Niveau</label>
        <select id="cls-level" name="level" className={input.base}>
          <option value="">— Aucun niveau —</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>{LEVEL_LABEL[l]}</option>
          ))}
        </select>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" size="sm" onClick={close}>Annuler</Button>
        <Button type="submit" size="sm" disabled={isCreating || !currentYear}>
          {isCreating ? 'Création…' : 'Créer'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function ClassCreateButton({
  programTracks,
  currentYear,
}: {
  programTracks: ProgramTrack[]
  currentYear: CurrentYear
}) {
  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="outline" disabled={!currentYear||!programTracks}>
          <Plus className="size-3.5" />
          Nouvelle promotion
        </Button>
      }
      title="Nouvelle promotion"
      description={!currentYear ? "Définissez d'abord une année académique courante." : undefined}
    >
      {(close) => (
        <Form programTracks={programTracks} currentYear={currentYear} close={close} />
      )}
    </FormDialog>
  )
}
