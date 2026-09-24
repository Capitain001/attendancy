'use client'

import { useMemo, useState } from 'react'
import type { GetTeacherSchedulesInfoDto } from '@/services/schedule'
import { resolveScheduleUiStatus } from '@/services/schedule/policy'

import { getPinnedLabel } from './format'
import type { ScheduleWithUi } from './types'
import { PinnedScheduleCard } from './PinnedScheduleCard'
import { ScheduleListSection } from './ScheduleListSection'
import { EmptySchedule } from './EmptySchedule'
import { useScheduleClock } from '@/hooks/data/schedule/useScheduleClock'

type DailyScheduleViewProps = {
  schedules: GetTeacherSchedulesInfoDto
}

export function DailyScheduleView({ schedules }: DailyScheduleViewProps) {
  // null = l'utilisateur n'a encore rien choisi → le pin suit le défaut automatiquement
  const [pinnedId, setPinnedId] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)

  // `now` ne change qu'aux frontières de transition (début/fin d'une séance PENDING)
  const now = useScheduleClock(schedules)

  // Source unique du statut affiché : resolveScheduleUiStatus
  const items: ScheduleWithUi[] = useMemo(
    () =>
      schedules
        .map((s) => ({ ...s, uiStatus: resolveScheduleUiStatus(s, now) }))
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
    [schedules, now],
  )

  const completedSchedules = items.filter((s) =>
    s.uiStatus === 'COMPLETED' || s.uiStatus === 'MISSED' || s.uiStatus === 'CANCELED',
  )
  const remainingSchedules = items.filter(
    (s) => s.uiStatus === 'PENDING' || s.uiStatus === 'ONGOING',
  )

  // Défaut : séance en cours, sinon la prochaine, sinon la première
  const defaultPinned =
    items.find((s) => s.uiStatus === 'ONGOING') ??
    items.find((s) => s.uiStatus === 'PENDING') ??
    items.at(0) ??
    null

  const pinnedSchedule = items.find((s) => s.id === pinnedId) ?? defaultPinned

  const handleSelectSchedule = (id: string) => {
    setPinnedId(id)
    setIsExpanded(true)
  }

  return (
    <div className="teacher-theme text-teacher-fg w-full mx-auto p-4 pt-2 lg:p-6 lg:pt-4 transition-colors">
      <div className="flex items-baseline justify-center mb-3 pb-1 border-b border-teacher-surface-muted">
        <h1 className="text-sm text-center font-medium tracking-tight">Aujourd'hui</h1>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col py-10 gap-8">
          <p className="text-sm text-center text-teacher-muted py-8">
            Aucun cours prévu pour cette journée.
          </p>
          <EmptySchedule />
        </div>
      ) : (
        <div className="space-y-6">
          {pinnedSchedule && (
            <PinnedScheduleCard
              schedule={pinnedSchedule}
              label={getPinnedLabel(pinnedSchedule, items,now)}
              isExpanded={isExpanded}
              onToggle={() => setIsExpanded((prev) => !prev)}
            />
          )}

          <div className="space-y-4">
            {completedSchedules.length > 0 && (
              <ScheduleListSection
                title="Cours effectués"
                schedules={completedSchedules}
                selectedId={pinnedSchedule?.id}
                onSelect={handleSelectSchedule}
              />
            )}

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

            {remainingSchedules.length > 0 && (
              <ScheduleListSection
                title={`Prochains cours (${remainingSchedules.length})`}
                schedules={remainingSchedules}
                selectedId={pinnedSchedule?.id}
                onSelect={handleSelectSchedule}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}