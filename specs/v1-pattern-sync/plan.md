# Tasks: Migration patterns V2 → V1

**Branch**: `v1-pattern-sync`  
**Specs**: `./spec.md`  
**Architecture**: `./architecture.md`  
**Status**: Not Started ⏳

---

## Phase 1: Setup — Dépendances & config projet ⏳ (~1h)

**Purpose**: Mettre à jour les versions des packages et la configuration de base avant tout changement de code.

- [ ] T001 `package.json` — bumper `prisma` + `@prisma/client` → `^7.8.0`, ajouter `@prisma/adapter-pg ^7.8.0`, `next` → `16.2.10`, `typescript` → `^6`
- [ ] T002 `next.config.ts` — réécrire en ESM (`export default`), ajouter `experimental: { cacheComponents: true }`, conserver `images.remotePatterns` V1
- [ ] T003 `tsconfig.json` — vérifier compatibilité TypeScript ^6, ajuster si breaking
- [ ] T004 Lancer `npm install` et vérifier absence d'erreurs de résolution de dépendances

**Checkpoint**: ✋ `npm install` sans erreur — ne pas lancer `npm build` avant Phase 2

**Notes:**
-

---

## Phase 2: Prisma v7 + multi-schema ⏳ (~3h)

**Purpose**: Migration Prisma v6 → v7 avec adapter pg et multi-schema. **Bloque tout le reste.**

⚠️ **CRITIQUE**: Lire le skill `prisma-upgrade-v7` avant de commencer cette phase.

- [ ] T005 Lire `/prisma-upgrade-v7` skill — identifier toutes les breaking changes applicables à V1
- [ ] T006 Comparer `prisma/schemas/` V2 vs schémas V1 actuels — lister les modèles présents en V1 mais absents en V2 (à conserver)
- [ ] T007 Copier `prisma/schemas/` de V2 → V1, **intégrer les modèles V1 manquants** identifiés en T006
- [ ] T008 Copier `prisma/post-migrate/` de V2 → V1
- [ ] T009 Copier `prisma/migration_lock.toml` de V2 → V1
- [ ] T010 Copier `prisma/migrations/` de V2 → V1 (remplace les migrations v6)
- [ ] T011 Copier `src/generated/` de V2 → V1 (client Prisma 7 généré)
- [ ] T012 Réécrire `src/lib/prisma.ts` V1 — pattern adapter pg V7 + multi-schema (copier depuis V2 `src/lib/prisma.ts`)
- [ ] T013 Lancer `npx prisma generate` — vérifier 0 erreur
- [ ] T014 Corriger les imports cassés par Prisma v7 dans `src/services/` (ex: `Prisma.TransactionClient` → nouveau type V7)

**Checkpoint**: ✋ `npx prisma generate` sans erreur + `npx tsc --noEmit` passe sur `src/lib/prisma.ts`

**Notes:**
-

---

## Phase 3: Cache engine V2 ⏳ (~2h)

**Purpose**: Remplacer le système de cache V1 (`src/config/cache.ts` + `revalidateTag`) par l'engine V2. Bloque les phases de services.

- [ ] T015 Créer `src/cache/server/` dans V1
- [ ] T016 Copier `src/cache/server/engine.ts` de V2 → V1 (tel quel)
- [ ] T017 Créer `src/cache/server/key.ts` dans V1 — même structure que V2 mais importer les `<SERVICE>_GRAPH` V1 existants (commencer avec les services Lot A : auth, class, teacher, student, department)
- [ ] T018 Vérifier `src/config/cache.ts` V1 — lister tous les imports de ce fichier (`grep -r "config/cache"`) pour planifier la suppression
- [ ] T019 Supprimer `src/config/cache.ts` V1 après vérification que tous les imports ont été migrés vers `src/cache/server/key.ts`

**Checkpoint**: ✋ `src/cache/server/engine.ts` + `key.ts` compilent sans erreur

**Notes:**
-

---

## Phase 4: Scripts ⏳ (~1h) [parallélisable avec Phase 5]

**Purpose**: Remplacer les scripts V1 par les scripts V2 (checkers naming/types/api).

- [ ] T020 [P] Copier `scripts/generate/` de V2 → V1 (naming/check.ts, types/check.ts, api/api.ts)
- [ ] T021 [P] Supprimer `scripts/generate-api.v1.ts`, `scripts/config.v1.ts`, `scripts/generate-api.ts` (remplacés)
- [ ] T022 Tester `npx tsx scripts/generate/naming/check.ts class` sur un service V1 — vérifier que le script tourne

**Notes:**
-

---

## Phase 5: Utils serveur ⏳ (~1h) [parallélisable avec Phase 4]

