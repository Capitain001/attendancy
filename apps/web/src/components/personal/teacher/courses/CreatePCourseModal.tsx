// src/components/personal/teacher/courses/CreatePCourseModal.tsx
import { createPersonalCourseFormAction } from "@/features/personal/services/course";
import { Plus, X } from "lucide-react";

export const CREATE_COURSE_MODAL_ID = "create-course";
const MODAL_ID = CREATE_COURSE_MODAL_ID;

// Plein écran : le popover natif est déjà fixed + inset-0, on lui donne
// toute la taille du viewport. Pas de `display` ici : il rendrait le
// popover toujours visible. Le centrage se fait dans le formulaire.
const modal =
  "m-0 h-dvh w-dvw max-h-none max-w-none overflow-y-auto border-0 bg-background p-0 text-foreground";

const cancelButton =
  "h-10 cursor-pointer rounded-md px-4 text-sm font-medium text-foreground/50 transition-colors hover:text-foreground/80";

interface CreatePCourseModalProps {
  classId: string;
  // Mécanique interne (classe thématique) : jamais exposée à l'utilisateur.
  withGroup?: boolean;
}

export function CreatePCourseModal({ classId, withGroup = false }: CreatePCourseModalProps) {
  return (
    <>
      <button
        type="button"
        popoverTarget={MODAL_ID}
        className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Plus aria-hidden="true" className="size-4" />
        Nouveau cours
      </button>

      <div id={MODAL_ID} popover="" className={modal}>
        <button
          type="button"
          popoverTarget={MODAL_ID}
          popoverTargetAction="hide"
          aria-label="Fermer"
          className="absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-md text-foreground/40 transition-colors hover:bg-foreground/5 hover:text-foreground/70"
        >
          <X aria-hidden="true" className="size-5" />
        </button>

        <form
          action={createPersonalCourseFormAction}
          className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-6 px-5 py-16"
        >
          <input type="hidden" name="classId" value={classId} />
          {withGroup && <input type="hidden" name="withGroup" value="true" />}

          <h2 className="text-2xl font-bold tracking-tight">Nouveau cours</h2>

          <label className="grid gap-1.5 text-xs font-medium text-foreground/60">
            Nom du cours
            <input
              name="name"
              required
              maxLength={100}
              autoFocus
              placeholder="Ex. Mathématiques"
              className="h-11 w-full rounded-md border border-foreground/10 bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/30 focus:border-primary/50"
            />
          </label>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              popoverTarget={MODAL_ID}
              popoverTargetAction="hide"
              className={cancelButton}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="h-10 cursor-pointer rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </>
  );
}