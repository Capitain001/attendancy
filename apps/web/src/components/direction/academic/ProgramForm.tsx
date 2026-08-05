'use client'
import { useRef, useState } from 'react'
import { useManagePrograms } from '@/hooks/data/program/useManagePrograms'
import { input } from '@/styles/input'
import { Button } from '@/components/ui/button'
import { Plus, Pencil } from 'lucide-react'
import { FormDialog } from '@/components/ui/FormDialog'
import { DialogFooter } from '@/components/ui/dialog'
import type { GetProgramTracksDto } from '@/services/program-track'

type TrackItem = NonNullable<GetProgramTracksDto>[number]

function CreateForm({ tracks, close }: { tracks: TrackItem[]; close: () => void }) {
  const { create } = useManagePrograms()
  const ref = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name           = fd.get('name') as string
    const description    = (fd.get('description') as string) || undefined
    const programTrackId = fd.get('programTrackId') as string

    await create.mutateAsync({ name, description, programTrackId })
    ref.current?.reset()
    close()
  }

  return (
    <form ref={ref} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="prog-name" className={input.label}>Nom du programme *</label>
        <input
          id="prog-name"
          name="name"
          type="text"
          required
          autoFocus
          placeholder="Licence Informatique"
          className={input.base}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="prog-track" className={input.label}>Filière *</label>
        <select id="prog-track" name="programTrackId" required className={input.base}>
          <option value="">Sélectionner une filière</option>
          {tracks.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="prog-desc" className={input.label}>Description</label>
        <textarea
          id="prog-desc"
          name="description"
          rows={3}
          placeholder="Description optionnelle…"
          className={input.base}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" size="sm" onClick={close}>Annuler</Button>
        <Button type="submit" size="sm" disabled={create.isPending}>
          {create.isPending ? 'Création…' : 'Créer'}
        </Button>
      </DialogFooter>
    </form>
  )
}

function EditForm({
  id,
  currentName,
  currentDescription,
  currentTrackId,
  tracks,
  close,
}: {
  id: string
  currentName: string
  currentDescription?: string | null
  currentTrackId?: string | null
  tracks: TrackItem[]
  close: () => void
}) {
  const { update } = useManagePrograms()
  const [name, setName] = useState(currentName)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const programTrackId = fd.get('programTrackId') as string
    const description    = (fd.get('description') as string) || undefined
    await update.mutateAsync({ id, data: { name, programTrackId, description } })
    close()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="prog-edit-name" className={input.label}>Nom *</label>
        <input
          id="prog-edit-name"
          type="text"
          required
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={input.base}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="prog-edit-track" className={input.label}>Filière *</label>
        <select
          id="prog-edit-track"
          name="programTrackId"
          required
          defaultValue={currentTrackId ?? ''}
          className={input.base}
        >
          <option value="">Sélectionner une filière</option>
          {tracks.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="prog-edit-desc" className={input.label}>Description</label>
        <textarea
          id="prog-edit-desc"
          name="description"
          rows={3}
          defaultValue={currentDescription ?? ''}
          className={input.base}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" size="sm" onClick={close}>Annuler</Button>
        <Button type="submit" size="sm" disabled={update.isPending}>
          {update.isPending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function ProgramCreateButton({ tracks }: { tracks: TrackItem[] }) {
  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="outline">
          <Plus className="size-3.5" />
          Programme
        </Button>
      }
      title="Nouveau programme"
    >
      {(close) => <CreateForm tracks={tracks} close={close} />}
    </FormDialog>
  )
}

export function ProgramEditButton({
  id,
  name,
  description,
  programTrackId,
  tracks,
}: {
  id: string
  name: string
  description?: string | null
  programTrackId?: string | null
  tracks: TrackItem[]
}) {
  return (
    <FormDialog
      trigger={
        <Button variant="ghost" size="icon-sm" className="text-text-subtle hover:text-text-primary">
          <Pencil className="size-3.5" />
          <span className="sr-only">Modifier</span>
        </Button>
      }
      title="Modifier le programme"
    >
      {(close) => (
        <EditForm
          id={id}
          currentName={name}
          currentDescription={description}
          currentTrackId={programTrackId}
          tracks={tracks}
          close={close}
        />
      )}
    </FormDialog>
  )
}
