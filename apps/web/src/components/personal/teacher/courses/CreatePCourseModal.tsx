import { createPersonalCourseFormAction } from "@/features/personal/services/course";
import { Plus } from "lucide-react";

export const CREATE_COURSE_MODAL_ID = "create-course";
const MODAL_ID = CREATE_COURSE_MODAL_ID;

// Pas de `display` ici : il rendrait le popover toujours visible.
const modal =
  "m-auto w-[min(90vw,24rem)] rounded-md border border-foreground/10 bg-background p-0 text-foreground backdrop:bg-foreground/30";

const cancelButton =
  "h-9 rounded-md px-3 text-xs font-medium text-foreground/50 hover:text-foreground/80";

export function CreatePCourseModal({ classId }: { classId: string }) {
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
        <form action={createPersonalCourseFormAction} className="grid gap-4 p-5">
          <input type="hidden" name="classId" value={classId} />
          <label className="grid gap-1.5 text-xs font-medium text-foreground/60">
            Nom du cours
            <input
              name="name"
              required
              maxLength={100}
              autoFocus
              placeholder="Ex. Mathématiques"
              className="h-10 w-full rounded-md border border-foreground/10 bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/30 focus:border-primary/50"
            />
          </label>
          <div className="flex justify-end gap-2">
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
              className="h-9 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </>
  );
}