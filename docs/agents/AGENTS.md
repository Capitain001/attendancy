# Agents slash-commands — attendancy

Agents invocables via `/` dans Claude Code. Fichiers dans `.claude/commands/`.

---

## `/validate [service]`

**Fichier** : `.claude/commands/validate.md`
**Modèle** : opus
**Rôle** : Valide qu'une implémentation respecte toutes les conventions avant commit.

### Quand l'utiliser

- Après avoir modifié ou créé un service dans `src/services/**`
- Avant tout commit sur du code service
- En revue rapide après une session d'implémentation

### Comment l'invoquer

```
/validate               → détecte les services modifiés via git diff
/validate schedule      → un service spécifique
/validate attendance/session
```

### Ce que l'agent fait

1. Lit `docs/skills/service-module-pattern/SKILL.md` + `src/services/SERVICE_CONTEXT.md`
2. Lit le `CLAUDE.md` du service ciblé
3. **Checks automatiques** (scripts du projet) :
   - `npx tsx scripts/generate/naming/check.ts <service>` — conventions nommage
   - `npx tsx scripts/generate/types/check.ts <service>` — placement des types
   - `npx tsx scripts/generate/api/api.ts <service>` — régénère l'index API
   - `npx tsx scripts/generate/api/api.ts --check` — cohérence cross-service (bloquant)
4. **Revue manuelle** sur 9 catégories :
   - Layering (`"use server"`, Prisma uniquement dans `database/`, barrel `index.ts`)
   - Auth & orgId (token serveur, scope multi-tenant)
   - Naming (`get*`, `remove*`, `delete*`, suffixe `Action`)
   - ActionResponse (`{ data } | { error: string }`, narrowing `'error' in`)
   - Validation (Valibot, schéma dans `validation.ts`, `InferInput`)
   - Types (`Awaited<ReturnType<...>>` dans `types.ts`)
   - Cache (`"use cache"`, `cacheTag`, `cacheLife`, `invalidateEvent`, cross-service)
   - Composition (pas de wrapper sans valeur, pas de résolution cachée)
   - Audit log (`logAuditAsync` fire-and-forget sur DELETE/remove)

### Rapport produit

```
## Rapport de validation — <service> (<date>)
### Checks automatiques  → output brut des scripts
### Layering             → ✅ / ⚠️ / ❌ par item
### Auth & orgId         → ...
...
### Verdict
🟢 PRÊT AU COMMIT
🟡 COMMIT POSSIBLE — corriger les ⚠️ dans la foulée
🔴 BLOQUER — résoudre les ❌ avant commit
### Actions requises     → liste concrète fichier:ligne
```

### Règles de verdict

| Résultat | Verdict |
|----------|---------|
| Tout ✅ | 🟢 PRÊT AU COMMIT |
| Que des ⚠️ | 🟡 COMMIT POSSIBLE |
| Au moins un ❌ | 🔴 BLOQUER |

---

## `/plan-architect [feature ou service]`

**Fichier** : `.claude/commands/plan-architect.md`
**Modèle** : opus
**Rôle** : Élabore un plan d'implémentation complet et ancré dans le pattern du projet avant d'écrire du code.

### Quand l'utiliser

- Avant d'implémenter une nouvelle feature cross-service
- Avant de créer un nouveau service
- Quand la feature touche le schéma Prisma ou plusieurs couches
- En complément du workflow por-dev `/plan` (plus ancré dans les conventions du projet)

### Comment l'invoquer

```
/plan "Ajouter export CSV des présences par classe"
/plan "Nouveau service notification push"
/plan "Refactorer le service schedule pour séparer les queries"
```

### Ce que l'agent fait

1. Lit `docs/skills/service-module-pattern/SKILL.md` + `src/services/SERVICE_CONTEXT.md` + `docs/cmd/generators.md`
2. Lit le `CLAUDE.md` du service ciblé (et des services voisins si cross-service)
3. **Analyse domaine** — répond aux 3 questions du SERVICE_CONTEXT §3 :
   - La donnée existe-t-elle déjà ailleurs ?
   - Ma fonction transforme-t-elle / fusionne-t-elle ?
   - Qui fournit les données (appelant vs résolution interne) ?
4. **Produit un plan structuré** dans `specs/<nom>.md`

### Plan produit — structure

```
specs/<nom>.md
├── Contexte           → problème résolu, valeur métier
├── Propriété des modèles → tableau modèle / service owner
├── Arborescence       → fichiers à créer / modifier avec leur couche
├── Phase 1 — Schema   → changements Prisma + impact FK
├── Phase 2 — database/ → fonctions + signatures + cache + invalidations
├── Phase 3 — actions/ → flux auth + retours ActionResponse
├── Phase 4 — Cache    → événements + tags + cross-service
├── Phase 5 — Frontend → hooks + composants (si applicable)
├── Phase 6 — Post-impl → commandes générateurs obligatoires
└── Risques / Décisions → tableau décision / alternative / risque
```

### Différence avec `/fast:feature` et `/plan` (por-dev)

| | `/fast:feature` | `/plan` (por-dev) | `/plan-architect` |
|-|-----------------|-------------------|-------------------|
| Profondeur | Plan court, one-shot | Architecture technique | Plan complet, multi-phase |
| Analyse domaine | Non | Partielle | Oui (SERVICE_CONTEXT §3) |
| Cache cross-service | Non | Non | Oui |
| Risques/décisions | Non | Partiel | Oui |
| Usage type | Feature UI simple | Feature complexe (discover→design→**plan**→implement) | Nouveau service / refacto |

---

## Workflow recommandé

```
Feature courte (UI, endpoint simple)
  /prime → /fast:feature → /implement → /validate

Feature complexe (cross-service, schéma, cache)
  /prime → /plan-architect → /implement → /validate

Bug
  /prime → /fast:bug → /implement → /validate
```

## Fichiers de référence lus par les agents

| Fichier | Lu par |
|---------|--------|
| `docs/skills/service-module-pattern/SKILL.md` | `/plan`, `/validate` |
| `src/services/SERVICE_CONTEXT.md` | `/plan`, `/validate` |
| `docs/cmd/generators.md` | `/plan`, `/validate` |
| `src/services/<service>/CLAUDE.md` | `/plan`, `/validate` |
| `prisma/ONDELETE_BEHAVIOR.md` | `/plan` (si schéma touché) |
