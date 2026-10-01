import Link from "next/link"
import { Actions, FicheButton } from "../components/actions"
import { Field } from "../components/field"
import { Line } from "../components/line"
import { SectionTitle } from "../components/section-title"
import { ViewHeader } from "../components/view-header"
import type { Period, TagData, ViewProps } from "../types"

export type OwnAttendanceEvent = {
    id: string
    title: string
    detail: string
    tag: TagData
}

export type OwnAttendanceData = {
    lateness: { duration: string; sessions: number }
    absence: { duration: string; sessions: number }
    madeUp: string
    remaining: string
    events: OwnAttendanceEvent[]
    unavailabilitiesHref: string
}

export function OwnAttendanceView({ go, data, period, onExport }: ViewProps & {
    data: OwnAttendanceData
    period: Period
    onExport?: () => void
}) {
    return (
        <section>
            <ViewHeader title="Mon assiduité" sub={period.label} backTo="home" onBack={go} />
            <div className="mt-2.5">
                <Field label="Retards"><b className="font-semibold">{data.lateness.duration}</b>, {data.lateness.sessions} séances</Field>
                <Field label="Absences"><b className="font-semibold">{data.absence.duration}</b>, {data.absence.sessions} séance</Field>
                <Field label="Rattrapé">{data.madeUp}</Field>
                <Field label="Reste à rattraper"><b className="font-semibold">{data.remaining}</b></Field>
            </div>
            <SectionTitle>Détail</SectionTitle>
            {data.events.map((e) => (
                <Line key={e.id} title={e.title} lines={[e.detail]} tag={e.tag} />
            ))}
            <Link href={data.unavailabilitiesHref} className="text-[13px] leading-snug text-muted-foreground underline">Mes indisponibilités</Link>
            <Actions><FicheButton onClick={onExport}>Exporter</FicheButton></Actions>
        </section>
    )
}
