# Feature Specification: Migration des patterns V2 → V1

**Feature Branch**: `v1-pattern-sync`  
**Input**: `./docs/promts/task5.md`

---

## Context and Understanding

V2 (`attendancy`) a évolué séparément de V1 (`attendancy-sys`) et a introduit
des patterns plus robustes : système de cache centralisé avec engine d'invalidation,
ActionResponse discriminé strict, dérivation des types Prisma correcte, scripts de
génération améliorés, utilitaires serveur (audit, gestion d'erreurs Prisma 7), et
une meilleure documentation des agents/commandes.

V1 a déjà une bonne base structurelle (layering `actions/` + `database/`, Valibot,
`<SERVICE>_GRAPH` par service) mais diverge sur des points critiques : son système
de cache est dans `src/config/cache.ts` avec `revalidateTag` direct au lieu du
pattern engine + `invalidateEvent`, les types utilisent `Prisma.PromiseReturnType<>`
(interdit en V2), et les retours d'action sont inconsistants.

L'objectif est de porter les patterns V2 vers V1 sans toucher à `src/app/` (hors
scope, sauvegarde existante) ni au service `user` (bypass explicite).

---

## Feature Description

Synchronisation sélective des patterns techniques de V2 vers V1. Il s'agit d'un
refactoring multi-fichiers guidé par un inventaire précis — certains éléments se
copient tel quel (`*`), d'autres nécessitent une lecture de l'existant V1 et une
adaptation (`+`). Aucune nouvelle fonctionnalité métier n'est introduite.

---

## Requirements

### Proposed Solution

- **US-001** : Copier le système Prisma V2 (schémas multi-schema, migrations Prisma 7, `src/generated`) vers V1.
- **US-002** : Remplacer le système de cache V1 (`src/config/cache.ts` + `revalidateTag`) par le pattern V2 (`src/cache/server/engine.ts` + `key.ts` + `invalidateEvent`).
- **US-003** : Migrer les scripts de génération V2 (`scripts/`) vers V1.
- **US-004** : Aligner `next.config.ts` V1 sur V2 (`cacheComponents: true`, ESM, Prisma 7 config).
- **US-005** : Ajouter les utilitaires serveur V2 manquants dans V1 (`src/utils/server/audit.ts`, `src/utils/server/prisma.ts`).
- **US-006** : Normaliser les `ActionResponse` dans tous les services V1 (`{ data } | { error: string }`).
- **US-007** : Corriger la dérivation des types Prisma dans V1 (`Awaited<ReturnType<>>` → supprimer `Prisma.PromiseReturnType<>`).
- **US-008** : Porter les conventions de nommage V2 (`remove*`/`delete*`/`get*`) dans V1.
- **US-009** : Copier `docs/skills/`, `docs/cmd/`, `docs/agents/` de V2 vers V1 (création du dossier `docs/` dans V1).
- **US-010** : Adapter `.claude/` de V2 vers V1 (commandes, settings, skills — adapter les chemins et contextes V1).
- **US-011** : Adapter `src/services/auth/members/complete-signup.ts` V1 selon les micro-améliorations V2 (`tx.user.upsert`, `logSignupAudit`, retour discriminé).
- **US-012** : Adapter `src/components/layout/Header/AsyncHeader.tsx` selon le pattern Suspense V2.
- **US-013** : Copier `src/app/globals.css` et `src/styles/` de V2 vers V1.

### Functional Requirements

- **FR-001** : V1 DOIT utiliser le même engine de cache que V2 (`engine.ts` + `invalidateEvent`) — `revalidateTag` direct supprimé des mutations.
- **FR-002** : Chaque service V1 DOIT avoir son `cache.ts` compatible avec le nouveau `key.ts` (signature `life` au lieu de `duration`).
- **FR-003** : Tous les retours d'action DOIVENT être `{ data: T } | { error: string }` — pas de `{ success: boolean }` ni de `{ data?: T; error?: string }`.
- **FR-004** : Tous les `types.ts` de service V1 DOIVENT utiliser `Awaited<ReturnType<typeof fn>>` — suppression de `Prisma.PromiseReturnType<>`.
- **FR-005** : `src/app/` en V1 est hors scope — aucune modification de ce dossier.
- **FR-006** : `src/services/user/` en V2 est un bypass explicite — ne pas copier ce service.
- **FR-007** : Le service `weekly-template` est V2-only — ne pas introduire en V1.
- **FR-008** : Les scripts V2 DOIVENT remplacer les scripts V1 (anciens `generate-api.v1.ts`, `config.v1.ts` supprimés).
- **FR-009** : `src/utils/server/` V1 DOIT être augmenté des utilitaires V2 sans supprimer les utilitaires V1 existants non-redondants.

