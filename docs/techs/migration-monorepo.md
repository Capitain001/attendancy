# Migration monorepo — Attendancy

Référence analysée : `C:\PROJECTS\PROJECT\PRODUCTIONS\tauri-v2-nextjs-monorepo`
(Arbarwings/tauri-v2-nextjs-monorepo)

---

## Pertinence du repo de référence

### Ce qu'il démontre

| Pattern | Utilité pour attendancy |
|---------|------------------------|
| TurboRepo + pnpm workspaces | Orchestration multi-app (web + desktop + mobile) |
| `packages/ui` — shadcn partagé | Composants réutilisés sans duplication |
| `packages/ui/src/views/` — vues partagées | La vue planning tourne dans Tauri ET dans le browser |
| Next.js API routes comme backend partagé | Tauri consomme les mêmes endpoints que le web |
| Tauri v2 avec gen iOS + Android | **Tauri couvre le mobile** — Expo potentiellement inutile |
| `fetch(apiBaseUrl + '/api/...')` dans les vues | Pattern clair pour que Tauri appelle Next.js |

### Insight mobile critique

Le repo inclut `src-tauri/gen/android/` et `src-tauri/gen/apple/` — Tauri v2 supporte
iOS et Android via WebView. Cela signifie que **Tauri seul peut couvrir desktop + mobile**
depuis la même app Vite, sans Expo (React Native).

Trade-off Tauri mobile vs Expo :
- **Tauri mobile** : une seule codebase Vite, accès aux plugins Rust natifs, WebView dépend du
  système (iOS = WKWebView, Android = Chromium) — rendu non garanti identique
- **Expo** : React Native natif, DX supérieure, meilleure intégration push/notifications,
  mais codebase séparée

Pour attendancy (planning en lecture offline, pas de fonctionnalités hardware complexes) :
**Tauri mobile est suffisant et réduit la surface de code.**

---

## Architecture cible

```
attendancy/                          ← monorepo root
├── apps/
│   ├── web/                         ← projet actuel (Next.js 16, PPR)
│   │   └── app/api/planning/        ← nouvelles API routes pour desktop/mobile
│   └── desktop/                     ← Vite + React + Tauri v2
│       └── src-tauri/               ← shell Rust
├── packages/
│   ├── ui/                          ← composants shadcn partagés (Tailwind v4)
│   ├── planning/                    ← views + hooks planning (React Query)
│   └── types/                       ← types TypeScript partagés
├── turbo.json
└── pnpm-workspace.yaml
```

### Rôle de chaque couche

| Package | Contenu | Consommateurs |
|---------|---------|--------------|
| `apps/web` | Next.js complet — RSC, server actions, Prisma, Supabase auth | browser |
| `apps/desktop` | Vite + React + Tauri v2 — shell minimal | desktop + mobile |
| `packages/ui` | Composants shadcn réexportés (Button, Card, etc.) | web + desktop |
| `packages/planning` | Views planning + hooks React Query (appel HTTP) | web + desktop |
| `packages/types` | Types partagés — ScheduleDto, SessionDto, etc. | tous |

---

## Contrainte principale : server actions → API routes

Les server actions Next.js (`'use server'`) ne sont pas appelables depuis Tauri.
Tauri doit appeler des **API routes HTTP classiques**.

```
apps/web/app/api/
├── planning/
│   └── route.ts        ← GET /api/planning?from=&to= (auth via cookie Supabase)
├── schedule/
│   └── route.ts        ← GET /api/schedule/:classId
└── session/
    └── route.ts        ← GET /api/session/active
```

Les API routes appellent les fonctions `database/` existantes — pas de duplication de logique.

---

## Divergences avec le repo de référence

| Point | Référence | Attendancy | Action |
|-------|-----------|-----------|--------|
| Tailwind version | v3 (config JS) | v4 (config CSS) | `packages/ui` utilise Tailwind v4 |
| React version | web=19, native=18 | partout 19 | desktop Vite → React 19 |
| Validation | Zod | Valibot | reste dans `apps/web`, jamais partagé |
| Mobile | Tauri gen/android + gen/apple | à décider | Tauri mobile ou Expo |
| Auth | raw pg | Supabase | cookie Supabase forwarded depuis Tauri |

---

## Phases de migration

### Phase 1 — Monorepo root (~2h)

Aucun fichier existant ne bouge. Seulement les fichiers racine ajoutés.

```bash
# 1. pnpm-workspace.yaml à la racine attendancy/
packages:
  - "apps/*"
  - "packages/*"

# 2. turbo.json à la racine
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "dev":   { "cache": false, "persistent": true },
    "lint":  { "dependsOn": ["^lint"] },
    "check-types": { "dependsOn": ["^check-types"] }
  }
}

# 3. package.json racine (scripts turbo)
# 4. Déplacer attendancy/ → apps/web/
```

