"use client";

import { Mail, Trash2, X } from "lucide-react";
import type { SelectedStudent } from "./useEnrollmentWorkspace";
import { StudentAvatar } from "./StudentAvatar";

interface EnrollmentSelectionCartProps {
  selected: SelectedStudent[];
  onClear: () => void;
  onRemove: (studentId: string) => void;
  onOpenConfirm: () => void;
  classIsActive: boolean;
  isPending: boolean;
}

export function EnrollmentSelectionCart({
  selected,
  onClear,
  onRemove,
  onOpenConfirm,
  classIsActive,
  isPending,
}: EnrollmentSelectionCartProps) {
  return (
    <aside className="h-fit rounded-xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Sélection</p>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {selected.length} étudiant{selected.length > 1 ? "s" : ""}
          </h2>
        </div>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            disabled={isPending}
            title="Vider la sélection"
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
          >
            <Trash2 className="size-4" />
            <span className="sr-only">Vider</span>
          </button>
        )}
      </div>

      <div className="mt-4 space-y-1.5">
        {selected.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center text-xs text-muted-foreground">
            Sélectionnez des étudiants dans les résultats de recherche.
          </p>
        ) : (
          selected.map((student) => (
            <div key={student.id} className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-2.5 py-2">
              <StudentAvatar name={student.label} src={student.avatarUrl} size={32} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-foreground">{student.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{student.email}</span>
              </span>
              <button
                type="button"
                onClick={() => onRemove(student.id)}
                disabled={isPending}
                className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background"
              >
                <X className="size-3.5" />
                <span className="sr-only">Retirer de la sélection</span>
              </button>
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        disabled={!classIsActive || selected.length === 0 || isPending}
        onClick={onOpenConfirm}
        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-[13px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        <Mail className="size-4" />
        Inscrire {selected.length > 0 ? `(${selected.length})` : ""}
      </button>
    </aside>
  );
}
