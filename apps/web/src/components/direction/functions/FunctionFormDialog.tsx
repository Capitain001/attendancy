'use client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { FunctionItem } from '@/services/function'

  interface FunctionFormDialogProps {
    open: boolean
    mode: 'create' | 'edit'
    initial?: Pick<FunctionItem, 'name' | 'description'>
    pending: boolean
    onOpenChange: (open: boolean) => void
   onSubmit: (data: { name: string; description?: string }) => void
  }

export function FunctionFormDialog({ open, mode, initial, pending, onOpenChange, onSubmit }: FunctionFormDialogProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Nouvelle fonction' : 'Modifier la fonction'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="fn-name">Nom</Label>
            <Input id="fn-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Scolarité" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fn-description">Description</Label>
            <Textarea
              id="fn-description"
              value={description ?? ''}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="À quoi sert cette fonction ?"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button
            disabled={!name.trim() || pending}
           onClick={() => onSubmit({ name: name.trim(), description: description.trim() || undefined })}
          >
            {mode === 'create' ? 'Créer' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}