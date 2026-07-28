"use client";

import { useQuery } from "@tanstack/react-query";

import { orgPlanningResourcesQuery } from "@/services/planning/queries";

/**
 * Ressources planning à l'échelle de l'org (classes, enseignants, salles).
 * Chargées une fois, partagées par tous les filtres de la sidebar.
 */
export function useOrgPlanningResources() {
  const q = useQuery(orgPlanningResourcesQuery());
  return {
    classes: q.data?.classes ?? [],
    teachers: q.data?.teachers ?? [],
    rooms: q.data?.rooms ?? [],
    isLoading: q.isLoading,
  };
}
