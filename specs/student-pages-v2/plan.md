# Plan — Pages Étudiant V2

**Branch** : `main` (ou dédiée `student-pages-v2`) · **Spec** : [spec.md](./spec.md) · **Archi** : [architecture.md](./architecture.md)
**Statut** : Not Started ⏳

> Portage V1 → V2 (recopie, pas from scratch). Règle routes : **vision si pertinent, sinon existant V1**.
> Visuel conservé : dashboard / session / planning.

## État d'avancement (màj implémentation)

| Livrable | Statut |
|---|---|
| P1 `getStudentActiveSession` (+Action) | ✅ fait (compose session+attendance) |
| P1 `getStudentStatsAction.today` (ring) | ⏸ différé → dashboard sans `StudentDayRing` (A-5 option B) |
| P2 `ui/{badges,stat,illustrations}` + barrels | ✅ fait |
| P2 `StudentDayRing` | ⏸ non porté (dépend `analytic-ring` + stats.today) |
| P3 Dashboard `student/page.tsx` | ✅ fait (visuel V1, ring omis), TS 0 err |
| P3 Session `student/session/page.tsx` + `StudentScanButton` | ✅ fait — ⚠ lecteur QR placeholder (`@yudiel/react-qr-scanner` absent V2) |
| P3 Planning `student/planning/page.tsx` | ⏸ **différé** — 2 gaps backend (ci-dessous) |
| P4 Layout + `studentRoutes` | ⏸ non fait (dépend `UserSidebar`/`RoleLiveBar`/`sidebar/types` V2 à auditer) |
| P5 pages refactor vision | ⏸ non commencé (audit backend requis) |

### Gaps backend planning (à traiter avant P3-planning)
1. `mapScheduleToEvent(ScheduleRow)` exige `confirmed`, `courseId/teacherId/roomId/classId/groupId`, `group` —
   or `getStudentSchedules` V2 renvoie une shape réduite. → **étendre** le select de `getStudentSchedules`.
2. `StudentSessionDialog` requiert `getStudentSessionDetailAction` (+`getStudentSessionDetail` DB) **absents V2**
   → **porter** depuis V1 (service `student`).

### Gap package
- `@yudiel/react-qr-scanner` non installé → `StudentScanButton` livré avec lecteur placeholder (bouton/dialog conservés).
  Installer le package pour réactiver le scan live.

---

## Phase 0 — Mon workflow pour CETTE tâche 📌 RELIRE À CHAQUE SESSION

> Comment j'exécute task9 (durable, survit aux compactions). Docs à **relire** (sans recopier) :
> `CLAUDE.md` racine · `SKILL.md` · `docs/cmd/generators.md` · `docs/skills/nextjs-ppr/SKILL.md` ·
> `hooks/CLAUDE.md` · `components/CLAUDE.md` · `docs/visions/roles/student.md`.

### 0.1 Retrouver une fonction / un composant existant (avant de coder)
- **Service `student` (et attendance/session/evaluation/justification)** = `src/services/*` → lecture rapide via
  `apps/web/summary/<service>.json` **d'abord**, puis `.api/<fn>.json` (source de vérité : signature, kind, deps).
  Ex. déjà vérifié : `getStudentProfileAction`, `getStudentScheduleAction`, `getStudentStatsAction` présents ;
  `getStudentActiveSessionAction` **absent** V2 (présent V1).
