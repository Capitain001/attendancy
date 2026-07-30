# scripts/generate/api

## Fichiers

| Fichier | Rôle |
|---------|------|
| `api.ts` | Générateur principal — analyse AST TypeScript, écrit `.api/` |
| `sync.ts` | Lance `api.ts` sur tous les services éligibles (auto-découverte) |
| `config.ts` | Constantes : `PROJECT_LAYOUT`, `ORG_ID_CHECK`, noms de dossiers |

## api.ts

**Input** : `src/services/<service>/database/**` + `src/services/<service>/actions/**`

**Output** :
- `src/services/<service>/.api/index.json` — liste des fns, graphe d'appels, deps cross-service
- `src/services/<service>/.api/<fnName>.json` — signature, kind, appels sortants

**Modes** :
```
npx tsx scripts/generate/api/api.ts <service>           # générer
npx tsx scripts/generate/api/api.ts svc1 svc2           # plusieurs (1 seul programme TS)
npx tsx scripts/generate/api/api.ts --check             # valider graphe cross-service (exit 1 si dead ref)
```

**Champs JSON préservés** (jamais écrasés) : `rules`, `why_ref`, `auth`

**Détection orgId** : avertit si une fn Prisma n'a pas `orgId` dans son `where`.
Modèles globaux (User…) et fonctions exemptées dans `config.ts`.

**Kind des fns** :
- `database/` → `query` (fichier `*.queries.ts`) ou `mutation` (fichier `*.mutations.ts`)
- `actions/` → `server-action`

## sync.ts

Lance `api.ts` sur tous les services qui ont `actions.ts`, `database.ts` ou `database/`.

```
npx tsx scripts/generate/api/sync.ts
```

## Quand lancer

- `api.ts <svc>` : après toute mutation d'action (ajout, renommage, suppression)
- `api.ts --check` : avant merge, vérifie que les refs cross-service ne sont pas cassées
- `sync.ts` : après refactor multi-service ou pour initialiser
