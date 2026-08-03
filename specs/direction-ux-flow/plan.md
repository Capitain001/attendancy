# Plan : Flux UX Direction

**Branch**: `v1-pattern-sync`
**Spec**: [spec.md](./spec.md)
**Status**: Phase 1 ✅ — Phases 2–8 ⏳

---

## État des prérequis

| Prérequis | Statut | Notes |
|---|---|---|
| Service `direction` (DB layer + actions) | ✅ Complet | `database/`, `actions/`, `types.ts`, `validation.ts`, `CLAUDE.md` |
| Service `organization` | ✅ Présent | `getOrgResourcesCountsAction`, `getOrgDailyMetricsAction` |
| Service `academic-year` | ✅ Présent | actions read + write |
| Service `class` | ✅ Présent | actions read + write |
| Service `department` | ✅ Présent | actions read + write |
| Service `program-track` | ✅ Présent | actions read + write |
| Service `course` | ✅ Présent | actions read + write |
| Service `teacher` | ✅ Présent | actions read + write |
| Service `student` | ✅ Présent | actions read + write |
| Service `session` | ✅ Présent | `getDirectionSessionsAction`, `getActiveSessionsAction` |
| Service `attendance` | ✅ Présent | `getOrgTodayAbsencesAction`, `getClassAttendanceRatesAction`, `getOrgStudentAttendanceRatesAction` |
| Service `room` | ✅ Présent | actions read + write |
| Service `invite` | ✅ Présent | flux existant |
| Composant `event-calendar` | ✅ Présent | `src/components/event-calendar/` |
| `[slug]/direction/` (routes) | ❌ Inexistant | Phases 2–8 entières à créer |
| Service `parent` | ❌ Inexistant | Phase 5 parents bloquée — créer ou chercher via `student` |
| `getOrgAuditLogsAction` | ❌ Manquant | À créer Phase 8 dans `modules/audit/queries.ts` + action wrapper |

---

## Phase 1 — Direction service DB layer ✅ COMPLET

**Toutes les implémentations présentes :** queries, mutations, cache, types, validation, CLAUDE.md, actions.
Aucune tâche restante.

---

## Phase 2 — Layout Direction + Navigation ⏳ (~3h)

**Objectif** : Skeleton navigable — sidebar 7 sections, breadcrumb, layout RSC.

