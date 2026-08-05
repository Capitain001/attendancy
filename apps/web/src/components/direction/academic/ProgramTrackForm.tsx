'use client'
import { useRef, useState } from 'react'
import { useManageProgramTracks } from '@/hooks/data/program-track/useManageProgramTracks'
import { input } from '@/styles/input'
import { Button } from '@/components/ui/button'
import { Plus, Pencil } from 'lucide-react'
import { FormDialog } from '@/components/ui/FormDialog'
import { DialogFooter } from '@/components/ui/dialog'

type Dept = { id: string; name: string }

function CreateForm({ departments, close }: { departments: Dept[]; close: () => void }) {
  const { create } = useManageProgramTracks()
  const ref = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name         = fd.get('name') as string
    const departmentId = fd.get('departmentId') as string

    await create.mutateAsync({ name, departmentId })
    ref.current?.reset()
    close()
  }

  return (
    <form ref={ref} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="pt-name" className={input.label}>Nom de la filière *</label>
        <input
          id="pt-name"
          name="name"
          type="text"
          required
          autoFocus
          placeholder="Génie Logiciel"
          className={input.base}
        />
      </div>

      {departments.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pt-dept" className={input.label}>Département</label>
          <select id="pt-dept" name="departmentId" className={input.base}>
            <option value="">Sans département</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      )}

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
  id, currentName, currentDeptId, departments, close,
}: { id: string; currentName: string; currentDeptId?: string | null; departments: Dept[]; close: () => void }) {
  const { update } = useManageProgramTracks()
  const [name, setName] = useState(currentName)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const departmentId = fd.get('departmentId') as string | null
    await update.mutateAsync({ id, data: { name, departmentId: departmentId || undefined } })
    close()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="pt-edit-name" className={input.label}>Nom *</label>
        <input
          id="pt-edit-name"
          type="text"
          required
          value={name}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          className={input.base}
        />
      </div>
      {departments.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pt-edit-dept" className={input.label}>Département</label>
          <select id="pt-edit-dept" name="departmentId" defaultValue={currentDeptId ?? ''} className={input.base}>
            <option value="">Sans département</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" size="sm" onClick={close}>Annuler</Button>
        <Button type="submit" size="sm" disabled={update.isPending}>
          {update.isPending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function ProgramTrackCreateButton({ departments }: { departments: Dept[] }) {
  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="outline">
          <Plus className="size-3.5" />
          Filière
        </Button>
      }
      title="Nouvelle filière"
    >
      {(close) => <CreateForm departments={departments} close={close} />}
    </FormDialog>
  )
}

export function ProgramTrackEditButton({
  id, name, departmentId, departments,
}: { id: string; name: string; departmentId?: string | null; departments: Dept[] }) {
  return (
    <FormDialog
      trigger={
        <Button variant="ghost" size="icon-sm" className="text-text-subtle hover:text-text-primary">
          <Pencil className="size-3.5" />
          <span className="sr-only">Modifier</span>
        </Button>
      }
      title="Modifier la filière"
    >
      {(close) => (
        <EditForm
          id={id}
          currentName={name}
          currentDeptId={departmentId}
          departments={departments}
          close={close}
        />
      )}
    </FormDialog>
  )
}
