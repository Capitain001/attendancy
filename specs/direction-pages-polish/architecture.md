# Architecture: Polish & Conception pages Direction restantes

**Feature**: direction-pages-polish
**Date**: 2026-08-07
**Branch**: `direction-pages-polish`
**Specs**: [spec.md](./spec.md)

---

## Summary

Toutes les pages existent dans le routeur Next.js mais 6 sont des stubs vides et 2 sont insuffisantes. Aucun nouveau service n'est requis : tous les services métier nécessaires (session, attendance, teacher, student, event, function, teacher-unavailability, schedule) exposent déjà les actions nécessaires via `.api/`. Le travail est purement **UI + RSC pages + quelques actions manquantes** dans des services existants.

---

## Technical Context

**Stack** : Next.js 16 PPR (`cacheComponents: true`) · React 19 · TypeScript strict · Tailwind v4 + shadcn/ui · Prisma v7 (adapter pg)
**Auth** : Supabase SSR — `authAccess({ requiredRole: 'DIRECTION' })` dans chaque action
**Patterns** : service-module-pattern · RSC pages + `await connection()` · hooks `hooks/data/<domain>/` pour composants clients · `ActionResponse { data } | { error }` · types inférés `GetXxxDto[number]`
**Pas de nouveau service** · Pas de migration DB · Pas de seed

---

## Technical Decisions

### Décision 1 : Supervision sessions — RSC + searchParams (pas de Realtime)

**What** : La page Sessions filtre par `date` et `classId` via `searchParams` (URL query params). Pas de Supabase Realtime pour ce sprint.
**Why** : `TodaySessionsWidget` (RSC async) existe déjà et couvre 90% du besoin. Un rechargement de page suffit pour un contexte de supervision Direction (pas un opérateur temps-réel). Realtime = complexité disproportionnée pour ce sprint.
**Trade-offs** : Pas de push live mais zéro complexité websocket.

### Décision 2 : Fiches détail enseignant/étudiant — nouvelle action `getStudentByIdForDirectionAction`

**What** : `getStudentProfileAction` retourne le profil de l'étudiant connecté. Pour la Direction, il faut un `getStudentByIdForDirectionAction(studentId)` dans le service `student`.
**Why** : Invariant « orgId extrait du token uniquement » — la Direction accède au profil d'un autre utilisateur scopé à son org.
**Alternatives** : Passer par le service `class` en filtrant les enrollments — moins lisible, violation de ownership.

### Décision 3 : Page Fonctions — `/direction/functions/` (pas `/direction/administration/functions/`)

**What** : La navigation existante pointe vers `/direction/functions` (pas sous `administration/`). On crée la page à cet emplacement exact.
**Why** : Cohérence avec la nav existante dans `navigation.ts`.

### Décision 4 : Évaluations — stub enrichi (pas de feature complète)

**What** : Aucun service `evaluation` avec `.api/` n'existe. La page affichera un état vide clair avec un message d'attente de la feature évaluations, sans code métier.
**Why** : Évite de créer un service vide ou d'importer des modèles non finalisés.

### Décision 5 : Rapports — filtre période côté serveur via searchParams

**What** : `getOrgStudentAttendanceRatesAction` retourne les taux par étudiant (sans filtre période). On ajoute une action `getAttendanceReportAction({ classId?, termId? })` dans le service `attendance`.
**Why** : `getOrgTodayAbsencesAction` est limité à aujourd'hui. La Direction a besoin d'une vue par terme/classe.
**Alternatives** : Filtrage côté client — rejeté (volume de données trop important en prod).

### Décision 6 : Parents — via service `student` (ParentRelation)

**What** : Pas de service `parent` dédié. La liste des parents est récupérée via `getParentsForDirectionAction` dans le service `student` (accès aux `ParentRelation`).
**Why** : `ParentRelation` appartient au domaine étudiant (ownership Prisma). Créer un service parent séparé serait prématuré.

