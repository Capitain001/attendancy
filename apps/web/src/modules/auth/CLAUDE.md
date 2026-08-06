# Auth module — CLAUDE.md

Contexte complet du flow auth : `docs/techs/auth-context.md`

## Ce que fait ce module

Auth **web SSR uniquement** (cookies Supabase). Ne gère PAS le mode Bearer/Tauri — voir `src/utils/supabase/api.ts`.

## Primitives à utiliser

- **Dans un Server Action / RSC** : `authAccess()` (ici, `persmission/acces.ts`)
  ```typescript
  const auth = await authAccess()
  if ('error' in auth) return { error: auth.error }
  const { orgId, user } = auth.data
  ```
- **Pour juste lire le profil** : `getUserInfo()` depuis `src/modules/user`
- **Pour les opérations Supabase Auth** (login, logout, signup…) : fonctions de `supabase.ts`

## Invariants

- `orgId` toujours depuis `auth.data.orgId` — jamais body/query/headers
- `"use server"` sur toutes les fonctions de `actions/`
- `createClient()` = client SSR (cookies). Ne jamais importer le client browser ici.

## Permissions / rôles

`persmission/acces.ts` → `authAccess({ requiredRole?, requiredFunction? })`  
Config des rôles : `persmission/config.ts`  
Types : `persmission/types.ts`

## Auth desktop (Tauri)

Hors de ce module. Voir :
- `apps/desktop/src/lib/supabase.ts`
- `apps/desktop/src/hooks/useAuth.ts`
- `apps/web/src/utils/supabase/api.ts` (vérification Bearer côté API routes)
