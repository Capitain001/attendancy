// components/teacher/personal/screen/TeacherDailyOverviewScreen.tsx
'use client'

import { useState } from 'react'
import { TeacherDailyOverview } from '@/components/teacher/personal/section/TeacherDailyOverview'
import { ScheduleCountdownLabel } from '@/components/teacher/personal/ui/ScheduleCountdownLabel'
import { TeacherScheduleDetailSheet } from '@/components/teacher/personal/section/TeacherScheduleDetailSheet'
import { useTeacherDailySchedule } from '@/hooks/data/schedule/useTeacherDailySchedule'
import { useTeacherDailyScheduleStats } from '@/hooks/data/schedule/useTeacherDailyScheduleStats'

export function TeacherDailyOverviewScreen() {
    const { schedules } = useTeacherDailySchedule()
    const { ongoing, upcoming, count } = useTeacherDailyScheduleStats(schedules)

    // Cours actuel s'il existe, sinon le prochain
    const schedule = ongoing ?? upcoming

    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [isOpen, setIsOpen] = useState(false)

    const selected = schedules.find((s) => s.id === selectedId) ?? null

    const handleScheduleClick = (schedule: { id?: string }) => {
        if (schedule.id) {
            setSelectedId(schedule.id)
            setIsOpen(true)
        }
    }

    return (
        <>
            <TeacherDailyOverview
                remaining={count.remaining}
                schedule={schedule}
                countdown={
                    <ScheduleCountdownLabel schedule={schedule} isOngoing={ongoing !== null} />
                }
                onScheduleClick={handleScheduleClick}
            />

            <TeacherScheduleDetailSheet
                schedule={selected}
                open={isOpen}
                onOpenChange={setIsOpen}
            />
        </>
    )
}

export default TeacherDailyOverviewScreen