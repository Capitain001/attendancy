// src/components/term/TermsSection.tsx
//
// Orchestration : décide quoi montrer quand `terms` est vide (message +
// GenerateTermsButton). TermsList, lui, reste pur — il ne sait afficher que
// des semestres, rien d'autre. C'est ce composant qui connaît la relation
// "liste vide → proposer de générer depuis le programme" ; un autre appelant
// qui n'a pas besoin de cette action compose directement <TermsList /> sans
// passer par ici (ex. vue lecture seule enseignant/étudiant).

import { card, typography } from "@/styles"
import type { GetTermsDto } from "@/services/term"
import { TermsList } from "./TermsList"
import { GenerateTermsButton } from "./Generatetermsbutton"
import { cn } from "@/lib/utils"

interface TermsSectionProps {
  classId: string
  terms: GetTermsDto
  /** Désactive GenerateTermsButton si la classe n'a pas de programme attaché. */
  hasProgram?: boolean
  className?: string
}

export function TermsSection({ classId, terms, hasProgram = true, className }: TermsSectionProps) {
  if (terms.length === 0) {
    return (
      <div className={cn(card.soft, "flex flex-col items-center gap-[1em] text-center", className)}>
        <p className={typography.medium}>Aucun semestre pour cette classe.</p>
        <p className={cn(typography.small, "text-muted-foreground")}>
          Génère-les depuis le programme appliqué, ou ajoute-en un manuellement.
        </p>
        <GenerateTermsButton classId={classId} hasProgram={hasProgram} />
      </div>
    )
  }

  return <TermsList terms={terms} className={className} />
}