**Purpose**: Ajouter `audit.ts` et `prisma.ts` (gestion erreurs Prisma 7) à `src/utils/server/`.

- [ ] T023 [P] Copier `src/utils/server/audit.ts` de V2 → V1 (`logAuditAsync`)
- [ ] T024 [P] Copier `src/utils/server/prisma.ts` de V2 → V1 (`tryConstraint`, erreurs Prisma 7)
- [ ] T025 Mettre à jour `src/utils/server/index.ts` V1 — ajouter exports `audit` + `prisma`
- [ ] T026 Supprimer `src/utils/server/cach.ts` V1 (revalidatePath wrapper, rendu obsolète par cache engine)

**Checkpoint**: ✋ `npx tsc --noEmit` sur `src/utils/server/` sans erreur

**Notes:**
-

---

## Phase 6: Services — cache.ts Lot A (auth + core) ⏳ (~2h)

**Purpose**: Migrer les `cache.ts` des services critiques vers la signature `key.ts` V2 (`cacheTag` + `cacheLife` dans les queries, `invalidateEvent` dans les mutations).

- [ ] T027 `src/services/auth/cache.ts` — adapter `AUTH_GRAPH` signature V2 + enregistrer dans `src/cache/server/key.ts`
- [ ] T028 `src/services/class/cache.ts` — adapter `CLASS_GRAPH` + enregistrer dans `key.ts`
- [ ] T029 `src/services/teacher/cache.ts` — adapter `TEACHER_GRAPH` + enregistrer dans `key.ts`
- [ ] T030 `src/services/student/cache.ts` — adapter `STUDENT_GRAPH` + enregistrer dans `key.ts`
- [ ] T031 `src/services/department/cache.ts` — adapter `DEPARTMENT_GRAPH` + enregistrer dans `key.ts`
- [ ] T032 Mettre à jour les `database/*.queries.ts` du Lot A — remplacer `revalidateTag` direct par `'use cache'` + `cacheTag(CACHE.X(orgId))` + `cacheLife(CACHE.X.life)`
- [ ] T033 Mettre à jour les `database/*.mutations.ts` du Lot A — remplacer `revalidateTag` par `invalidateEvent('X_EVENT', orgId)`
- [ ] T034 Lancer `npx tsx scripts/generate/naming/check.ts class` + `teacher` + `student` — corriger les ⚠️

**Notes:**
-

---

## Phase 7: Services — types.ts (Prisma.PromiseReturnType) ⏳ (~1h)

**Purpose**: Corriger les 16 fichiers `types.ts` utilisant `Prisma.PromiseReturnType<>`.

- [ ] T035 `grep -rl "Prisma.PromiseReturnType" src/services/` — générer la liste complète
- [ ] T036 [P] Corriger Lot A (class, teacher, student, department, auth) — `Prisma.PromiseReturnType<typeof fn>` → `Awaited<ReturnType<typeof fn>>`
- [ ] T037 [P] Corriger les services restants (11 fichiers) — même pattern
- [ ] T038 Lancer `npx tsx scripts/generate/types/check.ts` sur tous les services corrigés — 0 violation

**Notes:**
-

---

## Phase 8: Services — ActionResponse Lot A ⏳ (~3h)

**Purpose**: Normaliser `{ success: boolean }` → `{ data: T } | { error: string }` sur les services critiques. Ajouter `toDeleteFn` comme pont.

- [ ] T039 Copier `src/hooks/entity/actionHelpers.ts` de V2 → V1 (`toDeleteFn` union helper)
- [ ] T040 [P] `src/services/class/actions/` — normaliser tous les retours ActionResponse
- [ ] T041 [P] `src/services/teacher/actions/` — normaliser ActionResponse
- [ ] T042 [P] `src/services/student/actions/` — normaliser ActionResponse
- [ ] T043 [P] `src/services/department/actions/` — normaliser ActionResponse
- [ ] T044 [P] `src/services/auth/actions.ts` — normaliser ActionResponse
- [ ] T045 Vérifier que les composants consommateurs V1 utilisent `'error' in result` ou `toDeleteFn` — corriger les `result.success` cassés

**Checkpoint**: ✋ `npx tsc --noEmit` sur les services Lot A sans erreur

**Notes:**
-

---

## Phase 9: Services — Lots B, C, D ⏳ (~4h)

**Purpose**: Appliquer les mêmes corrections (cache.ts + types.ts + ActionResponse) aux services restants.

**Lot B — Académique :**
- [ ] T046 [P] `program`, `program-track`, `course`, `academic-year` — cache.ts + types.ts + ActionResponse

**Lot C — Opérationnel :**
- [ ] T047 [P] `planning`, `session`, `attendance`, `notification`, `invitation` — cache.ts + types.ts + ActionResponse

