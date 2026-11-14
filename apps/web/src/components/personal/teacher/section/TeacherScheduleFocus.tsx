// src/components/personal/teacher/section/TeacherScheduleFocus.tsx
import type { ReactNode } from 'react'
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatTime } from '@/lib/utils'
import type { TeacherDailyScheduleCount } from '@/hooks/data/schedule/useTeacherDailyScheduleStats'

/** Ce dont la section a besoin d'une séance. */
export type TeacherScheduleFocusSchedule = {
  startTime: Date
  endTime: Date
  course: { name: string }
}

type Props = {
  /** Séance à afficher (en cours, sinon la prochaine), ou null s'il n'en reste plus. */
  schedule: TeacherScheduleFocusSchedule | null
  /** Cours restants / total de la journée (ex. 2/3), en pastille dans le coin haut droit. */
  count?: Pick<TeacherDailyScheduleCount, 'remaining' | 'total'>
  /** Slot sous le filet : décompte fourni par le parent (libellé ou timer). */
  countdown?: ReactNode
  /** Slot en bas : action principale fournie par le parent, elle occupe la largeur restante. */
  action?: ReactNode
  /** Clic sur le bouton info (ouvre le détail). Absent = bouton masqué. */
  onInfo?: () => void
}

/**
 * Vue du prochain / du cours en cours : mise en page uniquement, aucune règle d'affichage.
 * Tout ce qui varie (décompte, action) arrive en slot depuis le parent.
 * Aucun état, aucun hook.
 */
export function TeacherScheduleFocus({ schedule, count, countdown, action, onInfo }: Props) {
  return (
    // font-sans : garantit une police sans-serif même si le layout n'en fixe aucune
    <section className="relative flex flex-1 flex-col items-center justify-center border bg-background px-6 font-sans">
      {schedule ? (
        <>
          {count && (
            // Pastille simple (pas de Badge shadcn) : fond muted, coin haut droit
            <p className="absolute right-4 top-4 rounded bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
              {/* Version visuelle compacte, et version lue par les lecteurs d'écran */}
              <span aria-hidden>
                {count.remaining}/{count.total}
              </span>
              <span className="sr-only">
                {count.remaining} cours restants sur {count.total} aujourd&apos;hui
              </span>
            </p>
          )}

          <div className="flex w-full max-w-sm flex-col gap-6">
            {/* Titre + plage horaire */}
            <div className="flex flex-col gap-1">
              {/* text-balance : un nom long se répartit sur deux lignes sans orphelin */}
              <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground">
                {schedule.course.name}
              </h2>
              <p className="tabular-nums text-muted-foreground">
                {formatTime(schedule.startTime)} – {formatTime(schedule.endTime)}
              </p>
            </div>

            {/* Filet : sépare l'identité du cours de son état, sans cadre */}
            <div aria-hidden className="h-px w-full bg-border" />

            {/* Décompte : libellé ou timer, au choix du parent */}
            <div className="flex justify-center">{countdown}</div>

            {/* Actions : info étroit à gauche, action principale large à droite */}
            <div className="flex w-full items-center gap-3">
              {onInfo && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onInfo}
                  aria-label="Voir le détail du cours"
                  className="shrink-0"
                >
                  <Info aria-hidden />
                </Button>
              )}
              {/* [&>*]:w-full : l'élément racine de l'action prend toute la largeur du conteneur */}
              <div className="flex-1 [&>*]:w-full">{action}</div>
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Aucun cours en attente aujourd&apos;hui</p>
      )}
    </section>
  )
}