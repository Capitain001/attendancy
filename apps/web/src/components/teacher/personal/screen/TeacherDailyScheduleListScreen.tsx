// components/teacher/personal/screen/TeacherDailyScheduleListScreen.tsx
'use client'

import { useState } from 'react'
import { TeacherDailyScheduleList } from '@/components/teacher/personal/section/TeacherDailyScheduleList'
import { TeacherScheduleDetailSheet } from '@/components/teacher/personal/section/TeacherScheduleDetailSheet'
import { useTeacherDailySchedule } from '@/hooks/data/schedule/useTeacherDailySchedule'
import { useTeacherDailyScheduleList } from '@/hooks/data/schedule/useTeacherDailyScheduleList'

export function TeacherDailyScheduleListScreen() {
    const { schedules } = useTeacherDailySchedule()
    const items = useTeacherDailyScheduleList(schedules)

    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [isOpen, setIsOpen] = useState(false)

    const selected = schedules.find((s) => s.id === selectedId) ?? null

    return (
        <>
            <TeacherDailyScheduleList
                items={items}
                onScheduleClick={(schedule) => {
                    setSelectedId(schedule.id)
                    setIsOpen(true)
                }}
            />

            <TeacherScheduleDetailSheet
                schedule={selected}
                open={isOpen}
                onOpenChange={setIsOpen}
            />
        </>
    )
}

export default TeacherDailyScheduleListScreen