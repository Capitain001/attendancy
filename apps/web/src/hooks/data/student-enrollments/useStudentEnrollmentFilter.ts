// src/hooks/data/student-enrollments/useStudentEnrollmentFilter.ts
// useStudentEnrollmentFilter.ts
"use client";

import { useMemo, useState } from "react";
import type { StudentEnrollmentsItem } from "@/services/student-enrollment";

/** Filtre texte (prénom, nom, email) sur une liste d'inscriptions. */
export function useStudentEnrollmentFilter(enrollments: readonly StudentEnrollmentsItem[]) {
  const [query, setQuery] = useState("");

  const filteredEnrollments = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return enrollments;
    return enrollments.filter(({ student: { user: u } }) =>
      [u.firstName, u.lastName, u.email].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [enrollments, query]);

  return { query, setQuery, filteredEnrollments };
}