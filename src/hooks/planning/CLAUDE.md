<!-- src/hooks/planning/ -->
# Hooks Planning — Contexte

## Rôle
Hooks React Query côté client pour interroger l'état

 du planning en temps réel — disponibilité, conflits, lectures dérivées. Pont entre composants UI et server actions du domaine planning.

## Hooks
### `useAvailability(params)`
[useAvailability.ts](useAvailability.ts)

Vérifie la disponibilité de ressources (rooms, teachers, classes, groups) sur un intervalle.

```ts
useAvailability({
  start?: Date | null,
  end?:   Date | null,
  rooms?:    { id: string }[],
  teachers?: { id: string }[],
  classes?:  { id: string }[],
  groups?:   { id: string }[],
  excludeScheduleId?: string,
  enabled?: boolean,
})
```

Retour : `AvailabilityResult { rooms, teachers, classes, groups }` — chaque entrée = `{ id, available }`.

Comportement :
- **Debounce 300ms** sur les inputs (évite rafale lors d'édition formulaire).
- **Désactivé automatiquement** si `start`/`end` invalides.
- Appel : [`checkAvailabilityAction`](/src/services/planning/conflict/actions.ts).

Clé cache : `availabilityKeys.check(params)` → `["availability", "check", params]`.

## Contraintes
- Hook **client only** (`"use client"`).
- Toujours fournir `start` ET `end` valides avant d'activer.
- Pour exclure le schedule en cours d'édition, passer `excludeScheduleId`.
- Conflits côté serveur = source de vérité ; ces hooks ne doivent pas dupliquer la logique de conflit, juste consommer.

## À venir
Hooks supplémentaires (planning du jour, prochaine session, etc.) s'ajouteront ici. Garder ce dossier purement client + React Query — la logique métier reste dans `src/services/planning/`.
