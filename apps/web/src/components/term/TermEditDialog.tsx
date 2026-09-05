"use client";

import { useEffect, useRef, useState } from "react";
import { useTerms } from "@/hooks/data/term/useTerms";
import { input } from "@/styles/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { GetTermsDto } from "@/services/term";

type Term = GetTermsDto[number];

export interface TermEditDialogProps {
  /** Semestre en cours d'édition. `null` = rien à afficher. */
  term: Term | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Formate une date en valeur "YYYY-MM-DD" exploitable par un <input type="date">. */
function toDateInputValue(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/**
 * Modal d'édition d'un semestre (`Term`).
 * Contient le formulaire de modification ET l'option de suppression
 * (avec confirmation en 2 clics, pas de composant AlertDialog séparé requis).
 */
export function TermEditDialog({ term, open, onOpenChange }: TermEditDialogProps) {
  // Le hook exige classId — on le dérive du term édité, et on désactive le fetch
  // tant qu'il n'y a rien à éditer (term === null).
  const { update, delete: deleteTerm, isUpdating, isDeleting } = useTerms({
    classId: term?.classId ?? "",
    enabled: !!term?.classId,
  });
  const ref = useRef<HTMLFormElement>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Réinitialise la confirmation de suppression à chaque ouverture / changement de semestre.
  useEffect(() => {
    if (open) setConfirmingDelete(false);
  }, [open, term?.id]);

  if (!term) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!update || !term) return;
    const fd = new FormData(e.currentTarget);
    const name = fd.get("name") as string;
    const orderStr = fd.get("order") as string;
    const startDateRaw = fd.get("startDate") as string;
    const endDateRaw = fd.get("endDate") as string;
    const order = Number.parseInt(orderStr, 10);

    await update({
      id: term.id,
      data: {
        name,
        order: Number.isNaN(order) ? term.order : order,
        startDate: startDateRaw ? new Date(startDateRaw) : undefined,
        endDate: endDateRaw ? new Date(endDateRaw) : undefined,
      },
    });

    onOpenChange(false);
  }

  async function handleDelete() {
    if (!deleteTerm || !term) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    await deleteTerm(term.id);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier le semestre</DialogTitle>
        </DialogHeader>

        <form ref={ref} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-term-name" className={input.label}>
              Nom du semestre *
            </label>
            <input
              id="edit-term-name"
              name="name"
              type="text"
              required
              autoFocus
              defaultValue={term.name}
              className={input.base}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-term-order" className={input.label}>
              Numéro d&apos;ordre *
            </label>
            <input
              id="edit-term-order"
              name="order"
              type="number"
              min={1}
              required
              defaultValue={term.order}
              className={input.base}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-term-start" className={input.label}>
                Date de début
              </label>
              <input
                id="edit-term-start"
                name="startDate"
                type="date"
                defaultValue={toDateInputValue(term.startDate)}
                className={input.base}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-term-end" className={input.label}>
                Date de fin
              </label>
              <input
                id="edit-term-end"
                name="endDate"
                type="date"
                defaultValue={toDateInputValue(term.endDate)}
                className={input.base}
              />
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <Button
              type="button"
              variant={confirmingDelete ? "destructive" : "ghost"}
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="size-3.5" />
              {isDeleting ? "Suppression…" : confirmingDelete ? "Confirmer ?" : "Supprimer"}
            </Button>

            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" size="sm" disabled={isUpdating}>
                {isUpdating ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