---

## Architecture Overview

### Fichiers à créer

```
apps/web/src/
├── app/(app)/[slug]/direction/
│   ├── people/
│   │   ├── teachers/
│   │   │   └── [teacherId]/page.tsx              # NEW — fiche enseignant
│   │   └── students/
│   │       └── [studentId]/page.tsx              # NEW — fiche étudiant
│   └── functions/
│       └── page.tsx                              # NEW — fonctions direction
│
├── components/direction/
│   ├── people/
│   │   ├── TeacherDetailPage.tsx                 # NEW
│   │   ├── StudentDetailPage.tsx                 # NEW
│   │   └── ParentList.tsx                        # NEW
│   ├── schedule/
│   │   └── SessionsDirectionPage.tsx             # NEW (composant client)
│   ├── attendance/
│   │   └── AttendanceReportPage.tsx              # NEW (composant client)
│   ├── functions/
│   │   └── FunctionDirectionPage.tsx             # NEW
│   └── events/
│       └── EventDirectionPage.tsx                # NEW
│
├── hooks/data/
│   ├── attendance/
│   │   └── useAttendanceReport.ts               # NEW
│   └── functions/
│       └── useFunctions.ts                      # NEW (si pas encore)
```

### Fichiers à modifier

```
apps/web/src/
├── app/(app)/[slug]/direction/
│   ├── attendance/sessions/page.tsx             # MOD — enrichi avec SessionsDirectionPage
│   ├── attendance/reports/page.tsx              # MOD — remplacé par AttendanceReportPage
│   ├── people/parents/page.tsx                  # MOD — stub → ParentList
│   ├── schedule/events/page.tsx                 # MOD — stub → EventDirectionPage
│   └── evaluation/page.tsx                      # MOD — stub enrichi (message attente)
│
├── components/direction/people/
│   ├── TeacherList.tsx                          # MOD — liens vers [teacherId]
│   └── StudentList.tsx                          # MOD — liens vers [studentId]
│
├── services/student/
│   ├── database/student.queries.ts              # MOD — getStudentByIdForDirection
│   ├── actions/student.queries.ts               # MOD — getStudentByIdForDirectionAction
│   └── generated.types.ts                       # MOD — régénéré
│
└── services/attendance/
    ├── database/attendance.queries.ts           # MOD — getAttendanceReport
    ├── actions/attendance.queries.ts            # MOD — getAttendanceReportAction
    └── generated.types.ts                       # MOD — régénéré
```

---

## Implementation Approach

### US-001 — Sessions de cours (P1)

