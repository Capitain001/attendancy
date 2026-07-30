# Plugin por-dev — Workflows de développement

Plugin Claude Code "Product on Rails" installé à la scope projet.  
Source : `https://github.com/lfnovo/por-marketplace` · `por-dev@por-marketplace`

---

## Workflow rapide (tâches courtes)

```
/prime → /fast:bug|chore|feature → /implement
```

## Workflow complet (features complexes)

```
/prime → /discover → /design → /plan → /implement
```

---

## Commandes

### `/prime`
**Toujours lancer en premier.** Version projet : lit `CLAUDE.md` (invariants,
conventions, stack) + `README.md` + `docs/`. Plus complet que la version plugin
de base qui lit seulement `README.md`.

```
/prime
```

---

### `/discover <description|fichier|ticket>`

Crée une spécification de feature dans `specs/<feature-slug>/spec.md`.

```
/discover "Ajouter export CSV des présences par classe"
/discover ./docs/promts/task3.md
```

**Sortie** : `specs/<slug>/spec.md` — user stories, exigences fonctionnelles,
critères de succès, questions de clarification.

---

### `/design`

Architecture technique à partir du `spec.md`. Requiert un `spec.md` complet.

```
/design
```

**Sortie** : `specs/<slug>/architecture.md` + optionnel `contracts.md`.

> ⚠️ Context7 et Perplexity MCP non configurés dans ce projet — l'étape
> de recherche utilise WebSearch en fallback.

---

### `/plan`

Découpe l'architecture en tâches implémentables ordonnées.

```
/plan
```

**Sortie** : `specs/<slug>/plan.md` — tâches par phase, parallélisables identifiées.

---

### `/implement [--ff|--phases]`

Exécute le plan.

```
/implement          # phased (arrêt après chaque phase)
/implement --ff     # fast-forward (pas d'arrêt)
```

**Post-session sur `src/services/**`** — lancer les checkers projet :
```bash
npx tsx scripts/generate/naming/check.ts <service>
npx tsx scripts/generate/types/check.ts <service>
npx tsx scripts/generate/api/api.ts <service>
```
Voir `docs/cmd/generators.md` pour le détail.

---

### `/fast:bug <description>`

Plan chirurgical de correction de bug. Override projet : template adapté
aux conventions attendancy (layers, naming, vitest).

```
/fast:bug "getTeacherStats retourne null quand departmentId est absent"
```

**Sortie** : `specs/<nom>.md`

---

### `/fast:feature <description>`

Plan de feature courte. Override projet : validation avec `vitest` + checkers
service au lieu de `pytest`.

```
/fast:feature "Ajouter filtre par statut dans la liste des justifications"
```

**Sortie** : `specs/<nom>.md`

---

### `/fast:chore <description>`

Tâche de maintenance.

```
/fast:chore "Migrer les actions de schedule vers le nouveau pattern ActionResponse"
```

---

## Structure des sorties

```
attendancy/
└── specs/
    ├── export-csv-presences.md          # fast track
    └── notification-absences/           # workflow complet
        ├── spec.md
        ├── architecture.md
        ├── contracts.md
        └── plan.md
```

---

## Commande désactivée

### ~~`/generate-all-claude-mds`~~

**Ne pas utiliser** sur ce projet. Le projet maintient ses propres `CLAUDE.md`
par service avec des invariants métier précis (orgId, layer séparation, patterns
Prisma). Une génération automatique écraserait ces fichiers.

Les `CLAUDE.md` sont créés manuellement à la création de chaque service
(convention CLAUDE.md racine).

---

## Décision workflow

| Tâche | Commande |
|---|---|
| Bug ciblé | `/prime` → `/fast:bug` → `/implement` |
| Mise à jour deps / refacto | `/prime` → `/fast:chore` → `/implement` |
| Feature UI simple | `/prime` → `/fast:feature` → `/implement` |
| Nouveau endpoint API | `/prime` → `/discover` → `/design` → `/plan` → `/implement` |
| Feature cross-service | `/prime` → `/discover` → `/design` → `/plan` → `/implement` |
| Nouveau service (conventions) | `/prime` → `/plan-architect` → `/implement` → `/validate` |
