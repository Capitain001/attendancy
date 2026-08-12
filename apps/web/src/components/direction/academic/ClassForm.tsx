'use client'
import { useRef } from 'react'
import { useManageClasses } from '@/hooks/data/class/useManageClasses'
import { input } from '@/styles/input'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { FormDialog } from '@/components/ui/FormDialog'
import { DialogFooter } from '@/components/ui/dialog'

const LEVELS = ['L1', 'L2', 'L3', 'M1', 'M2', 'D1', 'D2', 'D3'] as const
type Level = typeof LEVELS[number]
const LEVEL_LABEL: Record<string, string> = {
  L1: 'Licence 1', L2: 'Licence 2', L3: 'Licence 3',
  M1: 'Master 1', M2: 'Master 2',
  D1: 'Doctorat 1', D2: 'Doctorat 2', D3: 'Doctorat 3',
}

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
  const { create } = useManageClasses(currentYear?.id)
  const ref = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    await create.mutateAsync({
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
        <label htmlFor="cls-name" className={input.label}>Nom de la classe *</label>
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
        <Button type="submit" size="sm" disabled={create.isPending || !currentYear}>
          {create.isPending ? 'Création…' : 'Créer'}
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
          Classe
        </Button>
      }
      title="Nouvelle classe"
      description={!currentYear ? "Définissez d'abord une année académique courante." : undefined}
    >
      {(close) => (
        <Form programTracks={programTracks} currentYear={currentYear} close={close} />
      )}
    </FormDialog>
  )
}
