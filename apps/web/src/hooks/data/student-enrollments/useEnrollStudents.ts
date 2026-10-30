//apps\web\src\hooks\data\student-enrollments\useEnrollStudents.ts
"use client";

import { useMemo, useState } from "react";
import { useAvailableStudents } from "./useAvailableStudents"; // <-- Le nouveau hook importé ici
import { useEnrollStudentsAction } from "./useEnrollStudentsAction";
import { useSelection } from "@/hooks/utils/use-selection";

export function useEnrollStudents(classId: string) {
  // On récupère directement 'available', 'isLoading' et 'error' depuis le nouveau hook dédié
  const { available, isLoading, error } = useAvailableStudents(classId);
  const { enrollStudents, isEnrolling } = useEnrollStudentsAction(classId);
  const selection = useSelection();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available;

    return available.filter(({ user }) =>
      [user.firstName, user.lastName, user.email].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [available, query]);

  /** @returns true si toutes les inscriptions ont réussi. Le composant décide de fermer la modale. */
  const submit = async () => {
    try {
      const results = await enrollStudents(selection.ids);

      // Ne conserver que les échecs pour permettre une nouvelle tentative.
      const failedIds = results.filter((r) => r.status === "failed").map((r) => r.studentId);
      selection.replace(failedIds);

      return failedIds.length === 0;
    } catch {
      return false; // Toast déjà géré par onError.
    }
  };

  return {
    students: filtered,
    query,
    setQuery,
    selection,
    isLoading,
    isEnrolling,
    error,
    submit,
  };
}