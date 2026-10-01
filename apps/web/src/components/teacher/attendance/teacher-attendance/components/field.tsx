import type { ReactNode } from "react"
import { Leader } from "./leader"

export function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="my-1.5 flex items-baseline gap-1.5 text-[15px]">
            <span className="whitespace-nowrap font-sans text-[13px] text-muted-foreground">{label}</span>
            <Leader />
            <span className="text-right">{children}</span>
        </div>
    )
}