- **Composants V1 à recopier** : lire directement les fichiers sous
  `C:\PROJECTS\DEV\ULTIMATE\SAVE\attendancy\src\components\student\**` (pas d'index `.api`, ce sont des composants).
- Avant d'écrire dans `src/services/student/**` : lire `SKILL.md` + `SERVICE_CONTEXT.md` + `student/CLAUDE.md`.

### 0.2 Séquence d'exécution
P1 backend (porter l'action manquante) → P2 UI partagée → P3 pages visuel-conservé → P4 layout/nav →
P5 pages refactor-vision → P6 finition. Après chaque phase : `npx tsc --noEmit` **ciblé**.

### 0.3 Outils/patterns utilisés ici
- **Service `student`** → générateurs applicables : après ajout de query/action,
  `generate:types:svc -- student` → `generate:api:svc -- student` → `api:check` → `check:naming:svc -- student`.
- **Pages/composants** → conventions frontend : pages RSC via `actions/` + `await connection()` (PPR) ;
  composant client via `hooks/data/*` (jamais action directe) ; import via barrels ; `customToast` ;
  regroupement semi-modulaire sous `components/student/**`.
- Réutiliser sans réécrire : `resolveScheduleUiStatus` (schedule/policy), `mapScheduleToEvent` (planning/utils).

### 0.4 Renvoi
Détail complet générateurs/pattern : `docs/cmd/generators.md` + `SKILL.md`. Ne pas recopier ici.

---

## Phase 1 — Backend service `student` (~2h) ⏳

- [ ] T001 Lire V1 `services/student/actions.ts` (`getStudentActiveSessionAction`) + son `.api/`.
- [ ] T002 Porter en couches V2 : `student/database/*.queries.ts` → `getStudentActiveSession(classId, groupIds, orgId)`
      (`'use cache'`, `cacheTag`, select explicite) ; `student/actions/*.queries.ts` → `getStudentActiveSessionAction`
      (`authAccess` → orgId → DB → `{data}|{error}`). Contrat : `{ course, room?, teacher?, startTime, endTime, myAttendance?{status,recordedAt} } | null`.
- [ ] T003 (décision A-5) Étendre `getStudentStatsAction` avec `today{doneSessions,totalSessions,absences,doneMinutes,totalMinutes}`
      **si** le calcul est direct ; sinon documenter le ring dégradé (garde `stats?.today`).
- [ ] T004 Générer : `generate:types:svc -- student` → `generate:api:svc -- student` → `api:check` → `check:naming:svc -- student`.
      Mettre à jour `student/CLAUDE.md`.

**Checkpoint** : les 3 actions consommées par les pages visuel-conservé renvoient les shapes attendues.

---

## Phase 2 — UI partagée `components/student/ui` (~2h) ⏳

- [ ] T005 Porter `ui/badges.tsx` (`ScheduleStatusBadge`, `AttendanceStatusBadge`, `ATTENDANCE_META`).
- [ ] T006 Porter `ui/stat.tsx` (`StudentStat`, `StudentStatGrid`) + `ui/illustrations.tsx` (`StudentEmpty`, illustrations).
- [ ] T007 Porter `StudentDayRing.tsx`.
- [ ] T008 Barrel `components/student/index.ts` (+ sous-barrels) — adapter imports `@/lib/utils`, styles.

**Checkpoint** : composants compilent isolément (`tsc` ciblé).

---

## Phase 3 — Pages visuel conservé (~3h) 🎯 MVP ⏳

- [ ] T009 `session/StudentScanButton.tsx` (client) + `planning/StudentPlanningCalendar.tsx` (consomme `mapScheduleToEvent`).
- [ ] T010 Page `app/(app)/[slug]/student/page.tsx` (dashboard) — recopie V1, imports V2, branchement service `student`.
- [ ] T011 Page `student/session/page.tsx` — recopie V1 + `getStudentActiveSessionAction` (P1).
- [ ] T012 Page `student/planning/page.tsx` — recopie V1.

**Checkpoint** ✋ : 3 pages rendues, visuellement identiques à V1.

---

## Phase 4 — Layout & navigation (~1h) ⏳

- [ ] T013 `components/student/user/navigation.ts` (`studentRoutes`).
- [ ] T014 `app/(app)/[slug]/student/layout.tsx` — sidebar + breadcrumb + `RoleLiveBar` ;
      vérifier existence V2 de `UserSidebar`/nav helpers/`RoleLiveBar`, adapter au shell V2 si divergent.

**Checkpoint** : navigation étudiant fonctionnelle.

---

## Phase 5 — Pages refactor vision (~4h) ⏳

> **Auditer d'abord** les services requis (`summary/{attendance,justification,evaluation,session}.json`) —
> présence des actions **côté étudiant**. Documenter tout manque comme sous-tâche backend.

- [ ] T015 `student/attendance/` — historique présence (statuts, taux/cours, risque) selon vision.
- [ ] T016 `student/attendance/[attendanceId]/justify/` — dépôt justificatif (motif + PJ, workflow PENDING→APPROVED/REJECTED).
- [ ] T017 `student/courses/` (liste) + `student/courses/[courseId]/` (fiche) + sous-sections `schedule/` + `evaluation/` (fond `grades` V1).
- [ ] T018 `student/notifications/` — recopie existant. `student/class/` — vision si pertinent, sinon existant.

**Checkpoint** ✋ : pages alignées vision, dépendances backend résolues ou ticketées.

---

## Phase 6 — Finition (~1h) ⏳

- [ ] T019 `components/student/CLAUDE.md` (point d'entrée pages RSC, composants, props clés, hooks, règles).
- [ ] T020 `npx tsc --noEmit` global (0 nouvelle erreur) ; navigation croisée depuis le dashboard.
- [ ] T021 Cocher task9 ; noter tout gap backend restant (stats.today, actions vision) comme tickets.

---

## Dépendances & ordre
```
P1 backend ─▶ P2 UI ─▶ P3 pages MVP ─▶ P4 layout ─▶ P5 refactor vision ─▶ P6 finition
```
- **MVP = P1→P4** (3 pages visuel + navigation). P5 = incrément vision, dépend d'un audit backend.

## Ce qu'on NE fait PAS
- ❌ Réécrire les 3 pages conservées from scratch (recopie stricte).
- ❌ Toucher `components/student/sections/` (gestion Direction).
- ❌ Inventer des actions backend sans auditer les services (P5) — ticketer les manques.

## Risques
| Risque | Mitigation |
|---|---|
| `getStudentStatsAction` sans `today` | A-5 : étendre si simple, sinon ring dégradé (garde `stats?.today`) |
| Actions étudiant absentes pour attendance/evaluation/justify | Audit `summary/*` en tête de P5 ; ticketer |
| `UserSidebar`/`RoleLiveBar` divergents en V2 | Vérifier avant P4, adapter au shell V2 |
| Imports V1 profonds cassés | Regroupement barrels `components/student/**` (A-3) |
