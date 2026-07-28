"use client";

import { useQueryState, parseAsIsoDate } from "nuqs";

/** Clé d'URL du filtre date planning (source unique, partagée sidebar / page). */
export const PLANNING_DATE_KEY = "date";

/**
 * Date de planning sélectionnée, persistée en URL (`?date=YYYY-MM-DD`).
 * - `date === null` tant que l'utilisateur n'a rien choisi (param absent).
 * - Déselectionner (re-clic) retire le param de l'URL.
 * Le consommateur retombe sur `today` localement si besoin.
 */
export function usePlanningDateFilter() {
  return useQueryState(
    PLANNING_DATE_KEY,
    parseAsIsoDate.withOptions({ shallow: false }),
  );
}