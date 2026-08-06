# Générateurs de code

Scripts dans `scripts/generate/` — exécutables via `npm run` ou `npx tsx` directement.

---

## `service` — Scaffolding d'un nouveau service

Génère la structure minimale d'un service `src/services/<name>/` conforme au
pattern `service-module-pattern` (cf. `src/services/entity/`). Pose le squelette
(fichiers + fonctions à compléter) — ne remplit **pas** la logique métier.

```bash
# Modèle déduit du nom (course-teacher → CourseTeacher)
npx tsx scripts/generate/service/service.ts <name> --model=<Model>

# Exemple : sous-modèle avec code actif prêt à compléter (agent IA)
npx tsx scripts/generate/service/service.ts course-teacher --model=CourseTeacher --minimal
```

**Options** :

| Option | Effet |
|--------|-------|
| `--name=<kebab>` | Nom du service (alternative au positionnel) |
| `--model=<Pascal>` | Modèle Prisma (déduit de `<name>` si omis) |
| `--prefix=<kebab>` | Préfixe de domaine pour les clés cache/événements (ex: `--prefix=ue` → `UE_COURSE_TEACHER_CREATED`) |
| `--soft-delete` | Génère `remove*` (`deletedAt`) au lieu de `delete*` (hard delete) |
| `--minimal` | Code **actif** (imports réels, fonctions exécutables) au lieu du gabarit commenté — pensé pour un agent IA qui remplit immédiatement |
| `--skip-cache-registry` | Ne patche pas `src/cache/server/key.ts` |
| `--cache-registry=<path>` | Chemin du registre cache si non standard |
| `--force` | Écrase un service existant (ou un dossier vide déjà créé) |

**Effet de bord** : enregistre automatiquement `<SERVICE>_GRAPH` dans
`src/cache/server/key.ts` (import + entrée `CACHE.<KEY>` + spread dans `CACHE_GRAPH`),
sauf `--skip-cache-registry`.

**Après génération** (le script les rappelle) :
1. Remplacer les `TODO` (champs réels du modèle) — ou décommenter si mode gabarit.
2. Compléter le `CLAUDE.md` (rôle, contraintes).
3. Renseigner l'ownership dans `src/services/SERVICE_CONTEXT.md`.
4. `npx tsx scripts/generate/types/types.ts <name>` puis `... /api/api.ts <name>`.

> Le mode `--minimal` génère des imports réels alignés sur le monorepo
> (`@/lib/prisma`, `@/services/auth`, `@/services/audit`, `@/utils/server/prisma`).

---

## `api` — Index API d'un service

Génère `src/services/<service>/.api/index.json` + une fiche JSON par fonction exportée.
Analyse statiquement les couches `database/` et `actions/` via l'AST TypeScript.

```bash
# Tous les services (auto-découverte)
npm run generate:api

# Un service spécifique
npm run generate:api:svc -- <service>
npm run generate:api:svc -- course
npm run generate:api:svc -- users/profile

# Plusieurs services (1 seul programme TS partagé)
npm run generate:api:svc -- course room schedule

# Valider la cohérence cross-service (ne génère rien, exit 1 si dead ref)
npm run api:check
```

**Quand lancer** : obligatoire après toute mutation d'action (ajout, renommage, suppression).

**Sortie** :
- `.api/index.json` — liste des fns, graphe d'appels, deps cross-service
- `.api/<fnName>.json` — signature, kind (query/mutation/server-action), appels sortants

**Champs préservés** : `rules`, `why_ref`, `auth` — édités manuellement, jamais écrasés.

---

## `summary` — Vue consolidée par service (pour lecture IA)

Consolide `.api/` (1 fichier par fonction) en `summary/` (1 fichier par service).
Aucune analyse AST — lecture pure des JSON déjà produits par `api.ts`.

`.api/` reste la source de vérité. `summary/` est une vue **dérivée**, régénérable à
tout moment, jamais éditée à la main, jamais committée comme source de vérité.

```bash
# Tous les services (check cross-service inclus avant consolidation)
npm run generate:summary

# Un ou plusieurs services
npm run generate:summary:svc -- <service>
npm run generate:summary:svc -- group student

# + summary/all.json (vue globale, coûteuse — analyses transverses uniquement)
npm run generate:summary:svc -- --all

# Bypass le check cross-service (déconseillé, debug ponctuel)
npm run generate:summary:svc -- --skip-check
```

**Quand lancer** : après `generate:api`, dès qu'une IA doit consulter le contrat
d'un service sans ouvrir chaque fiche `.api/<fn>.json` individuellement. **Pas une
étape obligatoire du workflow** — un outil de confort pour la lecture, indépendant
de `api:check` qui reste la vérification de référence.

