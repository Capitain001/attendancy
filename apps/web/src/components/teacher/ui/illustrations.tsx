// Illustrations & état vide de l'espace enseignant.
//
// Le registre teacher = 70 % direction + accent serif + illustrations sur les
// vides (cf. skill teacher-page-style §6). On réutilise les SVG neutres de
// l'espace étudiant (zéro duplication) et on expose un wrapper `TeacherEmpty`
// au titre serif (la touche de chaleur), surface héritée direction.

import { cn } from "@/lib/utils";

// Illustrations partagées (mêmes SVG inline, neutres) — réexport pour les
// contextes enseignant. À spécialiser plus tard si un visuel dédié émerge.
export {
  CalendarRestIllustration,
  SessionPauseIllustration,
  BellQuietIllustration,
  NotebookIllustration,
  BackpackIllustration,
} from "@/components/student/ui/illustrations";

export function TeacherEmpty({
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
        "flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed bg-card/50 px-6 py-12 text-center",
        "animate-in fade-in slide-in-from-bottom-2 duration-500",
        className,
      )}
    >
      <div className="w-32">{illustration}</div>
      {/* Titre serif = accent de chaleur (signature teacher). */}
      <p className="font-serif text-lg leading-snug">{title}</p>
      {hint && <p className="max-w-xs text-xs text-muted-foreground">{hint}</p>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
