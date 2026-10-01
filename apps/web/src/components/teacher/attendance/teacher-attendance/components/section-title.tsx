import type { ReactNode } from "react"

export function SectionTitle({ children }: { children: ReactNode }) {
    return (
        <h2 className="mb-1 mt-5 border-b-2 border-foreground pb-0.5 font-sans text-[15px] font-semibold">
            {children}
        </h2>
    )
}
