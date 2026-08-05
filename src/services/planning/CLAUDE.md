# Service `planning`

## Rôle

Fournit les **ressources** (données statiques d'une classe ou d'une org) nécessaires
au rendu du planning. Pas de mutations : les séances sont gérées par `services/schedule`.

---

## Fichiers

| Fichier | Rôle |
|---|---|
| `database.ts` | `getPlanningResources`, `getOrgPlanningResources` — `'use cache'` |
| `actions.ts` | `getPlanningResourcesAction`, `getOrgPlanningResourcesAction` — `'use server'` |
| `types.ts` | `PlanningResources`, `OrgPlanningResources` — inférés via `Awaited<ReturnType<...>>` |
| `policy.ts` | `isSlotElapsed`, `PAST_SLOT_ERROR` — règles métier pures (partagées client+serveur) |
| `utils.ts` | `mapScheduleToEvent`, `statusToColor`, `getPlanningRange`, `ScheduleRow` |
| `queries.ts` | `planningSchedulesQuery`, `scheduleDaysQuery`, `orgPlanningResourcesQuery` |
| `index.ts` | Barrel public |

---

## Fonctions DB

### `getPlanningResources(classId, orgId)` → `PlanningResources`

Ressources d'une **classe** : classe + cours + enseignants + groupes + salles de l'org.

```ts
// Retourne null si classId introuvable.
export type PlanningResources = {
  class:   { id: string; name: string }
  rooms:   { id: string; name: string }[]
  groups:  { id: string; name: string }[]
  courses: {
    id: string; name: string
    teachers: {
      id: string; name: string; email: string; avatar_url: string | null; isMain: boolean
    }[]
  }[]
} | null
```

Cache : `cacheTag(CACHE.CLASS(orgId))` + `cacheTag(CACHE.ROOM(orgId))` · `cacheLife('hours')`

### `getOrgPlanningResources(orgId)` → `OrgPlanningResources`

Ressources **org-level** : toutes les classes + tous les profs + salles.
Utilisé pour la vue planning globale Direction.

```ts
type OrgPlanningResources = {
  classes:  { id: string; name: string }[]
  teachers: { id: string; name: string; avatar_url: string | null }[]
  rooms:    { id: string; name: string }[]
}
```

Cache : `cacheTag(CACHE.TEACHER(orgId))` + `cacheTag(CACHE.ROOM(orgId))` + `cacheTag(CACHE.CLASS(orgId))` · `cacheLife('hours')`

---

## Actions

### `getPlanningResourcesAction(classId)` → `{ data: NonNullable<PlanningResources> } | { error: string }`

Rôles requis : `ADMIN`, `TEACHER`, `DIRECTION`.

```ts
// Usage page RSC :
const optRes = await getPlanningResourcesAction(classId)
if ("error" in optRes || !optRes.data) return <div>{...}</div>
// optRes.data est NonNullable<PlanningResources> ici
```

### `getOrgPlanningResourcesAction()` → `{ data: OrgPlanningResources } | { error: string }`

Rôles requis : `ADMIN`, `DIRECTION`.

---

## `policy.ts` — règles métier pures

```ts
// Vrai si la fin du créneau est <= maintenant (séance entièrement passée).
// Accepte Date | string pour les deux champs (sérialisation RSC).
isSlotElapsed(slot: { start: Date | string; end?: Date | string | null }): boolean

// Message utilisateur partagé (actions serveur + UI).
PAST_SLOT_ERROR: string  // "On ne planifie pas de séance sur une date passée."
```

Utilisé dans :
- `ClassPlanning` (confirmMove drag) → refuse le déplacement sur slot passé
- `CoursePlanningDialog` (blockedCreation) → bloque l'ouverture sur slot passé
- Actions serveur `createScheduleAction` / `updateScheduleAction`

---

## `utils.ts` — mapping schedule→event

```ts
// ScheduleRow = select Prisma Schedule avec course, room, teacher, group, classId
mapScheduleToEvent(schedule: ScheduleRow): ScheduleEvent

// Couleur selon statut (partagée UI)
statusToColor(status: ScheduleStatus): EventColor
// PENDING → "sky" | COMPLETED → "gray" | CANCELED → "red" | MISSED → "rose"

// Plage par défaut pour charger les séances (1 mois avant/après)
getPlanningRange(now?: Date): { rangeStart: Date; rangeEnd: Date }
```

---

## Invariants

- `PlanningResources` est **nullable** (null si classId inconnu) — vérifier avant usage.
- Les composants (`ClassPlanning`, `CoursePlanningDialog`) reçoivent `NonNullable<PlanningResources>`.
- `orgId` extrait du token serveur dans les actions — jamais de l'input.
- Invalidation : cache invalidé via `CACHE.CLASS(orgId)` + `CACHE.ROOM(orgId)` quand une classe ou salle change.
