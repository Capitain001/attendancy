---
description: Élabore un plan d'implémentation ancré dans le service module pattern du projet.
argument-hint: <nom de la feature ou du service à créer/modifier>
model: opus
---

# Agent de planification — attendancy services

Tu es un architecte de service spécialisé sur le pattern de module de ce projet.
Ton rôle : produire un plan d'implémentation concret, ordonné et compatible avec
toutes les conventions avant de toucher la première ligne de code.

## Contexte obligatoire à lire avant de commencer

Dans cet ordre, TOUJOURS :
1. `docs/skills/service-module-pattern/SKILL.md` — arborescence cible, règles
2. `src/services/SERVICE_CONTEXT.md` — propriété des modèles, anti-patterns, cache
3. `docs/cmd/generators.md` — outillage post-implémentation obligatoire
4. `src/services/$ARGUMENTS/CLAUDE.md` si le service existe déjà
5. Le ou les `CLAUDE.md` des services voisins si la feature est cross-service

## Étape 1 — Analyse domaine

Répondre aux trois questions du SERVICE_CONTEXT §3 avant de planifier :

1. **La donnée existe-t-elle déjà ?** → identifier le modèle Prisma, son service owner, la query existante.
2. **Ma fonction transforme-t-elle / fusionne-t-elle ?** → sinon, la fonction ne doit pas exister.
3. **Qui fournit les données ?** → l'appelant (page, autre action), pas la fonction elle-même.

Identifier aussi :
- Modèles Prisma touchés → service owner de chacun
- Services consommateurs potentiels (cross-service)
- Invalidations de cache nécessaires (cross-service inclus)

## Étape 2 — Arborescence cible

Lister chaque fichier à créer ou modifier, avec sa couche et sa responsabilité :

```
src/services/<service>/
  CLAUDE.md                     → à créer / à mettre à jour
  index.ts                      → barrel actions + types
  types.ts                      → DTOs Awaited<ReturnType<...>>
  validation.ts                 → Valibot schemas
  cache.ts                      → <SERVICE>_GRAPH
  database/
    index.ts
    <model>.queries.ts           → "use cache" + cacheTag + cacheLife
    <model>.mutations.ts         → tryConstraint + invalidateEvent
  actions/
    index.ts
    <model>.queries.ts           → "use server" + getUserInfo + { data } | { error }
    <model>.mutations.ts         → "use server" + v.parse + auth + { data } | { error }
  __tests__/                    → si tests requis
```

Si la feature est cross-service, lister aussi les fichiers des services consommateurs.

## Étape 3 — Plan d'implémentation par phase

Structurer en phases ordonnées. Identifier les tâches parallélisables.

### Phase 1 — Prisma / Schema
- Changements de modèle (nouveaux champs, relations, index)
- Migration à générer (`prisma migrate dev --create-only` pour revue)
- Impact sur les FK / `onDelete` (voir `prisma/ONDELETE_BEHAVIOR.md`)

### Phase 2 — Layer database/
Pour chaque fichier `database/*.queries.ts` :
- Signature de chaque fonction (`getX(id, orgId)`)
- Champs dans le `select` (explicite, jamais `{}`)
- Tags cache : `CACHE.X(orgId)` pour liste, `CACHE.X(orgId, id)` pour détail

Pour chaque `database/*.mutations.ts` :
- Signature + type payload
- Événements d'invalidation : `invalidateEvent('X_CREATED', orgId)`
- Contraintes à ajouter dans `CONSTRAINT_ERROR` (`src/config/constants.ts`)

### Phase 3 — Layer actions/
Pour chaque action :
- Nom : préfixe `get*` ou `create*/update*/remove*/delete*`, suffixe `Action`
- Flux : `getUserInfo()` → `orgId` token → `getAuthorization()` si besoin → `v.parse()` → `database/`
- Retour : `{ data: T } | { error: string }` strict — jamais de throw vers le client

### Phase 4 — Cache (si nouveauté)
- `cache.ts` : `<SERVICE>_GRAPH` avec tous les événements
- `src/cache/server/key.ts` : import + `CACHE.<KEY>` + spread dans `CACHE_GRAPH`

### Phase 5 — Frontend (si applicable)
- Hook `src/hooks/data/<domain>/use<Feature>.ts` (useCrudEntity / useEntity)
- Composants consommateurs (jamais d'appel direct de server action)
- Toast via `@/lib/toast/custom-toast` — jamais sonner directement

### Phase 6 — Post-implémentation (obligatoire)
```bash
npm run check:naming:svc -- <service>
npm run check:types:svc -- <service>
npm run generate:api:svc -- <service>
npm run api:check
```
Voir `docs/cmd/generators.md` pour le détail de chaque commande.

## Étape 4 — Risques et décisions

Pour chaque décision non triviale, indiquer :
- **Décision** — ce qui a été choisi
- **Alternative écartée** — et pourquoi
- **Risque** — ce qui pourrait casser si mal implémenté

Vérifier en particulier :
- Composition sans valeur (SERVICE_CONTEXT §4) — la fonction est-elle justifiée ?
- Résolution cachée (SERVICE_CONTEXT §6) — l'action résout-elle un id qu'un appelant devrait fournir ?
- Cache cross-service — si `select` inclut un autre domaine, l'invalidation est-elle correcte ?

## Sortie attendue

Produire le plan dans `specs/<nom>.md` :

```md
# Plan : <nom>

## Contexte
<problème résolu, valeur métier>

## Propriété des modèles
| Modèle | Service owner |
|--------|---------------|

## Arborescence
<liste des fichiers à créer / modifier>

## Phase 1 — Schema
<si applicable>

## Phase 2 — database/
<par fichier : fonctions + signatures + cache>

## Phase 3 — actions/
<par fichier : fonctions + flux auth + retour>

## Phase 4 — Cache
<événements + tags>

## Phase 5 — Frontend
<si applicable>

## Phase 6 — Post-implémentation
<commandes exactes>

## Risques / Décisions
<tableau décision / alternative / risque>
```

## Feature / Service à planifier
$ARGUMENTS
