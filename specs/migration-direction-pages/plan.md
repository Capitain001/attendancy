# Tasks: Migration V1 → V2 — Pages Direction

**Branch**: `migration-direction-pages`  
**Specs**: [spec.md](./spec.md)  
**Architecture**: [architecture.md](./architecture.md)  
**Status**: Not Started ⏳

---

## Phase 1: Utilitaires & service manquants ⏳ (~1h)

**Purpose**: Créer les 2 fichiers utilitaires absents en V2 et compléter le service schedule. Bloque les phases suivantes.

- [ ] T001 Créer `src/lib/react-query.ts` — `getQueryClient()` retournant un `new QueryClient({ defaultOptions: { queries: { staleTime: 5*60*1000 } } })`
- [ ] T002 Créer `src/utils/server/validation.ts` — `validateUUID(value: string): string` via Valibot (`pipe(string(), uuid())`), appelle `notFound()` si invalide
- [ ] T003 Ajouter `getCourseScheduleAction(courseId: string)` dans `src/services/schedule/actions/schedule.queries.ts` — filtre `getSchedules` par courseId (ajouter le param optionnel `courseId?` dans la DB query si absent, sinon wrapper)
- [ ] T004 [P] Copier `src/components/planning/filters/FilterShell.tsx` depuis V1
- [ ] T004b [P] Copier `src/components/planning/filters/matchSchedule.ts` depuis V1 (renommer export : `matchesPlanningFilters`)
- [ ] T005 Mettre à jour `src/components/planning/filters/index.tsx` — ajouter exports `FilterShell` et `matchesPlanningFilters`

**Checkpoint**: ✋ Utilitaires prêts — compiler `tsc --noEmit` sur ces fichiers seuls.

**Notes:**
-

---

## Phase 2: Planning global (P0) ⏳ (~2h)

**Goal**: Page `direction/planning/` fonctionnelle avec calendrier, filtres sidebar, export.

### Tasks

- [ ] T006 Copier `src/components/planning/direction/DirectionPlanning.tsx` depuis V1
  - Corriger import : `from "sonner"` → `from "@/lib/toast/custom-toast"`
  - Corriger import : `@/components/schedule/scheduleExportColumns` → créer le fichier en T007
- [ ] T007 [P] Copier `src/components/schedule/scheduleExportColumns.ts` depuis V1
- [ ] T008 [P] Copier `src/components/planning/direction/ScheduleNotificationsBoard.tsx` depuis V1
- [ ] T009 Copier `src/components/planning/mapScheduleToEvent.ts` depuis V1
- [ ] T010 [P] Copier `src/components/planning/types.ts` depuis V1
- [ ] T011 [P] Copier `src/components/planning/utils.ts` depuis V1
- [ ] T012 [P] Copier `src/components/planning/hook/useActionConfirm.ts` depuis V1
- [ ] T013 [P] Copier `src/components/planning/hook/usePlanningEvents.ts` depuis V1
- [ ] T014 [P] Copier dossier `src/components/planning/ui/` depuis V1 (4 fichiers)
  - Vérifier : remplacer tout `from "sonner"` par `@/lib/toast/custom-toast`
- [ ] T015 Créer `src/app/(app)/[slug]/direction/planning/page.tsx`
  - Source : V1 `src/app/(attendancy)/[slug]/direction/planning/page.tsx`
  - Corriger : `@/lib/cache/react-query` → `@/lib/react-query`
  - Composant : `DirectionPlanning` depuis `@/components/planning/direction/DirectionPlanning`
- [ ] T016 Activer `PlanningFilters` dans `src/components/layout/sidebar/views/registry.ts`
  - Décommenter le `Component: dynamic(...)` dans l'entrée `planning`

**Checkpoint**: ✋ `direction/planning` s'affiche, le calendrier charge, filtres sidebar répondent.

**Notes:**
-

---

