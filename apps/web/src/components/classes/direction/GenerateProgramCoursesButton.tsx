// src/components/course/GenerateCoursesFromProgramButton.tsx
//
// Bouton qui déclenche generateCoursesFromProgramAction pour une (programId,
// classId) donnée. Les ids sont résolus par la PAGE parente (SERVICE_CONTEXT
// §4) — ce composant ne résout rien lui-même, il consomme.
//
// Idempotent côté serveur : rappelable sans risque (skip des cours déjà
// générés) — donc pas besoin de désactiver le bouton après un premier succès,
// seulement pendant l'appel en cours.

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { button } from "@/styles";
import { generateCoursesFromProgramAction } from "@/services/course";

interface GenerateProgramCoursesButtonProps {
  programId: string;
  classId: string;
  /** ProgramUE.semester → Term.id de la classe cible (optionnel — omis si les
   * Terms de la classe n'existent pas encore / ne doivent pas être liés). */
  termsBySemester?: Record<number, string>;
  /** Appelé après un succès (même si created.length === 0) — laisse la page
   * parente réagir (fermer un dialog, rafraîchir une liste locale…). */
  onSuccess?: (result: { created: unknown[]; skippedCount: number }) => void;
  className?: string;
}

export function GenerateProgramCoursesButton({
  programId,
  classId,
  termsBySemester,
  onSuccess,
  className,
}: GenerateProgramCoursesButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Distinct de isPending : reste true jusqu'au prochain clic, permet de
  // griser légèrement le libellé sans relancer un spinner sur un état stale.
  const [lastRanAt, setLastRanAt] = useState<number | null>(null);

  function handleClick() {
    startTransition(async () => {
      const result = await generateCoursesFromProgramAction({
        programId,
        classId,
        ...(termsBySemester ? { termsBySemester } : {}),
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      const { created, skippedCount } = result.data;
      setLastRanAt(Date.now());

      if (created.length === 0) {
        toast.info("Aucun nouveau cours à générer — la maquette est déjà appliquée.");
      } else {
        toast.success(
          `${created.length} cours généré${created.length > 1 ? "s" : ""}` +
            (skippedCount > 0 ? ` (${skippedCount} déjà existant${skippedCount > 1 ? "s" : ""})` : ""),
        );
      }

      onSuccess?.(result.data);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={button.primary + (className ? ` ${className}` : "")}
      aria-busy={isPending}
    >
      {isPending ? (
        <>
          <Loader2 className="size-[1em] animate-spin" aria-hidden />
          Génération…
        </>
      ) : lastRanAt ? (
        "Regénérer les cours"
      ) : (
        "Générer les cours de la maquette"
      )}
    </button>
  );
}
