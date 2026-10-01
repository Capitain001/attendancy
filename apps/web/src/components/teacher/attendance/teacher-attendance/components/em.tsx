import type { ReactNode } from "react"

export function Em({ children }: { children: ReactNode }) {
    return <em className="font-semibold not-italic text-destructive">{children}</em>
}
