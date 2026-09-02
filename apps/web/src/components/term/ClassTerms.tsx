"use client";

import { useState } from "react";
import { useTerms } from "@/hooks/data/term/useTerms";
import { TermsChips } from "@/components/term/TermsChips";
import { TermEditDialog } from "@/components/term/TermEditDialog";

import type { GetTermsDto } from "@/services/term";
import { TermCreateButton } from "../direction/academic/TermForm";

type Term = GetTermsDto[number];

export interface ClassTermsProps {
  /** ID de la classe dont on affiche/gère les semestres. */
  classId: string;
}

/**
 * Gère l'affichage des semestres (`Term`) d'une classe et toutes leurs interactions CRUD :
 * - Liste sous forme de chips (`TermsChips`), avec édition au clic.
 * - Modal d'édition (`TermEditDialog`) qui contient aussi la suppression.
 * - Bouton "+" (`TermCreateButton`) pour créer un nouveau semestre, préempli
 *   avec le prochain numéro d'ordre disponible.
 */
export function ClassTerms({ classId }: ClassTermsProps) {
  const { data, loading, error } = useTerms({ classId });

  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  function handleEdit(term: Term) {
    setEditingTerm(term);
    setEditModalOpen(true);
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Chargement des semestres…</div>;
  }

  if (error) {
    return <div className="text-sm text-destructive">Erreur : {error.message}</div>;
  }

  const terms = data.items;

  return (
    <div className="flex items-start gap-2">
      <div className="flex flex-1 items-center justify-between">
          <TermsChips terms={terms} onEdit={handleEdit} />
          <TermCreateButton classId={classId} defaultOrder={terms.length + 1} />
      </div>

      <TermEditDialog
        term={editingTerm}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
      />
    </div>
  );
}