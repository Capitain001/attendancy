# Plan : Traitement régressions teacher V1→V2

**Source :** `docs/raports/services-v1-v2.md`  
**Statut :** ✅ Traité — 2026-07-29

---

## Régressions à traiter

| ID | Description | Gravité |
|----|-------------|---------|
| REG-TEACH-01 | `getOrganizationTeacherStats` absente | 🔴 Haute |
| REG-TEACH-02 | `ponctualite` hardcodé à 100 | 🔴 Haute |

---

## Analyse technique

### REG-TEACH-02 — `ponctualite` hardcodé

**V2 actuel** (`database/teacher.queries.ts:114`) :
```ts
ponctualite: 100,  // ← hardcodé
```

**V1 calcul** : `ponctuelCount / sessions.length * 100` avec seuil 10min (checkIn ≤ startTime + 10min).

**Amélioration V2 possible** : `Session.isLate: Boolean` déjà calculé par le trigger DB `teacher_check_in`.
Donc : `ponctualite = sessions avec isLate=false / total sessions * 100` — plus fiable que recalculer.

**Fichiers** : `src/services/teacher/database/teacher.queries.ts` → `getTeacherStats`

### REG-TEACH-01 — `getOrganizationTeacherStats` absente

**V1** : scop via `user.userOrganizations.some.orgId` (indirect).  
**V2** : `Teacher.orgId` direct → requêtes plus simples.  
`withCourses` : utiliser `courses: { some: {} }` sur la relation `Teacher.courses` (CourseTeacher[]).

**Fichiers** :
- `src/services/teacher/database/teacher.queries.ts` → ajouter `getTeacherOrganizationStats`
- `src/services/teacher/actions/teacher.queries.ts` → ajouter `getTeacherOrganizationStatsAction`
- `src/services/teacher/types.ts` → ajouter `TeacherOrganizationStats`
- `src/services/teacher/CLAUDE.md` → mettre à jour

---

## Phases

### Phase 1 — REG-TEACH-02 : corriger `ponctualite` ⏳

- [ ] T001 — Dans `getTeacherStats`, remplacer `ponctualite: 100` par requête `Session.isLate`
  - Query : `prisma.session.findMany({ where: { schedule: { teacherId, orgId, deletedAt: null } }, select: { isLate: true } })`
  - Calcul : `ponctuelCount / sessions.length * 100`, fallback `100` si 0 sessions

### Phase 2 — REG-TEACH-01 : ajouter stats org ⏳

- [ ] T002 — Dans `database/teacher.queries.ts`, ajouter `getTeacherOrganizationStats(orgId)` :
  - `total` : `prisma.teacher.count({ where: { orgId, deletedAt: null } })`
  - `active` : idem + `user: { status: 'ACTIVE' }`
  - `inactive` : idem + `user: { status: 'INACTIVE' }`
  - `withCourses` : `prisma.teacher.count({ where: { orgId, deletedAt: null, courses: { some: {} } } })`
  - Pas de `"use cache"` (données admin peu fréquentes, invalidées par TEACHER_UPDATED)

- [ ] T003 — Ajouter `TeacherOrganizationStats` dans `types.ts`

- [ ] T004 — Dans `actions/teacher.queries.ts`, ajouter `getTeacherOrganizationStatsAction()`
  - Auth guard : `getUserInfo()` + `orgId` + `getAuthorization(user, 'DIRECTION')`

- [ ] T005 — Mettre à jour `CLAUDE.md`

### Phase 3 — Vérifications ⏳

- [ ] T006 — `npx tsx scripts/generate/naming/check.ts teacher`
- [ ] T007 — `npx tsx scripts/generate/types/check.ts teacher`
- [ ] T008 — `npx tsx scripts/generate/api/api.ts teacher` (vérifier 0 warn)
- [ ] T009 — `npx tsc --noEmit` (0 erreur dans teacher/)

---

## Estimation

| Phase | Effort |
|-------|--------|
| Phase 1 | ~20min |
| Phase 2 | ~40min |
| Phase 3 | ~10min |
| **Total** | **~70min** |
