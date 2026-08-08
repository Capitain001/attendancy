import { cn } from "@/lib/utils";

interface AttendanceSectionProps {
  label: string;
  count: number;
  variant: "pending" | "confirmed";
  defaultOpen?: boolean;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function AttendanceSection({
  label,
  count,
  variant,
  defaultOpen = true,
  children,
  action,
}: AttendanceSectionProps) {
  return (
    <details open={defaultOpen} className="group">
      <summary
        className={cn(
          "list-none [&::-webkit-details-marker]:hidden",
          "flex items-center justify-between px-3.5 py-1.5 cursor-pointer select-none",
          "hover:bg-muted/40 transition-colors"
        )}
      >
        <div className="flex items-center gap-2">
          {variant === "pending" && (
            <span className="size-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
          )}
          <span
            className={cn(
              "text-[10px] font-medium uppercase tracking-widest",
              variant === "pending"
                ? "text-amber-700 dark:text-amber-400"
                : "text-muted-foreground"
            )}
          >
            {label}
          </span>
          <span
            className={cn(
              "inline-flex items-center justify-center rounded-full px-1.5 py-px text-[9px] font-medium tabular-nums",
              variant === "pending"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                : "bg-muted text-muted-foreground"
            )}
          >
            {count}
          </span>
          <svg
            className="size-3 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2 4l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {action && (
          <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5">
            {action}
          </div>
        )}
      </summary>

      <div className="overflow-hidden">{children}</div>
    </details>
  );
}