---

## Success Criteria

### Measurable Outcomes

- **SC-001** : `npx tsx scripts/generate/naming/check.ts <service>` passe sans violation sur tous les services V1 portés.
- **SC-002** : `npx tsx scripts/generate/types/check.ts <service>` passe sans `Prisma.PromiseReturnType` restant.
- **SC-003** : `npx tsx scripts/generate/api/api.ts --check` cohérence cross-service — exit 0.
- **SC-004** : `npx tsc --noEmit` — 0 erreur TypeScript après migration.
- **SC-005** : Aucun `revalidateTag` direct restant dans les fichiers de mutations de service V1.
- **SC-006** : `src/app/` inchangé en V1 post-migration.

---

## Clarification Needed

1. **Scope du cache V1 — migration complète ou incrémentale ?**
   V1 a ~25+ services avec chacun un `cache.ts`. Migrer le système de cache implique
   d'adapter chaque `<SERVICE>_GRAPH` à la nouvelle signature `key.ts` V2.
   - A) Migrer tous les services V1 d'un coup (scope maximal, risque de régression plus large)
   - B) Migrer uniquement les services utilisés par les pages existantes + laisser les autres en compatibility shim
   - C) Migrer par lot (auth + class + teacher en priorité, reste ensuite)
   - **Suggestion : C** — migration par lots, les scripts de check permettent de valider chaque lot.

2. **ActionResponse — normalisation totale ou ciblée ?**
   V1 a des actions avec `{ success: boolean }`, d'autres déjà discriminées. Normaliser
   toutes les actions risque de casser les composants frontend V1 qui lisent `result.success`.
   - A) Normaliser toutes les actions + adapter les composants qui en dépendent
   - B) Normaliser uniquement les nouvelles actions + `toDeleteFn` union helper comme pont
   - C) Normaliser seulement les services dans le scope de la migration cache (cohérence locale)
   - **Suggestion : B** — le helper `toDeleteFn` de V2 permet la coexistence des deux formes.

3. **`.claude/` — merge ou remplacement ?**
   V1 a déjà un `.claude/` avec ses propres commandes, settings et skills (potentiellement différents).
   - A) Remplacer entièrement `.claude/` de V1 par celui de V2 (risque de perdre des configs V1)
   - B) Merger manuellement — conserver les settings V1, ajouter les commands/skills V2 manquants
   - C) Copier uniquement les fichiers V2 absents en V1 (pas de remplacement)
   - **Suggestion : B** — merger, en priorisant les settings V1 (paths différents).

4. **`src/utils/server/` — conflict entre `cach.ts` V1 et le nouveau pattern V2 ?**
   V1 a `src/utils/server/cach.ts` (revalidatePath wrapper) qui deviendra obsolète une fois
   le cache engine V2 en place. Faut-il le supprimer ou le garder ?
   - A) Supprimer `cach.ts` V1 après migration (propre mais risque si des composants l'importent)
   - B) Garder `cach.ts` en alias deprecated jusqu'à nettoyage complet
   - **Suggestion : A** — supprimer après vérification des imports (`grep -r "cach.ts"`).

5. **Prisma / `src/generated` — V1 a son propre schéma ?**
   Copier `prisma/` + `src/generated` de V2 vers V1 implique de remplacer le schéma
   Prisma V1 entièrement. V1 a peut-être des modèles différents de V2.
   - A) Copier intégralement (V2 est la référence schéma)
   - B) Merger les schémas (risque de conflits modèles)
   - C) Copier uniquement les migrations Prisma 7 + engine (pas les schémas modèles)
   - **Suggestion : A** — `task5.md` marque `prisma/` comme `*` (copie intégrale).

---

## Notes

- V1 a déjà la structure `actions/` + `database/` + `validation.ts` + Valibot → le layering structurel est bon, seules les implémentations divergent.
- V1 `scripts/` contient `generate-api.v1.ts` et `config.v1.ts` — ces fichiers `.v1.ts` sont à supprimer après le remplacement par les scripts V2.
- La migration du cache engine est le changement le plus impactant (touche tous les services). C'est le point de départ recommandé.
- `src/app/` V1 hors scope — une sauvegarde existe déjà selon `task5.md`.
- Ordre recommandé : Prisma → Cache engine → Scripts → next.config → Utils → Services par lots → Docs/.claude.
