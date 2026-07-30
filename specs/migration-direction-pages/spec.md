# Feature Specification: Migration V1 → V2 — Pages Direction (courses, classes, planning, invitations, program-track)

**Feature Branch**: `migration-direction-pages`  
**Input**: `./docs/promts/task4.md`

---

## Context and Understanding

L'application attendancy est en cours de migration de V1 (`attendancy-sys`) vers V2 (`attendancy`).  
La phase 1 est terminée (0 erreur TS, services migrés). Il reste à porter les **pages et composants UI direction** qui n'existent pas encore en V2.

La logique métier est identique entre V1 et V2. Les schemas Prisma sont quasi identiques. Seuls changent :
- Le groupe de route : `(attendancy)/` en V1 → `(app)/` en V2
- Certains noms de services : `services/courses` → `services/course`, `services/invitation/student` → `services/invite/student`, `services/years` → `services/academic-year`
- Le mode de cache : V2 est PPR (`cacheComponents: true`) → toute page RSC sans `getUserInfo()` direct doit commencer par `await connection()`

**Ce qui existe déjà en V2 :**
- `src/services/planning/` (avec `actions.ts`, `queries.ts`, `types.ts`)
- `src/services/course/`, `src/services/class/`, `src/services/schedule/`, `src/services/invite/`, `src/services/program-track/`
- `src/components/planning/filters/` (partiel — uniquement `constants.ts` + `index.tsx`)
- `src/components/programs/program/types.ts`
- `src/app/(app)/[slug]/direction/` — layout, loading, page (direction index uniquement)

**Ce qui est absent en V2 et doit être copié :**
- Toutes les pages routes sous `direction/planning/`, `direction/courses/[courseId]/`, `direction/classes/[classId]/`, `direction/invitations/`, `direction/program-track/`
- `src/components/planning/` (tous sauf `filters/`)
- `src/components/courses/`
- `src/components/classes/direction/`
- `src/components/invitation/direction/`
- `src/components/program-tracks/`

---

## Feature Description

Porter les pages direction V1 vers V2 en copiant les composants et pages, puis en rebanchant sur les services/actions V2.  
L'objectif est d'avoir un module direction fonctionnel en V2 avec : planning global, planning par classe/cours, fiche cours, fiche classe, invitation étudiants, fiche program-track.

---

## Requirements

### Proposed solution

- **US-001** — Planning global : page `direction/planning/page.tsx` + composant `DirectionPlanning` fonctionnel avec vue calendrier, filtres sidebar (filtre planning câblé via `registry.ts`)
- **US-002** — Planning par classe : page `direction/planning/classe/[classId]/page.tsx` + composant `ClassPlanning`
- **US-003** — Planning par cours : page `direction/planning/course/[courseId]/page.tsx` (RSC pur, pas de composant séparé)
- **US-004** — Fiche cours : page `direction/courses/[courseId]/page.tsx` + arborescence complète `courses/pages/DirectionCoursePage/`
- **US-005** — Liste/layout courses : pages `direction/courses/page.tsx`, `layout.tsx`, `@course_modal/`
- **US-006** — Fiche classe : page `direction/classes/[classId]/page.tsx` + layout + sous-pages (courses, enrollment, groups, invitations, program)
- **US-007** — Invitation étudiants : page `direction/invitations/classes/[classId]/page.tsx` + composant `InviteStudentPage`
- **US-008** — Fiche program-track : page `direction/program-track/[id]/page.tsx` + composant `ProgramTrackInfo` + `DirectionClasses`
- **US-009** — Connexion filtre planning sidebar : activer `PlanningFilters` dans `registry.ts` (actuellement commenté) en V2

### Functional Requirements

- **FR-001** : Les pages `direction/planning/**` DOIVENT afficher le calendrier des séances avec filtres par classe, groupe, salle, professeur, statut
- **FR-002** : La page `direction/courses/[courseId]` DOIT afficher banner, métriques, info, progression (enseignants + séances à venir), évaluations, historique via Suspense
- **FR-003** : La page `direction/classes/[classId]` DOIT afficher la bannière de classe et naviguer vers ses sous-pages (détails, cours, groupes, enrollment, invitations, program)
- **FR-004** : La page invitation DOIT charger les groupes de la classe ET les invitations existantes et les passer à `InviteStudentPage`
- **FR-005** : La page `direction/program-track/[id]` DOIT afficher les infos du program-track et la liste des classes associées avec leurs années
- **FR-006** : Toutes les pages RSC V2 DOIVENT respecter la contrainte PPR (`await connection()` si pas de `getUserInfo()` direct)
- **FR-007** : Les imports cassés DOIVENT être résolus en priorité via les services V2 équivalents (pas de réécriture from scratch)
- **FR-008** : Le filtre planning dans la sidebar DOIT être activé sur les routes `direction/planning/**` via `PLANNING_SIDEBAR_VIEWS` dans `registry.ts`

