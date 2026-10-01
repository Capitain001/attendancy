import { Em } from "../components/em"
import { Field } from "../components/field"
import { Leader } from "../components/leader"
import { SectionTitle } from "../components/section-title"
import type { Period, View, ViewProps } from "../types"

export type HomeMenuEntry = {
    view: Exclude<View, "home" | "classe">
    title: string
    /** Mise en avant en rouge avant le résumé (ex. « 5 demandes »). */
    alert?: string
    summary: string
}

export type HomeData = {
    teacherName: string
    classCount: number
    courseCount: number
    averageRate: number
    menu: HomeMenuEntry[]
}

export function HomeView({ go, data, period }: ViewProps & { data: HomeData; period: Period }) {
    return (
        <section>
            <p className="mb-3.5 font-sans text-[13px] text-muted-foreground">{period.short}</p>

            <div className="mt-2.5">
                <Field label="Professeur">{data.teacherName}</Field>
                <Field label="Classes">{data.classCount} classes</Field>
                <Field label="Cours">{data.courseCount} matières</Field>
                <Field label="Présence moyenne"><b className="font-semibold">{data.averageRate} %</b></Field>
            </div>

            <SectionTitle>Résumé</SectionTitle>
            <ul>
                {data.menu.map((item) => (
                    <li key={item.view}>
                        <button
                            onClick={() => go(item.view)}
                            className="block w-full border-b border-border px-1 py-3 text-left hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                        >
                            <span className="flex items-baseline gap-1.5">
                                <strong className="font-sans text-[15px] font-semibold">{item.title}</strong>
                                <Leader />
                                <span className="font-sans text-xs text-muted-foreground">Ouvrir</span>
                            </span>
                            <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                                {item.alert && <><Em>{item.alert}</Em>{" "}</>}
                                {item.summary}
                            </p>
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    )
}
