Ton pattern impose déjà l'essentiel : les actions prennent **un seul `input` typé** (norme V2 : `{ entityId, data }`) et retournent `{ data } | { error }`. Une action correspond donc à un appel RPC dont le corps est simplement l'input en JSON, sans mapping REST à écrire. Le système tient en 4 pièces.

## 1. `authAccess` accepte le Bearer (la pièce centrale)

Les actions ne changent pas : seule la source de l'utilisateur change. Je n'ai pas vu `getUserInfo`, donc je suppose qu'il construit `UserInfo` depuis la session cookies. Extrais son mapper (`toUserInfo(supabaseUser)`) dans `@/modules/user` pour que les deux chemins l'utilisent :

```ts
// src/services/auth/permission/access.ts (helper non exporté, le fichier est "use server")
import { headers } from 'next/headers'
import { getUserInfo, getUserInfoFromToken } from '@/modules/user'

async function resolveUser() {
  const auth = (await headers()).get('authorization')
  return auth?.startsWith('Bearer ')
    ? getUserInfoFromToken(auth.slice(7)) // verifyBearerToken + toUserInfo
    : getUserInfo()
}
// authAccess: remplacer `await getUserInfo()` par `await resolveUser()`
```

Un navigateur n'envoie jamais `Authorization` aux Server Actions, donc aucune ambiguïté. `verifyBearerToken` reste la brique bas niveau.

**Point de sécurité :** `role`, `function` et `organization.permissions` viennent de `user_metadata`, que l'utilisateur peut modifier avec `supabase.auth.updateUser` depuis un client. Le risque existe déjà côté web, mais une API Bearer publique le rend trivial à exploiter. À terme, ces champs doivent venir de `app_metadata` ou d'une lecture `UserOrganization`.

## 2. Une route générique + un registre typé

```ts
// src/app/api/rpc/registry.ts
import { getSchedulesAction } from '@/services/schedule'
export const RPC = { getSchedulesAction /* , … */ } as const
export type Rpc = typeof RPC
```

```ts
// src/app/api/rpc/[action]/route.ts
import { type NextRequest, NextResponse } from 'next/server'
import superjson from 'superjson'
import { ERRORS } from '@/config'
import { RPC } from '../registry'

export async function POST(req: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params
  if (!Object.hasOwn(RPC, action)) {
    return NextResponse.json({ error: 'Action inconnue' }, { status: 404 })
  }
  const fn = RPC[action as keyof typeof RPC] as unknown as (input: unknown) => Promise<unknown>
  try {
    const text = await req.text()
    const input = text ? superjson.parse(text) : undefined
    const result = await fn(input)
    return new NextResponse(superjson.stringify(result), { headers: { 'Content-Type': 'application/json' } })
  } catch {
    return NextResponse.json({ error: ERRORS.SERVER }, { status: 500 })
  }
}
```

