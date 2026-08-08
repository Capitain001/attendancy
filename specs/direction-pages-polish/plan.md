# Tasks: Direction Pages Polish

**Branch**: `direction-pages-polish`
**Specs**: [spec.md](./spec.md)
**Architecture**: [architecture.md](./architecture.md)
**Status**: Not Started ⏳

---

## Phase 1: Lecture contexte ⏳ (~30min)

**Purpose**: Lire les CLAUDE.md + summaries des services à modifier avant toute action

> Règle CLAUDE.md : lire `summary/<service>.json` + `services/<service>/CLAUDE.md` avant de toucher un service.

- [ ] T001 [P] Lire `apps/web/summary/student.json`
- [ ] T002 [P] Lire `apps/web/summary/attendance.json`
- [ ] T003 [P] Lire `apps/web/src/services/student/CLAUDE.md`
- [ ] T004 [P] Lire `apps/web/src/services/attendance/CLAUDE.md`
- [ ] T005 Vérifier schéma Prisma `ParentRelation` — confirmer champs disponibles avant T008

**Commandes de référence rapide :**
```bash
# Voir les actions exposées
cat apps/web/src/services/student/.api/index.json
cat apps/web/src/services/attendance/.api/index.json
cat apps/web/src/services/function/.api/index.json
cat apps/web/src/services/event/.api/index.json
```

**Notes:**
-

---

## Phase 2: Fondation — Nouvelles actions serveur ⏳ (~2h)

**Purpose**: Actions DB manquantes qui bloquent US-002, US-004, US-005

⚠️ **CRITIQUE**: US-002 (rapports), US-004 (fiche étudiant), US-005 (parents) ne peuvent pas démarrer sans ces actions.

### Service `student`

- [ ] T006 Écrire `getStudentByIdForDirection(studentId, orgId)` dans `apps/web/src/services/student/database/student.queries.ts`
  - Retourner : identité user, classe, groupe, stats (taux assiduité via join ou _count), `enrolledAt`
  - Filtrer par `orgId` extrait du token dans l'action (pas passé en paramètre DB direct)
- [ ] T007 Écrire `getStudentByIdForDirectionAction(studentId)` dans `apps/web/src/services/student/actions/student.queries.ts`
  - `authAccess({ requiredRole: 'DIRECTION' })` · retour `{ data } | { error: string }`
- [ ] T008 Écrire `getParentsForDirection(orgId)` dans `apps/web/src/services/student/database/student.queries.ts`
  - Via `ParentRelation` → inclure `parent.user` (nom, email) + `student` (nom, classe)
- [ ] T009 Écrire `getParentsForDirectionAction()` dans `apps/web/src/services/student/actions/student.queries.ts`
  - `authAccess({ requiredRole: 'DIRECTION' })` · retour `{ data } | { error }`
- [ ] T010 Mettre à jour `apps/web/src/services/student/generated.types.ts` si nécessaire + régénérer `.api/`
  ```bash
  cd apps/web
  bun run check:naming:svc -- student
  bun run check:types:svc -- student
  bun run generate:api:svc -- student
  bun run api:check
  ```

### Service `attendance`

- [ ] T011 Écrire `getAttendanceReport({ orgId, classId?, termId? })` dans `apps/web/src/services/attendance/database/attendance.queries.ts`
  - Agréger absences par étudiant · retourner `{ studentId, name, absences, total, rate }`
  - `cacheTag` + `cacheLife('minutes')` (volume potentiellement élevé)
- [ ] T012 Écrire `getAttendanceReportAction({ classId?, termId? })` dans `apps/web/src/services/attendance/actions/attendance.queries.ts`
  - `authAccess({ requiredRole: 'DIRECTION' })` · retour `{ data } | { error }`
- [ ] T013 Régénérer `.api/` attendance
  ```bash
  cd apps/web
  bun run check:naming:svc -- attendance
  bun run check:types:svc -- attendance
  bun run generate:api:svc -- attendance
  bun run api:check
  ```

**Checkpoint**: ✋ Toutes les nouvelles actions compilent et `api:check` passe → US-002/004/005 peuvent démarrer

**Notes:**
-

---

## Phase 3: US-001 — Sessions de cours (P1) ⏳ (~3h)

**Goal**: Page dédiée sessions avec statuts, filtre date/classe, expand détail par session

**Independent Test**: Naviguer vers `/[slug]/direction/attendance/sessions` → voir les sessions du jour avec statuts visuels

