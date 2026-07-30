# Plan — Résolution REG-01 / REG-02 + service function/

## Phase 1 — REG-01 : assign fonctions DIRECTION dans `completeInvite`
- Étendre `CompleteInviteParams` + transaction inline
- Mettre à jour `acceptInviteAction` pour passer les détails

## Phase 2 — `services/function/` complet
Pattern identique à `services/department/`
- CLAUDE.md · types.ts · validation.ts · cache.ts
- database/function.queries.ts · database/function.mutations.ts
- actions/function.queries.ts · actions/function.mutations.ts
- index.ts

## Phase 3 — REG-02 : cache `checkFunctionsExist`
- `invite/direction/database.ts` → `"use cache"` + `cacheTag(CACHE.FUNCTION(orgId))`
- `cache/server/key.ts` → FUNCTION entry + FUNCTION_GRAPH import
- checkers finaux