**Services** : `session` → `getDirectionSessionsAction()` (retourne aujourd'hui)
**Page** : `attendance/sessions/page.tsx` — RSC avec `searchParams?: { date?, classId? }`
**Composant** : `SessionsDirectionPage` (client) — liste + filtre date/classe + expand détail
**Types** : `GetDirectionSessionsDto[number]` inféré depuis `getDirectionSessionsAction`
**Pattern** : TodaySessionsWidget existant réutilisé en Suspense fallback

### US-002 — Rapports d'assiduité (P1)

**Services** : `attendance` → nouvelle `getAttendanceReportAction({ classId?, termId? })`
**Page** : `attendance/reports/page.tsx` — RSC avec searchParams `classId` + `termId`
**Composant** : `AttendanceReportPage` (client) — filtre + liste triée par taux d'absence + badge risque
**Données risque** : taux < 70% = rouge, 70-85% = orange, >85% = vert (seuils configurables via settings org)

### US-003 — Fiche enseignant (P2)

**Services** : `teacher` → `getTeacherAction(id)` · `getTeacherCoursesAction` · `getTeacherSchedulesAction` · `teacher-unavailability` → `getTeacherUnavailabilitiesAction`
**Page** : `people/teachers/[teacherId]/page.tsx` — RSC, tous les appels en `Promise.all`
**Composant** : `TeacherDetailPage` (server component pur — pas de state)
**Modification** : `TeacherList.tsx` → chaque ligne = `<Link href={.../${t.id}}>` 

### US-004 — Fiche étudiant (P2)

**Services** : `student` → nouvelle `getStudentByIdForDirectionAction(studentId)` + `getStudentStatsAction` · `attendance` → `getStudentAttendanceSummaryAction`
**Page** : `people/students/[studentId]/page.tsx` — RSC
**Composant** : `StudentDetailPage` (server component pur)
**Modification** : `StudentList.tsx` → chaque ligne = `<Link>`

### US-005 — Parents (P3)

**Services** : `student` → nouvelle `getParentsForDirectionAction()` (via `ParentRelation`)
**Page** : `people/parents/page.tsx` — MOD stub → liste réelle
**Composant** : `ParentList.tsx` — tableau simple avec étudiant(s) lié(s)

### US-006 — Fonctions direction (P3)

**Services** : `function` → `getFunctionsAction()`, `createFunctionAction`, `updateFunctionAction`, `deleteFunctionAction`, `getFunctionProfilesAction`
**Page** : `functions/page.tsx` (NOUVELLE, hors `administration/`)
**Hook** : `useFunctions.ts` (si absent dans `hooks/data/`) 
**Composant** : `FunctionDirectionPage` — liste + CRUD inline (pattern ProgramList existant)

### US-007 — Événements (P4)

**Services** : `event` → `getEventsAction`, `createEventAction`, `removeEventAction`
**Page** : `schedule/events/page.tsx` — MOD stub → EventDirectionPage
**Composant** : `EventDirectionPage` — liste avec types/statuts

### US-008 — Évaluations (P4)

**Page** : `evaluation/page.tsx` — stub enrichi : message clair + lien doc, pas de service
**Décision** : placeholder professionnel jusqu'à ce que le service évaluations existe

---

## Integration Points

- **`session`** : `getDirectionSessionsAction` → réutilisé tel quel pour US-001 (filtrage date = rechargement RSC via searchParams)
- **`attendance`** : 2 nouvelles fonctions DB/action à ajouter (US-002 + US-004)
- **`student`** : 2 nouvelles fonctions DB/action à ajouter (US-004 + US-005)
- **`teacher`** : aucune modification de service — toutes les actions existent
- **`function`** : aucune modification de service — toutes les actions existent
- **`event`** : aucune modification de service — toutes les actions existent

---

## Workflow outils à appliquer après chaque session de service

```bash
cd apps/web

# Après modification service student :
bun run check:naming:svc -- student
bun run check:types:svc -- student
bun run generate:api:svc -- student
bun run api:check

# Après modification service attendance :
bun run check:naming:svc -- attendance
bun run check:types:svc -- attendance
bun run generate:api:svc -- attendance
bun run api:check

# Régénérer summary après toute nouvelle action (optionnel mais recommandé) :
bun run generate:summary:svc -- student
bun run generate:summary:svc -- attendance
```

---

## Technical Constraints

- `await connection()` obligatoire en tête de toute RSC page direction (PPR actif)
- `orgId` extrait du token uniquement — jamais passé en paramètre URL
- Composants clients → uniquement via `hooks/data/<domain>/`
- Pas de `list*`, toujours `get*`
- Soft delete → préfixe `remove`, hard delete → `delete`

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `ParentRelation` pas exposée dans service `student` | Med | Vérifier schema Prisma avant d'écrire l'action parent |
| `getAttendanceReport` peut être lente sur grand volume | Med | `cacheTag` + `cacheLife('minutes')` sur la DB query |
| TeacherList / StudentList modifiés → régression autres pages | Low | Garder les props existants, ajouter `href` optionnel |

## Open Questions

Aucune — les clarifications de la spec ont été résolues par les décisions ci-dessus (sessions RSC sans Realtime, évaluations stub, parents via service student).
