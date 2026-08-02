# Architecture: Migration V1 → V2 — Pages Direction

**Feature**: migration-direction-pages  
**Date**: 2026-07-30  
**Branch**: `migration-direction-pages`  
**Specs**: [spec.md](./spec.md)

---

## Summary

Copie intégrale des composants et pages direction de V1 (`attendancy-sys`) vers V2 (`attendancy`), suivie de la correction des imports cassés. Le domaine métier est identique — seuls changent les chemins de services, quelques signatures d'actions, et la contrainte PPR V2. Aucune logique métier n'est réécrite.

---

## Technical Context

**Stack** : Next.js 16 PPR · React 19 · Prisma v7 · TypeScript strict  
**Key Dependencies** : `@tanstack/react-query` (HydrationBoundary + prefetch), `date-fns`, `lucide-react`  
**Testing** : Vitest (tests unitaires planning/filters + planning/coursePlanning à copier depuis V1)  
**Platform** : Server (RSC + Server Actions) + Client (composants interactifs)

---

## Technical Decisions

### Decision 1 : Copie d'abord, correction ensuite

**What** : Copier les fichiers V1 tels quels, puis corriger uniquement les imports cassés.  
**Why** : La logique métier (CoursePlanningDialog, ClassPlanning, filtres, etc.) est éprouvée et ne doit pas être réécrite.  
**Trade-offs** : Quelques warnings temporaires pendant la correction, mais zéro risque de régression logique.

### Decision 2 : Créer `src/lib/react-query.ts` pour `getQueryClient`

**What** : `lib/cache/react-query` n'existe pas en V2. Créer `src/lib/react-query.ts` avec `getQueryClient()`.  
**Why** : `DirectionPlanning` (planning global) utilise `HydrationBoundary` + `prefetchQuery` côté serveur — pattern à conserver.  
**Alternatives** : Réécrire DirectionPlanning en RSC pur sans prefetch — rejeté (trop invasif).  
**Trade-offs** : Fichier utilitaire minimal à créer ; supprimer si doublon détecté post-migration.

### Decision 3 : `getCourseScheduleAction` absent en V2 — à ajouter

**What** : V2 `schedule/actions` n'a pas de filtre par `courseId`. La page `planning/course/[courseId]` en a besoin.  
**Why** : V2 a `getSchedulesAction` (filtre classId/teacherId/roomId) mais pas courseId.  
**Solution** : Ajouter `getCourseScheduleAction(courseId)` dans `src/services/schedule/actions/schedule.queries.ts`.

### Decision 4 : `components/planning/filters/` déjà présent en V2 — ne pas recopier

**What** : Les filtres (ClassFilter, GroupFilter, TeacherFilter, RoomFilter, StatusFilter, constants) existent déjà en V2.  
**Why** : Éviter doublon et conflit.  
**Note** : Vérifier que les exports V1 manquants (`FilterShell`, `matchSchedule`) sont aussi copiés.

---

## Import Remapping Table (V1 → V2)

| Import V1 | Import V2 | Note |
|-----------|-----------|------|
| `@/lib/cache/react-query` (getQueryClient) | `@/lib/react-query` | À créer |
| `utils/server/validation` (validateUUID) | `@/utils/server/validation` | À créer |
| `@/services/courses/actions` (getCourseAction) | `@/services/course/actions` | Singulier + signature directe |
| `@/services/years/action` (getYearsAction) | `@/services/academic-year` (getYearsAction) | Alias exporté |
| `@/services/invitation/student/actions` (getClassInvitationsAction) | `@/services/invite/student/actions` (getClassInvitesAction) | Chemin + nom changés |
| `@/services/planning/actions` (getPlanningResourcesAction) | `@/services/planning/actions` (getOrgPlanningResourcesAction) | Nom changé, plus de classId param |
| `@/services/planning/queries` | `@/services/planning/queries` | Identique ✅ |
| `@/services/schedule/actions` (getClassSchedulesAction) | `@/services/schedule/actions` (getClassSchedulesAction) | Signature positionnelle en V2 |
| `@/services/schedule/actions` (getCourseScheduleAction) | À ajouter en V2 | Absent |
| `@/services/class` | `@/services/class` | Identique ✅ |
| Route group `(attendancy)/` | `(app)/` | Toutes les pages |

## Signature Mismatches (V1 → V2)

| Action | V1 | V2 |
|--------|----|----|
| `getCourseAction` | `{ courseId }` (objet) | `courseId` (string direct) |
| `getClassSchedulesAction` | `{ classId, rangeStart, rangeEnd }` (objet) | `classId, rangeStart, rangeEnd` (positionnel) |
| `getPlanningResourcesAction` | `(classId)` | `getOrgPlanningResourcesAction()` (sans param) |
| `getClassInvitationsAction` | V1 name | `getClassInvitesAction` en V2 |

