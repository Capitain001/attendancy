# Plan : ClassPlanning V1 → V2

**Source** : `docs/tasks/task1.md`
**Status** : Terminé ✅

---

## Contexte rapide

La V1 existe et fonctionne — il s'agit de copier/adapter, pas de réécrire.
Le schéma Prisma est identique entre V1 et V2.

### État V2 (composants planning déjà présents)

`src/components/planning/` contient déjà :
- `utils.ts`, `conflictsToast.ts`
- `filters/` (FilterShell, matchSchedule, constants, index)
- `hook/useActionConfirm.ts`, `hook/usePlanningEvents.ts`
- `ui/ActionScheduleToast.tsx`, `ui/PlanningToolbar.tsx`, `ui/ToolbarButton.tsx`

**Manquent** : `index.ts`, `types.ts`, `ClassPlanning.tsx`, `CoursePlanningDialog.tsx`,
`card/*`, `coursePlanning/*`, `export/PlanningExportWidget.tsx`

---

## Adaptations V1 → V2 (règles transversales)

| V1 | V2 |
|---|---|
| `from '@prisma/client'` | `from '@/generated/prisma/client'` |
| `from '@/services/planning/database'` (PlanningResources) | `from '@/services/planning'` |
| `from '@/services/planning/actions'` | `from '@/services/planning'` |
| `from '@/services/schedule/actions'` | `from '@/services/schedule'` |
| `from '@/components/planning/ClassPlanning'` | `from '@/components/planning'` |
| `import { unstable_cache }` | `'use cache'` + `cacheTag` + `cacheLife` |
| `from '../user'` / `from '../auth/persmission'` | `from '@/modules/user'` / `from '@/modules/auth'` |
| `getClassSchedulesAction({ classId, rangeStart, rangeEnd })` | `getClassSchedulesAction(classId, rangeStart, rangeEnd)` |
| `GetSchedulesDto` | `GetSchedulesReturn` (inféré via `Awaited<ReturnType<...>>`) |

---

## Phase 1 — Service planning (fondation) ✅ (~45min)

**But** : exposer `PlanningResources` (classe-level) côté service — bloque tout le reste.

### Tâches

- [x] T001 `src/services/planning/database.ts` — ajouter `getPlanningResources(classId, orgId)` (copie V1 `fetchPlanningRaw` + `mapPlanningResources`, adapter cache V1 `unstable_cache` → `'use cache'` + `cacheTag(CACHE.CLASS/ROOM)` + `cacheLife('hours')`). Exporter `PlanningResources` = `Awaited<ReturnType<typeof getPlanningResources>>`.

- [x] T002 `src/services/planning/actions.ts` — ajouter `getPlanningResourcesAction(classId: string)` (copie V1, corriger imports : `from '@/modules/user'`, `from '@/modules/auth'`, `getAuthorization(user, ['ADMIN','TEACHER','DIRECTION'])` non-async).

- [x] T003 `src/services/planning/types.ts` — ajouter `export type PlanningResources`.

- [x] T004 `src/services/planning/index.ts` — ajouter exports `getPlanningResources`, `getPlanningResourcesAction`, `PlanningResources`.

**Checkpoint** : ✋ `npx tsc --noEmit 2>&1 | grep planning` = 0 erreur

---

## Phase 2 — Fondation composants ✅ (~30min)

**But** : types partagés + barrel — prérequis de tous les composants planning.

### Tâches

- [ ] T005 [P] `src/components/planning/types.ts` — copier V1 `types.ts` (corriger : `from '@prisma/client'` → `from '@/generated/prisma/client'`, `from "@/services/planning/database"` → `from '@/services/planning'`, `NO_GROUP`/`NO_TEACHER` re-exportés depuis `./coursePlanning/constants`).

- [ ] T006 [P] `src/components/planning/coursePlanning/constants.ts` — copier V1 `coursePlanning/constants.ts` (NO_GROUP, NO_TEACHER, constantes grille horaire).

- [ ] T007 `src/components/planning/coursePlanning/formState.ts` — copier V1, corriger imports.
- [ ] T008 `src/components/planning/coursePlanning/timeRange.ts` — copier V1, corriger imports.
- [ ] T009 `src/components/planning/coursePlanning/resourceMaps.ts` — copier V1, corriger imports.
- [ ] T010 `src/components/planning/coursePlanning/filters.ts` — copier V1, corriger imports.
- [ ] T011 `src/components/planning/coursePlanning/availabilityParams.ts` — copier V1, corriger imports.
- [ ] T012 `src/components/planning/coursePlanning/submit.ts` — copier V1, corriger imports.
- [ ] T013 `src/components/planning/coursePlanning/index.ts` — barrel exportant toutes les fonctions des fichiers ci-dessus.

