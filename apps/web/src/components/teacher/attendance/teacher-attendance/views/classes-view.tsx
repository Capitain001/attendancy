import { Line } from "../components/line"
import { ViewHeader } from "../components/view-header"
import type { Period, ViewProps } from "../types"

export type ClassSummary = {
    id: string
    name: string
    course: string
    size: number
    overThreshold: number
    rate: number
}

export type ClassesData = {
    thresholdNote: string
    items: ClassSummary[]
}

export function ClassesView({ go, data, period, onSelect }: ViewProps & {
    data: ClassesData
    period: Period
    onSelect: (classId: string) => void
}) {
    return (
        <section>
            <ViewHeader title="Mes classes" sub={period.label} backTo="home" onBack={go} />
            <div className="mt-2">
                {data.items.map((c) => (
                    <Line
                        key={c.id}
                        title={c.name}
                        lines={[
                            `${c.course} · ${c.size} étudiants`,
                            c.overThreshold ? `${c.overThreshold} au-delà du seuil` : "Aucun au-delà du seuil",
                        ]}
                        aside={<><b className="block text-[15px] font-semibold">{c.rate} %</b>présence</>}
                        onClick={() => onSelect(c.id)}
                    />
                ))}
            </div>
            <p className="mt-3 text-[13px] leading-snug text-muted-foreground">{data.thresholdNote}</p>
        </section>
    )
}
