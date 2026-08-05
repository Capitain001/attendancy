'use client'
import { useRef } from 'react'
import { useRooms } from '@/hooks/data/rooms/useRooms'
import { input } from '@/styles/input'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { FormDialog } from '@/components/ui/FormDialog'
import { DialogFooter } from '@/components/ui/dialog'

function Form({ close }: { close: () => void }) {
  const { create, isCreating } = useRooms()
  const ref = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name     = fd.get('name') as string
    const capRaw   = fd.get('capacity') as string
    const capacity = capRaw ? parseInt(capRaw, 10) : undefined

    await create({ name, capacity })
    ref.current?.reset()
    close()
  }

  return (
    <form ref={ref} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="room-name" className={input.label}>Nom de la salle *</label>
        <input
          id="room-name"
          name="name"
          type="text"
          required
          autoFocus
          placeholder="Amphi A"
          className={input.base}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="room-cap" className={input.label}>
          Capacité <span className="text-text-subtle">(optionnel)</span>
        </label>
        <input
          id="room-cap"
          name="capacity"
          type="number"
          min={1}
          placeholder="200"
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

export function RoomCreateButton() {
  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="outline">
          <Plus className="size-3.5" />
          Salle
        </Button>
      }
      title="Nouvelle salle"
    >
      {(close) => <Form close={close} />}
    </FormDialog>
  )
}
