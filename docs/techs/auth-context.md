# Auth — contexte complet

Deux modes coexistent. Ne jamais mélanger leurs primitives.

---

## 1. Modes d'authentification

### Mode A — Web SSR (Next.js `apps/web`)

Supabase SSR via cookies. Le middleware injecte la session dans chaque requête.

```
Browser → Next.js middleware (refresh cookie) → Page RSC / Server Action
                                               ↓
                                          getUserInfo()   ← lit le cookie Supabase
                                          authAccess()    ← wrap getUserInfo() + vérif role/org
```

**Primitives à utiliser :**
- `getUserInfo()` — `src/modules/user` — retourne `UserInfo` (id, email, role, organization…)
- `authAccess(params?)` — `src/modules/auth/persmission/acces.ts` — retourne `{ data: { user, orgId } } | { error }`
- `createClient()` — `src/utils/supabase/server.ts` — client Supabase SSR (cookies)

**Règle invariante :** `orgId` toujours extrait de `auth.data.orgId` (lu depuis le token Supabase), **jamais** du body/query/headers.

---

### Mode B — Tauri Desktop (`apps/desktop`)

WebView à `localhost:1420` → Next.js à `localhost:3000`. Cookies cross-origin impossibles.
Supabase Browser Client (`@supabase/supabase-js`) stocke la session en `localStorage`.
Chaque appel API porte `Authorization: Bearer <access_token>`.

```
LoginView → useAuth().login()
              ↓ supabase.auth.signInWithPassword()
              ↓ session stockée localStorage automatiquement
App.tsx   → setAuthToken(session.access_token)   ← injecté dans apiFetch (packages/planning)
              ↓ GET /api/auth/me  (Bearer)
              ↓ classId réel → PlanningView
```

**Primitives à utiliser :**
- `supabase` — `apps/desktop/src/lib/supabase.ts` — client browser (localStorage, autoRefresh)
- `useAuth()` — `apps/desktop/src/hooks/useAuth.ts` — `{ session, user, loading, login, logout }`
- `setAuthToken(token)` — `packages/planning/src/lib/api-client.ts` — injecte le Bearer dans `apiFetch`

---

## 2. Structure `user_metadata` Supabase

Tout est stocké dans `user.user_metadata` (défini à l'inscription) :

```typescript
type UserMetadata = {
  name?: string
  role?: string                       // 'ADMIN' | 'DIRECTION' | 'TEACHER' | 'STUDENT' …
  function?: string                   // 'PRINCIPAL' | 'SUPER_ADMIN' …
  status?: string                     // 'NEW' | 'ACTIVE' …
  organization?: { id: string }       // orgId — source of truth côté API routes
}
```

**Pour extraire `orgId` côté API route Bearer :**
```typescript
const meta = user.user_metadata as { organization?: { id?: string } }
const orgId = meta.organization?.id
```

---

## 3. Fichiers clés

### `apps/web`

| Fichier | Rôle |
|---|---|
| `src/utils/supabase/server.ts` | `createClient()` SSR (cookies) |
| `src/utils/supabase/middleware.ts` | Refresh session sur chaque requête |
| `src/utils/supabase/api.ts` | `extractBearerToken()` + `verifyBearerToken()` — pour les routes appelées par Tauri |
| `src/modules/auth/persmission/acces.ts` | `authAccess()` — auth SSR + vérif role/org |
| `src/modules/auth/supabase.ts` | `loginWithPassword`, `logout`, `signUp*` … |
| `src/modules/user/` | `getUserInfo()` — retourne le profil complet depuis cookie |
| `src/app/api/auth/me/route.ts` | Route Bearer : renvoie `{ userId, email, name, orgId, role, classId }` |
| `src/app/api/planning/route.ts` | Route dual-auth : Bearer (Tauri) + cookie SSR (web) |

### `apps/desktop`

| Fichier | Rôle |
|---|---|
| `src/lib/supabase.ts` | Client browser (localStorage, `detectSessionInUrl: false`) |
| `src/hooks/useAuth.ts` | `useAuth()` — state machine session |
| `src/views/LoginView.tsx` | Formulaire email/password |
| `src/App.tsx` | Shell : `setAuthToken` + fetch `/api/auth/me` + routing login↔planning |

### `packages/planning`

| Fichier | Rôle |
|---|---|
| `src/lib/api-client.ts` | `apiFetch()` + `setAuthToken()` — gère le Bearer sur les appels HTTP |

---

## 4. Ajouter Bearer à une nouvelle API route

Pattern minimal — supporte les deux modes sans dupliquer la logique :

```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { authAccess } from '@/services/auth'
import { extractBearerToken, verifyBearerToken } from '@/utils/supabase/api'

function corsHeaders(req: NextRequest) {
  return {
    'Access-Control-Allow-Origin': req.headers.get('origin') ?? '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) })
}

async function resolveOrgId(req: NextRequest): Promise<string | null> {
  const token = extractBearerToken(req)
  if (token) {
    const user = await verifyBearerToken(token)
    const meta = (user?.user_metadata ?? {}) as { organization?: { id?: string } }
    return meta.organization?.id ?? null
  }
  const auth = await authAccess()
  if ('error' in auth || !auth.data) return null
  return auth.data.orgId
}

export async function GET(req: NextRequest) {
  const cors = corsHeaders(req)
  const orgId = await resolveOrgId(req)
  if (!orgId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401, headers: cors })
  // … logique métier …
  return NextResponse.json({ data: result }, { headers: cors })
}
```

---

## 5. Flow desktop de bout en bout

```
1. App démarre
   └─ useAuth() → supabase.auth.getSession()
      ├─ session null   → <LoginView />
      └─ session valide → setAuthToken(token) + GET /api/auth/me

2. GET /api/auth/me (Bearer)
   └─ verifyBearerToken() → supabase.auth.getUser(token)
      └─ retourne { orgId, role, classId }
         ├─ role = TEACHER → classId = premier Schedule futur du teacher
         └─ autre rôle    → classId = null (non implémenté)

3. <PlanningView classId={classId} />
   └─ apiFetch('/api/planning?classId=…') avec Authorization: Bearer <token>
      └─ route dual-auth → getSchedules() → DayScheduleDto[]
         └─ stocké offline via PersistQueryClientProvider + idbPersister

4. Logout
   └─ supabase.auth.signOut() → session null → setAuthToken(null) → <LoginView />
```

---

## 6. Variables d'environnement

### `apps/web/.env`
```
NEXT_PUBLIC_SUPABASE_URL=https://…supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ…
```

### `apps/desktop/.env`
```
VITE_API_URL=http://localhost:3000        # URL du Next.js en dev
VITE_SUPABASE_URL=https://…supabase.co
VITE_SUPABASE_ANON_KEY=eyJ…
```

---

## 7. Ce qu'on ne fait PAS

- `orgId` depuis le body ou les query params → **interdit** (invariant projet)
- `supabase.auth.getUser()` dans un Server Action → utiliser `getUserInfo()` à la place
- Cookie Supabase dans Tauri → impossible cross-origin, toujours Bearer
- `@supabase/ssr` dans `apps/desktop` → utiliser `@supabase/supabase-js` (browser)
- Dupliquer la logique `resolveOrgId` dans chaque route → extraire dans `utils/supabase/api.ts`
