// src/components/schedule/daily-schedule-view.tsx
'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import type { ScheduleStatus } from '@/generated/prisma/browser'
import { GetTeacherSchedulesInfoDto } from '@/services/schedule'
import StatusClock from '@/components/ux/StatusClock'

type ScheduleItem = GetTeacherSchedulesInfoDto[number]

type DailyScheduleViewProps = {
  schedules: GetTeacherSchedulesInfoDto
  date?: Date
}

const STATUS_CONFIG: Record<ScheduleStatus, { label: string; dot: string }> = {
  PENDING: { label: 'À venir', dot: 'bg-amber-500' },
  COMPLETED: { label: 'Terminé', dot: 'bg-emerald-500' },
  CANCELED: { label: 'Annulé', dot: 'bg-rose-500' },
  MISSED: { label: 'Manqué', dot: 'bg-teacher-muted' },
}

const timeFormatter = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
})

const dayFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
})

function formatRange({ startTime, endTime }: { startTime: Date; endTime: Date }) {
  return `${timeFormatter.format(new Date(startTime))} - ${timeFormatter.format(new Date(endTime))}`
}

function getAudienceLabel(schedule: ScheduleItem) {
  return schedule.group ? `${schedule.class.name} · ${schedule.group.name}` : schedule.class.name
}

function getRelativeTimeString(startTime: Date) {
  const now = new Date()
  const start = new Date(startTime)
  const diffMs = start.getTime() - now.getTime()

  if (diffMs <= 0) return "Aujourd'hui"

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) {
    const diffMins = Math.max(1, Math.round(diffMs / (1000 * 60)))
    return `Aujourd'hui · Dans ${diffMins} min`
  }
  return `Aujourd'hui · Dans ${diffHours} h`
}

function getPinnedLabel(schedule: ScheduleItem, schedules: GetTeacherSchedulesInfoDto) {
  if (schedule.status === 'COMPLETED') return 'Cours terminé'
  if (schedule.status === 'CANCELED') return 'Cours annulé'
  if (schedule.status === 'MISSED') return 'Cours manqué'

  const upcoming = schedules.filter((s) => s.status === 'PENDING')
  const nextCourse = upcoming[0]

  if (nextCourse && nextCourse.id === schedule.id) {
    return 'Cours suivant'
  }

  return getRelativeTimeString(schedule.startTime)
}

