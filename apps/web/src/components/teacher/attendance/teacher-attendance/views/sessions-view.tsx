import { Actions, FicheButton } from "../components/actions"
import { Line } from "../components/line"
import { SectionTitle } from "../components/section-title"
import { ViewHeader } from "../components/view-header"
import type { TagData, ViewProps } from "../types"

export type TodaySession = {
    id: string
    course: string
    place: string
    time: string
    tag: TagData
    count: string | null
}

export type NextSession = {
    id: string
    course: string
    place: string
    when: string
}

export type SessionsData = {
    dateLabel: string
    today: TodaySession[]
    next: NextSession[]
    /** Heure de l'appel en attente (ex. « 10 h 15 »). `null` : aucun appel à faire. */
    pendingCallTime: string | null
}

export function SessionsView({ go, data, onTakeCall }: ViewProps & {
    data: SessionsData
    onTakeCall?: () => void
}) {
    return (
        <section>
            <ViewHeader title="Mes séances" sub={data.dateLabel} backTo="home" onBack={go} />
            <SectionTitle>Aujourd’hui</SectionTitle>
            {data.today.map((s) => (
                <Line
                    key={s.id}
                    title={s.course}
                    lines={[s.place, s.time]}
                    tag={s.tag}
                    aside={s.count && <><br />{s.count}</>}
                />
            ))}
            <SectionTitle>À venir</SectionTitle>
            {data.next.map((s) => (
                <Line key={s.id} title={s.course} lines={[s.place]} aside={s.when} />
            ))}
            {data.pendingCallTime && (
                <Actions>
                    <FicheButton primary onClick={onTakeCall}>Faire l’appel de {data.pendingCallTime}</FicheButton>
                </Actions>
            )}
        </section>
    )
}
