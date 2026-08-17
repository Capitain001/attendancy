'use client'
import { useRef, useState } from 'react'
import { useDepartments } from '@/hooks/data/departments/useDepartments'
import { input } from '@/styles/input'
import { Button } from '@/components/ui/button'
import { Plus, Pencil } from 'lucide-react'
import { FormDialog } from '@/components/ui/FormDialog'
import { DialogFooter } from '@/components/ui/dialog'

function CreateForm({ close }: { close: () => void }) {
  const { create: createDepartment, isCreating } = useDepartments() as ReturnType<typeof useDepartments> & {
    create: (input: { name: string }) => Promise<unknown>
  }
  const ref = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    await createDepartment({ name: fd.get('name') as string })
    ref.current?.reset()
    close()
  }

  return (
    <form ref={ref} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="dept-name" className={input.label}>Nom du département *</label>
        <input
          id="dept-name"
          name="name"
          type="text"
          required
          placeholder="Informatique"
          autoFocus
          className={input.base}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" size="sm" onClick={close}>Annuler</Button>
        <Button type="submit" size="sm" disabled={isCreating}>
          {isCreating ? 'Création…' : 'Créer'}
        </Button>
      </DialogFooter>
    </form>
  )
}

function EditForm({ id, currentName, close }: { id: string; currentName: string; close: () => void }) {
  const { update: updateDepartment, isUpdating } = useDepartments() as ReturnType<typeof useDepartments> & {
    update: (input: { id: string; data: { name: string } }) => Promise<unknown>
  }
  const [name, setName] = useState(currentName)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    await updateDepartment({ id, data: { name } })
    close()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="dept-edit-name" className={input.label}>Nom *</label>
        <input
          id="dept-edit-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          className={input.base}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" size="sm" onClick={close}>Annuler</Button>
        <Button type="submit" size="sm" disabled={isUpdating || name === currentName}>
          {isUpdating ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function DepartmentCreateButton() {
  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="outline">
          <Plus className="size-3.5" />
          Département
        </Button>
      }
      title="Nouveau département"
    >
      {(close) => <CreateForm close={close} />}
    </FormDialog>
  )
}

export function DepartmentEditButton({ id, name }: { id: string; name: string }) {
  return (
    <FormDialog
      trigger={
        <Button variant="ghost" size="icon-sm" className="text-text-subtle hover:text-text-primary">
          <Pencil className="size-3.5" />
          <span className="sr-only">Modifier</span>
        </Button>
      }
      title="Renommer le département"
    >
      {(close) => <EditForm id={id} currentName={name} close={close} />}
    </FormDialog>
  )
}
