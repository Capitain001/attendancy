import type { ReactNode } from "react"
import type { TagData } from "../types"
import { Tag } from "./tag"

export function Line({ title, lines, aside, tag, onClick }: {
    title: string
    lines: string[]
    aside?: ReactNode
    tag?: TagData
    onClick?: () => void
}) {
    const Root = onClick ? "button" : "div"
    return (
        <Root
            onClick={onClick}
            className={`flex w-full items-start justify-between gap-3 border-b border-border px-1 py-3 text-left ${
                onClick ? "cursor-pointer hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring" : ""
            }`}
        >
            <span className="block">
                <b className="block font-sans text-[15px] font-semibold">{title}</b>
                {lines.map((line) => (
                    <span key={line} className="block text-[13px] leading-snug text-muted-foreground">{line}</span>
                ))}
            </span>
            <span className="block whitespace-nowrap text-right font-sans text-[13px] leading-snug">
                {tag && <Tag {...tag} />}
                {aside}
            </span>
        </Root>
    )
}
