'use client'
import { useRef } from 'react'
import { useUEs } from '@/hooks/data/ue/useUEs'
import { input } from '@/styles/input'
import { Button } from '@/components/ui/button'
import { Edit } from 'lucide-react'
import { FormDialog } from '@/components/ui/FormDialog'
import { DialogFooter } from '@/components/ui/dialog'
import { GetDepartmentsDto } from '@/services/department'
import type { GetUEByIdDto } from '@/services/ue'

type UE = NonNullable<GetUEByIdDto>

function EditForm({ ue, departments, close }: { ue: UE; departments: GetDepartmentsDto; close: () => void }) {
  const { update, isUpdating } = useUEs()
  const ref = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name         = fd.get('name') as string
    const code         = (fd.get('code') as string) || null
    const departmentId = (fd.get('departmentId') as string) || null
    const description  = (fd.get('description') as string) || null
    const isOptional   = fd.get('isOptional') === 'true'

    await update?.({ id: ue.id, data: { name, code, departmentId, description, isOptional } })
    
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
          defaultValue={ue.name}
          className={input.base}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ue-code" className={input.label}>Code</label>
        <input
          id="ue-code"
          name="code"
          type="text"
          defaultValue={ue.code || ''}
          className={input.base}
        />
      </div>

      {departments.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ue-dept" className={input.label}>Département</label>
          <select id="ue-dept" name="departmentId" defaultValue={ue.departmentId || ''} className={input.base}>
            <option value="">Sans département</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ue-type" className={input.label}>Type d'UE</label>
        <select id="ue-type" name="isOptional" defaultValue={ue.isOptional ? 'true' : 'false'} className={input.base}>
          <option value="false">Obligatoire</option>
          <option value="true">Optionnelle</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ue-desc" className={input.label}>Description</label>
        <textarea
          id="ue-desc"
          name="description"
          defaultValue={ue.description || ''}
          rows={3}
          className={input.base}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" size="sm" onClick={close}>Annuler</Button>
        <Button type="submit" size="sm" disabled={isUpdating}>
          {isUpdating ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function UEEditButton({ ue, departments }: { ue: UE; departments: GetDepartmentsDto }) {
  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="outline" className="gap-2">
          <Edit className="size-3.5" />
          Modifier
        </Button>
      }
      title="Modifier l'unité d'enseignement"
    >
      {(close) => <EditForm ue={ue} departments={departments} close={close} />}
    </FormDialog>
  )
}
