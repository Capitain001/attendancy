# Architecture: Migration des patterns V2 → V1

**Branch**: `v1-pattern-sync`  
**Spec**: `./spec.md`

---

## Delta technologique V1 → V2

| Package | V1 (actuel) | V2 (cible) | Impact |
|---------|-------------|------------|--------|
| `prisma` | ^6.16.2 | ^7.8.0 | **CRITIQUE** — breaking changes majeurs |
| `@prisma/client` | ^6.16.2 | ^7.8.0 | **CRITIQUE** |
| `@prisma/adapter-pg` | absent | ^7.8.0 | **CRITIQUE** — nouveau requis |
| `next` | 16.0.8 | 16.2.10 | Moyen — `cacheComponents: true` |
| `typescript` | ^5 | ^6 | Faible — rétrocompatible |
| `react` | 19.2.1 | 19.2.4 | Patch — transparent |
| `valibot` | ^1.1.0 | ^1.4.2 | Faible — rétrocompatible |

---

## Structure cible (fichiers à créer / modifier / supprimer)

### Phase 1 — Dépendances et config projet

```
attendancy-sys/
  package.json                         # bump prisma ^7, next 16.2.10, ts ^6, adapter-pg
  next.config.ts                       # réécrire ESM + cacheComponents: true
  tsconfig.json                        # ajuster si breaking ts^6
```

### Phase 2 — Prisma v7 + multi-schema

```
attendancy-sys/
  prisma/
    schemas/                           # COPIER de V2 (multi-schema)
      main.prisma
      billing.prisma
      (autres schemas V2)
    migrations/                        # REMPLACER par migrations V2
    post-migrate/                      # COPIER de V2
    migration_lock.toml                # COPIER de V2
  src/
    generated/                         # COPIER de V2 (client généré Prisma 7)
    lib/
      prisma.ts                        # RÉÉCRIRE — adapter pg V7 + multi-schema
```

### Phase 3 — Cache engine V2

```
attendancy-sys/
  src/
    cache/                             # CRÉER (absent en V1)
      server/
        engine.ts                      # COPIER de V2 (key(), invalidateEvent, CACHE_LIFE)
        key.ts                         # ADAPTER — importer les GRAPH V1 existants
    config/
      cache.ts                         # SUPPRIMER après migration (revalidateTag direct)
      client_cache.ts                  # GARDER (cache côté client, distinct)
```

`key.ts` V1 : même structure que V2 mais importer les `<SERVICE>_GRAPH` existants de V1 (~25 services). La signature `key.ts` change : `keyFn.duration` → `keyFn.life`.

### Phase 4 — Scripts

```
attendancy-sys/
  scripts/                             # REMPLACER par scripts/ de V2
    generate/
      naming/check.ts
      types/check.ts
      api/api.ts
    (suppression : generate-api.v1.ts, config.v1.ts, generate-api.ts)
```

### Phase 5 — Utils serveur

```
attendancy-sys/
  src/utils/server/
    audit.ts                           # COPIER de V2 (logAuditAsync)
    prisma.ts                          # COPIER de V2 (tryConstraint, Prisma 7 errors)
    validation.ts                      # GARDER V1 (existe, compatible)
    cach.ts                            # SUPPRIMER (remplacé par cache engine)
    index.ts                           # METTRE À JOUR — exporter audit + prisma
```

### Phase 6 — Services : cache.ts par lot

Adapter la signature de chaque `<SERVICE>_GRAPH` dans `cache.ts` :
- Ancienne API V1 : `keyFn(orgId, id)` avec `keyFn.duration`
- Nouvelle API V2 : même `keyFn(orgId, id)` mais `cacheTag` + `cacheLife` dans les queries

**Lot A (priorité — auth + core) :**
```
src/services/auth/cache.ts
src/services/class/cache.ts
src/services/teacher/cache.ts
src/services/student/cache.ts
src/services/department/cache.ts
```

**Lot B (académique) :**
```
src/services/program/cache.ts
src/services/program-track/cache.ts
src/services/course/cache.ts
src/services/academic-year/cache.ts (ou équivalent V1)
```

