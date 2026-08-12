"use client";

/**
 * EditContext
 * -----------
 * Fournit aux composants enfants (UEBlock, SortableCourseRow)
 * les handlers d'édition de la Direction sans prop-drilling.
 *
 * Utilisé uniquement dans DirectionProgramPage.
 * ProgramPage (lecture seule) ne wrap PAS ce contexte → les actions restent null.
 */

import React, { createContext, useContext } from 'react';
import type { ProgramUECourses, UeCourseDTO } from '@/services/ue/types';

export type EditHandlers = {
  /** Délier une UE du programme */
  onDetachUE: (ue: ProgramUECourses) => void;
  /** Supprimer un cours d'une UE */
  onDeleteCourse: (ue: ProgramUECourses, course: UeCourseDTO) => void;
  /** Ajouter un cours à une UE */
  onAddCourse: (ue: ProgramUECourses) => void;
};

const EditContext = createContext<EditHandlers | null>(null);

export function EditProvider({
  children,
  handlers,
}: {
  children: React.ReactNode;
  handlers: EditHandlers;
}) {
  return <EditContext.Provider value={handlers}>{children}</EditContext.Provider>;
}

/** Retourne les handlers si on est dans un contexte éditable, null sinon. */
export function useEditHandlers(): EditHandlers | null {
  return useContext(EditContext);
}