export function DailyScheduleView({ schedules, date }: DailyScheduleViewProps) {
  const [pinnedId, setPinnedId] = useState<string | null>(schedules.at(0)?.id ?? null)
  const [isExpanded, setIsExpanded] = useState<boolean>(true)

  const pinnedSchedule = schedules.find((s) => s.id === pinnedId) ?? schedules.at(0) ?? null

  const completedSchedules = schedules.filter(
    (s) => s.status === 'COMPLETED' || s.status === 'MISSED' || s.status === 'CANCELED'
  )
  const remainingSchedules = schedules.filter((s) => s.status === 'PENDING')

  const headerDate = date ?? (schedules.at(0)?.startTime ? new Date(schedules[0].startTime) : null)

  const handleSelectSchedule = (id: string) => {
    setPinnedId(id)
    setIsExpanded(true)
  }

  return (
    <div className="teacher-theme text-teacher-fg w-full mx-auto p-4 pt-2 lg:p-6 lg:pt-4 transition-colors">
      {/* En-tête */}
      <div className="flex items-baseline justify-center mb-3 pb-1 border-b border-teacher-surface-muted">
        <h1 className="text-sm text-center font-medium tracking-tight">Aujourd'hui</h1>
      </div>

      {schedules.length === 0 ? (
        <p className="text-sm text-teacher-muted py-8">Aucun cours prévu pour cette journée.</p>
      ) : (
        <div className="space-y-6">

          {/* 1. CARTE ÉPINGLÉE */}
          {pinnedSchedule && (
            <div className="space-y-2 min-h-[320px]">
              <div className="text-xs font-mono uppercase tracking-wider text-teacher-muted flex items-center gap-1.5">
                <StatusClock status={pinnedSchedule.status} />
                {getPinnedLabel(pinnedSchedule, schedules)}
              </div>

              <div className="bg-card rounded-lg p-4 border border-teacher-surface-muted space-y-3">
                <button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="w-full flex items-start justify-between text-left group"
                >
                  <div className="space-y-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-teacher-muted">
                        {formatRange(pinnedSchedule)}
                      </span>
                      <span
                        aria-label={STATUS_CONFIG[pinnedSchedule.status].label}
                        className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[pinnedSchedule.status].dot}`}
                      />
                    </div>
                    <h3 className="text-base font-semibold text-teacher-fg truncate">
                      {pinnedSchedule.course.name}
                    </h3>
                    <p className="text-xs text-teacher-muted truncate">
                      {getAudienceLabel(pinnedSchedule)}
                    </p>
                  </div>

                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-1 text-teacher-muted group-hover:text-teacher-fg shrink-0"
                  >
                    <ChevronDown className="size-4" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 border-t border-teacher-surface-muted text-xs space-y-1.5 text-teacher-muted">
                        <div className="flex justify-between">
                          <span>Horaire</span>
                          <span className="font-mono font-medium text-teacher-fg">
                            {formatRange(pinnedSchedule)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Salle</span>
                          <span className="font-medium text-teacher-fg">
                            {pinnedSchedule.room.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Classe</span>
                          <span className="font-medium text-teacher-fg">
                            {pinnedSchedule.class.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Groupe</span>
                          <span className="font-medium text-teacher-fg">
                            {pinnedSchedule.group?.name ?? 'Classe entière'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Statut</span>
                          <span className="font-medium text-teacher-fg">
                            {STATUS_CONFIG[pinnedSchedule.status].label}
                          </span>
                        </div>

                        {pinnedSchedule.notes && (
                          <p className="pt-2 mt-2 text-xs leading-relaxed text-teacher-muted border-t border-teacher-surface-muted truncate">
                            {pinnedSchedule.notes}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* 2. LISTE COMPLÈTE AVEC LABELS BORDER-DASHED */}
          <div className="space-y-4">

            {/* Section Cours Effectués */}
            {completedSchedules.length > 0 && (
              <details open className="group space-y-1">
                <summary className="cursor-pointer select-none text-xs font-mono uppercase tracking-wider text-teacher-muted mb-2 inline-flex items-center list-none [&::-webkit-details-marker]:hidden">
                  <span className="border-b border-dashed border-teacher-surface-muted pb-0.5 hover:text-teacher-fg transition-colors">
                    Cours effectués
                  </span>
                </summary>

                <div className="space-y-1">
                  {completedSchedules.map((schedule) => {
                    const status = STATUS_CONFIG[schedule.status]
                    const isSelected = schedule.id === pinnedSchedule?.id

                    return (
                      <button
                        key={schedule.id}
                        type="button"
                        onClick={() => handleSelectSchedule(schedule.id)}
                        className={`group/btn w-full flex items-center justify-between p-3 rounded-lg text-sm text-left transition-colors ${
                          isSelected ? 'bg-muted font-medium' : 'hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="text-xs font-mono text-teacher-muted w-24 shrink-0">
                            {formatRange(schedule)}
                          </span>
                          <span className="truncate text-teacher-fg">
                            {schedule.course.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-xs text-teacher-muted">
                          <span>{schedule.room.name}</span>
                          <span
                            aria-label={status.label}
                            className={`w-1.5 h-1.5 rounded-full ${status.dot}`}
                          />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </details>
            )}

            {/* Trait Séparateur */}
            {completedSchedules.length > 0 && remainingSchedules.length > 0 && (
              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-teacher-surface-muted" />
                </div>
                <span className="relative bg-background px-3 text-[10px] font-mono uppercase text-teacher-muted">
                  Cours restants
                </span>
              </div>
            )}

            {/* Section Prochains Cours */}
            {remainingSchedules.length > 0 && (
              <details open className="group space-y-1">
                <summary className="cursor-pointer select-none text-xs font-mono uppercase tracking-wider text-teacher-muted mb-2 inline-flex items-center list-none [&::-webkit-details-marker]:hidden">
                  <span className="border-b border-dashed border-teacher-surface-muted pb-0.5 hover:text-teacher-fg transition-colors">
                    Prochains cours ({remainingSchedules.length})
                  </span>
                </summary>

                <div className="space-y-1">
                  {remainingSchedules.map((schedule) => {
                    const status = STATUS_CONFIG[schedule.status]
                    const isSelected = schedule.id === pinnedSchedule?.id

                    return (
                      <button
                        key={schedule.id}
                        type="button"
                        onClick={() => handleSelectSchedule(schedule.id)}
                        className={`group/btn w-full flex items-center justify-between p-3 rounded-lg text-sm text-left transition-colors ${
                          isSelected ? 'bg-muted font-medium' : 'hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="text-xs font-mono text-teacher-muted w-24 shrink-0">
                            {formatRange(schedule)}
                          </span>
                          <span className="truncate text-teacher-fg">
                            {schedule.course.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-xs text-teacher-muted">
                          <span>{schedule.room.name}</span>
                          <span
                            aria-label={status.label}
                            className={`w-1.5 h-1.5 rounded-full ${status.dot}`}
                          />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </details>
            )}

          </div>

        </div>
      )}
    </div>
  )
}