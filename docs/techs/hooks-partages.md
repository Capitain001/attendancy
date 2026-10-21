# Système de Hooks Partagés (Web Next.js ↔ Clients Vite / Tauri)

## 1. Objectif

Permettre aux hooks de données (`useTeacherDailySchedule`, `useNextSchedule`, `useAttendanceList`, etc.) d'être écrits **une seule fois** dans `apps/web/src/hooks/` et d'être exécutés à l'identique :
- **Sur le Web (`apps/web`)** : exécution directe des Server Actions Next.js (`'use server'`).
- **Sur les applications clientes (`apps/desktop`, `apps/teacher`)** : exécution via des requêtes HTTP typées (RPC Next.js) avec Bearer token Supabase et cache offline.

Aucune duplication de code métier ou de hooks React Query n'est tolérée entre le web et les clients.

---

## 2. Architecture & Mécanisme de résolution

```text
                                Hook Partagé
                     (`apps/web/src/hooks/data/...`)
                                    │
               import { getXAction } from "@/services/X"
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
   Environnement Web (Next.js)                         Environnement Client (Vite)
   Alias `@` -> `apps/web/src`                         Alias Regex Vite prioritaire :
         │                                             `^@/services/([^/]+)(\/actions)?$`
         ▼                                                     │
Server Action réelle (`'use server'`)                          ▼
Prisma, validation, DB                                 Stub généré (`packages/rpc/src/generated/X.ts`)
                                                       `export const getXAction = api.getXAction`
                                                       `export type * from '.../services/X/types'`
                                                               │
                                                               ▼
                                                       Client RPC (`@rpc-api`)
                                                       `POST /api/rpc/getXAction` (Bearer JWT)
```

### Le rôle clé de la résolution statique (Build-time)
1. **Zéro configuration runtime** : il n'y a pas de switch dynamique `if (isTauri) apiFetch() else serverAction()`. Tout est résolu statiquement par les bundlers (Next.js / Vite) au moment du build.
2. **Le package `@attendancy/rpc`** :
   - Fichiers générés automatiquement par `packages/rpc/scripts/gen.mjs`.
   - Contient un stub par service (ex: `schedule.ts`, `attendance.ts`, `session.ts`).
   - Les stubs importent `api` depuis l'alias `@rpc-api` et réexportent les types.
3. **L'alias `@rpc-api`** :
   - Ce n'est pas un package npm, mais un alias de redirection Vite.
   - Sur Desktop : résout vers `apps/desktop/src/lib/api.ts`.
   - Sur Teacher : résout vers `@attendancy/auth/src/api.ts` (ou le client API local).

---

## 3. Les 5 Règles d'Or pour les Hooks Partagés

Pour qu'un hook reste consommable côté client sans faire échouer le build Vite ni injecter du code serveur dans le bundle :

### Règle 1 : Imports de service et Barrel RPC (sans `/actions` obligatoire)
- Dans les hooks, les développeurs peuvent écrire naturellement :
  `import { getTeacherNextScheduleAction, type GetTeacherNextScheduleDto } from "@/services/schedule"`
- Côté client, l'alias regex `^@/services/([^/]+)(\/actions)?$` intercepte indifféremment `@/services/<service>` et `@/services/<service>/actions`.
- Le stub généré par `gen.mjs` réexporte à la fois les stubs RPC (`api.<action>`) et les types purs (`types.ts`).
- **Attention :** Ne jamais importer de valeurs serveur internes (`database/`, Prisma, helpers serveur non-RPC).

### Règle 2 : Importer uniquement des TYPES depuis le reste du service
- ✅ `import type { CreateScheduleInput } from "@/services/schedule"`
- ❌ `import { validateUUID } from "@/utils/server/validation"` (embarque `next/navigation` ou des modules serveur)
- Les imports de types sont effacés à la compilation (`import type`) et ne polluent pas le bundle client.

### Règle 3 : ZÉRO dépendance runtime `next/*` dans les composants / hooks partagés
- Aucun import de `next/server`, `next/headers`, `next/navigation` (`useParams`, `useRouter`, `notFound`) dans les hooks ou composants réutilisés.
- Rendre les composants UI agnostiques en leur passant les callbacks de navigation (ex: `onStartSession` ou `sessionsHref`) depuis la page hôte (RSC Next.js ou Route TanStack Router).
- Pour les liens, `next/link` est intercepté par un alias Vite redirigeant vers le composant `Link` de TanStack Router.

### Règle 4 : Signature à argument unique (`input`) pour le transport RPC
- Le protocole RPC HTTP (`POST /api/rpc/[action]`) transmet **un seul payload JSON**.
- ✅ `export async function getNextSchedule({ teacherId }: { teacherId: string })`
- ✅ `export async function startSessionAction({ scheduleId, coords }: StartSessionInput)`
- ❌ `export async function startSessionAction(scheduleId: string, coords: any)` (le 2e argument sera ignoré par le transport RPC).

### Règle 5 : Gestion des pannes réseau (`NetworkError`) & Cache React Query
- En cas de coupure réseau, le client RPC **doit lever une exception `NetworkError`** au lieu de retourner `{ error: "Réseau indisponible" }`.
- *Pourquoi ?* React Query ne préserve le cache local offline (`persistClient`) que si la promesse est rejetée (`throw`). Si l'action retourne un objet `{ error }`, React Query considère que la requête a réussi et écrase la donnée en cache.

---

## 4. Reconversion des Dates (Reviver ISO)

Le protocole HTTP sérialise les dates en chaînes JSON au format ISO UTC (`YYYY-MM-DDTHH:mm:ss.sssZ`).
Le client RPC (`api.ts`) applique un `reviver` lors du parsing JSON :
```typescript
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const reviver = (_: string, v: unknown) =>
  typeof v === "string" && ISO.test(v) ? new Date(v) : v;
```
Les hooks React Query partagés reçoivent ainsi des instances authentiques de `Date` (ex: `schedule.startTime.getTime()` fonctionne sans transformation préalable).

---

## 5. Workflow d'ajout d'une Server Action à un Hook Partagé

```bash
# 1. Écrire la Server Action dans apps/web/src/services/<service>/actions/
# 2. Inscrire l'action dans le registre serveur allowlist :
#    apps/web/src/lib/rpc/actions.ts -> export const ACTIONS = { ..., myNewAction }

# 3. Régénérer les stubs RPC :
bun --filter @attendancy/rpc gen

# 4. Consommer dans le hook partagé :
#    import { myNewAction } from "@/services/<service>"
```
