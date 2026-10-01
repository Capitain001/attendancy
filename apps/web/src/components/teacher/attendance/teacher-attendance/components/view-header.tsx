import type { View } from "../types"

export function ViewHeader({ title, sub, backTo, backLabel = "Retour", onBack }: {
    title: string
    sub?: string
    backTo?: View
    backLabel?: string
    onBack: (view: View) => void
}) {
    return (
        <header>
            <div className="mb-4 flex justify-between">
                <h1 className="font-sans text-xl font-semibold leading-tight">{title}</h1>
                {backTo && (
                    <button
                        onClick={() => onBack(backTo)}
                        className="font-sans text-[13px] font-medium text-muted-foreground underline hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                    >
                        {backLabel}
                    </button>
                )}
            </div>
            {sub && <p className="mt-0.5 w-full text-center font-sans text-[13px] text-muted-foreground">{sub}</p>}
        </header>
    )
}
