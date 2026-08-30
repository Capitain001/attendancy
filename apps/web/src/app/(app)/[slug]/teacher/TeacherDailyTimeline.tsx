"use client"

import { useState } from "react"
import { Check, MapPin, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn, formatDate, formatTime } from "@/lib/utils"
import type { ScheduleStatus } from "@/generated/prisma/browser"
import {
  resolveScheduleUiStatus,
  SCHEDULE_UI_STATUS_LABEL,
  type ScheduleUiStatus,
} from "@/services/schedule/policy"
import { CalendarRestIllustration, TeacherEmpty } from "@/components/teacher/ui/illustrations"
// import { TeacherEmpty, CalendarRestIllustration } from "@/components/teacher/ui/illustrations"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DailyScheduleItem {
  id: string
  start: Date               // Date natif — transporté tel quel par le RSC payload
  end: Date
  status: ScheduleStatus    // status DB brut ; l'UI dérive le statut affichable
  notes: string | null
  courseName: string
  roomName: string
}

// ─── Config statuts (clé = statut UI dérivé, PAS le status DB) ─────────────────
//
// PENDING n'est pas figé (schedule/policy.ts) : il devient ONGOING pendant la
// fenêtre puis MISSED une fois passé. On affiche donc le `ScheduleUiStatus`
// résolu via resolveScheduleUiStatus, jamais `schedule.status` directement.

// Style du point uniquement — le libellé vient de SCHEDULE_UI_STATUS_LABEL.
const STATUS_DOT: Record<ScheduleUiStatus, string> = {
  PENDING: "bg-background border-border text-muted-foreground ring-transparent",
  // Ambre + pulsation : séance en cours, point d'attention du planning
  ONGOING: "bg-amber-600 border-transparent text-white ring-amber-600/20 animate-pulse",
  // Vert sauge (couleur principale du thème) pour une séance terminée
  COMPLETED: "bg-primary border-transparent text-primary-foreground ring-primary/20",
  CANCELED:
    "bg-background border-muted-foreground/30 text-muted-foreground/40 ring-transparent line-through",
  // Couleur d'erreur du système pour une séance manquée
  MISSED: "bg-background border-destructive text-destructive ring-destructive/10",
}

// ─── Composant ───────────────────────────────────────────────────────────────

interface TeacherDailyTimelineProps {
  schedules?: DailyScheduleItem[]
  date?: string
  className?: string
}

