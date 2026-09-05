import { cn } from "@/lib/utils";

// Pill de statut douce (inspirée des badges de rôle Clerk) — partagée entre
// EnrollmentSearchPanel (statuts de recherche) et EnrolledStudentsList
// (badges de groupe).
export function Pill({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "accent" | "ok";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-[11px] font-medium",
        tone === "muted" && "border-border bg-muted/50 text-muted-foreground",
        tone === "accent" && "border-primary/30 bg-primary/10 text-primary",
        tone === "ok" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
      )}
    >
      {children}
    </span>
  );
}
