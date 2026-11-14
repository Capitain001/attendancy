// src/components/personal/teacher/screen/TeacherDailyOverviewScreen.tsx
// components/personal/teacher/screen/TeacherDailyOverviewScreen.tsx
'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { CountdownCircle } from '@/components/ui/custom/CountdownCircle'
import { TeacherDailyOverview } from '@/components/personal/teacher/section/TeacherDailyOverview'
import { RemainingCircle } from '@/components/personal/teacher/ui/RemainingCircle'
import { ScheduleCountdownLabel } from '@/components/personal/teacher/ui/ScheduleCountdownLabel'
import { StartSessionButton } from '@/components/personal/teacher/ui/StartSessionButton'
import { resolveScheduleIcon } from '@/components/personal/teacher/ui/ScheduleStatusIcon'
import { TeacherScheduleDetailSheet } from '@/components/personal/teacher/section/TeacherScheduleDetailSheet'
import { useTeacherDailySchedule } from '@/hooks/data/schedule/useTeacherDailySchedule'
import { useTeacherDailyScheduleStats } from '@/hooks/data/schedule/useTeacherDailyScheduleStats'
import { resolveCountdownWindow } from '@/lib/countdown'
import { CHECK_IN_WINDOW } from '@/services/session/policy'
import { CountdownDisplay } from '@/components/ui/custom/CountdownDisplay'

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

    // Fonction pure et peu coûteuse : pas besoin de useMemo
    const icon = schedule
        ? resolveScheduleIcon(ongoing ? 'ONGOING' : 'PENDING', schedule.session !== null)
        : undefined

    // Décompte avant le début du prochain cours, uniquement dans la fenêtre.
    // Pas de décompte si un cours est déjà en cours.
    // `now` ne change qu'aux frontières : la valeur est stable entre deux re-renders
    // (refetch inclus), l'animation CSS n'est donc jamais relancée à tort.
    const countdownWindow = resolveCountdownWindow(
        ongoing ? null : (upcoming?.startTime ?? null),
        now,
        CHECK_IN_WINDOW,
    )
    // const countdownWindow = { remaining: 63_000, total: CHECK_IN_WINDOW }

    // Une seule branche décide de l'en-tête ET du label au-dessus de la carte :
    // dans la fenêtre, l'en-tête porte le décompte, donc le label serait redondant.
    const { header, countdown } = countdownWindow
        ? {
            // key : l'animation CSS repart de zéro d'une séance à l'autre
            countdown: null,
            header: <CountdownDisplay key={schedule?.id} {...countdownWindow} label="Début dans" />,
        }
        : {
            header: 
            <RemainingCircle count={count.remaining} />,
            countdown: <ScheduleCountdownLabel schedule={schedule} isOngoing={ongoing !== null} />,
        }

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
                header={
                    countdownWindow ? <CountdownDisplay key={schedule?.id} {...countdownWindow} label="Début dans" /> : null
                }
                countdown={countdown}
                count={count}
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