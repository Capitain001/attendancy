"use client";
import { useMemo, useRef } from "react";

/**
 * Stabilise une valeur dérivée en conservant la même référence objet
 * tant que la valeur produite est considérée comme "égale" à la précédente.
 *
 * Utile pour éviter des re-renders inutiles lorsqu'une factory recrée un
 * objet (ex. `new Date(...)`) à chaque render, même si la valeur sous-jacente
 * n'a pas changé.
 *
 * @param factory   Fonction pure qui produit la valeur dérivée.
 * @param deps      Dépendances de `factory` (même sémantique que `useMemo`).
 * @param isEqual   Comparateur d'égalité entre l'ancienne et la nouvelle valeur.
 *                  Par défaut : égalité référentielle (`===`).
 *
 * @returns La valeur dérivée, avec référence stable tant qu'`isEqual` retourne `true`.
 *
 * @example
 * // Stabilise un objet Date dérivé d'une string ISO
 * const endAt = useReference(
 *   () => new Date(schedule.endTime),
 *   [schedule.endTime],
 *   (a, b) => a.getTime() === b.getTime(),
 * );
 *
 * @example
 * // Stabilise un objet quelconque par clé sérialisée
 * const config = useReference(
 *   () => buildConfig(rawConfig),
 *   [rawConfig],
 *   (a, b) => JSON.stringify(a) === JSON.stringify(b),
 * );
 */
export function useReference<T>(
  factory: () => T,
  deps: React.DependencyList,
  isEqual: (previous: T, next: T) => boolean = (a, b) => a === b,
): T {
  // Calcule la nouvelle valeur candidate à chaque changement de deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const next = useMemo(factory, deps);

  const stableRef = useRef<T>(next);

  if (!isEqual(stableRef.current, next)) {
    stableRef.current = next;
  }

  return stableRef.current;
}