- **`Object.hasOwn` est indispensable.** Avec `ACTIONS[action]` (le croquis de l'autre session), `POST /api/rpc/constructor` ou `toString` résoudrait une fonction native.
- **`superjson` évite un décalage de types.** Tes DTOs dérivés de Prisma contiennent des `Date` (et peut-être des `Decimal`). Une Server Action les renvoie intacts, mais du JSON brut les transforme en `string`. Sans superjson, les types mentiraient côté Tauri et le code partagé casserait sur `.getTime()`.
- **Auth et `orgId` restent dans les actions**, donc le corps de la requête ne peut jamais fournir d'`orgId`. Ça respecte ta contrainte absolue.

## 3. Client Tauri sans état global

Le `_authToken` au niveau du module et `import.meta.env` disparaissent : tout est injecté par l'hôte.

```ts
// packages/api-client/src/index.ts
import superjson from 'superjson'
import type { Rpc } from '@/app/api/rpc/registry' // import de type uniquement

export type ApiClient = { [K in keyof Rpc]: Rpc[K] }

export function createApiClient(opts: {
  baseUrl: string
  getToken: () => Promise<string | null>
  onUnauthorized?: () => void
  fetchImpl?: typeof fetch
}): ApiClient {
  const doFetch = opts.fetchImpl ?? fetch
  return new Proxy({} as ApiClient, {
    get: (_, name) => {
      if (typeof name !== 'string' || name === 'then') return undefined
      return async (input?: unknown) => {
        try {
          const token = await opts.getToken()
          const res = await doFetch(`${opts.baseUrl}/api/rpc/${name}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
            body: input === undefined ? undefined : superjson.stringify(input),
          })
          if (res.status === 401) { opts.onUnauthorized?.(); return { error: 'Non autorisé' } }
          return superjson.parse(await res.text())
        } catch {
          return { error: 'Réseau indisponible' }
        }
      }
    },
  })
}
```

L'hôte Tauri passe `getToken: async () => (await supabase.auth.getSession()).data.session?.access_token ?? null`, ce qui gère le refresh. Le web, lui, fournit directement les Server Actions.

Comme `ApiClient` a exactement les signatures des actions, le Context `useApi()` des hooks partagés peut typer `Pick<Rpc, 'getSchedulesAction' | …>` : pas d'interface à maintenir à la main. Ensuite, fais émettre les types (`Rpc`, DTOs, schémas Valibot) par ton générateur dans un package `contracts`, pour remplacer l'import de type vers `@/app`.

## 4. Vérifications avant de brancher

- **`invalidateEvent`** : si ton implémentation utilise `updateTag`, ça ne marche que dans une Server Action. Depuis un Route Handler, il faut `revalidateTag`. À tester sur une mutation.
- **Proxy/middleware** : exclus `/api/rpc` de la redirection vers le login basée sur les cookies.
- **CORS** : il faut un `OPTIONS` (en-têtes `Authorization` et `Content-Type`) pour les origines Tauri (`tauri://localhost`, `http://tauri.localhost`). Sinon, utilise `tauri-plugin-http` comme `fetchImpl` : la requête part côté Rust, sans CORS.
- **Erreurs transport** : le client les convertit en `{ error }`, donc tes hooks n'ont qu'un seul format à gérer.

## 5. Sort de `/api/auth/me`

Elle viole la règle « Prisma seulement dans `database/` » et mélange deux modèles. Remplace-la par des actions qui respectent les frontières des services :

