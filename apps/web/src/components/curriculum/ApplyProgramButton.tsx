"use client"

// src/components/curriculum/ApplyProgramButton.tsx
//
// Déclenche applyProgramToClassAction(classId) — génère les semestres PUIS
// les cours rattachés, dans l'ordre garanti par le service `curriculum`.
// Remplace l'usage courant de GenerateTermsButton + GenerateProgramCoursesButton
// enchaînés manuellement (ordre non garanti côté UI, mapping jamais construit).
//
// Idempotent côté serveur (les deux fonctions composées le sont) — pas de
// désactivation après un premier succès, seulement pendant l'appel en cours,
// même choix que GenerateProgramCoursesButton (regénérable après ajout d'une
// UE/matière en cours d'année).

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles } from "lucide-react"
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
import { applyProgramToClassAction } from "@/services/curriculum"
import type { ApplyProgramToClassDto } from "@/services/curriculum"
import { cn } from "@/lib/utils"

interface ApplyProgramButtonProps {
  classId: string
  /** Désactive l'action si la classe n'a pas de programme attaché (résolu par l'appelant — SERVICE_CONTEXT.md §4). */
  hasProgram?: boolean
  className?: string
  onSuccess?: (result: ApplyProgramToClassDto) => void
}

export function ApplyProgramButton({
  classId,
  hasProgram = true,
  className,
  onSuccess,
}: ApplyProgramButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [lastRanAt, setLastRanAt] = useState<number | null>(null)

  function handleConfirm() {
    startTransition(async () => {
      const result = await applyProgramToClassAction(classId)
      setOpen(false)

      if ("error" in result) {
        toast.error(result.error)
        return
      }

      const { termsCreated, coursesCreated, coursesSkipped } = result.data
      setLastRanAt(Date.now())

      if (termsCreated.length === 0 && coursesCreated.length === 0) {
        toast.info("La maquette est déjà appliquée — rien à générer.")
      } else {
        const parts: string[] = []
        if (termsCreated.length > 0) {
          parts.push(`${termsCreated.length} semestre${termsCreated.length > 1 ? "s" : ""}`)
        }
        if (coursesCreated.length > 0) {
          parts.push(`${coursesCreated.length} cours`)
        }
        toast.success(
          `${parts.join(" et ")} généré${termsCreated.length + coursesCreated.length > 1 ? "s" : ""}` +
            (coursesSkipped > 0 ? ` (${coursesSkipped} cours déjà existant${coursesSkipped > 1 ? "s" : ""})` : "")
        )
      }

      onSuccess?.(result.data)
      router.refresh()
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          disabled={!hasProgram || isPending}
          className={cn(button.primary, className)}
          aria-busy={isPending}
        >
          {isPending ? (
            <Loader2 className="size-[1em] animate-spin" aria-hidden />
          ) : (
            <Sparkles className="size-[1em]" aria-hidden />
          )}
          {isPending
            ? "Application…"
            : lastRanAt
              ? "Réappliquer la maquette"
              : "Appliquer la maquette"}
        </button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className={typography.h4}>
            Appliquer la maquette à cette classe
          </AlertDialogTitle>
          <AlertDialogDescription className={typography.small}>
            Génère les semestres manquants du programme, puis les cours
            correspondants — rattachés directement à leur semestre. Les
            semestres et cours déjà présents sont ignorés, rien n&apos;est
            écrasé.
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
                Application…
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