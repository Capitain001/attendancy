// src/components/personal/teacher/class/ClassOverviewCard.tsx
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type ClassOverviewCardProps = {
    icon: LucideIcon;
    title: string;
    value: string | number;
    description: string;
    href?: string;
};

export function ClassOverviewCard({
    icon: Icon,
    title,
    value,
    description,
    href = "#",
}: ClassOverviewCardProps) {
    return (
        <article className="relative flex h-full flex-col justify-between gap-8 rounded-md border border-foreground/10 bg-foreground/[0.02] p-5 text-center transition-colors hover:border-foreground/20 hover:bg-foreground/[0.03]">
            <div className="flex flex-col items-center gap-4">
                <div aria-hidden="true" className="flex items-end justify-center gap-2 text-foreground/80">
                    <Icon className="size-7 opacity-70" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    <Link
                        href={href}
                        scroll={href !== "#"}
                        className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-md focus-visible:after:ring-2 focus-visible:after:ring-primary/50"
                    >
                        {title}
                    </Link>
                </h2>
            </div>

            <p className="flex items-baseline justify-center gap-1.5 text-xs text-foreground/35">
                <span className="font-medium tabular-nums text-foreground/60">{value}</span>
                <span>{description}</span>
            </p>
        </article>
    );
}