- `getSessionAction` dans `auth` (service d'infrastructure, exception documentée) : user, `orgId`, rôle via `authAccess`.
- `getTeacherByUserAction` dans `teacher`.
- La « prochaine classe » vient de `schedule`, avec `teacherId` en paramètre.

Le client Tauri les enchaîne au démarrage, ou tu ajoutes une action d'orchestration dédiée si tu veux un seul aller-retour.

Ordre suggéré : (1) Bearer dans `authAccess`, (2) registre + route avec **une seule** action (`getSchedulesAction`) pour valider de bout en bout, (3) `createApiClient`, (4) migrer `/me`, (5) extraire `contracts`.

Envoie-moi `getUserInfo` (`@/modules/user`) si tu veux que j'écrive l'extraction de `toUserInfo` et `getUserInfoFromToken` exactement à ta convention.


Ton raisonnement sur le cache est faux dans un cas précis, et il y a un piège dans `getUserInfo`. Voici les deux, puis les DTOs.

## 1. `updateTag` échoue en silence dans `/api/rpc`

Ton cache `"use cache"` vit **côté serveur**. Si une mutation passe par la route RPC sans invalider le tag, la mise à jour côté Tauri ne change rien. Le client invalide son cache TanStack et refait un `getXAction`, mais le serveur renvoie la version encore en cache jusqu'à expiration de `cacheLife`. Les utilisateurs web verraient aussi des données périmées.

`updateTag` ne peut être appelé que depuis une Server Action, pas depuis un Route Handler. Dans ton moteur, l'erreur est avalée par le `catch` « silencieux volontaire », donc tu ne verrais rien. `revalidateTag` est utilisable dans les Route Handlers, et son second argument `{ expire: 0 }` force une expiration immédiate.

Le correctif tient dans `engine.ts` :

```ts
import { updateTag, revalidateTag } from "next/cache";

function expireTag(tag: string) {
  try {
    updateTag(tag)                      // Server Action : read-your-own-writes
  } catch {
    try {
      revalidateTag(tag, { expire: 0 }) // Route Handler (/api/rpc)
    } catch {
      // hors runtime Next (scripts, seed)
    }
  }
}
// remplacer les deux appels updateTag(...) par expireTag(...)
```

Test à faire : une mutation via `/api/rpc`, puis un `get` via `/api/rpc`, et vérifier que le résultat est frais.

## 2. Bearer dans `getUserInfo`

J'abandonne mon `resolveUser` dans `authAccess`. Ton `getUserInfo` est le bon point d'entrée : il suffit de trois modifications dans `getUserInfo.ts`, et `authAccess` ne change pas.

**Sécurité :** `getUserId` décode le JWT **sans le vérifier** (`jwtDecode`). C'est acceptable sur le chemin cookies parce que le middleware appelle `getClaims()` avant. Le Bearer arrive sur `/api/rpc` sans ce middleware. Il faut donc vérifier la signature avant de consulter le LRU. Sinon, un JWT forgé avec le `sub` d'un autre utilisateur lirait son profil en cache.

```ts
import { headers } from "next/headers"
import { createClient as createTokenClient } from "@supabase/supabase-js"

const getBearerToken = cache(async () => {
  const auth = (await headers()).get("authorization")
  return auth?.startsWith("Bearer ") ? auth.slice(7) : null
})

const createStatelessClient = () =>
  createTokenClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )

const getUserId = cache(async (): Promise<string | null> => {
  const bearer = await getBearerToken()
  if (bearer) {
    const { data, error } = await createStatelessClient().auth.getClaims(bearer)
    return error || !data ? null : (data.claims.sub ?? null)
  }
  // ... chemin cookies inchangé
})

// dans fetchUserFromSupabase, remplacer la récupération du user par :
const bearer = await getBearerToken()
const { data: { user }, error } = bearer
  ? await createStatelessClient().auth.getUser(bearer)
  : await (await createClient()).auth.getUser()
// le contrôle d'userId et le mapping restent identiques
```

Résultat : une requête Bearer coûte un `getClaims` (local avec les clés de signature asymétriques, sinon repli réseau) plus une lecture LRU. Le `getUser` réseau n'a lieu qu'au cache miss. Le compromis est le même que ton middleware : un token révoqué reste accepté jusqu'à son expiration ou jusqu'à l'expiration du LRU. `verifyBearerToken` peut disparaître une fois `/me` migrée.

Séparément, `fetchUserFromSupabase` duplique `mapUserInfo`. Tu pourras le remplacer par `{ ...mapUserInfo({ user, userMetadata }), updated_at: user.updated_at }`, mais fais-le dans un autre commit. Deux différences à trancher : l'avatar par défaut, et `isConnected: … || true` qui vaut toujours `true`. Côté Tauri, `"/avatar.png"` serait résolu par rapport à l'origine Tauri, pas celle du serveur Next.

## 3. Tes DTOs dans l'UI partagée

Oui, tu peux en profiter, et sans passer par `types.ts`. Le registre `Rpc` porte déjà les types de retour de chaque action :

```ts
export type ApiData<K extends keyof Rpc> =
  Extract<Awaited<ReturnType<Rpc[K]>>, { data: unknown }>['data']
// ApiData<'getSchedulesAction'> = ton GetSchedulesDto, sans importer le service
```

Le vrai obstacle est technique. Un `import type` de `registry.ts` depuis le projet Tauri fait parcourir à `tsc` tout le graphe des services (Prisma généré, `next/headers`…). Les alias `@/` sont résolus avec le `paths` du projet importateur, pas celui du web. Deux issues :

- **Court terme :** le projet Tauri déclare `paths: { "@/*": ["../web/src/*"] }` et n'utilise pas `@/` pour son propre code.
- **Propre :** `apps/web` émet des `.d.ts` (project references ou `emitDeclarationOnly`) et Tauri et l'UI ne consomment que ça. Le package `contracts` viendra ensuite, quand l'UI partagée devra se construire sans dépendre du web.

Pour choisir entre les deux, il me faut l'arborescence de ton monorepo (`packages/…`, `pnpm-workspace`/turbo) et les `paths` du `tsconfig` de `apps/web`. Peux-tu me les envoyer ?

Avec ce monorepo, je retire ma suggestion d'`import type` depuis `apps/web`. `@attendancy/types` existe déjà : c'est ton package `contracts`, et il faut l'utiliser.

## Pourquoi pas l'import de type depuis le web

`apps/desktop` n'a pas d'alias `@/`, alors que chaque fichier du web en utilise. Pour que `tsc` passe côté desktop, il faudrait lui déclarer `@/* → ../web/src/*`. Il traverserait alors tout le graphe des services, avec `next/headers` et le Prisma généré. Vite ne vérifie pas les types, donc le build tourne quand même, mais `tsc --noEmit` devient fragile et lent. Ça convient pour un test d'un jour, pas comme fondation.

## Architecture cible (dépendances dans un seul sens)

```
apps/web  ──►  @attendancy/types  ◄──  @attendancy/planning  ◄──  apps/desktop
                                                                    (et apps/web)
```

**`@attendancy/types`** contient uniquement des types :

```ts
// packages/types/src/api.ts
export type ApiResult<T> = { data: T } | { error: string | undefined }

// À terme généré, au début écrit à la main pour 1-2 actions
export interface ApiContract {
  getSchedulesAction: { input: GetSchedulesInput; output: ApiResult<GetSchedulesDto> }
}

export type ApiClient = {
  [K in keyof ApiContract]: (input: ApiContract[K]['input']) => Promise<ApiContract[K]['output']>
}
```

**Registre côté web**, avec un garde-fou contre la dérive :

```ts
// apps/web/src/app/api/rpc/registry.ts
import type { ApiClient } from '@attendancy/types'
export const RPC = { getSchedulesAction } as const satisfies ApiClient
```

`satisfies` échoue à la compilation si une action du registre n'est pas dans le contrat, si le contrat en contient une que le registre n'a pas, ou si les signatures divergent. Le contrat écrit à la main reste donc honnête même avant le générateur.

**`@attendancy/planning`** reçoit un contexte d'API réduit à ses besoins :

```tsx
// packages/planning/src/api-context.tsx
import type { ApiClient } from '@attendancy/types'
export type PlanningApi = Pick<ApiClient, 'getSchedulesAction'>
const Ctx = createContext<PlanningApi | null>(null)
export const ApiProvider = Ctx.Provider
export const useApi = () => useContext(Ctx)!
```

Les hooks React Query appellent `useApi().getSchedulesAction(...)`. Le web fournit ses Server Actions importées directement, et le desktop fournit `createApiClient`. Ce dernier reste dans `apps/desktop/src/lib/api.ts`, avec le `Proxy` de mon message précédent, sauf que `ApiClient` vient de `@attendancy/types` au lieu de `Rpc`. On l'extraira en package quand un second consommateur en aura besoin.

## Ce qui reste difficile : générer le contrat

Ton générateur émet `Awaited<ReturnType<typeof fn>>`, qui n'a de sens que dans le web. Deux points bloquent :

- **Les DTOs** : pour vivre dans `@attendancy/types`, ils doivent être émis comme des types autonomes, résolus par le TypeChecker (ts-morph), et non comme des références au code des services.
- **Les schémas Valibot** : ils ne peuvent pas migrer tels quels, car ils font `satisfies Record<keyof CreateEntityData, …>` sur des types Prisma. Seuls les types d'`Input` sont émis, pas les schémas.

Fais d'abord les 1-2 actions à la main pour valider le câblage de bout en bout, puis on écrira l'émetteur.

`apps/web/src/types/user.ts` posera un problème du même ordre. Il importe des enums Prisma en runtime (`@/generated/prisma/browser`) et `FUNCTIONS` depuis `@/config/data`. Si l'UI partagée a besoin de `Role` ou de `Functions`, il faudra les déclarer comme unions de littéraux dans `@attendancy/types`, et les vérifier côté web avec `satisfies` contre Prisma.

## Câblage bun/Turbo

- Ajoute `"@attendancy/types": "workspace:*"` dans les `package.json` de `web`, `desktop` et `planning`.
- Les deux packages sont consommés en source (`"exports": "./src/index.ts"`, sans build). Next a besoin de `transpilePackages: ['@attendancy/planning', '@attendancy/types']`, et Vite compile le TS tel quel.
- Ajoute `"lib": ["ES2022"]` dans le `tsconfig` de `packages/types`. Pour `planning`, ajoute aussi `jsx` (ton exemple de `types` est copié de `planning`, je suppose que `planning` l'a déjà).

## Ordre proposé

1. Côté serveur : Bearer dans `getUserInfo`, correctif `expireTag`, route `/api/rpc` avec une action.
2. `@attendancy/types` avec `ApiResult`, `ApiClient` et le contrat écrit à la main pour `getSchedulesAction`.
3. `ApiProvider` dans `planning`, puis migration d'un hook.
4. `createApiClient` et le provider dans `desktop`.
5. Générateur du contrat.

Pour l'étape 5, envoie-moi `scripts/generate/types/types.ts`. Je verrai s'il peut être étendu ou s'il faut un émetteur séparé.