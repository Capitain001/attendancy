// src/hooks/data/term/useTerms.ts
"use client";

import { useCrudEntity } from "@/hooks/entity/useCrudEntity";
import { toFetchFn, toCreateFn, toUpdateFn, toDeleteFn } from "@/hooks/entity/actionHelpers";
import {
  getTermsAction,
  createTermAction,
  updateTermAction,
  removeTermAction,
} from "@/services/term/actions";
import type { GetTermsDto } from "@/services/term";
import type { CreateTermInput as ServiceCreateInput, UpdateTermDataInput } from "@/services/term/validation";

// Types pour les inputs du hook
export type CreateTermInput = ServiceCreateInput;
export type UpdateTermInput = UpdateTermDataInput;

export interface UseTermsOptions {
  /** ID de la classe dont on gère les semestres — obligatoire. */
  classId: string;
  staleTime?: number;
  enabled?: boolean;
}

/**
 * Hook CRUD pour les semestres (Terms) d'une classe.
 *
 * @example
 * ```tsx
 * const { data, create, update, delete: deleteTerm, loading } = useTerms({ classId });
 *
 * // Créer un semestre
 * await create({ classId, order: 1, name: "Semestre 1" });
 *
 * // Mettre à jour
 * await update({ id: "term-123", data: { name: "S1 — 2025/2026" } });
 *
 * // Supprimer
 * await deleteTerm("term-123");
 * ```
 */
export function useTerms(options: UseTermsOptions) {
  const { classId, staleTime, enabled } = options;

  const fetchFn = toFetchFn(getTermsAction, classId);
  const create  = toCreateFn(createTermAction);
  // updateTermAction attend { termId, data } — norme V2 nested.
  const update  = toUpdateFn(updateTermAction, "termId");
  // removeTermAction est un hard-delete côté DB (Term n'a pas de deletedAt).
  const deleteTerm = toDeleteFn(removeTermAction);

  return useCrudEntity<GetTermsDto[number], CreateTermInput, UpdateTermInput>({
    entityName: "terms",
    fetchFn,
    staleTime,
    enabled,
    crud: {
      create,
      update,
      delete: deleteTerm,
      messages: {
        create: "Semestre créé avec succès",
        update: "Semestre modifié avec succès",
        delete: "Semestre supprimé avec succès",
        error:  "Une erreur est survenue",
      },
    },
  });
}
