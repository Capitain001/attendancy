import { cn } from "@/lib/utils";
import type { UISessionStatus } from "@/hooks/data/sessions/use-session-state";

const STATUS_CONFIG: Record<
  UISessionStatus,
  { label: string; dot: string; ring: string; text: string; bg: string }
> = {
  upcoming: {
    label: "À venir",
    dot: "bg-muted-foreground",
    ring: "ring-muted-foreground/30",
    text: "text-muted-foreground",
    bg: "bg-muted/50",
  },
  "can-check-in": {
    label: "Démarrage possible",
    dot: "bg-amber-500",
    ring: "ring-amber-500/30",
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
  },
  ongoing: {
    label: "Session démarrée",
    dot: "bg-primary animate-pulse",
    ring: "ring-primary/30",
    text: "text-primary",
    bg: "bg-primary/10",
  },
  "can-check-out": {
    label: "Clôture possible",
    dot: "bg-violet-500",
    ring: "ring-violet-500/30",
    text: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
  },
  done: {
    label: "Terminée",
    dot: "bg-emerald-500",
    ring: "ring-emerald-500/30",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  missed: {
    label: "Manqué",
    dot: "bg-red-500",
    ring: "ring-red-500/30",
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
  },
  canceled: {
    label: "Annulée",
    dot: "bg-zinc-400 dark:bg-zinc-600",
    ring: "ring-zinc-400/30 dark:ring-zinc-600/30",
    text: "text-zinc-600 dark:text-zinc-400",
    bg: "bg-zinc-500/10",
  },
};

interface SessionStatusBadgeProps {
  status: UISessionStatus;
  className?: string;
}

export function SessionStatusBadge({ status, className }: SessionStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
        config.bg,
        config.text,
        config.ring,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
