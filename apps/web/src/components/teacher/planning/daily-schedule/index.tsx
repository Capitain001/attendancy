'use client'

import { useState } from 'react'
import type { GetTeacherSchedulesInfoDto } from '@/services/schedule'
import { getPinnedLabel } from './format'
import { PinnedScheduleCard } from './PinnedScheduleCard'
import { ScheduleListSection } from './ScheduleListSection'
import { EmptySchedule } from './EmptySchedule'

type DailyScheduleViewProps = {
  schedules: GetTeacherSchedulesInfoDto
}

export function DailyScheduleView({ schedules }: DailyScheduleViewProps) {
  const [pinnedId, setPinnedId] = useState<string | null>(schedules.at(0)?.id ?? null)
  const [isExpanded, setIsExpanded] = useState(true)

  const pinnedSchedule = schedules.find((s) => s.id === pinnedId) ?? schedules.at(0) ?? null

  const completedSchedules = schedules.filter(
    (s) => s.status === 'COMPLETED' || s.status === 'MISSED' || s.status === 'CANCELED'
  )
  const remainingSchedules = schedules.filter((s) => s.status === 'PENDING')

  const handleSelectSchedule = (id: string) => {
    setPinnedId(id)
    setIsExpanded(true)
  }

  return (
    <div className="teacher-theme text-teacher-fg w-full mx-auto p-4 pt-2 lg:p-6 lg:pt-4 transition-colors">
      <div className="flex items-baseline justify-center mb-3 pb-1 border-b border-teacher-surface-muted">
        <h1 className="text-sm text-center font-medium tracking-tight">Aujourd'hui</h1>
      </div>

      {schedules.length === 0 ? (
        
        <div className='flex flex-col py-10 gap-8'>
          <p className="text-sm text-center text-teacher-muted py-8">Aucun cours prévu pour cette journée.</p>
          <EmptySchedule/>
        </div>
      ) : (
        <div className="space-y-6">
          {pinnedSchedule && (
            <PinnedScheduleCard
              schedule={pinnedSchedule}
              label={getPinnedLabel(pinnedSchedule, schedules)}
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
