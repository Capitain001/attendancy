import type { ReactNode } from "react"

export function Actions({ children }: { children: ReactNode }) {
    return <div className="mt-3.5 flex flex-wrap gap-2">{children}</div>
}

export function FicheButton({ children, primary, onClick }: {
    children: ReactNode
    primary?: boolean
    onClick?: () => void
}) {
    return (
        <button
            onClick={onClick}
            className={`min-h-10 flex-auto border border-foreground px-3.5 py-2 font-sans text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                primary ? "bg-primary text-primary-foreground" : "bg-background text-foreground"
            }`}
        >
            {children}
        </button>
    )
}
