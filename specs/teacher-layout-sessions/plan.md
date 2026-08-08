# Tasks: Teacher Layout + Page Sessions

**Branch**: main  
**Source**: `docs/tasks/task8.md`  
**Référence V1**: `src/app/(attendancy)/[slug]/teacher/sessions/page.tsx`  
**Référence pattern**: `apps/web/src/app/(app)/[slug]/direction/layout.tsx` (V2)  
**Status**: In Progress ⏰

---

## Contexte & Conventions

### Ce qui existe déjà en V2 (ne pas recréer)
- `hooks/data/sessions/useNextSchedule.ts` ✅
- `hooks/data/sessions/use-session-state.ts` ✅
- `hooks/data/sessions/use-start-session.ts` ✅
- `hooks/pratical/use-session-countdown.ts` ✅
- `services/session/policy.ts` ✅
- `services/schedule` → `getTeacherNextScheduleAction` ✅
- `services/teacher` → `getCurrentTeacherId` ✅
- `components/ui/gauge.tsx` ✅
- `components/ui/carouselx.tsx` ✅
- `hooks/data/attendances/use-attendance-stats.ts` ✅
- `hooks/data/attendances/use-attendance-list.ts` ✅

### Conventions critiques (lire avant toute modif service)
- `docs/skills/service-module-pattern/SKILL.md` — pattern service obligatoire
- Lookup rapide des fonctions : `.api/<service>/` ou `summary/<service>.json`
- `npx tsx scripts/generate/api/api.ts <service>` après chaque mutation d'action
- Imports : depuis `@/services/schedule` (index), jamais depuis le chemin interne
- PPR constraint : toute page RSC sans `getUserInfo()` direct → `await connection()` en tête
- `HydrationBoundary` + `prefetchQuery` pour le prefetch RSC → client

---

## Phase 1: Fondamental — Navigation + Layout Teacher ⏳ (~45min)

**But**: Créer l'entrée teacher dans la V2. Bloque les phases suivantes.

⚠️ **CRITIQUE**: Copier le pattern `direction/layout.tsx` V2 — utiliser `UserSidebarSlot` (pas `UserSidebar` de la V1).

- [x] T001 Créer `apps/web/src/components/teacher/navigation.ts`
  - Copier `teacherRoutes` depuis V1 (`src/components/teacher/navigation.ts`)
  - Adapter les types depuis `@/components/layout/sidebar/types` (même import que V2 direction)
  - Routes V1 à conserver : dashboard, courses, planning, attendance, evaluations, students, sessions, notifications

- [x] T002 Créer `apps/web/src/app/(app)/[slug]/teacher/layout.tsx`
  - Calquer sur `direction/layout.tsx` V2 (structure identique)
  - Remplacer `directionRoutes` → `teacherRoutes` (depuis `@/components/teacher/navigation`)
  - `homeLabel="Teacher"`, `homeHref={`/${slug}/teacher`}`
  - `getUserInfo()` + `params` en parallèle via `Promise.all`
  - **Pas** de `RoleLiveBar` pour l'instant (commenté en V1 aussi)

**Checkpoint**: ✋ Layout visible, sidebar teacher fonctionnelle

**Notes:**
- 

---

## Phase 2: US1 — Composants Session UI ⏳ (~1h30)

**But**: Porter les composants UI session nécessaires à `TeacherSessionPage`. Tous indépendants entre eux (peuvent être créés en parallèle).

**Arbre de dépendances** (du bas vers le haut) :
```
SessionStatusBadge  CollapsibleSection  SessionQRDisplay  AttendanceList
                                              ↓                 ↓
                                       AttendanceSection ←──────┘
                                              ↓
                                       SessionCarousel
```

- [ ] T003 [P] [US1] Copier `apps/web/src/components/session/ui/SessionStatusBadge.tsx`
  - Source : `src/components/session/ui/SessionStatusBadge.tsx` (V1)
  - Importe depuis `@/services/session/policy` — déjà présent en V2 ✅
  - Vérifier que `UISessionStatus` est exporté depuis `policy.ts` V2

- [ ] T004 [P] [US1] Copier `apps/web/src/components/session/ui/CollapsibleSection.tsx`
  - Source : `src/components/session/ui/CollapsibleSection.tsx` (V1)
  - Composant UI pur, pas de dépendances service

- [ ] T005 [P] [US1] Copier `apps/web/src/components/session/SessionQRDisplay.tsx`
  - Source : `src/components/session/SessionQRDisplay.tsx` (V1)
  - Vérifier les imports UI (shadcn, etc.) disponibles en V2

- [ ] T006 [P] [US1] Copier `apps/web/src/components/session/AttendanceList.tsx`
  - Source : `src/components/session/AttendanceList.tsx` (V1)
  - Importe `use-attendance-list` (V2 ✅) et `ScheduleAttendanceDTO` depuis `@/services/attendance`
  - Vérifier que `ScheduleAttendanceDTO` est exporté depuis le service attendance V2
  - `framer-motion` : vérifier présence dans `package.json` V2

