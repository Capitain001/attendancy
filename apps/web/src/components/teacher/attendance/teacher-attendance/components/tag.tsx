import type { Tone } from "../types"

const TONES: Record<Tone, string> = {
    neutral: "border-border text-muted-foreground",
    warn: "border-destructive text-destructive",
    ok: "border-emerald-600 text-emerald-600",
}

export function Tag({ text, tone }: { text: string; tone: Tone }) {
    return (
        <span className={`whitespace-nowrap border px-1.5 font-sans text-xs font-medium ${TONES[tone]}`}>
            {text}
        </span>
    )
}
