'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { FunctionItem } from '@/services/function'

interface FunctionFormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  /** Pré-rempli si mode édition, absent si création */
  initial?: FunctionItem | null
  onSubmit: (data: { name: string; description?: string; icon?: string }) => void
  isPending: boolean
}

export function FunctionFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  isPending,
}: FunctionFormDialogProps) {
  const [name, setName]             = useState(initial?.name ?? '')
  const [description, setDesc]      = useState(initial?.description ?? '')
  const [icon, setIcon]             = useState(initial?.icon ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      icon: icon.trim() || undefined,
    })
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
            <Input
              id="fn-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Secrétaire"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fn-desc">Description</Label>
            <Input
              id="fn-desc"
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Optionnel"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fn-icon">Icône (emoji)</Label>
            <Input
              id="fn-icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Ex: 📋"
              maxLength={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? 'Enregistrement…' : initial ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