### Tasks

- [ ] T014 Modifier `apps/web/src/app/(app)/[slug]/direction/attendance/sessions/page.tsx`
  - `await connection()` en tête (PPR)
  - Récupérer `searchParams?: { date?, classId? }`
  - Appeler `getDirectionSessionsAction()` (service session — action existante)
  - Passer les données à `<SessionsDirectionPage>`
- [ ] T015 Créer `apps/web/src/components/direction/schedule/SessionsDirectionPage.tsx`
  - `'use client'`
  - Props : `sessions: GetDirectionSessionsDto`, `classes: ...`
  - Filtre date (DatePicker ou `<select>` natif) + filtre classId (Select)
  - Liste de sessions : badge statut (ACTIVE/PENDING/COMPLETED/CANCELED/MISSED), enseignant, salle, nb présents/total
  - Expand au clic → liste étudiants présents/absents (déjà dans `attendances[]` de l'action)
  - Type : `GetDirectionSessionsDto[number]` inféré depuis `@/services/session`

**Checkpoint**: ✋ Sessions visibles avec statuts colorés, filtre fonctionnel par rechargement de page

**Notes:**
-

---

## Phase 4: US-002 — Rapports d'assiduité (P1) ⏳ (~3h)

**Goal**: Filtres période/classe + agrégats par étudiant + badges risque visuel

**Independent Test**: Naviguer vers `/[slug]/direction/attendance/reports` → voir tableau par étudiant trié par taux d'absence + badges colorés

### Tasks

- [ ] T016 Modifier `apps/web/src/app/(app)/[slug]/direction/attendance/reports/page.tsx`
  - `await connection()` en tête
  - `searchParams?: { classId?, termId? }`
  - Appeler `getAttendanceReportAction({ classId, termId })` (T012)
  - Passer à `<AttendanceReportPage>`
- [ ] T017 Créer `apps/web/src/hooks/data/attendance/useAttendanceReport.ts` (si filtrage client nécessaire)
  - Hook wrappant `getAttendanceReportAction` via `useTransition` ou React Query
  - Exposer `{ data, isLoading, filter, setFilter }`
- [ ] T018 Créer `apps/web/src/components/direction/attendance/AttendanceReportPage.tsx`
  - `'use client'`
  - Tableau trié par taux d'absence ASC (plus à risque en premier)
  - Badge risque : taux < 70% = rouge, 70-85% = orange, >85% = vert
  - Filtre période : Aujourd'hui / Semaine / Mois / Terme (via searchParams → rechargement RSC)
  - Filtre classe (Select)
  - Type : `GetAttendanceReportDto[number]` depuis `@/services/attendance`

**Checkpoint**: ✋ Tableau rapport visible, badges risque colorés, filtres fonctionnels

**Notes:**
-

---

## Phase 5: US-003 — Fiche détail enseignant (P2) ⏳ (~3h)

**Goal**: Page `[teacherId]/` avec identité, cours affectés, planning, indisponibilités

**Independent Test**: Cliquer sur un enseignant dans la liste → arriver sur sa fiche avec ses informations

### Tasks

- [ ] T019 [P] Créer `apps/web/src/app/(app)/[slug]/direction/people/teachers/[teacherId]/page.tsx`
  - RSC — `await connection()` en tête
  - `Promise.all([ getTeacherAction(id), getTeacherCoursesAction(id), getTeacherSchedulesAction(id), getTeacherUnavailabilitiesAction(id) ])`
  - `notFound()` si `'error' in teacher`
  - Passer à `<TeacherDetailPage>`
- [ ] T020 [P] Créer `apps/web/src/components/direction/people/TeacherDetailPage.tsx`
  - Server component pur (pas de `'use client'`)
  - Sections : Identité (avatar, nom, email, département) · Cours affectés · Planning (séances à venir) · Indisponibilités
  - Types inférés : `GetTeacherDto`, `GetTeacherCoursesDto[number]`, etc.
- [ ] T021 Modifier `apps/web/src/components/direction/people/TeacherList.tsx`
  - Chaque ligne enseignant → `<Link href={`/${slug}/direction/people/teachers/${teacher.id}`}>`
  - Garder les props existants intacts

**Checkpoint**: ✋ Navigation liste → fiche 2 clics, fiche affiche cours + planning + indispos

**Notes:**
-

---

## Phase 6: US-004 — Fiche détail étudiant (P2) ⏳ (~3h)

**Goal**: Page `[studentId]/` avec inscription, groupe, taux assiduité, justificatifs

**Independent Test**: Cliquer sur un étudiant dans la liste → arriver sur sa fiche avec son historique de présence

### Tasks

- [ ] T022 [P] Créer `apps/web/src/app/(app)/[slug]/direction/people/students/[studentId]/page.tsx`
  - RSC — `await connection()` en tête
  - `Promise.all([ getStudentByIdForDirectionAction(id), getStudentAttendanceSummaryAction(id) ])`
  - `notFound()` si `'error' in student`
  - Passer à `<StudentDetailPage>`
- [ ] T023 [P] Créer `apps/web/src/components/direction/people/StudentDetailPage.tsx`
  - Server component pur
  - Sections : Identité (nom, email, classe, groupe) · Taux d'assiduité global · Historique par cours · Justificatifs (PENDING / APPROVED / REJECTED)
  - FR-016 : bouton Approuver/Rejeter un justificatif → appel à l'action du service `justification` (vérifier existence via `.api/`)
- [ ] T024 Modifier `apps/web/src/components/direction/people/StudentList.tsx`
  - Chaque ligne → `<Link href={`/${slug}/direction/people/students/${student.id}`}>`
  - Props existants conservés

**Checkpoint**: ✋ Navigation liste → fiche, taux visible, justificatifs listés

**Notes:**
-

---

## Phase 7: US-005 Parents + US-006 Fonctions (P3) ⏳ (~4h)

**Goal US-005**: Page parents avec liens étudiants
**Goal US-006**: CRUD fonctions direction

**Independent Test**: Naviguer vers `/parents` → liste réelle · `/functions` → liste + pouvoir créer une fonction

### Tasks

#### US-005 — Parents

- [ ] T025 Modifier `apps/web/src/app/(app)/[slug]/direction/people/parents/page.tsx`
  - `await connection()` en tête
  - Appeler `getParentsForDirectionAction()` (T009)
  - Passer à `<ParentList>`
- [ ] T026 Créer `apps/web/src/components/direction/people/ParentList.tsx`
  - Server component (pas de client state)
  - Tableau : Nom parent · Email · Étudiant(s) lié(s) · Lien vers fiche étudiant
  - Empty state si aucun parent

#### US-006 — Fonctions direction

- [ ] T027 Créer `apps/web/src/app/(app)/[slug]/direction/functions/page.tsx`
  - RSC — `await connection()` en tête
  - Appeler `getFunctionsAction()` (service function — action existante)
  - Passer à `<FunctionDirectionPage>`
- [ ] T028 Vérifier existence de `apps/web/src/hooks/data/functions/useFunctions.ts`
  - Créer si absent : hook wrappant `createFunctionAction`, `updateFunctionAction`, `deleteFunctionAction`
- [ ] T029 Créer `apps/web/src/components/direction/functions/FunctionDirectionPage.tsx`
  - `'use client'` — state pour dialog création/édition
  - Via hook `useFunctions` (jamais appel direct action depuis client)
  - Liste des fonctions + bouton Créer + inline rename/delete
  - Pattern : s'inspirer de `ProgramList.tsx` existant

**Checkpoint**: ✋ `/parents` → liste réelle · `/functions` → CRUD fonctionnel

**Notes:**
-

---

## Phase 8: US-007 Événements + US-008 Évaluations (P4) ⏳ (~3h)

**Goal US-007**: Liste événements avec types/statuts
**Goal US-008**: Placeholder professionnel (pas de service eval existant)

**Independent Test**: `/events` → liste réelle · `/evaluation` → message clair (pas stub vide)

### Tasks

#### US-007 — Événements

- [ ] T030 Modifier `apps/web/src/app/(app)/[slug]/direction/schedule/events/page.tsx`
  - `await connection()` en tête
  - Appeler `getEventsAction()` (service event — action existante)
  - Passer à `<EventDirectionPage>`
- [ ] T031 Créer `apps/web/src/components/direction/events/EventDirectionPage.tsx`
  - `'use client'` — state dialog création
  - Liste événements : titre, type (MEETING/EXAM/DEFENSE/OTHER), date, nb participants
  - Badge statut invitation (PENDING/ACCEPTED/DECLINED)
  - Bouton Créer → dialog `createEventAction` via hook `hooks/data/event/useEvent` (vérifier existence)
  - Types : `GetEventsDto[number]` depuis `@/services/event`

#### US-008 — Évaluations (stub enrichi)

- [ ] T032 Modifier `apps/web/src/app/(app)/[slug]/direction/evaluation/page.tsx`
  - `await connection()` en tête
  - Afficher : titre "Évaluations", icône, message "Fonctionnalité en cours de développement"
  - Pas de service, pas d'import métier

**Checkpoint**: ✋ `/events` → liste · `/evaluation` → placeholder propre (pas blanc)

**Notes:**
-

---

## Phase 9: Polish & vérification finale ⏳ (~1h)

**Purpose**: Zéro stub vide + checkers de naming/types + commit

- [ ] T033 Parcourir toutes les pages Direction modifiées — vérifier qu'aucune n'affiche "en cours de développement" sauf evaluation
- [ ] T034 [P] Vérifier types service student
  ```bash
  cd apps/web
  bun run check:naming:svc -- student
  bun run check:types:svc -- student
  ```
- [ ] T035 [P] Vérifier types service attendance
  ```bash
  cd apps/web
  bun run check:naming:svc -- attendance
  bun run check:types:svc -- attendance
  ```
- [ ] T036 Validation cross-service
  ```bash
  cd apps/web
  bun run api:check
  ```
- [ ] T037 [P] Optionnel — régénérer summaries
  ```bash
  cd apps/web
  bun run generate:summary:svc -- student
  bun run generate:summary:svc -- attendance
  ```
- [ ] T038 Commit final (voir conventions git du projet)

**Notes:**
-

---

## Dépendances & Ordre d'exécution

```
Phase 1 (Lecture)
    ↓
Phase 2 (Fondation) ← BLOQUE US-002, US-004, US-005
    ↓
    ├─→ Phase 3 (US-001) — indépendant, peut démarrer après P1
    ├─→ Phase 4 (US-002) — attend T012 (getAttendanceReportAction)
    ├─→ Phase 5 (US-003) — indépendant, aucune nouvelle action requise
    ├─→ Phase 6 (US-004) — attend T007 (getStudentByIdForDirectionAction)
    ├─→ Phase 7 (US-005/006) — US-005 attend T009, US-006 indépendant
    └─→ Phase 8 (US-007/008) — indépendant
    ↓
Phase 9 (Polish)
```

### Indépendance des US

- **US-001 (P1)**: Indépendant ✅ — `getDirectionSessionsAction` existe
- **US-002 (P1)**: Attend Phase 2 (T011-T012)
- **US-003 (P2)**: Indépendant ✅ — toutes actions teacher existent
- **US-004 (P2)**: Attend Phase 2 (T006-T007)
- **US-005 (P3)**: Attend Phase 2 (T008-T009)
- **US-006 (P3)**: Indépendant ✅ — toutes actions function existent
- **US-007 (P4)**: Indépendant ✅ — toutes actions event existent
- **US-008 (P4)**: Indépendant ✅ — pas de service requis

---

## Stratégie MVP

### 🎯 MVP (P1 seulement)

1. Phase 1 → Phase 2 → Phase 3 (US-001 Sessions) → Phase 4 (US-002 Rapports)
2. **STOP** — valider que Sessions + Rapports fonctionnent
3. Livrer, puis continuer avec US-003/004 (fiches détail)

### 📈 Livraison incrémentale recommandée

| Sprint | Contenu | Valeur |
|--------|---------|--------|
| Sprint 1 | Phase 1 + 2 + 3 + 4 | Sessions + Rapports (supervision complète) |
| Sprint 2 | Phase 5 + 6 | Fiches enseignant + étudiant (navigation contextuelle) |
| Sprint 3 | Phase 7 + 8 | Parents, Fonctions, Événements, Évaluations stub |
| Polish | Phase 9 | Qualité + checks |

---

## Suivi de progression

**Légende :** ⏳ Non démarré · ⏰ En cours · ✅ Terminé

**Total tâches**: 38
**Temps estimé total**: ~19h
**Temps MVP (P1)**: ~5h (Phase 1 + 2 + 3 + 4)

---

## Notes globales

**Invariants à respecter dans toute implémentation :**
- `await connection()` en tête de toute page RSC Direction
- `orgId` depuis token uniquement — jamais URL param
- Composants clients → hook `hooks/data/<domain>/` (jamais action directe)
- Narrowing : `if ('error' in result)` — jamais `if (result.error)`
- Préfixe `get*` — jamais `list*`
- Types : `GetXxxDto[number]` inférés — jamais écrits à la main
