'use client'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FunctionItem } from '@/services/function/types'
import { FunctionCard, FunctionFormDialog } from '@/components/direction/functions'
import { useFonctions } from '@/hooks'
import { DeleteFunctionDialog } from '@/components/direction/functions/DeleteFunctionDialog'

type DialogState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; fn: FunctionItem }
  | { mode: 'delete'; fn: FunctionItem }

export function FunctionsAdminPage() {
  const { data, create, update, delete: deleteFunction, loading } = useFonctions()
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' })
  const close = () => setDialog({ mode: 'closed' })

async function handleCreate(input: { name: string; description?: string }) {
  if (create) await create(input)
  close()
}

async function handleEdit(input: { name: string; description?: string }) {
  if (dialog.mode !== 'edit') return
  if (update) await update({ id: dialog.fn.id, data: input })
  close()
}

  async function handleDelete(functionId: string) {
    if (deleteFunction) await deleteFunction(functionId)
    close()
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Fonctions</h1>
        <Button onClick={() => setDialog({ mode: 'create' })} size="sm" className="gap-1.5">
          <Plus className="size-4" />
          Nouvelle fonction
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {data?.items.map((fn) => (
          <FunctionCard
            key={fn.id}
            fn={fn}
            href={`/admin/functions/${fn.id}`}
            onEdit={(f) => setDialog({ mode: 'edit', fn: f })}
            onDelete={(f) => setDialog({ mode: 'delete', fn: f })}
          />
        ))}
      </div>

      <FunctionFormDialog
        open={dialog.mode === 'create' || dialog.mode === 'edit'}
        mode={dialog.mode === 'edit' ? 'edit' : 'create'}
        initial={dialog.mode === 'edit' ? dialog.fn : undefined}
        pending={loading}
        onOpenChange={(open) => !open && close()}
        onSubmit={dialog.mode === 'edit' ? handleEdit : handleCreate}
      />

      <DeleteFunctionDialog
        fn={dialog.mode === 'delete' ? dialog.fn : null}
        pending={loading}
        onOpenChange={(open) => !open && close()}
        onConfirm={handleDelete}
      />
    </div>
  )
}