- [ ] T014 `src/components/planning/index.ts` — barrel minimal (s'enrichira aux phases suivantes) :
  ```ts
  export { ClassPlanning } from './ClassPlanning'
  export { CoursePlanningDialog } from './CoursePlanningDialog'
  export type { CoursePlanningDialogProps } from './CoursePlanningDialog'
  export type { CoursePlanningFormState, CoursePlanningCardUpdatePatch, TimeOption, TimeValue } from './types'
  ```

**Checkpoint** : ✋ `npx tsc --noEmit 2>&1 | grep planning` = 0 erreur sur les types

---

## Phase 3 — Cards UI ✅ (~45min)

**But** : composants visuels `CourseEcard` (édition) et `CoursePcard` (aperçu), utilisés par le dialogue.

### Tâches

- [ ] T015 Lire `card/CoursePcard.tsx` V1 — noter les imports (MiniMonth ? TeacherCombobox ?)
- [ ] T016 [P] `src/components/planning/card/CoursePcard.tsx` — copier V1, corriger imports.
- [ ] T017 [P] `src/components/planning/card/CourseEcard.tsx` — copier V1, corriger imports.
- [ ] T018 Si `MiniMonth` utilisé : `src/components/planning/card/MiniMonth.tsx` — copier V1.
- [ ] T019 Si `TeacherCombobox` utilisé : `src/components/planning/card/TeacherCombobox.tsx` — copier V1.

**Checkpoint** : ✋ 0 erreur TS sur les cards

---

## Phase 4 — CoursePlanningDialog + PlanningExportWidget ✅ (~45min)

**But** : dialogue de création/édition de séance + widget d'export.

### Tâches

- [ ] T020 `src/components/planning/ui/Availabilitychecker.tsx` — copier V1 si référencé dans le dialogue (vérifier V1 `CoursePlanningDialog` — l'import `useAvailability` est un hook, pas ce composant ; skip si non utilisé).

- [ ] T021 `src/components/planning/CoursePlanningDialog.tsx` — copier V1, corriger :
  - `from "@/services/planning/database"` → `from '@/services/planning'`
  - `from "@/components/planning/..."` → chemins relatifs internes
  - Vérifier que `useAvailability` import path est correct dans V2 (`@/hooks/planning/useAvailability` ✅ V2 a ce hook)

- [ ] T022 `src/components/planning/export/PlanningExportWidget.tsx` — copier V1, corriger :
  - `from "@/services/planning/database"` → `from '@/services/planning'`
  - `getSchedulesAction` appel : V2 signature = `getSchedulesAction({ orgId, ...params })` via `ScheduleFilterParams` — adapter en conséquence
  - Vérifier `SCHEDULE_EXPORT_COLUMNS` et `ExportButton` existent en V2

**Checkpoint** : ✋ 0 erreur TS sur le dialogue et le widget

---

## Phase 5 — ClassPlanning principal + Page RSC ✅ (~30min)

**But** : assembler le composant racine et la page Next.js PPR.

### Tâches

- [ ] T023 `src/components/planning/ClassPlanning.tsx` — copier V1, corriger :
  - `from "@/services/planning/database"` → `from '@/services/planning'` (PlanningResources)
  - `from "@/services/schedule"` → laisser tel quel (GetSchedulesReturn ✅)
  - `from "./utils"` → chemins relatifs internes (✅ utils.ts V2 a les bonnes exports)
  - `from "./export/PlanningExportWidget"` → chemin relatif (créé en T022)

- [ ] T024 `src/app/(attendancy)/[slug]/direction/planning/classe/[classId]/page.tsx` — adapter V1 page :
  - `import { ClassPlanning } from "@/components/planning"` (barrel)
  - `import { getPlanningResourcesAction } from "@/services/planning"` (barrel)
  - `getClassSchedulesAction(classId, rangeStart, rangeEnd)` (signature V2 — args séparés)
  - Ajouter `await connection()` en tête si pas de `getUserInfo()` direct (règle PPR)
  - Vérifier l'erreur narrowing : `if ('error' in schedulesRes)` pattern V2

**Checkpoint** : ✋ Page rendue sans erreur TS, composant visible en dev

---

## Phase 6 — Vérification finale ✅ (~20min)

- [ ] T025 `npx tsc --noEmit 2>&1 | grep -E "planning|schedule|ClassPlanning"` → 0 erreur
- [ ] T026 `npx tsx scripts/generate/api/api.ts planning` → 0 warning non documenté
- [ ] T027 Vérifier que `src/components/planning/index.ts` exporte tout ce dont les consommateurs ont besoin (au minimum `ClassPlanning`, `CoursePlanningDialog`, types)
- [ ] T028 Vérifier que les imports de `ClassPlanning` et `getPlanningResourcesAction` depuis l'extérieur passent par les barrels (pas de chemin interne)

---

## Dépendances

```
Phase 1 (service)
    ↓
Phase 2 (types + coursePlanning/) ← débloquer Phase 3, 4, 5
    ↓
    ├─→ Phase 3 (cards)
    │       ↓
    ├─→ Phase 4 (dialog + export) ← attend Phase 3
    │       ↓
    └─→ Phase 5 (ClassPlanning + page) ← attend Phase 4
            ↓
        Phase 6 (vérif)
```

---

## Points d'attention

| # | Risque | Mitigation |
|---|---|---|
| A | `getSchedulesAction` dans `PlanningExportWidget` : la V2 a une nouvelle signature `(params: ScheduleFilterParams)` | Adapter l'appel (T022) |
| B | `getClassSchedulesAction` dans la page : V1 prend un objet, V2 prend des args séparés | Adapter la page (T024) |
| C | `useAvailability` hook : vérifier que `@/hooks/planning/useAvailability.ts` couvre les mêmes entrées | Lire avant T021 |
| D | `SCHEDULE_EXPORT_COLUMNS` + `ExportButton` doivent exister en V2 | Vérifier au T022 |
| E | `notifyScheduleCreationAction` dans `usePlanningEvents.ts` : déjà dans V2 existant, pas à gérer | Pré-existant |
| F | `connection()` (règle PPR) : page RSC sans `getUserInfo()` direct → ajouter `await connection()` | T024 |

---

## Estimation totale : ~3h15min