## Phase 3: Planning classe & cours (P0) ⏳ (~1h)

**Goal**: Pages `planning/classe/[classId]` et `planning/course/[courseId]` fonctionnelles.

### Tasks

- [ ] T017 Copier `src/components/planning/ClassPlanning.tsx` depuis V1
  - Corriger : `getPlanningResourcesAction(classId)` → `getOrgPlanningResourcesAction()` (plus de param)
  - Corriger : import `services/planning/actions`
- [ ] T018 Copier `src/components/planning/class-planning-types.ts` depuis V1
- [ ] T019 Copier dossier `src/components/planning/card/` depuis V1 (4 fichiers)
- [ ] T020 Créer `src/app/(app)/[slug]/direction/planning/classe/[classId]/page.tsx`
  - Source : V1 page
  - Corriger : `getClassSchedulesAction({ classId, rangeStart, rangeEnd })` → `getClassSchedulesAction(classId, rangeStart, rangeEnd)` (positional)
  - Corriger : `getPlanningResourcesAction(classId)` → `getOrgPlanningResourcesAction()`
- [ ] T021 Créer `src/app/(app)/[slug]/direction/planning/course/[courseId]/page.tsx`
  - Source : V1 page
  - Corriger : `getCourseAction({ courseId })` → `getCourseAction(courseId)`
  - Corriger : `getCourseScheduleAction({ courseId })` → `getCourseScheduleAction(courseId)` (créé en T003)
  - Import status options : `from "@/components/planning/filters"` (inchangé)
  - Vérifier contrainte PPR : ajouter `await connection()` si pas de `getUserInfo()` direct

**Checkpoint**: ✋ `/direction/planning/classe/[classId]` et `/direction/planning/course/[courseId]` s'affichent.

**Notes:**
-

---

## Phase 4: Fiche cours direction (P1) ⏳ (~3h)

**Goal**: Page `direction/courses/[courseId]` avec toutes ses sections via Suspense.

### Tasks

- [ ] T022 [P] Copier dossier `src/components/courses/pages/DirectionCoursePage/components/` depuis V1
- [ ] T023 [P] Copier dossier `src/components/courses/pages/DirectionCoursePage/sections/` depuis V1
  - Corriger dans chaque section : `getCourseAction({ courseId })` → `getCourseAction(courseId)`
  - Corriger import service : `@/services/courses/` → `@/services/course/`
- [ ] T024 Copier `src/components/courses/pages/DirectionCoursePage/index.ts` depuis V1
- [ ] T025 [P] Copier `src/components/courses/pages/DirectionCoursePage/types.ts` depuis V1
- [ ] T026 [P] Copier `src/components/courses/pages/DirectionCoursePage/utils.ts` depuis V1
- [ ] T027 [P] Copier `src/components/courses/pages/DirectionCoursePage/constants.ts` depuis V1
- [ ] T028 Copier `src/components/courses/direction/CourseDetail.tsx` depuis V1
- [ ] T029 [P] Copier `src/components/courses/direction/CourseBanner.tsx` depuis V1
- [ ] T030 [P] Copier `src/components/courses/direction/CourseSections.tsx` depuis V1 (si existe)
- [ ] T031 [P] Copier `src/components/courses/teacher/CourseTeachersList.tsx` depuis V1
- [ ] T032 [P] Copier `src/components/courses/teacher/TeacherAssignment.tsx` depuis V1
- [ ] T033 Copier `src/components/courses/direction/index.ts` depuis V1
- [ ] T034 Créer `src/app/(app)/[slug]/direction/courses/[courseId]/page.tsx`
  - Source : V1 page
  - Corriger : `getCourseAction({ courseId })` → `getCourseAction(courseId)`
  - Import `CourseDetail` : `@/components/courses/direction/CourseDetail`
  - Import sections : `@/components/courses/pages/DirectionCoursePage`

**Checkpoint**: ✋ `/direction/courses/[id]` s'affiche avec toutes les sections.

