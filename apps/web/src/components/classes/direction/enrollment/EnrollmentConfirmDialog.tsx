"use client";

import { RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SelectedStudent } from "./useEnrollmentWorkspace";
import { StudentAvatar } from "./StudentAvatar";

interface EnrollmentConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: SelectedStudent[];
  className: string;
  isPending: boolean;
  onConfirm: () => void;
}

export function EnrollmentConfirmDialog({
  open,
  onOpenChange,
  selected,
  className,
  isPending,
  onConfirm,
}: EnrollmentConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmer l'inscription</DialogTitle>
          <DialogDescription>
            {selected.length} étudiant{selected.length > 1 ? "s" : ""} seront inscrits dans {className}.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-60 space-y-1.5 overflow-y-auto">
          {selected.map((student) => (
            <div key={student.id} className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2">
              <StudentAvatar name={student.label} src={student.avatarUrl} size={32} />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-foreground">{student.label}</p>
                <p className="truncate text-xs text-muted-foreground">{student.email}</p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="rounded-lg border border-border px-4 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending && <RefreshCw className="size-4 animate-spin" />}
            Confirmer
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