⚠️ Déplacer le projet en `apps/web/` est l'étape bloquante : tous les chemins
`.env`, `prisma/`, `scripts/`, `public/` doivent rester cohérents.

### Phase 2 — packages/types (~1h)

Extraire les types partagés sans toucher au code existant.

```
packages/types/
├── package.json         ← name: "@attendancy/types"
├── tsconfig.json
└── src/
    ├── schedule.ts      ← ScheduleDto, DayScheduleDto
    ├── session.ts       ← SessionDto, ActiveSessionDto
    └── index.ts
```

Types = `Awaited<ReturnType<typeof fn>>` extraits de `apps/web/src/services/*/types.ts`.

### Phase 3 — packages/planning (~2h)

Vues React Query qui appellent les API routes (pas les server actions).

```
packages/planning/
├── package.json         ← name: "@attendancy/planning"
├── src/
│   ├── hooks/
│   │   ├── usePlanning.ts       ← React Query, appel fetch vers /api/planning
│   │   └── useActiveSession.ts
│   ├── views/
│   │   ├── PlanningView.tsx     ← composant partagé web+desktop
│   │   └── SessionView.tsx
│   └── lib/
│       └── api-client.ts        ← fetch wrapper + apiBaseUrl env
└── tsconfig.json
```

`apiBaseUrl` : `process.env.NEXT_PUBLIC_API_URL` (web) ou env Vite `VITE_API_URL` (desktop).

### Phase 4 — API routes dans apps/web (~2h)

Exposer en HTTP les queries déjà existantes.

```typescript
// apps/web/app/api/planning/route.ts
import { getClassSchedulesAction } from '@/services/schedule/actions'
import { authAccess } from '@/services/auth'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const auth = await authAccess()
  if (!auth.data) return Response.json({ error: auth.error }, { status: 401 })
  // appel database/ direct (pas server action)
  const data = await getClassSchedules(auth.data.orgId, ...)
  return Response.json({ data })
}
```

L'auth Supabase via cookie fonctionne pour Tauri si le WebView envoie les cookies
(configurer `credentials: 'include'` dans le fetch client).

### Phase 5 — apps/desktop (~3h)

```
apps/desktop/
├── package.json         ← name: "desktop", vite + @tauri-apps/api
├── vite.config.ts
├── src/
│   ├── main.tsx         ← <PlanningView /> depuis @attendancy/planning
│   └── App.tsx
└── src-tauri/
    ├── tauri.conf.json
    │   devUrl: http://localhost:1420
    │   frontendDist: ../dist
    │   identifier: com.attendancy.app
    └── Cargo.toml
```

Dev flow :
```bash
pnpm --filter desktop tauri dev   # lance Vite + shell Rust
# apps/web doit tourner sur :3000 en parallèle
```

### Phase 6 — React Query persistence offline (~1h)

Dans `packages/planning/src/lib/persister.ts` :

```typescript
// Web / Tauri desktop (WebView = IndexedDB disponible)
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { get, set, del } from 'idb-keyval'

export const persister = createAsyncStoragePersister({
  storage: { getItem: get, setItem: set, removeItem: del }
})
```

`PersistQueryClientProvider` wrap `PlanningView` — le planning s'affiche offline
depuis IndexedDB après la première visite connectée.

---

## Fichiers à créer (résumé)

| Fichier | Phase |
|---------|-------|
| `pnpm-workspace.yaml` | 1 |
| `turbo.json` | 1 |
| `packages/types/package.json` + types | 2 |
| `packages/planning/package.json` + hooks + views | 3 |
| `apps/web/app/api/planning/route.ts` | 4 |
| `apps/web/app/api/schedule/route.ts` | 4 |
| `apps/desktop/package.json` + Vite + Tauri | 5 |
| `packages/planning/src/lib/persister.ts` | 6 |

---

## Points d'attention

- **Husky hooks** : rester dans `apps/web/` après déplacement — vérifier `.husky/` paths
- **Prisma postinstall** : `apps/web/package.json` garde `"postinstall": "prisma generate"` — le root n'en a pas besoin
- **scripts/generate/** : chemins relatifs depuis `apps/web/` — adapter ROOT dans les scripts
- **summary/** et **.api/** : générés dans `apps/web/`, inchangés
- **Tailwind v4 dans packages/ui** : pas de `tailwind.config.js` — utiliser `@import "tailwindcss"` dans le CSS
- **Cookie Supabase dans Tauri** : WebView respecte les cookies si `credentials: 'include'` — tester en Phase 5

---

## Référence clonée

```
C:\PROJECTS\PROJECT\PRODUCTIONS\tauri-v2-nextjs-monorepo\
```

Inspecter `apps/native/src/App.tsx` + `packages/ui/src/views/analyzeTextView.tsx`
pour le pattern complet vue partagée → Tauri.
