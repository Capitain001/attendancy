'use client'
import { useRef } from 'react'
import { useTerms } from '@/hooks/data/term/useTerms'
import { input } from '@/styles/input'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { FormDialog } from '@/components/ui/FormDialog'
import { DialogFooter } from '@/components/ui/dialog'

interface TermFormProps {
  /** ID de la classe à laquelle le semestre sera rattaché. */
  classId: string
  /** Callback de fermeture du modal (fourni par FormDialog). */
  close: () => void
  /** Numéro d'ordre pré-rempli dans le champ (ex: `terms.length + 1` pour incrémenter le semestre). */
  defaultOrder?: number
}

function TermForm({ classId, close, defaultOrder }: TermFormProps) {
  const { create, isCreating } = useTerms({ classId })
  const ref = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!create) return
    const fd = new FormData(e.currentTarget)
    const name = fd.get('name') as string
    const orderStr = fd.get('order') as string
    const startDateRaw = fd.get('startDate') as string
    const endDateRaw = fd.get('endDate') as string

    const order = Number.parseInt(orderStr, 10)

    await create({
      classId,
      name,
      order: Number.isNaN(order) ? 1 : order,
      startDate: startDateRaw ? new Date(startDateRaw) : undefined,
      endDate: endDateRaw ? new Date(endDateRaw) : undefined,
    })

    ref.current?.reset()
    close()
  }

  return (
    <form ref={ref} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="term-name" className={input.label}>Nom du semestre *</label>
        <input
          id="term-name"
          name="name"
          type="text"
          required
          autoFocus
          placeholder="Semestre 1"
          className={input.base}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="term-order" className={input.label}>Numéro d&apos;ordre *</label>
        <input
          id="term-order"
          name="order"
          type="number"
          min={1}
          required
          defaultValue={defaultOrder ?? 1}
          className={input.base}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="term-start" className={input.label}>Date de début</label>
          <input
            id="term-start"
            name="startDate"
            type="date"
            className={input.base}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="term-end" className={input.label}>Date de fin</label>
          <input
            id="term-end"
            name="endDate"
            type="date"
            className={input.base}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" size="sm" onClick={close}>
          Annuler
        </Button>
        <Button type="submit" size="sm" disabled={isCreating}>
          {isCreating ? 'Création…' : 'Créer'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export interface TermCreateButtonProps {
  /** ID de la classe à laquelle le semestre sera rattaché. */
  classId: string
  /** Numéro d'ordre pré-rempli par défaut dans le formulaire (ex: `terms.length + 1`). */
  defaultOrder?: number
  /** Libellé personnalisé du bouton (par défaut: "Nouveau semestre"). */
  buttonText?: string
}

export function TermCreateButton({
  classId,
  defaultOrder,
  buttonText = 'Nouveau semestre',
}: TermCreateButtonProps) {
  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="outline" disabled={!classId}>
          <Plus className="size-3.5" />
          {buttonText}
        </Button>
      }
      title="Nouveau semestre"
    >
      {(close) => (
        <TermForm classId={classId} close={close} defaultOrder={defaultOrder} />
      )}
    </FormDialog>
  )
}
