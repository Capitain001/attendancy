'use client'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { FunctionItem } from '@/services/function'

interface DeleteFunctionDialogProps {
  fn: FunctionItem | null
  pending: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (functionId: string) => void
}

export function DeleteFunctionDialog({ fn, pending, onOpenChange, onConfirm }: DeleteFunctionDialogProps) {
  return (
    <AlertDialog open={fn !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer « {fn?.name} » ?</AlertDialogTitle>
          <AlertDialogDescription>
            {fn && fn._count.users > 0
              ? `${fn._count.users} utilisateur${fn._count.users > 1 ? 's' : ''} perdront cette fonction et les permissions qui y sont attachées. Cette action est irréversible.`
              : 'Cette action est irréversible.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction disabled={pending} onClick={() => fn && onConfirm(fn.id)}>
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}