**Note PPR** : layout.tsx RSC sans `getUserInfo()` direct → pas de `connection()` (pas d'accès dynamique en tête).

### Tâches

- [ ] T001 Créer `src/app/(app)/[slug]/direction/layout.tsx` — layout RSC : sidebar 7 items + slot enfant
- [ ] T002 Créer `src/app/(app)/[slug]/direction/_components/DirectionNav.tsx` — client, liens actifs par pathname, icônes Lucide
- [ ] T003 Créer `src/app/(app)/[slug]/direction/_components/DirectionHeader.tsx` — titre section + breadcrumb
- [ ] T004 Créer `src/app/(app)/[slug]/direction/page.tsx` — RSC vide (placeholder dashboard, remplacé Phase 3)
- [ ] T005 [P] Créer `src/app/(app)/[slug]/direction/academic/layout.tsx` — sous-nav academic (redirect → classes)
- [ ] T006 [P] Créer `src/app/(app)/[slug]/direction/people/layout.tsx` — sous-nav people
- [ ] T007 [P] Créer stubs de routes vides pour toutes les sections (academic, people, attendance, schedule, evaluation, administration)

**Checkpoint** : ✋ Navigation entre 7 sections fonctionne, item actif visible, breadcrumb correct.

**Notes** :

---

## Phase 3 — Dashboard ⏳ (~3h)

**Objectif** : Page d'accueil direction — métriques, année courante, sessions du jour en streaming.

**Fetches parallèles RSC :**
```ts
const [metrics, year] = await Promise.all([
  getOrgResourcesCountsAction(),   // services/organization
  getCurrentAcademicYearAction(),  // services/academic-year
])
```

### Tâches

- [ ] T008 Créer `src/components/direction/dashboard/OrgMetricsCard.tsx` — affiche classes / enseignants / étudiants depuis `getOrgResourcesCountsAction`
- [ ] T009 [P] Créer `src/components/direction/dashboard/AcademicYearBanner.tsx` — année courante + dates depuis `getCurrentAcademicYearAction`
- [ ] T010 [P] Créer `src/components/direction/dashboard/TodaySessionsWidget.tsx` — RSC enfant, `getDirectionSessionsAction` filtré date=today
- [ ] T011 [P] Créer `src/components/direction/dashboard/AttendanceAlerts.tsx` — `getOrgTodayAbsencesAction`, placeholder si vide
- [ ] T012 Mettre à jour `src/app/(app)/[slug]/direction/page.tsx` — RSC complet avec `Promise.all` + Suspense pour `TodaySessionsWidget`

**Checkpoint** : ✋ Dashboard affiche métriques, année courante, sessions du jour streamées.

**Notes** :

---

## Phase 4 — Academic ⏳ (~5h)

**Objectif** : 4 sous-sections — departments → programs → classes → courses (ordre dépendance).

**Pattern par page** : RSC → action → composant liste + modale de mutation côté client via `useCrudEntity`.

### Tâches — Departments

- [ ] T013 Créer `src/components/direction/academic/DepartmentList.tsx` — cartes par département + counts (enseignants rattachés)
- [ ] T014 Créer `src/app/(app)/[slug]/direction/academic/departments/page.tsx` — RSC, `getDepartmentsAction`

### Tâches — Programs

- [ ] T015 [P] Créer `src/components/direction/academic/ProgramList.tsx` — filières avec classes associées
- [ ] T016 [P] Créer `src/app/(app)/[slug]/direction/academic/programs/page.tsx` — RSC, `getProgramTracksAction`

### Tâches — Classes

- [ ] T017 Créer `src/components/direction/academic/ClassList.tsx` — tableau + filtre yearId + sélecteur année
- [ ] T018 [P] Créer `src/components/direction/academic/ClassDetail.tsx` — tabs : étudiants / cours / groupes / termes (RSC + Suspense par tab)
- [ ] T019 Créer `src/app/(app)/[slug]/direction/academic/classes/page.tsx` — RSC, `getClassesAction(yearId?)`
- [ ] T020 [P] Créer `src/app/(app)/[slug]/direction/academic/classes/[classId]/page.tsx` — RSC, `getClassAction(classId)`
- [ ] T021 [P] Créer `src/app/(app)/[slug]/direction/academic/classes/[classId]/students/page.tsx` — étudiants inscrits + groupes

### Tâches — Courses

- [ ] T022 [P] Créer `src/components/direction/academic/CourseList.tsx` — cours avec UE + enseignant principal
- [ ] T023 [P] Créer `src/app/(app)/[slug]/direction/academic/courses/page.tsx` — RSC, `getCoursesAction`

**Checkpoint** : ✋ Les 4 listes academic affichent vraies données. Mutations (create/update/remove) fonctionnelles.

**Notes** :

---

## Phase 5 — People ⏳ (~4h)

**Objectif** : Enseignants, étudiants, responsables légaux.

⚠️ **Prérequis bloquant** : Service `parent` inexistant. Deux options :
1. Ajouter une query `getParents(orgId)` dans `services/student/database/` (parents liés via `StudentParent`)
2. Créer un service `parent` minimal (database + action uniquement)

### Tâches — Teachers

- [ ] T024 Créer `src/components/direction/people/TeacherList.tsx` — tableau + filtre département + charges
- [ ] T025 [P] Créer `src/components/direction/people/TeacherDetail.tsx` — cours assignés, indisponibilités
- [ ] T026 Créer `src/app/(app)/[slug]/direction/people/teachers/page.tsx` — RSC, `getTeachersAction(deptId?)`
- [ ] T027 [P] Créer `src/app/(app)/[slug]/direction/people/teachers/[teacherId]/page.tsx` — RSC, `getTeacherAction`

### Tâches — Students

- [ ] T028 [P] Créer `src/components/direction/people/StudentList.tsx` — tableau + sélecteur classe
- [ ] T029 [P] Créer `src/app/(app)/[slug]/direction/people/students/page.tsx` — RSC, `getEnrolledStudentsAction(classId?)`

### Tâches — Parents

- [ ] T030 Décider : query dans `services/student/database/` ou service `parent` dédié (vérifier schéma `StudentParent`)
- [ ] T031 Créer `src/components/direction/people/ParentList.tsx` — responsables + enfants liés
- [ ] T032 Créer `src/app/(app)/[slug]/direction/people/parents/page.tsx` — RSC, action à déterminer selon T030

**Checkpoint** : ✋ Listes teachers + students affichent vraies données. Parents : au moins placeholder documenté.

**Notes** :

---

## Phase 6 — Attendance ⏳ (~3h)

**Objectif** : Sessions filtrables + rapports d'assiduité.

### Tâches — Sessions

- [ ] T033 Créer `src/components/direction/attendance/SessionsTable.tsx` — tableau filtrable (date, classe, enseignant, statut)
- [ ] T034 Créer `src/app/(app)/[slug]/direction/attendance/sessions/page.tsx` — RSC, `getDirectionSessionsAction` + filtres query params

### Tâches — Reports

- [ ] T035 [P] Créer `src/components/direction/attendance/AttendanceReportView.tsx` — stats par classe / période (`getOrgStudentAttendanceRatesAction`, `getClassAttendanceRatesAction`)
- [ ] T036 [P] Créer `src/app/(app)/[slug]/direction/attendance/reports/page.tsx` — RSC, fetches parallèles stats assiduité

**Checkpoint** : ✋ Sessions du jour visibles. Rapports affichent taux par classe. Filtres opérationnels.

**Notes** :

---

## Phase 7 — Schedule ⏳ (~4h)

**Objectif** : Calendrier global (réutilise `event-calendar`), gestion salles, événements org.

### Tâches — Calendar

- [ ] T037 Créer `src/app/(app)/[slug]/direction/schedule/calendar/page.tsx` — RSC, données `getClassSchedulesAction` ou `getSchedulesAction`, Suspense
- [ ] T038 Créer composant wrapper `src/components/direction/schedule/DirectionCalendar.tsx` — client, adapte données → format `event-calendar`, sélecteur classe / enseignant

### Tâches — Rooms

- [ ] T039 [P] Créer `src/components/direction/schedule/RoomList.tsx` — CRUD salles (liste + modale create/edit)
- [ ] T040 [P] Créer `src/app/(app)/[slug]/direction/schedule/rooms/page.tsx` — RSC, `getRoomsAction`

### Tâches — Events

- [ ] T041 [P] Créer `src/app/(app)/[slug]/direction/schedule/events/page.tsx` — RSC, placeholder si service `event` indisponible (documenter blocage)

**Checkpoint** : ✋ Calendrier affiché avec séances. Salles listées + CRUD fonctionnel.

**Notes** :

---

## Phase 8 — Administration ⏳ (~4h)

**Objectif** : Paramètres org + journal d'audit paginé.

⚠️ **Prérequis** : `getOrgAuditLogsAction` absent. À créer :
1. Ajouter `getOrgAuditLogs(orgId, filters)` dans `src/modules/audit/queries.ts`
2. Créer wrapper action dans `src/services/audit/` (ou action directe dans le page)

### Tâches — Settings

- [ ] T042 Créer `src/components/direction/administration/OrgSettingsForm.tsx` — client, `getOrgIdentityAction` + `getOrgDetailsAction` → mutations `updateOrgIdentityAction` / `setOrgDetailsAction`
- [ ] T043 Créer `src/app/(app)/[slug]/direction/administration/settings/page.tsx` — RSC, données org initiales

### Tâches — Audit

- [ ] T044 Ajouter `getOrgAuditLogs(orgId, filters?: { resource?, action?, limit?, cursor? })` dans `src/modules/audit/queries.ts`
- [ ] T045 Créer action `getOrgAuditLogsAction` dans `src/services/audit/` (wrapping `getOrgAuditLogs`, `orgId` du token)
- [ ] T046 Créer `src/components/direction/administration/AuditLogTable.tsx` — tableau RSC paginé, filtre resource / action / date
- [ ] T047 Créer `src/app/(app)/[slug]/direction/administration/audit/page.tsx` — RSC paginé (searchParams → cursor)

**Checkpoint** : ✋ Paramètres org modifiables avec feedback toast. Journal d'audit lisible, filtrable, paginé.

**Notes** :

---

## Phase 9 — Evaluation ⏳ (~2h)

**Objectif** : Vue globale évaluations par classe/terme (section prévue dans routes).

- [ ] T048 Identifier service `evaluation` ou `grade` existant (vérifier `src/services/`)
- [ ] T049 Créer `src/app/(app)/[slug]/direction/evaluation/page.tsx` — RSC ou placeholder documenté selon disponibilité du service

**Notes** :

---

## Ordre d'exécution recommandé

```
Phase 2 (layout + nav)
    ↓
Phase 3 (dashboard)  ←  MVP lisible
    ↓
    ├─→ Phase 4 (academic)
    ├─→ Phase 5 (people)
    ├─→ Phase 6 (attendance)
    └─→ Phase 7 (schedule)
    ↓
Phase 8 (administration)
Phase 9 (evaluation)
```

Phases 4–7 indépendantes entre elles — parallélisables.

---

## Checkers à lancer après toute modification de `src/services/direction/`

```bash
npx tsx scripts/generate/naming/check.ts direction
npx tsx scripts/generate/types/check.ts direction
npx tsx scripts/generate/api/api.ts direction
```

---

## Conventions rappel

- RSC layout → jamais `getUserInfo()` direct sans `connection()` en tête
- `orgId` → toujours du token auth serveur, jamais body/query
- Mutations client → toujours via `src/hooks/data/<domain>/` (`useCrudEntity` / `useEntity`)
- Toast → `@/lib/toast/custom-toast` (jamais sonner direct)
- Actions retour → `{ data } | { error: string }` — narrowing `if ('error' in result)`
- Soft delete → préfixe `remove` · Hard delete → préfixe `delete`
