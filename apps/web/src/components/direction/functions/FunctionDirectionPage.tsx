'use client'
import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { typography } from '@/styles'
import { useFonctions } from '@/hooks/data/functions/useFonctions'
import { useCheckMainFunctions } from '@/hooks/data/functions'
import type { FunctionItem } from '@/services/function'
import { TabsContainer } from '@/components/tools/TabsContainer'
import { FunctionList } from './FunctionList'
import { FunctionFormDialog } from './FunctionFormDialog'
import { FunctionFilter } from './FunctionFilter'

interface FunctionDirectionPageProps {
  initialFunctions: FunctionItem[]
}

export function FunctionDirectionPage({ initialFunctions }: FunctionDirectionPageProps) {
  const { data, create, update, delete: remove, loading } = useFonctions()

  const functions = data.items?.length > 0 ? data.items : initialFunctions

  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const mainFns = functions.filter((fn) => fn.isMain && (!q || fn.name.toLowerCase().includes(q) || fn.description?.toLowerCase().includes(q)))
  const customFns = functions.filter((fn) => !fn.isMain && (!q || fn.name.toLowerCase().includes(q) || fn.description?.toLowerCase().includes(q)))

  const { check, result: mainFunctionsOk, isPending: isChecking } = useCheckMainFunctions()

  // Quand le tab Principales est vide, on sonde le serveur pour proposer
  // l'activation en un clic via CreateMainFunctionsButton.
  useEffect(() => {
    if (mainFns.length === 0) check()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainFns.length === 0])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<FunctionItem | null>(null)

  function openCreate() {
    setEditTarget(null)
    setDialogOpen(true)
  }

  function openEdit(fn: FunctionItem) {
    setEditTarget(fn)
    setDialogOpen(true)
  }

  async function handleSubmit(formData: { name: string; description?: string; icon?: string }) {
    try {
      if (editTarget) {
        if (update) await update({ id: editTarget.id, data: formData })
      } else {
        if (create) await create(formData)
      }
      setDialogOpen(false)
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  async function handleDelete(id: string) {
    try {
      if (remove) await remove(id)
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const tabs = [
    {
      label: `Principales${mainFns.length > 0 ? ` (${mainFns.length})` : ''}`,
      value: 'principales',
      content: (
        <FunctionList
          getHref={(fn: FunctionItem) => `../direction/functions/${fn.id}`}
          items={mainFns}
          emptyLabel="Aucune fonction principale."
          emptyHint="Ces fonctions sont générées automatiquement."
          showMainFunctionsButton
          isChecking={isChecking}
          mainFunctionsOk={mainFunctionsOk}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      ),
    },
    {
      label: `Personnalisées${customFns.length > 0 ? ` (${customFns.length})` : ''}`,
      value: 'personnalisees',
      content: (
        <FunctionList
          getHref={(fn:FunctionItem) => `../direction/functions/${fn.id}`}
          items={customFns}
          emptyLabel="Aucune fonction personnalisée."
          emptyHint="Créez des fonctions pour organiser les rôles de votre direction."
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-text-primary">Fonctions direction</h1>
          <p className={typography.small}>
            {functions.length} fonction{functions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 h-8 text-xs"
          onClick={openCreate}
          disabled={loading}
        >
          <Plus className="size-3.5" />
          Nouvelle fonction
        </Button>
      </div>

      {/* Filtre */}
      <FunctionFilter value={query} onChange={setQuery} />

      {/* Tabs Principales / Personnalisées */}
      <TabsContainer tabs={tabs} defaultValue="principales" />

      {/* Dialog création / édition */}
      <FunctionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editTarget}
        onSubmit={handleSubmit}
        isPending={loading}
      />
    </div>
  )
}