**Notes:**
-

---

## Phase 5: Liste cours + layout + modal (P1) ⏳ (~1.5h)

**Goal**: Pages `direction/courses/page.tsx`, `layout.tsx`, `@course_modal/`.

### Tasks

- [ ] T035 Copier `src/components/courses/direction/DirectionCourses.tsx` depuis V1
  - Corriger import service : `@/services/courses/` → `@/services/course/`
- [ ] T036 [P] Copier `src/components/courses/ui/CourseCard.tsx` depuis V1
- [ ] T037 [P] Copier `src/components/courses/ui/CourseList.tsx` depuis V1
- [ ] T038 [P] Copier `src/components/courses/ui/CourseActions.tsx` depuis V1
- [ ] T039 [P] Copier `src/components/courses/modal/CourseDialog.tsx` depuis V1
- [ ] T040 [P] Copier `src/components/courses/form/CourseForm.tsx` depuis V1
- [ ] T041 Créer `src/app/(app)/[slug]/direction/courses/page.tsx` (source V1)
- [ ] T042 [P] Créer `src/app/(app)/[slug]/direction/courses/layout.tsx` (source V1)
- [ ] T043 [P] Créer `src/app/(app)/[slug]/direction/courses/@course_modal/default.tsx` (source V1)
- [ ] T044 [P] Créer `src/app/(app)/[slug]/direction/courses/@course_modal/loading.tsx` (source V1)
- [ ] T045 [P] Créer `src/app/(app)/[slug]/direction/courses/@course_modal/page.tsx` (source V1)

**Checkpoint**: ✋ `/direction/courses` s'affiche avec la liste et les modals.

**Notes:**
-

---

## Phase 6: Fiche classe + sous-pages (P1) ⏳ (~3h)

**Goal**: Route `direction/classes/[classId]/` avec layout, bannière, et toutes les sous-pages.

### Tasks

- [ ] T046 Copier `src/components/classes/direction/ui/ClassBanner.tsx` depuis V1
- [ ] T047 Copier `src/components/classes/direction/DirectionClassDetailPage.tsx` depuis V1
- [ ] T048 [P] Copier `src/components/classes/direction/section/ClassProfilePage.tsx` depuis V1
- [ ] T049 [P] Copier dossier `src/components/classes/direction/section/ui/` depuis V1
- [ ] T050 [P] Copier `src/components/classes/direction/enrollment/` depuis V1
- [ ] T051 [P] Copier `src/components/classes/direction/groups/` depuis V1
- [ ] T052 [P] Copier `src/components/classes/direction/ui/DirectionClasses.tsx` depuis V1
- [ ] T053 [P] Copier `src/components/classes/direction/ui/ClassesList.tsx` depuis V1
- [ ] T054 [P] Copier `src/components/classes/direction/ui/AddClass.tsx` depuis V1
- [ ] T055 [P] Copier `src/components/classes/direction/mapClassProfile.ts` depuis V1
- [ ] T056 Copier `src/components/classes/direction/index.ts` depuis V1
- [ ] T057 Créer `src/app/(app)/[slug]/direction/classes/[classId]/layout.tsx`
  - Source : V1 layout
  - Corriger : `getClassAction(classId)` (V2 = même signature)
