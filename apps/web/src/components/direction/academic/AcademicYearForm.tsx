'use client'
import { useRef } from 'react'
import { useManageAcademicYears } from '@/hooks/data/academic-year/useManageAcademicYears'
import { input } from '@/styles/input'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { FormDialog } from '@/components/ui/FormDialog'
import { DialogFooter } from '@/components/ui/dialog'

function Form({ close }: { close: () => void }) {
  const { create } = useManageAcademicYears()
  const ref = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name      = fd.get('name') as string
    const startDate = fd.get('startDate') as string
    const endDate   = fd.get('endDate') as string

    await create.mutateAsync({ name, startDate, endDate })
    ref.current?.reset()
    close()
  }

  return (
    <form ref={ref} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ay-name" className={input.label}>Nom *</label>
        <input
          id="ay-name"
          name="name"
          type="text"
          required
          placeholder="2025 – 2026"
          className={input.base}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ay-start" className={input.label}>Début *</label>
          <input
            id="ay-start"
            name="startDate"
            type="date"
            required
            className={input.base}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ay-end" className={input.label}>Fin *</label>
          <input
            id="ay-end"
            name="endDate"
            type="date"
            required
            className={input.base}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" size="sm" onClick={close}>
          Annuler
        </Button>
        <Button type="submit" size="sm" disabled={create.isPending}>
          {create.isPending ? 'Création…' : 'Créer'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function AcademicYearCreateButton() {
  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="outline">
          <Plus className="size-3.5" />
          Nouvelle année
        </Button>
      }
      title="Nouvelle année académique"
    >
      {(close) => <Form close={close} />}
    </FormDialog>
  )
}
