# Spec — Pages Étudiant V2 (portage V1 + refactor vision)

> Driver : `docs/tasks/task9.md` (prompt similaire à `task1.md`). Portage des pages `student/` V1 → V2.
> **Règle de décision** (utilisateur) : *se fier à la vision `docs/visions/roles/student.md` quand
> c'est pertinent, sinon conserver l'existant V1.*
> **Conserver le visuel** (recopie ~à l'identique, adaptation conventions V2 uniquement) :
> `student/page.tsx` (dashboard), `student/session/`, `student/planning/`.

## 1. Source V1

`C:\PROJECTS\DEV\ULTIMATE\SAVE\attendancy\src\app\(attendancy)\[slug]\student\`

| Page V1 | Traitement V2 |
|---|---|
| `page.tsx` (dashboard) | **Visuel conservé** — recopie |
| `session/page.tsx` | **Visuel conservé** — recopie |
| `planning/page.tsx` | **Visuel conservé** — recopie |
| `attendance/page.tsx` | **Refactor vision** — historique + accès justificatif |
| `courses/page.tsx` + `courses/[courseId]/page.tsx` | **Refactor vision** — fiche cours + sous-sections `schedule`/`evaluation` |
| `grades/page.tsx` | **Refactor vision** — fondu dans `courses/[courseId]/evaluation` (résultats par cours) |
| `class/page.tsx` | **Vision** — pertinent ? sinon existant (fiche classe/inscription) |
| `notifications/page.tsx` | **Existant** — pas de spécificité vision, recopie |
| `layout.tsx` | Portage (sidebar `studentRoutes`, breadcrumb, RoleLiveBar) |

## 2. Dépendances V1 des 3 pages à visuel conservé

**Dashboard** → `@/services/student` (`getStudentProfileAction`, `getStudentStatsAction`, `getStudentScheduleAction`),
`@/services/schedule/policy` (`resolveScheduleUiStatus`), composants `@/components/student/ui/{badges,stat,illustrations}`,
`@/components/student/StudentDayRing`.

**Session** → `@/services/student` (`getStudentProfileAction`, **`getStudentActiveSessionAction`**),
`@/components/student/session/StudentScanButton`, `@/components/student/ui/{badges,illustrations}`.

**Planning** → `@/services/student` (`getStudentProfileAction`, `getStudentScheduleAction`),
`@/components/student/planning/StudentPlanningCalendar`, `@/components/planning/utils` (`mapScheduleToEvent`),
`@/components/student/ui/illustrations`.

## 3. État V2 (constaté)

| Élément | État V2 | Action |
|---|---|---|
| Service `student` : `getStudentProfileAction` | ✅ présent, shape compatible (`{studentId,classId,groupIds,user}`) | réutiliser |
| `getStudentScheduleAction` | ✅ présent, shape compatible (rows `{id,status,teacher,room,course,startTime,endTime,notes}`) | réutiliser |
| `getStudentStatsAction` | ⚠️ présent mais retourne `{attendanceRate,totalCourses,todayCount,averageGrade,totalEvaluations}` — **manque `today.{doneSessions,totalSessions,absences,doneMinutes,totalMinutes}`** requis par `StudentDayRing` | **étendre** ou dégrader le ring |
| `getStudentActiveSessionAction` | ❌ **absent** en V2 (existe en V1) | **porter** depuis V1 |
| `schedule/policy` `resolveScheduleUiStatus` | ✅ présent | réutiliser |
| `planning/utils` `mapScheduleToEvent` | ✅ présent (`ScheduleRow → ScheduleEvent`) | réutiliser |
| `@/components/student/**` (UI rôle étudiant) | ❌ absent (seul `sections/` = gestion Direction) | **porter** `ui/`, `session/`, `planning/`, `user/nav` |
| `studentRoutes` (navigation) | ❌ absent | porter |
| Pages `app/(app)/[slug]/student/**` | ❌ aucune | créer |

## 4. User stories (vision)

- **US1 (P1)** Dashboard : prochain cours, journée, suivi assiduité (visuel V1).
- **US2 (P1)** Session en cours : infos séance + émargement QR (visuel V1).
- **US3 (P1)** Planning global : calendrier des séances (visuel V1).
- **US4 (P2)** Historique de présence + accès dépôt justificatif (`attendance/` + `attendance/[attendanceId]/justify/`, vision).
- **US5 (P2)** Détail cours + sous-sections `schedule` / `evaluation` (vision).
- **US6 (P3)** Notifications (existant).

## 5. Invariants / contraintes

- Portage, **pas d'écriture from scratch** : recopier depuis V1, adapter aux conventions V2.
- Backend `student` = **service** → toute nouvelle action passe par le pattern (`database/`+`actions/`) + générateurs.
- Pages RSC → via `actions/`, `await connection()` si pas de `getUserInfo()` direct (PPR).
- Composant client → hooks `hooks/data/*` (jamais action directe) ; import via barrels ; `customToast`.
- Regroupement semi-modulaire par domaine : tout le student-role sous `components/student/` (barrels).

## 6. Critères de succès

- [ ] 3 pages (dashboard/session/planning) rendues **visuellement identiques** à la V1, branchées sur le service `student` V2.
- [ ] `getStudentActiveSessionAction` ajouté au service `student` (généré `.api`/types, `api:check` vert).
- [ ] `StudentDayRing` alimenté (stats `today`) **ou** dégradé proprement si l'extension est hors périmètre.
- [ ] Pages refactorées alignées sur la vision (attendance+justify, courses/[courseId]/{schedule,evaluation}).
- [ ] `components/student/` : barrels + `CLAUDE.md` (composants UI critiques). 0 nouvelle erreur TS.