- [ ] T058 Créer `src/app/(app)/[slug]/direction/classes/[classId]/page.tsx` (source V1)
- [ ] T059 [P] Créer `src/app/(app)/[slug]/direction/classes/[classId]/courses/page.tsx` (source V1)
- [ ] T060 [P] Créer `src/app/(app)/[slug]/direction/classes/[classId]/courses/layout.tsx` (source V1)
- [ ] T061 [P] Créer `src/app/(app)/[slug]/direction/classes/[classId]/courses/@course_modal/` (3 fichiers)
- [ ] T062 [P] Créer `src/app/(app)/[slug]/direction/classes/[classId]/enrollment/page.tsx` (source V1)
- [ ] T063 [P] Créer `src/app/(app)/[slug]/direction/classes/[classId]/groups/page.tsx` (source V1)
- [ ] T064 [P] Créer `src/app/(app)/[slug]/direction/classes/[classId]/invitations/page.tsx` (source V1)
- [ ] T065 [P] Créer `src/app/(app)/[slug]/direction/classes/[classId]/program/page.tsx` (source V1)
- [ ] T066 [P] Créer `src/app/(app)/[slug]/direction/classes/[classId]/program/layout.tsx` (source V1)
- [ ] T067 [P] Créer `src/app/(app)/[slug]/direction/classes/[classId]/program/@program_modal/` (3 fichiers)
- [ ] T068 Créer `src/app/(app)/[slug]/direction/classes/page.tsx` (source V1)

**Checkpoint**: ✋ `/direction/classes/[id]` navigue entre toutes ses sous-pages sans erreur.

**Notes:**
-

---

## Phase 7: Invitation étudiants (P1) ⏳ (~1h)

**Goal**: Page `direction/invitations/classes/[classId]` fonctionnelle.

### Tasks

- [ ] T069 Copier `src/components/invitation/direction/pages/InviteStudentPage.tsx` depuis V1
  - Corriger tout import `from "sonner"` → `@/lib/toast/custom-toast`
- [ ] T070 Créer `src/app/(app)/[slug]/direction/invitations/classes/[classId]/page.tsx`
  - Source : V1 page
  - Corriger : `getClassInvitationsAction` → `getClassInvitesAction` (V2)
  - Corriger import : `@/services/invitation/student/actions` → `@/services/invite/student/actions`
- [ ] T071 Créer `src/app/(app)/[slug]/direction/invitations/page.tsx` (source V1 — page index)

**Checkpoint**: ✋ `/direction/invitations/classes/[id]` affiche le formulaire d'invitation.

**Notes:**
-

---

## Phase 8: Program-track (P1) ⏳ (~1.5h)

**Goal**: Page `direction/program-track/[id]` avec infos + liste des classes.

### Tasks

- [ ] T072 Copier `src/components/program-tracks/ui/ProgramTrackInfo.tsx` depuis V1
- [ ] T073 [P] Copier `src/components/program-tracks/ui/ProgramTrackBanner.tsx` depuis V1
- [ ] T074 [P] Copier `src/components/program-tracks/ui/ProgramTrackCard.tsx` depuis V1
- [ ] T075 [P] Copier `src/components/program-tracks/ui/ProgramTrackList.tsx` depuis V1
- [ ] T076 [P] Copier `src/components/program-tracks/ui/AddProgramTrack.tsx` depuis V1
- [ ] T077 [P] Copier `src/components/program-tracks/ui/ProgramTrackActions.tsx` depuis V1
- [ ] T078 [P] Copier `src/components/program-tracks/form/ProgramTrackForm.tsx` depuis V1
- [ ] T079 [P] Copier `src/components/program-tracks/dialog/ProgramTrackDialog.tsx` depuis V1
- [ ] T080 Créer `src/app/(app)/[slug]/direction/program-track/[id]/page.tsx`
  - Source : V1 page
  - Corriger : `validateUUID` → import depuis `@/utils/server/validation` (créé T002)
  - Corriger : `getYearsAction()` → depuis `@/services/academic-year` (alias existant ✅)
  - Corriger : `getClassesAction({ programTrackId: id })` → vérifier signature V2
  - Vérifier contrainte PPR (`await connection()` si absent)
- [ ] T081 Créer `src/app/(app)/[slug]/direction/program-track/page.tsx` (source V1)
- [ ] T082 [P] Créer arborescence `program-track/classes/` (copie V1 complète)
  - `classes/page.tsx`
  - `classes/[classId]/page.tsx`
  - `classes/[classId]/courses/page.tsx` + layout + @course_modal
  - `classes/[classId]/courses/[courseId]/page.tsx`
  - `classes/[classId]/invitations/page.tsx`
  - `classes/[classId]/program/page.tsx`

