import { cn } from "@/lib/utils";

/**
 * Illustrations inline de l'espace étudiant (P-27) : trait léger, couleurs du thème
 * (`currentColor` + accent primaire), aucune dépendance.
 */

type IllustrationProps = { className?: string };

/** Journée libre — calendrier au soleil. */
export function CalendarRestIllustration({ className }: IllustrationProps) {
  return (
    <div className={cn("relative", className)}>
      <div className="absolute top-4 right-4">
        <div className="relative size-7">
          <div className="absolute inset-0 rounded-full bg-primary/20" />
          <div className="absolute inset-1.5 rounded-full bg-primary/40" />
        </div>
      </div>
      <svg viewBox="0 0 120 120" fill="none" aria-hidden="true" className="h-full w-full text-muted-foreground/60">
        <rect x="22" y="34" width="76" height="64" rx="10" className="fill-card" stroke="currentColor" strokeWidth="2.5" />
        <path d="M22 52h76" stroke="currentColor" strokeWidth="2.5" />
        <path d="M40 28v12M80 28v12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M42 72c4 6 12 10 18 10s14-4 18-10" className="stroke-primary" strokeWidth="3" strokeLinecap="round" />
        <circle cx="46" cy="64" r="2.5" className="fill-primary" />
        <circle cx="74" cy="64" r="2.5" className="fill-primary" />
        <path d="M10 104c10-4 90-4 100 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
      </svg>
    </div>
  );
}

/** Pause — tasse fumante, aucune séance en cours. */
export function SessionPauseIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 160 120" fill="none" aria-hidden="true" className={cn("text-muted-foreground/60", className)}>
      <path d="M58 96h44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M52 56h50v18c0 12-11 20-25 20S52 86 52 74V56Z" className="fill-card" stroke="currentColor" strokeWidth="2.5" />
      <path d="M102 60h8a10 10 0 0 1 0 20h-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M67 30c-3 5 3 7 0 12M81 26c-3 5 3 7 0 12" className="stroke-primary" strokeWidth="3" strokeLinecap="round" />
      <circle cx="36" cy="42" r="3" className="fill-primary/40" />
      <circle cx="124" cy="34" r="4" className="fill-primary/25" />
    </svg>
  );
}

/** Cloche calme — aucune notification. */
export function BellQuietIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 160 120" fill="none" aria-hidden="true" className={cn("text-muted-foreground/60", className)}>
      <path d="M80 26a26 26 0 0 1 26 26v14l8 14H46l8-14V52a26 26 0 0 1 26-26Z" className="fill-card" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M72 90a8 8 0 0 0 16 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M80 26v-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M118 40c4-2 7-5 8-9M42 40c-4-2-7-5-8-9" className="stroke-primary" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      <circle cx="80" cy="58" r="2.5" className="fill-primary" />
      <circle cx="70" cy="64" r="2" className="fill-primary/50" />
    </svg>
  );
}

/** Carnet vierge — pas encore d'historique. */
export function NotebookIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 160 120" fill="none" aria-hidden="true" className={cn("text-muted-foreground/60", className)}>
      <rect x="44" y="24" width="72" height="76" rx="8" className="fill-card" stroke="currentColor" strokeWidth="2.5" />
      <path d="M58 44h44M58 58h44M58 72h28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
      <circle cx="112" cy="88" r="14" className="fill-primary/15" />
      <path d="M106 88l4 4 8-8" className="stroke-primary" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Sac à dos — pas de cours / classe vide. */
export function BackpackIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 160 120" fill="none" aria-hidden="true" className={cn("text-muted-foreground/60", className)}>
      <path d="M56 50a24 24 0 0 1 48 0v46H56V50Z" className="fill-card" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M68 38v-8a12 12 0 0 1 24 0v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="66" y="64" width="28" height="20" rx="5" className="fill-primary/15 stroke-primary" strokeWidth="2.5" />
      <path d="M80 64v8" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="120" cy="40" r="3" className="fill-primary/40" />
      <circle cx="40" cy="60" r="4" className="fill-primary/25" />
    </svg>
  );
}

/** Empty state illustré commun (fade-in léger, P-27). */
export function StudentEmpty({
  illustration,
  title,
  hint,
  className,
  children,
}: {
  illustration: React.ReactNode;
  title: string;
  hint?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-3xl border border-dashed bg-card/50 px-6 py-12 text-center",
        "animate-in fade-in slide-in-from-bottom-2 duration-500",
        className,
      )}
    >
      <div className="w-36">{illustration}</div>
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="max-w-xs text-xs text-muted-foreground">{hint}</p>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
