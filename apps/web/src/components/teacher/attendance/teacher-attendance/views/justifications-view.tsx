import { Actions, FicheButton } from "../components/actions"
import { Line } from "../components/line"
import { ViewHeader } from "../components/view-header"
import type { TagData, ViewProps } from "../types"

export type PendingJustification = {
    id: string
    name: string
    detail: string
    reason: string
    tag: TagData
}

export type JustificationsData = {
    pendingCount: number
    items: PendingJustification[]
}

export function JustificationsView({ go, data, onAccept, onRefuse }: ViewProps & {
    data: JustificationsData
    onAccept?: () => void
    onRefuse?: () => void
}) {
    const hidden = data.pendingCount - data.items.length

    return (
        <section>
            <ViewHeader title="Justificatifs" sub={`${data.pendingCount} demandes en attente`} backTo="home" onBack={go} />
            <div className="mt-2">
                {data.items.map((j) => (
                    <Line key={j.id} title={j.name} lines={[j.detail, j.reason]} tag={j.tag} />
                ))}
            </div>
            {hidden > 0 && (
                <p className="mt-3 text-[13px] leading-snug text-muted-foreground">{hidden} autres demandes plus bas dans la liste.</p>
            )}
            <Actions>
                <FicheButton primary onClick={onAccept}>Accepter</FicheButton>
                <FicheButton onClick={onRefuse}>Refuser</FicheButton>
            </Actions>
        </section>
    )
}