**Lot C (opérationnel) :**
```
src/services/planning/cache.ts
src/services/session/cache.ts (ou présence)
src/services/attendance/cache.ts
src/services/notification/cache.ts
src/services/invitation/cache.ts
```

**Lot D (reste ~15 services) :** au fil de la migration des queries.

### Phase 7 — Services : types.ts (Prisma.PromiseReturnType → Awaited<ReturnType<>>)

16 fichiers `types.ts` à corriger :
```
grep -rl "Prisma.PromiseReturnType" src/services/
```
Pattern de remplacement :
```ts
// AVANT
export type ClassesDTo = Prisma.PromiseReturnType<typeof getClasses>

// APRÈS
export type ClassesDTo = Awaited<ReturnType<typeof getClasses>>
```

### Phase 8 — Services : ActionResponse (79 fichiers — par lots)

Normaliser `{ success: boolean }` → `{ data: T } | { error: string }`.
Helper pont `toDeleteFn` de V2 (`src/hooks/entity/actionHelpers.ts`) copié en V1
pour coexistence progressive.

```
src/hooks/entity/actionHelpers.ts     # COPIER de V2 (toDeleteFn union)
```

Priorité : services des lots A et B en premier (bloquent les pages critiques).

### Phase 9 — Auth service : complete-signup.ts

```
src/services/auth/members/complete-signup.ts   # ADAPTER
  - tx.user.create → tx.user.upsert
  - logSignupAudit (depuis utils/server/audit.ts)
  - retour { data: {...} } | { error: string }
```

### Phase 10 — Thème / styles

```
attendancy-sys/
  src/app/globals.css                  # REMPLACER par V2
  src/styles/                          # COPIER de V2 (si absent en V1)
```

### Phase 11 — Docs et agents

```
attendancy-sys/
  docs/                                # CRÉER
    skills/                            # COPIER de V2
    cmd/                               # COPIER de V2
    agents/                            # COPIER de V2
  .claude/
    commands/                          # MERGER — ajouter validate.md, plan-architect.md V2
    settings.json                      # MERGER — conserver plugins V1, ajouter MCP V2
    skills/                            # GARDER V1 (skills propres à V1)
```

---

## Invariants de migration

- `src/app/` V1 — **hors scope total**, aucune modification.
- `src/services/user/` V2 — bypass explicite, ne pas porter.
- `weekly-template` — V2-only, ne pas introduire en V1.
- Chaque service migré → lancer les 3 checkers V2 (`naming`, `types`, `api`).
- ActionResponse : utiliser `toDeleteFn` comme pont, ne pas casser les composants existants.

---

## Ordre d'exécution (dépendances)

```
Phase 1 (deps + next.config)
    ↓
Phase 2 (Prisma v7)           ← BLOQUE tout le reste (client Prisma cassé avant)
    ↓
Phase 3 (Cache engine)        ← BLOQUE phases 6-8 (services utilisent le nouveau CACHE)
    ↓
    ├─→ Phase 4 (Scripts)     [parallélisable]
    ├─→ Phase 5 (Utils)       [parallélisable]
    └─→ Phase 6 (Services cache — Lot A) 
            ↓
        Phase 7 (types.ts — Lot A)
            ↓
        Phase 8 (ActionResponse — Lot A)
            ↓
        [Lots B, C, D en séquence ou parallèle]
    ↓
Phase 9 (complete-signup)
Phase 10 (styles)             [parallélisable à tout moment après Phase 1]
Phase 11 (docs/.claude)       [parallélisable à tout moment]
```

---

## Risques

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Prisma v7 breaking changes dans les queries existantes | CRITIQUE | Lire `prisma-upgrade-v7` skill avant Phase 2 |
| `cacheComponents: true` casse des pages V1 existantes | HAUT | `src/app/` hors scope — pages non modifiées, risque limité |
| 79 fichiers ActionResponse — régression composants | MOYEN | `toDeleteFn` union helper comme pont |
| `.claude/` V1 très différent (agentdb, automation) | FAIBLE | Merger sélectif, conserver commandes V1 |
| V1 a des modèles Prisma absents en V2 | MOYEN | Vérifier diff `prisma/schemas/` avant Phase 2 |
