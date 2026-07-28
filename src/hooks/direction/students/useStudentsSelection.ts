// src/hooks/direction/students/useStudentsSelection.ts
"use client";

import { useMemo, useState } from "react";

import type { StudentRow } from "@/components/direction/students/ui/studentDirectory.helpers";

/**
 * État de sélection de l'annuaire étudiant (vue direction).
 * Préoccupation unique : quelles lignes sont sélectionnées et le mode actif.
 * Le filtrage/tri/pagination est géré par `StudentsTable` ; la sélection
 * raisonne donc sur l'effectif complet `students`.
 */
export function useStudentsSelection({ students }: { students: StudentRow[] }) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const selectedRows = useMemo(
    () => students.filter((s) => selected.has(s.id)),
    [students, selected],
  );

  const allSelected =
    students.length > 0 && students.every((s) => selected.has(s.id));

  function toggle(studentId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(students.map((s) => s.id)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function enterSelectionMode() {
    setSelectionMode(true);
  }

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelected(new Set());
  }

  return {
    selectionMode,
    selected,
    selectedRows,
    allSelected,
    toggle,
    selectAll,
    clearSelection,
    enterSelectionMode,
    exitSelectionMode,
  };
}
