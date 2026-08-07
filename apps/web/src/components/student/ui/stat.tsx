import { cn } from "@/lib/utils";

/**
 * Carte de statistique de l'espace étudiant.
 * Chiffre + label en serif (registre « contenu »), surface douce.
 * Factuel, jamais anxiogène (P-25) : l'accent porte une couleur de sens via `accent`.
 */
export function StudentStat({
  value,
  label,
  accent = "text-foreground",
  className,
}: {
  value: string | number;
  label: string;
  /** Classe couleur du chiffre (ex. `text-emerald-600`, `text-blue-600`). */
  accent?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/20 bg-muted/50 p-4 text-center",
        className,
      )}
    >
      <p className={cn("font-serif text-3xl font-normal tabular-nums", accent)}>
        {value}
      </p>
      <p className="mt-1 font-serif text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/** Grille de lecture rapide — 3 stats côte à côte (mobile-first). */
export function StudentStatGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-3 gap-3", className)}>{children}</div>
  );
}