---

## Mapping V1 → V2 (références critiques)

| V1 | V2 |
|----|----|
| Route group `(attendancy)/` | `(app)/` |
| `services/courses/actions` | `services/course/actions` |
| `services/invitation/student/actions` | `services/invite/student/actions` |  
| `services/years/action` | `services/academic-year/actions` |
| `services/class` | `services/class` (identique) |
| `services/planning` | `services/planning` (identique) |
| `services/schedule/actions` | `services/schedule/actions` (identique) |
| `lib/cache/react-query` | `lib/cache/react-query` (à vérifier) |
| `utils/server/validation` (validateUUID) | à localiser en V2 |

### Composants V1 → destination V2

| Composant V1 | Destination V2 |
|---|---|
| `components/planning/direction/DirectionPlanning` | `components/planning/direction/DirectionPlanning` |
| `components/planning/ClassPlanning` | `components/planning/ClassPlanning` |
| `components/planning/CoursePlanningDialog` | `components/planning/CoursePlanningDialog` |
| `components/planning/filters/**` | `components/planning/filters/**` (partiel existe) |
| `components/planning/hook/**` | `components/planning/hook/**` |
| `components/planning/ui/**` | `components/planning/ui/**` |
| `components/planning/card/**` | `components/planning/card/**` |
| `components/planning/coursePlanning/**` | `components/planning/coursePlanning/**` |
| `components/courses/direction/**` | `components/courses/direction/**` |
| `components/courses/pages/DirectionCoursePage/**` | `components/courses/pages/DirectionCoursePage/**` |
| `components/courses/teacher/**` | `components/courses/teacher/**` |
| `components/courses/ui/**` (subset) | `components/courses/ui/**` |
| `components/classes/direction/**` | `components/classes/direction/**` |
| `components/invitation/direction/**` | `components/invitation/direction/**` |
| `components/program-tracks/**` | `components/program-tracks/**` |

---

## Success Criteria

- **SC-001** : `npx tsc --noEmit` retourne 0 erreur après la migration
- **SC-002** : Les 5 routes direction sont accessibles sans erreur runtime
- **SC-003** : Le filtre planning sidebar s'active/désactive selon la route (`PLANNING_SIDEBAR_VIEWS` vs `DEFAULT_SIDEBAR_VIEWS`)
- **SC-004** : Aucun appel direct `prisma.*` dans les composants ou pages copiés
- **SC-005** : Aucun import `from "sonner"` direct — tous via `@/lib/toast/custom-toast`

---

## Clarification Needed

1. **`getYearsAction` / `getAcademicYears`** — V1 utilise `services/years/action`. En V2 le service s'appelle `academic-year`. L'action équivalente est-elle `getAcademicYearsAction` ?
   - A) Oui, `getAcademicYearsAction` depuis `services/academic-year`
   - B) Il existe un alias ou re-export à localiser
   - C) Autre

2. **`validateUUID`** — V1 importe depuis `utils/server/validation`. Équivalent V2 ?
   - A) Même chemin `utils/server/validation` existe en V2
   - B) Intégré dans Valibot directement dans la page
   - C) Absent, à recréer

3. **`lib/cache/react-query` / `getQueryClient`** — utilisé par `DirectionPlanning` (planning global) pour le prefetch React Query. Existe en V2 ?
   - A) Oui, même chemin
   - B) V2 utilise un autre mécanisme (RSC direct sans prefetch)

4. **Filtre planning sidebar** — `PlanningFilters` dans `registry.ts` est commenté. Faut-il l'activer dans cette migration ?
   - A) Oui, activer `PlanningFilters` avec le composant V1 porté
   - B) Laisser commenté pour l'instant, le filtre viendra dans une tâche séparée

5. **Tâche secondaire (réorganisation dossiers)** — À traiter dans cette branche ou PR séparée ?
   - A) Même branche, après que tout fonctionne
   - B) PR séparée après merge

---

## Notes

- V1 contient des fichiers `.txt` et `copy` (artefacts) — les ignorer lors de la copie
- `CoursePlanningDialog` est le formulaire de planification : composant lourd avec logique de conflits, disponibilités, soumission — copier tel quel, corriger les imports uniquement
- `DirectionPlanning` utilise `HydrationBoundary` + React Query prefetch côté serveur — pattern à conserver tel quel si `getQueryClient` existe en V2
- Le `registry.ts` V2 a déjà `PLANNING_SIDEBAR_VIEWS` défini mais `PlanningFilters` est commenté — l'import du composant est déjà préparé
- Fichiers tests V1 (`__tests__/`) dans `planning/filters/` et `planning/coursePlanning/` — à copier également pour maintenir la couverture
