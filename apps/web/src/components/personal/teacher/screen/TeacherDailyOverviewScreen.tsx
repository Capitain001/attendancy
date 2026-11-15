// src/components/personal/teacher/screen/TeacherDailyOverviewScreen.tsx
// components/personal/teacher/screen/TeacherDailyOverviewScreen.tsx
'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { TeacherDailyOverview } from '@/components/personal/teacher/section/TeacherDailyOverview'
import { ScheduleCountdownLabel } from '@/components/personal/teacher/ui/ScheduleCountdownLabel'
import { StartSessionButton } from '@/components/personal/teacher/ui/StartSessionButton'
import { TeacherScheduleDetailSheet } from '@/components/personal/teacher/section/TeacherScheduleDetailSheet'
import { CountdownDisplay } from '@/components/ui/custom/CountdownDisplay'
import { useTeacherDailySchedule } from '@/hooks/data/schedule/useTeacherDailySchedule'
import { useTeacherDailyScheduleStats } from '@/hooks/data/schedule/useTeacherDailyScheduleStats'
import { resolveCountdownWindow } from '@/lib/countdown'
import { CHECK_IN_WINDOW } from '@/services/session/policy'

interface TeacherDailyOverviewScreenProps {
    sessionsHref?: string;
}

export function TeacherDailyOverviewScreen({ sessionsHref: externalSessionsHref }: TeacherDailyOverviewScreenProps = {}) {
    const { slug } = useParams<{ slug?: string }>()
    const sessionsHref = externalSessionsHref ?? (slug ? `/personal/${slug}/teacher/session` : '/sessions')

    const { schedules } = useTeacherDailySchedule()

    // `lead` : on veut être réveillé à l'ouverture de la fenêtre de check-in,
    // sinon `now` reste figé et le décompte ne s'affiche jamais à temps.
    const { ongoing, upcoming, count, now } = useTeacherDailyScheduleStats(schedules, {
        lead: CHECK_IN_WINDOW,
    })

    // Cours actuel s'il existe, sinon le prochain
    const schedule = ongoing ?? upcoming

    // Décompte avant le début du prochain cours, uniquement dans la fenêtre.
    // Pas de décompte si un cours est déjà en cours.
    // `now` ne change qu'aux frontières : la valeur est stable entre deux re-renders
    // (refetch inclus), l'animation CSS n'est donc jamais relancée à tort.
    const countdownWindow = resolveCountdownWindow(
        ongoing ? null : (upcoming?.startTime ?? null),
        now,
        CHECK_IN_WINDOW,
    )
    // MOCK : décommenter pour tester l'affichage du timer
    // const countdownWindow = { remaining: 63_000, total: CHECK_IN_WINDOW }

    // Un seul slot : le libellé hors fenêtre, le timer à l'entrée dans la fenêtre de check-in.
    // key : l'animation CSS repart de zéro d'une séance à l'autre.
    // const countdown = countdownWindow
    //     ? <CountdownDisplay key={schedule?.id} {...countdownWindow} label="Début dans" />
    //     : <ScheduleCountdownLabel schedule={schedule} isOngoing={ongoing !== null} />

        const countdown = <ScheduleCountdownLabel schedule={schedule} isOngoing={ongoing !== null} />

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
                schedule={schedule}
                count={count}
                countdown={countdown}
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