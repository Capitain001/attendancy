```typescriptreact
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
  const { data: items, create, update, delete: deleteFunction, loading } = useFonctions()
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' })
  const close = () => setDialog({ mode: 'closed' })

  async function handleCreate(data: { name: string; description?: string | null }) {
    if(create){
        await create(data)

    }
    close()
  }

  async function handleEdit(data: { name: string; description?: string | null }) {
    if (dialog.mode !== 'edit') return
    if(update){
        await update({ id: dialog.fn.id, data })

    }
    close()
  }

  async function handleDelete(functionId: string) {
    if (deleteFunction) {
        await deleteFunction(functionId)
        
    }
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
        {items?.map((fn) => (
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
```


error :

[{
	"resource": "/c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/app/(app)/[slug]/admin/functions/page.tsx",
	"owner": "typescript",
	"code": "2345",
	"severity": 8,
	"message": "Argument of type '{ name: string; description?: string | null | undefined; }' is not assignable to parameter of type '{ name: string; description?: string | undefined; icon?: string | undefined; isMain?: boolean | undefined; }'.\n  Types of property 'description' are incompatible.\n    Type 'string | null | undefined' is not assignable to type 'string | undefined'.\n      Type 'null' is not assignable to type 'string | undefined'.",
	"source": "ts",
	"startLineNumber": 26,
	"startColumn": 22,
	"endLineNumber": 26,
	"endColumn": 26,
	"origin": "extHost1"
},{
	"resource": "/c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/app/(app)/[slug]/admin/functions/page.tsx",
	"owner": "typescript",
	"code": "2322",
	"severity": 8,
	"message": "Type '{ name: string; description?: string | null | undefined; }' is not assignable to type '{ name?: string | undefined; description?: string | undefined; icon?: string | undefined; isMain?: boolean | undefined; }'.\n  Types of property 'description' are incompatible.\n    Type 'string | null | undefined' is not assignable to type 'string | undefined'.\n      Type 'null' is not assignable to type 'string | undefined'.",
	"source": "ts",
	"startLineNumber": 35,
	"startColumn": 42,
	"endLineNumber": 35,
	"endColumn": 46,
	"relatedInformation": [
		{
			"startLineNumber": 125,
			"startColumn": 46,
			"endLineNumber": 125,
			"endColumn": 50,
			"message": "The expected type comes from property 'data' which is declared here on type '{ id: string; data: { name?: string | undefined; description?: string | undefined; icon?: string | undefined; isMain?: boolean | undefined; }; }'",
			"resource": "/c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/hooks/entity/useCrudEntity.ts"
		}
	],
	"origin": "extHost1"
},{
	"resource": "/c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/app/(app)/[slug]/admin/functions/page.tsx",
	"owner": "typescript",
	"code": "2339",
	"severity": 8,
	"message": "Property 'map' does not exist on type '{ items: { id: string; name: string; description: string | null; isMain: boolean; icon: string | null; _count: { users: number; }; }[]; byId: Record<string, { id: string; name: string; description: string | null; isMain: boolean; icon: string | null; _count: { ...; }; }>; }'.",
	"source": "ts",
	"startLineNumber": 60,
	"startColumn": 17,
	"endLineNumber": 60,
	"endColumn": 20,
	"origin": "extHost1"
},{
	"resource": "/c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/app/(app)/[slug]/admin/functions/page.tsx",
	"owner": "typescript",
	"code": "7006",
	"severity": 8,
	"message": "Parameter 'fn' implicitly has an 'any' type.",
	"source": "ts",
	"startLineNumber": 60,
	"startColumn": 22,
	"endLineNumber": 60,
	"endColumn": 24,
	"origin": "extHost1"
}]


type des mutation :

const create: UseMutateAsyncFunction<Partial<{
    id: string;
    name: string;
    description: string | null;
    isMain: boolean;
    icon: string | null;
    _count: {
        users: number;
    };
}> & {
    id: string;
}, Error, {
    name: string;
    description?: string | undefined;
    icon?: string | undefined;
    isMain?: boolean | undefined;
}, unknown> | undefined

const update: UseMutateAsyncFunction<Partial<{
    id: string;
    name: string;
    description: string | null;
    isMain: boolean;
    icon: string | null;
    _count: {
        users: number;
    };
}> & {
    id: string;
}, Error, {
    id: string;
    data: {
        name?: string | undefined;
        description?: string | undefined;
        icon?: string | undefined;
        isMain?: boolean | undefined;
    };
}, unknown> | undefined

const deleteFunction: UseMutateAsyncFunction<void, Error, string, unknown> | undefined