**Checkpoint**: ✋ `/direction/program-track/[id]` affiche infos + classes.

**Notes:**
-

---

## Phase 9: Validation TS + correctifs transverses ⏳ (~1.5h)

**Purpose**: 0 erreur TypeScript, vérification conventions V2.

- [ ] T083 Lancer `npx tsc --noEmit` — lister toutes les erreurs restantes
- [ ] T084 Corriger erreurs TypeScript bloc planning (T006-T016)
- [ ] T085 [P] Corriger erreurs TypeScript bloc courses (T022-T045)
- [ ] T086 [P] Corriger erreurs TypeScript bloc classes (T046-T068)
- [ ] T087 [P] Corriger erreurs TypeScript bloc invitations + program-track (T069-T082)
- [ ] T088 Vérifier : aucun `import { toast } from "sonner"` dans les fichiers copiés → `@/lib/toast/custom-toast`
- [ ] T089 Vérifier : aucun `prisma.*` direct dans composants ou pages copiés
- [ ] T090 Vérifier contrainte PPR sur les 3 pages sans `getUserInfo()` direct : `planning/course`, `program-track/[id]`, ajouter `await connection()` si manquant
- [ ] T091 Relancer `npx tsc --noEmit` → doit retourner 0 erreur

**Checkpoint**: ✋ 0 erreur TS. Conventions respectées.

**Notes:**
-

---

## Phase 10: Réorganisation dossiers UI (secondaire) ⏳ (~1h)

**Purpose**: Aligner l'organisation des composants copiés aux conventions V2.

- [ ] T092 Auditer les composants copiés : identifier ceux qui appartiennent à `components/layout/` plutôt que leur emplacement actuel
- [ ] T093 Déplacer / renommer les composants identifiés + mettre à jour les imports
- [ ] T094 Relancer `npx tsc --noEmit` → 0 erreur après réorganisation

**Notes:**
-

---

## Dependencies & Execution Order

```
Phase 1 (Utilitaires)
    ↓ BLOQUE tout
Phase 2 (Planning global)  ←→ Phase 3 (Planning classe/cours) [parallélisable]
    ↓
Phase 4 (Fiche cours) ←→ Phase 5 (Liste cours) [parallélisable]
    ↓
Phase 6 (Fiche classe) ←→ Phase 7 (Invitations) ←→ Phase 8 (Program-track) [parallélisable]
    ↓
Phase 9 (Validation TS)
    ↓
Phase 10 (Réorganisation — optionnel)
```

### Stories indépendantes après Phase 1

- **P2, P3** (planning global + classe/cours) — peuvent se faire en même temps
- **P4, P5** (fiche cours + liste) — indépendantes entre elles
- **P6, P7, P8** (classe + invitations + program-track) — indépendantes entre elles

---

## Résumé

| Métrique | Valeur |
|----------|--------|
| Total tâches | 94 |
| Phases | 10 |
| Durée estimée | ~15h |
| MVP (planning global fonctionnel) | Phase 1 + 2 ≈ 3h |

## Conventions rappel

- **[P]** = parallélisable (fichiers différents, pas de dépendance logique)
- Toujours corriger `from "sonner"` → `@/lib/toast/custom-toast`
- Toujours corriger `@/services/courses/` → `@/services/course/`
- `getCourseAction({ courseId })` → `getCourseAction(courseId)` (string direct)
- `getClassSchedulesAction({...})` → `getClassSchedulesAction(classId, rangeStart, rangeEnd)` (positional)
- `getClassInvitationsAction` → `getClassInvitesAction`
- `getPlanningResourcesAction(classId)` → `getOrgPlanningResourcesAction()` (sans param)
