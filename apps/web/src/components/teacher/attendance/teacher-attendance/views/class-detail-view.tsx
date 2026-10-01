import Link from "next/link"
import { Actions, FicheButton } from "../components/actions"
import { Field } from "../components/field"
import { Line } from "../components/line"
import { SectionTitle } from "../components/section-title"
import { ViewHeader } from "../components/view-header"
import type { Period, TagData, ViewProps } from "../types"

export type WatchedStudent = {
    id: string
    name: string
    detail: string
    tag: TagData
}

export type RecentCall = {
    id: string
    dateLabel: string
    summary: string
}

export type ClassDetailData = {
    name: string
    course: string
    sessionsHeld: number
    averageRate: number
    absences: { total: number; justified: number }
    lateness: { count: number; duration: string }
    watched: WatchedStudent[]
    recentCalls: RecentCall[]
    studentsHref: string
}

export function ClassDetailView({ go, data, period, onExport }: ViewProps & {
    data: ClassDetailData
    period: Period
    onExport?: () => void
}) {
    return (
        <section>
            <ViewHeader
                title={data.name}
                sub={`${data.course} · ${period.label}`}
                backTo="classes"
                backLabel="Retour aux classes"
                onBack={go}
            />
            <div className="mt-2.5">
                <Field label="Séances tenues">{data.sessionsHeld}</Field>
                <Field label="Présence moyenne"><b className="font-semibold">{data.averageRate} %</b></Field>
                <Field label="Absences">{data.absences.total}, dont {data.absences.justified} justifiées</Field>
                <Field label="Retards">{data.lateness.count}, soit {data.lateness.duration}</Field>
            </div>
            <SectionTitle>Étudiants à surveiller</SectionTitle>
            {data.watched.map((e) => (
                <Line key={e.id} title={e.name} lines={[e.detail]} tag={e.tag} />
            ))}
            <SectionTitle>Derniers appels</SectionTitle>
            {data.recentCalls.map((c) => (
                <Field key={c.id} label={c.dateLabel}>{c.summary}</Field>
            ))}
            <Link href={data.studentsHref} className="text-[13px] leading-snug text-muted-foreground underline">Liste des étudiants</Link>
            <Actions><FicheButton onClick={onExport}>Exporter</FicheButton></Actions>
        </section>
    )
}
