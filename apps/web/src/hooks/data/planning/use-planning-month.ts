"use client";

import { useQueryState, parseAsString } from "nuqs";
import { format } from "date-fns/format";
import { startOfMonth } from "date-fns/startOfMonth";

/** Clé d'URL du mois planning (source unique, partagée entre vues). */
export const PLANNING_MONTH_KEY = "month";

/**
 * Mois affiché par un calendrier planning, persisté en URL (`?month=yyyy-MM`).
 * - Param absent ou invalide => mois courant.
 * - `setMonth(null)` retire le paramètre de l'URL.
 * La navigation de mois met à jour l'URL : le rendu serveur précharge le mois
 * choisi, et les hooks de données chargent le mois + ses mois adjacents.
 */
export function usePlanningMonth() {
  const [value, setValue] = useQueryState(PLANNING_MONTH_KEY, parseAsString);

  const parsed = value ? new Date(`${value}-01T00:00:00`) : null;
  const month =
    parsed && !Number.isNaN(parsed.getTime()) ? parsed : startOfMonth(new Date());

  const setMonth = (date: Date | null) =>
    setValue(date ? format(date, "yyyy-MM") : null);

  return [month, setMonth] as const;
}