---

## Architecture Overview

### Fichiers à CRÉER (utilities manquantes en V2)

```
src/lib/react-query.ts                          # NOUVEAU — getQueryClient() pour HydrationBoundary
src/utils/server/validation.ts                  # NOUVEAU — validateUUID (Valibot uuid)
```

### Fichiers à AJOUTER dans services existants

```
src/services/schedule/actions/schedule.queries.ts   # MODIFIER — ajouter getCourseScheduleAction(courseId)
src/components/layout/sidebar/views/registry.ts     # MODIFIER — décommenter PlanningFilters
```

### Pages routes à CRÉER (copie V1 + correction imports)

```
src/app/(app)/[slug]/direction/planning/page.tsx
src/app/(app)/[slug]/direction/planning/classe/[classId]/page.tsx
src/app/(app)/[slug]/direction/planning/course/[courseId]/page.tsx

src/app/(app)/[slug]/direction/courses/page.tsx
src/app/(app)/[slug]/direction/courses/layout.tsx
src/app/(app)/[slug]/direction/courses/[courseId]/page.tsx
src/app/(app)/[slug]/direction/courses/@course_modal/default.tsx
src/app/(app)/[slug]/direction/courses/@course_modal/loading.tsx
src/app/(app)/[slug]/direction/courses/@course_modal/page.tsx

src/app/(app)/[slug]/direction/classes/[classId]/page.tsx
src/app/(app)/[slug]/direction/classes/[classId]/layout.tsx
src/app/(app)/[slug]/direction/classes/[classId]/courses/page.tsx
src/app/(app)/[slug]/direction/classes/[classId]/courses/layout.tsx
src/app/(app)/[slug]/direction/classes/[classId]/courses/@course_modal/{default,loading,page}.tsx
src/app/(app)/[slug]/direction/classes/[classId]/enrollment/page.tsx
src/app/(app)/[slug]/direction/classes/[classId]/groups/page.tsx
src/app/(app)/[slug]/direction/classes/[classId]/invitations/page.tsx
src/app/(app)/[slug]/direction/classes/[classId]/program/page.tsx
src/app/(app)/[slug]/direction/classes/[classId]/program/@program_modal/{default,loading,page}.tsx
src/app/(app)/[slug]/direction/classes/[classId]/program/layout.tsx
src/app/(app)/[slug]/direction/classes/page.tsx

src/app/(app)/[slug]/direction/invitations/page.tsx
src/app/(app)/[slug]/direction/invitations/classes/[classId]/page.tsx

src/app/(app)/[slug]/direction/program-track/page.tsx
src/app/(app)/[slug]/direction/program-track/[id]/page.tsx
src/app/(app)/[slug]/direction/program-track/classes/...   # arborescence complète V1
```

### Composants à COPIER depuis V1 (répertoires entiers)

```
# Planning (hors filters/ déjà présent)
src/components/planning/direction/DirectionPlanning.tsx
src/components/planning/direction/ScheduleNotificationsBoard.tsx
src/components/planning/ClassPlanning.tsx
src/components/planning/class-planning-types.ts
src/components/planning/CoursePlanningDialog.tsx
src/components/planning/conflictsToast.ts
src/components/planning/mapScheduleToEvent.ts
src/components/planning/types.ts
src/components/planning/utils.ts
src/components/planning/index.ts
src/components/planning/hook/                   # useActionConfirm, usePlanningEvents
src/components/planning/ui/                     # ActionScheduleToast, Availabilitychecker, PlanningToolbar, ToolbarButton
src/components/planning/card/                   # CourseEcard, CoursePcard, MiniMonth, TeacherCombobox
src/components/planning/coursePlanning/         # formState, submit, filters, resourceMaps, constants, etc.
src/components/planning/export/                 # PlanningExportWidget
src/components/planning/filters/FilterShell.tsx # si absent en V2
src/components/planning/filters/matchSchedule.ts
src/components/planning/filters/__tests__/
src/components/planning/coursePlanning/__tests__/

# Courses (direction)
src/components/courses/direction/               # CourseDetail, CourseBanner, CourseDetail.tsx, etc.
src/components/courses/pages/DirectionCoursePage/  # sections, components, types, utils
src/components/courses/teacher/                # CourseTeacher, CourseTeachersList, TeacherAssignment
src/components/courses/ui/                     # subset (CourseCard, CourseDetails, DeleteCourseDialog, EditCourseDialog, etc.)
src/components/courses/form/                   # CourseForm
src/components/courses/modal/                  # CourseDialog
src/components/courses/attendance/             # AttendanceFile, AttendanceFilter, AttendanceTable, StudentsAttendance
src/components/courses/index.ts

# Classes (direction uniquement)
src/components/classes/direction/              # tout le dossier (DirectionClassDetailPage, ClassBanner, etc.)

# Invitation direction
src/components/invitation/direction/           # InviteStudentPage

# Program-tracks
src/components/program-tracks/                 # tout le dossier
```