export function TeacherDailyTimeline({
  schedules = [],
  date,
  className,
}: TeacherDailyTimelineProps) {
  const now = new Date()
  const uiStatusOf = (s: DailyScheduleItem): ScheduleUiStatus =>
    resolveScheduleUiStatus(
      { status: s.status, startTime: s.start, endTime: s.end },
      now,
    )

  // Défaut : séance en cours, sinon la prochaine à venir — l'enseignant tombe
  // d'emblée sur ce qui l'attend, pas sur du vide.
  const [selectedId, setSelectedId] = useState<string | null>(
    schedules.find((s) => uiStatusOf(s) === "ONGOING")?.id ??
      schedules.find((s) => uiStatusOf(s) === "PENDING")?.id ??
      null
  )

  return (
    <div className={cn("bg-card rounded-2xl p-4 w-full", className)}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Planning du jour</p>
          <h2 className="text-base font-semibold capitalize">
            {date ?? formatDate(now, "LONG_DATE")}
          </h2>
        </div>
        {schedules.length > 0 && (
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {schedules.length} séance{schedules.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {schedules.length === 0 ? (
        <TeacherEmpty
          illustration={<CalendarRestIllustration />}
          title="Aucune séance aujourd'hui"
          hint="Profitez-en — votre prochain cours apparaîtra ici."
          className=""
        />
      ) : (
        <div className="relative">
          {/* Trait vertical de la timeline */}
          <div className="absolute left-6 top-2 bottom-2 w-px bg-border" />

          {schedules.map((schedule) => {
            const uiStatus = uiStatusOf(schedule)
            const dotClass = STATUS_DOT[uiStatus]
            const isPast = uiStatus === "COMPLETED" || uiStatus === "MISSED"
            const isCanceled = uiStatus === "CANCELED"
            const isCurrent = uiStatus === "ONGOING"
            const isSelected = selectedId === schedule.id
            // Démarrable uniquement pendant la fenêtre (ONGOING) ; ni avant, ni une fois manquée.
            const isUpcoming = uiStatus === "PENDING"
            const canStart = isCurrent

            return (
              <div
                key={schedule.id}
                role="button"
                tabIndex={0}
                aria-expanded={isSelected}
                aria-label={`${schedule.courseName}, ${SCHEDULE_UI_STATUS_LABEL[uiStatus]}`}
                className="flex gap-3 mb-3 cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-foreground/25"
                onClick={() => setSelectedId(isSelected ? null : schedule.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setSelectedId(isSelected ? null : schedule.id)
                  }
                }}
              >
                {/* dot */}
                <div className="w-12 flex flex-col items-center pt-0.5">
                  <div
                    className={cn(
                      "z-10 size-5 rounded-full border-2 transition-all flex items-center justify-center",
                      dotClass,
                      isSelected && !isPast && "ring-foreground/25"
                    )}
                  >
                    {/* Coche uniquement pour les cours validés terminés */}
                    {uiStatus === "COMPLETED" && (
                      <Check className="size-3 stroke-[3]" />
                    )}

                    {/* Petite croix distinctive pour un cours manqué */}
                    {uiStatus === "MISSED" && (
                      <X className="size-3 stroke-[3]" />
                    )}

                    {/* Point central blanc pour la séance en cours */}
                    {isCurrent && (
                      <div className="size-1.5 rounded-full bg-current" />
                    )}
                  </div>
                </div>

                {/* Card — surfaces solides : lisibilité d'abord, pas de transparence */}
                <div
                  className={cn(
                    "relative flex-1 overflow-hidden rounded-2xl border border-border/60 p-3 transition-all",
                    isSelected
                      ? "bg-accent ring-1 ring-border"
                      : "bg-muted hover:bg-accent/60",
                    // Passé / annulé : on atténue le FOND, jamais le texte (reste lisible)
                    (isPast || isCanceled) && "bg-muted/60"
                  )}
                >
                  {/* Hachure pour passé / annulé */}
                  {(isPast || isCanceled) && (
                    <div
                      aria-hidden
                      className="absolute inset-0 pointer-events-none opacity-[0.06] bg-[repeating-linear-gradient(-45deg,transparent_0px,transparent_5px,currentColor_5px,currentColor_6px)] z-10"
                    />
                  )}

                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-serif text-xs tabular-nums text-muted-foreground">
                        {formatTime(schedule.start)} – {formatTime(schedule.end)}
                      </p>
                      <p className={cn(
                        "text-sm font-medium truncate",
                        isCanceled && "line-through text-muted-foreground"
                      )}>
                        {schedule.courseName}
                      </p>

                    </div>

                    <Badge
                      variant={isCurrent ? "default" : "secondary"}
                      className="shrink-0 text-[10px] px-1.5 py-0 h-4"
                    >
                      {SCHEDULE_UI_STATUS_LABEL[uiStatus]}
                    </Badge>
                  </div>

                  {/* Détail au clic */}
                  {isSelected && (
                    <div className="mt-3 space-y-2.5">
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="size-3 shrink-0" />
                        {schedule.roomName}
                      </p>

                      {schedule.notes && (
                        <p className="text-xs text-muted-foreground italic leading-relaxed">
                          {schedule.notes}
                        </p>
                      )}

                      {(isUpcoming || isCurrent) && (
                        <button
                          disabled={!canStart}
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            "text-[11px] px-3 py-1.5 rounded-xl font-medium transition-colors",
                            canStart
                              ? "bg-primary text-primary-foreground hover:bg-primary/90"
                              : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                          )}
                        >
                          {canStart ? "Démarrer la séance" : "Pas encore l'heure"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}