**Sortie** :
- `summary/index.json` — table des matières (service, fichier, nb de fonctions, sha)
- `summary/<service>.json` — toutes les fonctions du service, fusionnées (fiche + layer/kind)
- `summary/all.json` (optionnel, `--all`) — tous les services, vue globale

**Garde-fou intégré** : par défaut, lance `api.ts --check` avant de consolider.
Si une référence cross-service est cassée, `summary/` n'est **pas** régénéré —
évite de figer une vue consolidée sur un graphe incohérent.

---

## `types` — DTOs depuis les queries

Génère `src/services/<service>/types.ts` avec un type `FnNameDto` par fonction exportée
des fichiers `database/*.queries.ts`.

Pattern : `export type GetEnrolledStudentsDto = Awaited<ReturnType<typeof getEnrolledStudents>>`

```bash
# Tous les services éligibles
npm run generate:types

# Un service spécifique
npm run generate:types:svc -- <service>
npm run generate:types:svc -- class

# Plusieurs services
npm run generate:types:svc -- class student schedule
```

**Quand lancer** : après avoir ajouté ou modifié des fonctions dans `database/*.queries.ts`.

**Effet de bord** : ajoute `export * from './types'` dans `index.ts` si absent.

---

## `check-naming` — Vérificateur de conventions

Rappeleur de conventions de nommage — **non bloquant (exit 0 toujours)**.

```bash
# Tous les services
npm run check:naming

# Un ou plusieurs services
npm run check:naming:svc -- <service>
npm run check:naming:svc -- course room event
```

**Règles vérifiées** :

| Règle | Interdit | Attendu |
|-------|----------|---------|
| Lecture | `list*` | `get*` |
| Soft delete (fn) | `delete*` si corps contient `deletedAt` | `remove*` |
| Soft delete (event) | `*_DELETED` si soft | `*_REMOVED` |
| Hard delete (fn) | `remove*` si corps appelle `prisma.x.delete` | `delete*` |
| Hard delete (event) | `*_REMOVED` si hard | `*_DELETED` |

**Quand lancer** : avant chaque commit sur `src/services/**`.

---

## `check-types` — Vérificateur de placement des types inférés

Détecte les `export type X = Awaited<ReturnType<...>>` définis hors de `types.ts` — **non bloquant (exit 0 toujours)**.

```bash
# Tous les services
npm run check:types

# Un ou plusieurs services
npm run check:types:svc -- <service>
npm run check:types:svc -- session attendance
```

**Règle** : tout `export type X = Awaited<ReturnType<typeof fn>>` doit être dans `types.ts`.
Les fichiers `index.ts` et `types.ts` sont exclus du scan.

**Fix** : `npm run generate:types:svc -- <service>` régénère `types.ts` automatiquement,
puis supprimer manuellement le type de l'ancien fichier.

**Quand lancer** : en complément de `generate:types`, avant chaque commit sur `src/services/**`.

---

## `supabase-types` — Types Supabase

Génère `src/types/database.ts` depuis le schéma Supabase distant.

```bash
npm run generate:supabase-types
```

---

## `icons` / `svg` — Composants React depuis SVG

```bash
# Icônes resource (public/assets/resources/*.svg → src/components/icons/generated/)
npm run generate:icons

# Collections SVG (resource, illustration…)
npm run generate:svg
```

**Quand lancer** : après avoir ajouté ou modifié des fichiers `.svg` dans `public/assets/`.

---

## `api:all` — Régénérer + valider

```bash
npm run api:all
```

Enchaîne : `sync` (régénère `.api/` pour tous les services) → `api:check`
(valide la cohérence cross-service). `summary` n'en fait pas partie — à lancer
séparément (`generate:summary`) si une vue consolidée pour lecture IA est
nécessaire.

---

## `generate:all` — Tout régénérer

Lance tous les générateurs dans l'ordre : api → api:check → summary → types →
check:naming → check:types → icons → svg.

```bash
npm run generate:all
```

> `api:check` reste une étape à part entière ici, indépendante de `summary` :
> `summary` relance son propre check en interne avant de consolider, mais
> `api:check` doit rester la vérification de référence, appelable seule (CI,
> vérification ponctuelle) sans dépendre de `summary`.

---

## Workflow post-service (résumé)

```bash
# 1. Vérifier les conventions de nommage
npm run check:naming:svc -- <service>

# 2. Vérifier le placement des types inférés
npm run check:types:svc -- <service>

# 3. Mettre à jour l'index API
npm run generate:api:svc -- <service>

# 4. (optionnel) Régénérer les DTOs si queries modifiées
npm run generate:types:svc -- <service>

# 5. Valider la cohérence cross-service (obligatoire)
npm run api:check

# 6. (optionnel) Régénérer la vue consolidée pour lecture IA
npm run generate:summary:svc -- <service>
```