**Lot D — Reste (~15 services) :**
- [ ] T048 `grep -rl "Prisma.PromiseReturnType\|success: boolean" src/services/` — lister les services restants
- [ ] T049 [P] Appliquer corrections par groupe de 3-4 services

- [ ] T050 Lancer `npx tsx scripts/generate/api/api.ts --check` — cohérence cross-service, exit 0

**Notes:**
-

---

## Phase 10: Auth complete-signup.ts ⏳ (~1h)

**Purpose**: Appliquer les micro-améliorations V2 à `complete-signup.ts`.

- [ ] T051 Lire `src/services/auth/members/complete-signup.ts` V1 + V2 en parallèle
- [ ] T052 Adapter V1 : `tx.user.create` → `tx.user.upsert`
- [ ] T053 Adapter V1 : ajouter appel `logSignupAudit` (depuis `utils/server/audit.ts`)
- [ ] T054 Adapter V1 : retour `{ data: {...} } | { error: string }` au lieu de `{ success, error? }`

**Notes:**
-

---

## Phase 11: Styles / Thème ⏳ (~30min) [parallélisable]

**Purpose**: Aligner styles globaux V1 sur V2.

- [ ] T055 [P] Remplacer `src/app/globals.css` V1 par celui de V2
- [ ] T056 [P] Copier `src/styles/` de V2 → V1 (si dossier différent ou absent)

**Notes:**
-

---

## Phase 12: Docs + .claude ⏳ (~1h) [parallélisable]

**Purpose**: Ajouter la documentation V2 et merger les configurations agent.

- [ ] T057 Créer `docs/` dans V1
- [ ] T058 [P] Copier `docs/skills/` de V2 → V1
- [ ] T059 [P] Copier `docs/cmd/` de V2 → V1
- [ ] T060 [P] Copier `docs/agents/` de V2 → V1
- [ ] T061 Merger `.claude/commands/` — ajouter `validate.md` + `plan-architect.md` de V2 (ne pas supprimer les commandes V1 existantes)
- [ ] T062 Merger `.claude/settings.json` — conserver plugins V1, ajouter `mcpServers.playwright` de V2
- [ ] T063 Copier `CLAUDE.md` racine de V2 → V1 (adapter les chemins si différents)

**Notes:**
-

---

## Phase 13: Validation finale ⏳ (~1h)

**Purpose**: Vérification globale post-migration.

- [ ] T064 `npx tsx scripts/generate/naming/check.ts` sur tous les services — 0 violation
- [ ] T065 `npx tsx scripts/generate/types/check.ts` sur tous les services — 0 `Prisma.PromiseReturnType`
- [ ] T066 `npx tsx scripts/generate/api/api.ts --check` — cohérence cross-service, exit 0
- [ ] T067 `npx tsc --noEmit` — 0 erreur TypeScript
- [ ] T068 `grep -r "revalidateTag" src/services/` → 0 occurrence dans les mutations de service
- [ ] T069 `grep -r "Prisma.PromiseReturnType" src/services/` → 0 occurrence
- [ ] T070 `grep -r "success: boolean" src/services/actions/` → 0 occurrence dans les nouvelles actions
- [ ] T071 `npm run build` — build complet sans erreur

**Checkpoint final**: ✋ Tous les critères SC-001→SC-006 de la spec validés

**Notes:**
-

---

## Dépendances & ordre d'exécution

```
Phase 1 (deps + config)
    ↓
Phase 2 (Prisma v7)              ← BLOQUE tout
    ↓
Phase 3 (Cache engine)           ← BLOQUE phases 6-9
    ↓
    ├─→ Phase 4 (Scripts)        [parallèle]
    ├─→ Phase 5 (Utils)          [parallèle]
    ├─→ Phase 11 (Styles)        [parallèle]
    ├─→ Phase 12 (Docs/.claude)  [parallèle]
    └─→ Phase 6 (Services Lot A — cache)
            ↓
        Phase 7 (types.ts)
            ↓
        Phase 8 (ActionResponse Lot A)
            ↓
        Phase 9 (Lots B, C, D)
            ↓
        Phase 10 (complete-signup)
            ↓
        Phase 13 (Validation finale)
```

---

## Résumé

| Métrique | Valeur |
|----------|--------|
| Total tâches | 71 |
| Phases | 13 |
| Durée estimée | ~20h |
| MVP (Phases 1-3) | ~6h |
| Tâches parallélisables | ~20 |
| Fichiers impactés | ~120+ |
| Services concernés | ~25+ |

**Risque principal** : Prisma v6 → v7 (Phase 2). Lire impérativement le skill `prisma-upgrade-v7` avant de commencer.
