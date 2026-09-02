"use client"

// src/components/term/GenerateTermsButton.tsx
//
// Déclenche la génération des semestres (Term) d'une classe depuis son
// programme — appelle l'action existante `generateTermsFromProgramAction`
// (src/services/term/actions/term.mutations.ts).
// Aucune logique métier ici : orchestration UI (confirmation, état de
// chargement, feedback) uniquement — cf. SERVICE_CONTEXT.md.

import { useState, useTransition } from "react"
import { CalendarPlus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { button, typography } from "@/styles"
import { generateTermsFromProgramAction } from "@/services/term"
import { cn } from "@/lib/utils"

interface GenerateTermsButtonProps {
  classId: string
  className?: string
  /** Nombre de semestres déjà présents — désactive l'action si tout est généré. */
  hasProgram?: boolean
  onGenerated?: (count: number) => void
}

export function GenerateTermsButton({
  classId,
  className,
  hasProgram = true,
  onGenerated,
}: GenerateTermsButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  function handleConfirm() {
    startTransition(async () => {
      const result = await generateTermsFromProgramAction(classId)

      if ("error" in result) {
        toast.error(result.error)
        return
      }

      const created = result.data
      setOpen(false)

      if (created.length === 0) {
        toast.info("Aucun semestre à générer — le programme est déjà appliqué.")
        return
      }
      
      toast.success(
        created.length === 1
          ? "1 semestre généré."
          : `${created.length} semestres générés.`
      )
      onGenerated?.(created.length)
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          disabled={!hasProgram || isPending}
          className={cn(button.secondary, className)}
        >
          {isPending ? (
            <Loader2 className="size-[1em] animate-spin" />
          ) : (
            <CalendarPlus className="size-[1em]" />
          )}
          Générer les semestres
        </button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className={typography.h4}>
            Générer les semestres de la classe
          </AlertDialogTitle>
          <AlertDialogDescription className={typography.small}>
            Un semestre sera créé pour chaque semestre structurel du programme
            appliqué à cette classe, en ignorant ceux déjà existants. Cette
            action n&apos;écrase rien — elle ne fait qu&apos;ajouter ce qui manque.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleConfirm()
            }}
            disabled={isPending}
            className={button.primary}
          >
            {isPending ? (
              <>
                <Loader2 className="size-[1em] animate-spin" />
                Génération…
              </>
            ) : (
              "Confirmer"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}