// components/teacher/personal/screen/TeacherDailyOverviewScreen.tsx
'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { TeacherDailyOverview } from '@/components/teacher/personal/section/TeacherDailyOverview'
import { ScheduleCountdownLabel } from '@/components/teacher/personal/ui/ScheduleCountdownLabel'
import { StartSessionButton } from '@/components/teacher/personal/ui/StartSessionButton'
import { resolveScheduleIcon } from '@/components/teacher/personal/ui/ScheduleStatusIcon'
import { TeacherScheduleDetailSheet } from '@/components/teacher/personal/section/TeacherScheduleDetailSheet'
import { useTeacherDailySchedule } from '@/hooks/data/schedule/useTeacherDailySchedule'
import { useTeacherDailyScheduleStats } from '@/hooks/data/schedule/useTeacherDailyScheduleStats'

export function TeacherDailyOverviewScreen() {
    const { slug } = useParams<{ slug: string }>()
    const sessionsHref = `/${slug}/teacher/sessions`

    const { schedules } = useTeacherDailySchedule()
    const { ongoing, upcoming, count } = useTeacherDailyScheduleStats(schedules)

    // Cours actuel s'il existe, sinon le prochain
    const schedule = ongoing ?? upcoming

    // Fonction pure et peu coûteuse : pas besoin de useMemo
    const icon = schedule
        ? resolveScheduleIcon(ongoing ? 'ONGOING' : 'PENDING', schedule.session !== null)
        : undefined

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
                icon={icon}
                action={
                    schedule ? <StartSessionButton schedule={schedule} href={sessionsHref} /> : null
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