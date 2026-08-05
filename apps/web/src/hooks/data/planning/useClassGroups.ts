"use client";

import { useQueries } from "@tanstack/react-query";

import { getClassGroupsAction } from "@/services/class";

export interface GroupOption {
  id: string;
  name: string;
  classId: string;
}

/**
 * Groupes des classes sélectionnées (une query par classe), aplaties.
 * `enabled` seulement quand au moins une classe est sélectionnée.
 */
export function useClassGroups(classIds: string[]) {
  const results = useQueries({
    queries: classIds.map((classId) => ({
      queryKey: ["class", "groups", classId] as const,
      queryFn: async (): Promise<GroupOption[]> => {
        const res = await getClassGroupsAction({ classId });
        if ("error" in res || !res.data) return [];
        return res.data.groups.map((g) => ({
          id: g.id,
          name: g.name,
          classId,
        }));
      },
      staleTime: 5 * 60_000,
    })),
  });

  return {
    groups: results.flatMap((r) => r.data ?? []),
    isLoading: results.some((r) => r.isLoading),
  };
}
