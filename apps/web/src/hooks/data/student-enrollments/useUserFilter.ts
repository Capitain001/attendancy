// src/hooks/data/student-enrollments/useUserFilter.ts
"use client";

import { useMemo, useState } from "react";
import type { UserType } from "@/services/student-enrollment";

type WithUser = { user: Pick<UserType, "firstName" | "lastName" | "email"> };

/** Filtre texte (prénom, nom, email) sur une liste d'éléments `{ user }`. */
export function useUserFilter<T extends WithUser>(items: readonly T[]) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(({ user: u }) =>
      [u.firstName, u.lastName, u.email].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [items, query]);

  return { query, setQuery, filtered };
}