---

## Data Flow par User Story

### US-001 — Planning global (`direction/planning/page.tsx`)

```
RSC page
  └── getQueryClient() [lib/react-query.ts]
  └── prefetchQuery(planningSchedulesQuery({ date }))
  └── prefetchQuery(orgPlanningResourcesQuery())
  └── <HydrationBoundary>
        └── <DirectionPlanning />  [components/planning/direction/]
              ├── useQuery(planningSchedulesQuery) → séances calendrier
              ├── useQuery(orgPlanningResourcesQuery) → ressources (classes, salles, profs)
              ├── <EventCalendar /> [components/event-calendar/]
              └── sidebar planning (registry.ts PLANNING_SIDEBAR_VIEWS) → <PlanningFilters />
```

### US-002 — Planning par classe (`planning/classe/[classId]/page.tsx`)

```
RSC page
  └── getClassSchedulesAction(classId, rangeStart, rangeEnd)  [V2 positional]
  └── getOrgPlanningResourcesAction()                         [V2 — plus de classId]
  └── <ClassPlanning slug classId resources schedules />
```

### US-003 — Planning par cours (`planning/course/[courseId]/page.tsx`)

```
RSC page (pur, pas de composant séparé)
  └── getCourseAction(courseId)         [V2 direct string]
  └── getCourseScheduleAction(courseId) [À AJOUTER en V2]
  └── JSX inline (ScheduleRow, upcoming/past split)
```

### US-004/005 — Fiche cours (`courses/[courseId]/page.tsx`)

```
RSC page
  └── getCourseAction(courseId)  [V2 direct string]
  └── <CourseDetail>
        ├── <CourseBannerSection courseId />   [Suspense]
        ├── <CourseMetricsSection courseId />  [Suspense]
        ├── <CourseInfoAndStatsSection />      [Suspense]
        ├── <CourseTeachersIsland />           [Suspense — RSC interne]
        ├── <CourseUpcomingSection />          [Suspense]
        ├── <EvaluationsSection />             [Suspense]
        └── <CourseHistorySection />           [Suspense]
```

### US-006 — Fiche classe (`classes/[classId]/`)

```
Layout RSC
  └── getClassAction(classId)     [V2 direct string]
  └── <ClassBanner class_={class_} />

Page RSC (index)
  └── <DirectionClassDetailPage classId slug />
        └── <ClassProfilePage /> → sections (CoursesSection, StudentsSection, TeachersSection, etc.)
```

### US-007 — Invitation étudiants (`invitations/classes/[classId]/page.tsx`)

```
RSC page
  └── getClassGroupsAction({ classId })
  └── getClassInvitesAction({ classId })   [V2 — était getClassInvitationsAction en V1]
  └── <InviteStudentPage classGroups invitations />
```

### US-008 — Program-track (`program-track/[id]/page.tsx`)

```
RSC page
  └── validateUUID(rawId)                         [À créer utils/server/validation.ts]
  └── getClassesAction({ programTrackId: id })
  └── getYearsAction()                            [alias V2 = getAcademicYearsAction]
  └── <ProgramTrackInfo programTrackId />
  └── <DirectionClasses programTrackId classes years />
```

### US-009 — Filtre planning sidebar (registry.ts)

```
registry.ts
  └── PLANNING_SIDEBAR_VIEWS = ["navigation", "planning"]
  └── SIDEBAR_VIEWS.planning.Component = dynamic(import PlanningFilters)  # décommenter
```

Le hook `use-sidebar-views.ts` lit `PLANNING_SIDEBAR_VIEWS` quand la route matche `direction/planning/**`.

---

## File Structure (résultat final)

