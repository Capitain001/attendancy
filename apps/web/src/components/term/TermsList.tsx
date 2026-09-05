// src/components/term/TermsList.tsx
//
// Affiche les semestres (Term) d'une classe, triés par ordre structurel.
// Purement présentationnel : ne connaît que `terms`. Pas de classId, pas de
// GenerateTermsButton, pas de notion d'état "vide → action de génération" —
// cette décision appartient à l'appelant (cf. TermsSection), pas tous les
// consommateurs de la liste n'ont besoin de cette action (ex. vue enseignant
// en lecture seule). Rend `null` en liste vide : c'est à l'appelant de
// décider quoi afficher à la place (message, CTA, ou rien).

import { CalendarRange, Lock } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { card, typography} from "@/styles"
import type { GetTermsDto } from "@/services/term"
import { cn } from "@/lib/utils"

interface TermsListProps {
  terms: GetTermsDto
  className?: string
}

function formatTermRange(startDate: Date | null, endDate: Date | null) {
  if (!startDate && !endDate) return "Dates à définir"
  if (startDate && endDate) {
    return `${format(startDate, "d MMM yyyy", { locale: fr })} → ${format(endDate, "d MMM yyyy", { locale: fr })}`
  }
  // Une seule borne posée (cas transitoire, avant que l'établissement finisse de dater le semestre).
  const known = startDate ?? endDate
  const label = startDate ? "Début" : "Fin"
  return `${label} : ${format(known as Date, "d MMM yyyy", { locale: fr })}`
}

export function TermsList({ terms, className }: TermsListProps) {
  if (terms.length === 0) return null

  return (
    <div className={cn("flex flex-col gap-[1em]", className)}>
      {terms.map((term) => (
        <div
          key={term.id}
          className={cn(card.base, "flex items-center justify-between gap-[1.5em]")}
        >
          <div className="flex flex-col gap-[0.3em]">
            <div className="flex items-center gap-[0.6em]">
              <span className={typography.medium}>
                Semestre {term.order} — {term.name}
              </span>
              {term.lockedAt && (
                <span
                  className={cn(
                    typography.xsmall,
                    "flex items-center gap-[0.3em] rounded-[10em] bg-muted px-[0.8em] py-[0.2em] text-muted-foreground"
                  )}
                >
                  <Lock className="size-[1em]" />
                  Clôturé
                </span>
              )}
            </div>
            <span className={cn(typography.small, "flex items-center gap-[0.4em] text-muted-foreground")}>
              <CalendarRange className="size-[1em]" />
              {formatTermRange(term.startDate, term.endDate)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
