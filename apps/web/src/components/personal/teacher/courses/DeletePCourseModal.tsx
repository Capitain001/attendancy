// src/components/personal/teacher/courses/DeletePCourseModal.tsx
import { X } from "lucide-react";

// Un seul modal de suppression par page : id fixe.
const MODAL_ID = "delete-course";

// Plein écran : le popover natif est déjà fixed + inset-0, on lui donne
// toute la taille du viewport. Pas de `display` ici : il rendrait le
// popover toujours visible.
const modal =
  "m-0 h-dvh w-dvw max-h-none max-w-none overflow-y-auto border-0 bg-background p-0 text-foreground";

const cancelButton =
  "h-10 cursor-pointer rounded-sm px-4 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground";

const dangerButton =
  "h-10 cursor-pointer rounded-sm bg-destructive px-5 text-sm font-medium text-white transition-colors hover:bg-destructive/90";

interface DeletePCourseModalProps {
  courseName: string;
  // Server action fournie par la page : elle connaît le cours et la redirection.
  action: () => Promise<void>;
}

// Déclencheur + popover de confirmation. Aucun JS client : popoverTarget natif.
export function DeletePCourseModal({ courseName, action }: DeletePCourseModalProps) {
  return (
    <>
      <button
        type="button"
        popoverTarget={MODAL_ID}
        className="inline-flex h-9 cursor-pointer items-center justify-center rounded-sm border border-destructive/40 px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
      >
        Supprimer
      </button>

      <div id={MODAL_ID} popover="" className={modal}>
        <button
          type="button"
          popoverTarget={MODAL_ID}
          popoverTargetAction="hide"
          aria-label="Fermer"
          className="absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-sm text-foreground/75 transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          <X aria-hidden="true" className="size-5" />
        </button>

        {/* Aucun champ : le courseId est déjà connu de l'action (params de la page) */}
        <form
          action={action}
          className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-6 px-5 py-16"
        >
          <div className="grid gap-2">
            <h2 className="text-2xl font-bold tracking-tight">Supprimer ce cours ?</h2>
            <p className="text-sm text-foreground/75">
              Le cours <span className="font-medium text-foreground">{courseName}</span> sera
              retiré de la classe, avec ses séances.
            </p>
          </div>

          {/* Annuler à gauche (secondaire), action destructive à droite */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              popoverTarget={MODAL_ID}
              popoverTargetAction="hide"
              className={cancelButton}
            >
              Annuler
            </button>
            <button type="submit" className={dangerButton}>
              Supprimer
            </button>
          </div>
        </form>
      </div>
    </>
  );
}