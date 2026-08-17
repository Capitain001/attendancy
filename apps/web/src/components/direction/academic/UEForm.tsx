'use client'
import { useRef } from 'react'
import { useUEs } from '@/hooks/data/ue/useUEs'
import { input } from '@/styles/input'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { FormDialog } from '@/components/ui/FormDialog'
import { DialogFooter } from '@/components/ui/dialog'
import { GetDepartmentsDto } from '@/services/department'



function CreateForm({ departments, close }: { departments: GetDepartmentsDto; close: () => void }) {
  const { create, isCreating } = useUEs()
  const ref = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name         = fd.get('name') as string
    const code         = (fd.get('code') as string) || undefined
    const departmentId = (fd.get('departmentId') as string) || undefined

    await create?.({ data: { name, code, departmentId } })
    ref.current?.reset()
    close()
  }

  return (
    <form ref={ref} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ue-name" className={input.label}>Intitulé de l&apos;UE *</label>
        <input
          id="ue-name"
          name="name"
          type="text"
          required
          autoFocus
          placeholder="Algorithmique avancée"
          className={input.base}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ue-code" className={input.label}>Code</label>
        <input
          id="ue-code"
          name="code"
          type="text"
          placeholder="INF301"
          className={input.base}
        />
      </div>

      {departments.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ue-dept" className={input.label}>Département</label>
          <select id="ue-dept" name="departmentId" className={input.base}>
            <option value="">Sans département</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" size="sm" onClick={close}>Annuler</Button>
        <Button type="submit" size="sm" disabled={isCreating}>
          {isCreating ? 'Création…' : 'Créer'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function UECreateButton({ departments }: { departments: GetDepartmentsDto }) {
  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="outline">
          <Plus className="size-3.5" />
          UE
        </Button>
      }
      title="Nouvelle unité d'enseignement"
    >
      {(close) => <CreateForm departments={departments} close={close} />}
    </FormDialog>
  )
}