- [ ] T007 [US1] Copier `apps/web/src/components/session/attendance/AttendanceSection.tsx`
  - Source : `src/components/session/attendance/AttendanceSection.tsx` (V1)
  - Dépend de T006 (AttendanceList)
  - Importe `use-attendance-stats` (V2 ✅)

- [ ] T008 [US1] Copier `apps/web/src/components/session/SessionCarousel.tsx`
  - Source : `src/components/session/SessionCarousel.tsx` (V1)
  - Dépend de T005, T007
  - Imports à vérifier : `carouselx` (V2 ✅), `TeacherNextSchedule` depuis `@/services/schedule`
  - Adapter import `TeacherNextSchedule` : V2 exporte depuis `services/schedule` index

**Checkpoint**: ✋ Composants session compilent sans erreur TS

**Notes:**
- 

---

## Phase 3: US2 — TeacherSessionPage ⏳ (~45min)

**But**: Porter le composant principal `TeacherSessionPage` et le brancher.

- [ ] T009 [US2] Copier `apps/web/src/components/session/TeacherSessionPage.tsx`
  - Source : `src/components/session/page/TeacherSessionPage.tsx` (V1) — renommer (plus de sous-dossier `page/`)
  - Dépend de T003, T004, T008
  - Imports à adapter :
    - `useSessionState`, `DBSession` → `@/hooks/data/sessions/use-session-state` ✅
    - `useNextSchedule` → `@/hooks/data/sessions/useNextSchedule` ✅
    - `useStartSession` → `@/hooks/data/sessions/use-start-session` ✅
    - `SessionCountdownState` → `@/hooks/pratical/use-session-countdown` ✅
    - `UISessionStatus` → `@/services/session/policy` ✅
    - `TeacherNextSchedule` → `@/services/schedule` ✅
    - `Gauge` → `@/components/ui/gauge` ✅
    - `SessionCarousel` → `@/components/session/SessionCarousel`
    - `CollapsibleSection` → `@/components/session/ui/CollapsibleSection`
    - `SessionStatusBadge` → `@/components/session/ui/SessionStatusBadge`

**Checkpoint**: ✋ `TeacherSessionPage` compile — tsc 0 erreur

**Notes:**
- 

---

## Phase 4: US3 — Page Sessions RSC ⏳ (~30min)

**But**: Brancher le composant dans la route Next.js avec prefetch.

- [ ] T010 [US3] Créer `apps/web/src/app/(app)/[slug]/teacher/sessions/page.tsx`
  - Calquer sur la V1 (`src/app/(attendancy)/[slug]/teacher/sessions/page.tsx`)
  - Pattern : `await connection()` en tête (PPR constraint — pas de `getUserInfo()` direct)
  - `getCurrentTeacherId()` depuis `@/services/teacher` ✅
  - `getQueryClient()` + `prefetchQuery` avec `getTeacherNextScheduleAction`
  - `CACHE_KEYS.SCHEDULES.NEXT(teacherId)` depuis `@/config/client_cache` ✅
  - `HydrationBoundary` + `TeacherSessionPage` depuis `@/components/session/TeacherSessionPage`

**Checkpoint**: ✋ Page `/[slug]/teacher/sessions` accessible, composant s'affiche

**Notes:**
- 

---

## Phase 5: Polish ⏳ (~20min)

- [ ] T011 Vérifier `TeacherNextSchedule` bien exporté depuis `apps/web/src/services/schedule/index.ts`
  - Si absent : ajouter re-export du type DB (via `Awaited<ReturnType<typeof getTeacherNextSchedule>>`)
- [ ] T012 `cd apps/web && npx tsc --noEmit` — 0 erreur dans les fichiers touchés
- [ ] T013 Vérifier route accessible dans la sidebar teacher (lien `/teacher/sessions` actif)

**Notes:**
- 

---

## Dépendances & Ordre

```
Phase 1 (Layout)
    ↓
Phase 2 (Session UI — T003/T004/T005/T006 en parallèle, T007→T008 séquentiels)
    ↓
Phase 3 (TeacherSessionPage)
    ↓
Phase 4 (Page RSC)
    ↓
Phase 5 (Polish)
```

---

## Scripts de référence

```bash
# Depuis apps/web/
npx tsc --noEmit                                     # 0 erreur TS
npx tsx scripts/generate/api/api.ts schedule         # si schedule touché
```

## Lookups rapides

```bash
# Vérifier une fonction dans le service
cat apps/web/summary/schedule.json | grep -A5 "getTeacherNextSchedule"
cat apps/web/src/services/schedule/.api/index.json | grep TeacherNext

# Vérifier exports teacher
cat apps/web/summary/teacher.json | grep getCurrentTeacherId
```
