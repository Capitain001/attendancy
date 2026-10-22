// components/teacher/personal/section/TeacherScheduleDetailSheet.tsx
'use client'

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { formatDuration, formatTime, timeFormatter } from '@/lib/utils'
import type { GetTeacherDailyScheduleDto } from '@attendancy/types'

type Props = {
    schedule: GetTeacherDailyScheduleDto[number] | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function TeacherScheduleDetailSheet({ schedule, open, onOpenChange }: Props) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="flex w-full flex-col gap-6 px-6 py-2 sm:max-w-md">
                {schedule && <Details schedule={schedule} />}
            </SheetContent>
        </Sheet>
    )
}

function Details({ schedule }: { schedule: GetTeacherDailyScheduleDto[number] }) {
    // Effectif du groupe s'il existe, sinon effectif de la classe
    const headcount =
        schedule.group?._count.studentGroups ?? schedule.class._count.studentEnrollments

    const duration = formatDuration(schedule.startTime, schedule.endTime)

    return (
        <div className="flex flex-col gap-16">
            {/* En-tête : uniquement le nom du cours */}
            <SheetHeader className="p-0 gap-4 text-left">
                <SheetTitle className="text-2xl font-semibold tracking-tight text-foreground">
                    {schedule.course.name}
                </SheetTitle>
                <SheetDescription className="sr-only">Détails de la séance</SheetDescription>

            </SheetHeader>


            {/* Liste d'informations épurée */}
            <div className="flex flex-col divide-y divide-border text-sm">
                <Row
                    label="Horaire"
                    value={`${formatTime(schedule.startTime, 'h')} – ${formatTime(schedule.endTime, 'h')}`}
                />
                <Row label="Durée" value={duration} />
                <Row label="Salle" value={schedule.room.name} />
                <Row label="Classe" value={schedule.class.name} />
                {schedule.group && <Row label="Groupe" value={schedule.group.name} />}
                <Row label="Effectif" value={`${headcount} étudiants`} />

                {schedule.notes && (
                    <div className="flex flex-col gap-3 py-3 mt-8">
                        <span className="text-muted-foreground text-center">Notes</span>
                        <p className="whitespace-pre-wrap text-foreground">{schedule.notes}</p>
                    </div>
                )}
            </div>
        </div>
    )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between py-3">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-foreground">{value}</span>
        </div>
    )
}