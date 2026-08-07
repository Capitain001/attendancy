# Architecture — Pages Étudiant V2

> Prérequis lecture (fait) : `CLAUDE.md` racine · `SKILL.md` service-module-pattern ·
> `docs/cmd/generators.md` · `docs/skills/nextjs-ppr/SKILL.md` · `hooks/CLAUDE.md` · `components/CLAUDE.md`
> · `docs/visions/roles/student.md`.

## 1. Décisions

| ID | Décision | Justification |
|---|---|---|
| A-1 | **Visuel conservé** (recopie V1) pour dashboard/session/planning ; adapter uniquement imports/conventions | task9 explicite |
| A-2 | **Routes** : vision quand pertinent, sinon existant V1 | règle utilisateur |
| A-3 | Tout le student-role sous `components/student/` (barrels par sous-domaine) | semi-modulaire (task1) |
| A-4 | `getStudentActiveSessionAction` **porté** dans le service `student` (couches DB+actions) | absent V2, existe V1 |
| A-5 | `StudentDayRing` : étendre `getStudentStatsAction` avec `today{...}` **si peu coûteux**, sinon rendre le ring optionnel (déjà gardé par `stats?.today` en V1) | dégradation gracieuse |
| A-6 | Réutiliser `resolveScheduleUiStatus` (schedule) + `mapScheduleToEvent` (planning) V2 | déjà présents |

### Routing cible (A-2 appliqué)

| Page | Route V2 | Source |
|---|---|---|
| Dashboard | `student/` | V1 (visuel) |
| Session | `student/session/` | **V1 conservé** (visuel ; vision `sessions/[sessionId]` non pertinente ici — l'étudiant n'a qu'une séance active) |
| Planning | `student/planning/` | **V1 conservé** (visuel ; alias possible `student/schedule` plus tard) |
| Historique présence | `student/attendance/` | vision |
| Justificatif | `student/attendance/[attendanceId]/justify/` | vision |
| Cours (liste) | `student/courses/` | V1 |
| Cours (détail) | `student/courses/[courseId]/` (+ `schedule/`, `evaluation/`) | vision |
| Notifications | `student/notifications/` | existant |

## 2. Composants à porter (depuis V1 `src/components/student/`)

```
components/student/
  index.ts                       # barrel principal
  CLAUDE.md                      # composants UI critiques (point d'entrée pages RSC)
  ui/
    badges.tsx                   # ScheduleStatusBadge, AttendanceStatusBadge, ATTENDANCE_META
    stat.tsx                     # StudentStat, StudentStatGrid
    illustrations.tsx            # StudentEmpty, Backpack/CalendarRest/SessionPause…
  StudentDayRing.tsx             # anneau interactif (dashboard)
  session/
    StudentScanButton.tsx        # émargement QR (client)
  planning/
    StudentPlanningCalendar.tsx  # calendrier (consomme mapScheduleToEvent)
  user/
    navigation.ts                # studentRoutes (sidebar)
```

> `components/student/sections/` (existant, gestion Direction) **inchangé** — ne pas confondre.
> Adapter les imports V1 → V2 : `@/components/student/ui/badges` reste ; vérifier `@/lib/utils`
> (`formatTime`, `cn`), `@/components/planning` (barrel), `@/components/layout/sidebar`.

## 3. Backend — service `student`

### 3.1 Réutilisé tel quel
`getStudentProfileAction`, `getStudentScheduleAction` (shapes compatibles V1).

### 3.2 À porter : `getStudentActiveSessionAction`
- Source V1 : `services/student/actions.ts` + `.api/getStudentActiveSessionAction.json`.
- Cible V2 (pattern) : `student/database/*.queries.ts` (`getStudentActiveSession(classId, groupIds, orgId)` avec `'use cache'`)
  + `student/actions/*.queries.ts` (`getStudentActiveSessionAction` : `authAccess` → DB → `{data}|{error}`).
- Retour attendu (contrat page session) : `{ course, room?, teacher?, startTime, endTime, myAttendance?: { status, recordedAt } } | null`.
- Vérifier ownership `orgId` + scoping classe/groupes.

### 3.3 À décider : `getStudentStatsAction.today`
- V1 fournit `today{ doneSessions, totalSessions, absences, doneMinutes, totalMinutes }`.
- V2 ne l'a pas. Option A (recommandée si le calcul existe déjà côté schedule/attendance) : étendre la query stats.
  Option B : garder le ring masqué (`stats?.today` falsy) → dashboard fonctionnel sans le ring.

## 4. Dépendances cross-service (via actions owner)

| Besoin | Fournisseur V2 |
|---|---|
| Séances de l'étudiant | `student` (`getStudentScheduleAction`) / `schedule` |
| Statut UI d'une séance | `schedule/policy` `resolveScheduleUiStatus` |
| Événements calendrier | `components/planning/utils` `mapScheduleToEvent` |
| Historique présence + justificatif | `attendance` / `justification` (à vérifier : actions étudiant existantes ?) |
| Résultats (evaluation) | `evaluation` (à vérifier) |
| Émargement QR | `session` / `attendance` (token rotatif — vérifier action côté étudiant) |

> ⚠️ Les pages **refactor vision** (attendance/justify, evaluation) dépendent de services à **auditer**
> avant P5 (existence des actions étudiant). Consulter `summary/{attendance,justification,evaluation,session}.json`.

## 5. Layout & navigation
- Porter `student/layout.tsx` : `SidebarProvider` + `UserSidebar routes={studentRoutes}` + `BreadcrumbLayout` + `RoleLiveBar role="STUDENT"`.
- Vérifier existence V2 : `@/components/layout/sidebar` (UserSidebar, nav helpers), `RoleLiveBar`. Sinon adapter au shell V2.

## 6. Générateurs (service `student` uniquement)
```bash
cd apps/web
# après ajout de getStudentActiveSession(+Action) et éventuelle extension stats
bun run generate:types:svc -- student
bun run generate:api:svc   -- student
bun run api:check
bun run check:naming:svc   -- student
bun run generate:summary:svc -- student
```
Les composants/pages ne sont pas des services → pas de générateur (conventions frontend seulement).

## 7. Regroupement (semi-modulaire, task1)
Tout le student-role sous `components/student/**` avec barrels → un seul point d'import
(`@/components/student`, `@/components/student/session`, …), évite les imports profonds éparpillés.
