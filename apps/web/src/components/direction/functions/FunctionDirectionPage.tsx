'use client'
import { useState } from 'react'
import { Plus, Pencil, Trash2, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'
import { useFonctions } from '@/hooks/data/fonctions/useFonctions'
import type { FunctionItem } from '@/services/function'

function FunctionCard({
  fn,
  onEdit,
  onDelete,
}: {
  fn: FunctionItem
  onEdit: (fn: FunctionItem) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className={cn(card.base, 'flex items-center gap-3 py-3')}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        {fn.icon ? (
          <span className="text-base">{fn.icon}</span>
        ) : (
          <Settings2 className="size-4 text-primary" strokeWidth={1.5} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{fn.name}</p>
        {fn.description && <p className={typography.small}>{fn.description}</p>}
        <p className={typography.small}>{fn._count.users} membre{fn._count.users !== 1 ? 's' : ''}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {fn.isMain && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            Principale
          </span>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(fn)}>
          <Pencil className="size-3.5" />
        </Button>
        <Button
          variant="ghost" size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(fn.id)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

function FunctionFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  isPending,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: FunctionItem | null
  onSubmit: (data: { name: string; description?: string; icon?: string }) => void
  isPending: boolean
}) {
  const [name, setName]        = useState(initial?.name ?? '')
  const [description, setDesc] = useState(initial?.description ?? '')
  const [icon, setIcon]        = useState(initial?.icon ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), description: description.trim() || undefined, icon: icon.trim() || undefined })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{initial ? 'Modifier la fonction' : 'Nouvelle fonction'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fn-name">Nom *</Label>
            <Input id="fn-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Secrétaire" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fn-desc">Description</Label>
            <Input id="fn-desc" value={description} onChange={(e) => setDesc(e.target.value)} placeholder="Optionnel" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fn-icon">Icône (emoji)</Label>
            <Input id="fn-icon" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Ex: 📋" maxLength={4} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? 'Enregistrement…' : initial ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function FunctionDirectionPage({ initialFunctions }: { initialFunctions: FunctionItem[] }) {
  const { 
    data, 
    create, 
    update, 
    delete: remove, 
    loading,
    // isCreating,
    // isUpdating,
    // isDeleting
  } = useFonctions()
  
  const functions = data.items?.length > 0 ? data.items : initialFunctions

  const [dialogOpen, setDialogOpen]   = useState(false)
  const [editTarget, setEditTarget]   = useState<FunctionItem | null>(null)
  
  // ✅ On combine tous les états de chargement des mutations
  const isPending = loading 

  function openCreate() {
    setEditTarget(null)
    setDialogOpen(true)
  }

  function openEdit(fn: FunctionItem) {
    setEditTarget(fn)
    setDialogOpen(true)
  }

  // ✅ Correction : create et update sont directement des fonctions async (mutateAsync)
  async function handleSubmit(formData: { name: string; description?: string; icon?: string }) {
    try {
      if (editTarget) {
        if(update) await update({ id: editTarget.id, data: formData })
      } else {
        if(create)await create(formData)
      }
      setDialogOpen(false)
    } catch (error) {
      // Les erreurs sont déjà gérées par le toast dans useCrudEntity
      // mais on peut ajouter un traitement supplémentaire si besoin
      console.error('Erreur:', error)
    }
  }

  // ✅ Correction : remove est directement une fonction async
  async function handleDelete(id: string) {
    try {
     if(remove) await remove(id)
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-text-primary">Fonctions direction</h1>
          <p className={typography.small}>{functions.length} fonction{functions.length !== 1 ? 's' : ''}</p>
        </div>
        <Button 
          size="sm" 
          className="gap-1.5 h-8 text-xs" 
          onClick={openCreate}
          disabled={isPending}
        >
          <Plus className="size-3.5" />
          Nouvelle fonction
        </Button>
      </div>

      {functions.length === 0 ? (
        <div className={cn(card.soft, 'py-12 text-center')}>
          <Settings2 className="mx-auto mb-3 size-8 text-text-subtle" strokeWidth={1} />
          <p className={typography.body}>Aucune fonction définie.</p>
          <p className={typography.small}>Créez des fonctions pour organiser les rôles de votre direction.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {functions.map((fn) => (
            <FunctionCard 
              key={fn.id} 
              fn={fn} 
              onEdit={openEdit} 
              onDelete={handleDelete} 
            />
          ))}
        </div>
      )}

      <FunctionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editTarget}
        onSubmit={handleSubmit}
        isPending={isPending}
      />
    </div>
  )
}