```
src/
├── lib/
│   └── react-query.ts                              # NOUVEAU
├── utils/
│   └── server/
│       └── validation.ts                           # NOUVEAU (validateUUID)
├── services/
│   └── schedule/actions/
│       └── schedule.queries.ts                     # MODIFIÉ (+getCourseScheduleAction)
├── components/
│   ├── planning/
│   │   ├── filters/                                # EXISTE déjà — ajouter FilterShell + matchSchedule
│   │   ├── direction/                              # NOUVEAU (copie)
│   │   ├── hook/                                   # NOUVEAU (copie)
│   │   ├── ui/                                     # NOUVEAU (copie)
│   │   ├── card/                                   # NOUVEAU (copie)
│   │   ├── coursePlanning/                         # NOUVEAU (copie)
│   │   └── export/                                 # NOUVEAU (copie)
│   ├── courses/
│   │   ├── direction/                              # NOUVEAU (copie)
│   │   ├── pages/DirectionCoursePage/              # NOUVEAU (copie)
│   │   ├── teacher/                                # NOUVEAU (copie)
│   │   ├── ui/                                     # NOUVEAU (copie subset)
│   │   ├── form/                                   # NOUVEAU (copie)
│   │   ├── modal/                                  # NOUVEAU (copie)
│   │   └── attendance/                             # NOUVEAU (copie)
│   ├── classes/
│   │   └── direction/                              # NOUVEAU (copie)
│   ├── invitation/
│   │   └── direction/                              # NOUVEAU (copie)
│   └── program-tracks/                             # NOUVEAU (copie)
├── app/(app)/[slug]/direction/
│   ├── planning/
│   │   ├── page.tsx                                # NOUVEAU
│   │   ├── classe/[classId]/page.tsx               # NOUVEAU
│   │   └── course/[courseId]/page.tsx              # NOUVEAU
│   ├── courses/
│   │   ├── page.tsx / layout.tsx                   # NOUVEAU
│   │   ├── [courseId]/page.tsx                     # NOUVEAU
│   │   └── @course_modal/                          # NOUVEAU
│   ├── classes/
│   │   ├── page.tsx                                # NOUVEAU
│   │   └── [classId]/                              # NOUVEAU (page + layout + sous-pages)
│   ├── invitations/
│   │   ├── page.tsx                                # NOUVEAU
│   │   └── classes/[classId]/page.tsx              # NOUVEAU
│   └── program-track/
│       ├── page.tsx                                # NOUVEAU
│       ├── [id]/page.tsx                           # NOUVEAU
│       └── classes/...                             # NOUVEAU (arborescence complète)
└── components/layout/sidebar/views/
    └── registry.ts                                 # MODIFIÉ (décommenter PlanningFilters)
```

---

## Risks & Mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Composants V1 avec imports croisés non répertoriés | Moyen | Compiler après chaque bloc copié, corriger au fur et à mesure |
| `getCourseScheduleAction` absent → runtime error | Haut | Ajouter l'action avant de copier la page planning/course |
| Signatures d'actions différentes (objet vs positional) | Haut | Table de remapping dans ce doc — corriger systématiquement |
| Fichiers `.txt` / `copy` V1 accidentellement copiés | Bas | Copier uniquement `.ts` / `.tsx` |
| `getQueryClient` crée un QueryClient neuf à chaque requête | Bas | Pattern identique à V1 — acceptable pour prefetch SSR |
| PPR violation (page sans `connection()`) | Moyen | Vérifier chaque page RSC qui n'appelle pas `getUserInfo()` directement |

---

## Contrainte PPR (rappel)

Toute page RSC V2 qui n'appelle pas `getUserInfo()` directement DOIT commencer par :
```ts
import { connection } from 'next/server'
await connection()
```
Les pages planning/course/[courseId] et program-track/[id] sont candidates — vérifier cas par cas après copie.

---

## Open Questions

*(toutes résolues)*

**Filtres planning = URL params via `nuqs`** — pas de Zustand.  
- `usePlanningFilters()` / `use-planning-date-filter()` → `useQueryState` (nuqs)  
- Tous les hooks planning (`useDirectionSchedules`, `useOrgPlanningResources`, `useClassGroups`, etc.) **existent déjà en V2** dans `src/hooks/data/planning/`  
- `src/components/layout/sidebar/views/planning-filters.tsx` **existe déjà en V2**  
- `nuqs` est dans `package.json` V2  
- Seul manquant dans `components/planning/filters/` : `FilterShell.tsx` + `matchSchedule.ts` à copier de V1

---

## Next Steps

1. Créer les 2 utilitaires manquants (`lib/react-query.ts`, `utils/server/validation.ts`)
2. Ajouter `getCourseScheduleAction` dans schedule service
3. Copier bloc par bloc : planning → courses → classes → invitations → program-track
4. Corriger les imports avec la table de remapping
5. Activer `PlanningFilters` dans `registry.ts`
6. `npx tsc --noEmit` → 0 erreur
7. Réorganisation dossiers (tâche secondaire)
