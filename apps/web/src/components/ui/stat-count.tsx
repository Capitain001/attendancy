import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Variants ────────────────────────────────────────────────────────────────

const statCountVariants = cva(
    "inline-flex flex-col items-center justify-center rounded-2xl border transition-colors",
    {
        variants: {
            status: {
                default: "border-border bg-card text-card-foreground",
                warning: "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950",
                danger: "border-destructive/30 bg-destructive/5 dark:border-destructive/40 dark:bg-destructive/10",
            },
            size: {
                sm: "gap-1 px-4 py-3",
                default: "gap-1.5 px-6 py-4",
                lg: "gap-2 px-8 py-6",
            },
        },
        defaultVariants: {
            status: "default",
            size: "default",
        },
    }
);

const countVariants = cva("font-semibold tabular-nums leading-none", {
    variants: {
        status: {
            default: "text-foreground",
            warning: "text-orange-600 dark:text-orange-400",
            danger: "text-destructive",
        },
        size: {
            sm: "text-2xl",
            default: "text-4xl",
            lg: "text-6xl",
        },
    },
    defaultVariants: {
        status: "default",
        size: "default",
    },
});

const labelVariants = cva("font-normal text-muted-foreground", {
    variants: {
        size: {
            sm: "text-xs",
            default: "text-sm",
            lg: "text-base",
        },
    },
    defaultVariants: { size: "default" },
});

const iconSizeMap = {
    sm: "h-4 w-4",
    default: "h-5 w-5",
    lg: "h-6 w-6",
} as const;

const iconColorMap = {
    default: "text-muted-foreground",
    warning: "text-orange-500 dark:text-orange-400",
    danger: "text-destructive",
} as const;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface StatCountProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statCountVariants> {
    count: number;
    label?: string;
    icon?: LucideIcon;
}

// ─── Component ───────────────────────────────────────────────────────────────

const StatCount = React.forwardRef<HTMLDivElement, StatCountProps>(
    (
        {
            count,
            label = "absences",
            status = "default",
            size = "default",
            icon: Icon,
            className,
            ...props
        },
        ref
    ) => {
        const resolvedSize = size ?? "default";
        const resolvedStatus = status ?? "default";

        return (
            <div
                ref={ref}
                role="status"
                aria-label={`${count} ${label}`}
                className={cn(statCountVariants({ status, size }), className)}
                {...props}
            >
                <div className="flex items-center gap-2">

                    <span
                        className={cn(countVariants({ status, size }))}
                        aria-hidden="true"
                    >
                        {count}
                    </span>

                    {Icon && (
                        <Icon
                            aria-hidden="true"
                            className={cn(
                                iconSizeMap[resolvedSize],
                                iconColorMap[resolvedStatus]
                            )}
                        />
                    )}

                </div>

                <span
                    className={cn(labelVariants({ size }))}
                    aria-hidden="true"
                >
                    {label}
                </span>
            </div>
        );
    }
);

StatCount.displayName = "StatCount";

export { StatCount, statCountVariants };
