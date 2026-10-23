import Link from "next/link";
import { Archive, ChevronDown, Pencil } from "lucide-react";
import { updateClassFormAction, removeClassFormAction } from "@/services/class/form";

type PersonalClassCardProps = {
  class_: {
    id: string;
    name: string;
    _count: { courses: number; studentEnrollments: number };
  };
  href: string;
};

const optionButton =
  "flex w-full items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-foreground/50 transition-colors hover:bg-foreground/[0.04] hover:text-foreground/80";

// Pas de `display` ici : il rendrait le popover toujours visible.
const modal =
  "m-auto w-[min(90vw,24rem)] rounded-md border border-foreground/10 bg-background p-0 text-foreground backdrop:bg-foreground/30";

const cancelButton =
  "h-9 rounded-md px-3 text-xs font-medium text-foreground/50 hover:text-foreground/80";

export function PersonalClassCard({ class_, href }: PersonalClassCardProps) {
  const renameId = `rename-${class_.id}`;
  const archiveId = `archive-${class_.id}`;
  const students = class_._count.studentEnrollments;

  return (
    <article className="overflow-hidden rounded-md border border-foreground/10 bg-foreground/[0.02] transition-colors hover:border-foreground/20">
      {/* Zone principale : nom centré */}
      <Link href={href} className="flex min-h-40 flex-col items-center justify-center gap-2 px-5 py-6 text-center">
        <h2 className="line-clamp-2 text-lg font-semibold tracking-tight text-foreground/85">{class_.name}</h2>
        <p className="text-xs text-foreground/30">
          {class_._count.courses} cours · {students} étudiant{students === 1 ? "" : "s"}
        </p>
      </Link>

      {/* Zone options : dépliable pour éviter les clics involontaires */}
      <details className="group border-t border-foreground/10">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-2.5 text-xs text-foreground/40 transition-colors hover:text-foreground/70 [&::-webkit-details-marker]:hidden">
          <span className="font-medium">Options</span>
          <ChevronDown aria-hidden="true" className="size-3.5 transition-transform group-open:rotate-180" />
        </summary>
        <div className="grid grid-cols-2 divide-x divide-foreground/10 border-t border-foreground/10">
          <button type="button" popoverTarget={renameId} className={optionButton}>
            <Pencil aria-hidden="true" className="size-3.5" />
            Renommer
          </button>
          <button type="button" popoverTarget={archiveId} className={`${optionButton} hover:!text-destructive`}>
            <Archive aria-hidden="true" className="size-3.5" />
            Archiver
          </button>
        </div>
      </details>

      {/* Modal : renommer (le champ n'apparaît qu'après le clic) */}
      <div id={renameId} popover="" className={modal}>
        <form action={updateClassFormAction} className="grid gap-4 p-5">
          <input type="hidden" name="classId" value={class_.id} />
          <label className="grid gap-1.5 text-xs font-medium text-foreground/60">
            Nouveau nom
            <input
              name="data.name"
              defaultValue={class_.name}
              required
              maxLength={100}
              className="h-10 w-full rounded-md border border-foreground/10 bg-background px-3 text-sm text-foreground outline-none focus:border-primary/50"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" popoverTarget={renameId} popoverTargetAction="hide" className={cancelButton}>
              Annuler
            </button>
            <button type="submit" className="h-9 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary/90">
              Enregistrer
            </button>
          </div>
        </form>
      </div>

      {/* Modal : confirmation d'archivage */}
      <div id={archiveId} popover="" className={modal}>
        <form action={removeClassFormAction} className="grid gap-4 p-5">
          <input type="hidden" name="classId" value={class_.id} />
          <div className="grid gap-1">
            <p className="text-sm font-semibold text-foreground/85">Archiver « {class_.name} » ?</p>
            <p className="text-xs text-foreground/50">La classe sera retirée de votre liste.</p>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" popoverTarget={archiveId} popoverTargetAction="hide" className={cancelButton}>
              Annuler
            </button>
            <button type="submit" className="h-9 rounded-md bg-destructive px-4 text-xs font-medium text-destructive-foreground hover:bg-destructive/90">
              Archiver
            </button>
          </div>
        </form>
      </div>
    </article>
  );
}