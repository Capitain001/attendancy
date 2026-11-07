# Auth module — CLAUDE.md

Contexte complet du flow auth : `docs/techs/auth-context.md`

## Ce que fait ce module

Auth **web SSR uniquement** (cookies Supabase). Ne gère PAS le mode Bearer/Tauri — voir `src/utils/supabase/api.ts`.

## Primitives à utiliser

- **Dans un Server Action / RSC** : `authAccess()` (ici, `persmission/acces.ts`)
  ```typescript
  const auth = await authAccess();
  if ("error" in auth) return { error: auth.error };
  const { orgId, user } = auth.data;
  ```
- **Pour juste lire le profil** : `getUserInfo()` depuis `src/modules/user`
- **Pour les opérations Supabase Auth** (login, logout, signup…) : fonctions de `supabase.ts`

## Invariants

- `orgId` toujours depuis `auth.data.orgId` — jamais body/query/headers
- `"use server"` sur toutes les fonctions de `actions/`
- `createClient()` = client SSR (cookies). Ne jamais importer le client browser ici.
- Les helpers DB dans `members/utils.ts` ne sont pas des Server Actions : ils utilisent `import 'server-only'` et reçoivent le client Prisma ou transactionnel fourni par leur appelant.
- `enrollStudentInClass` délègue à `createStudentEnrollmentRaw` du service `student-enrollment`; vérifier et préserver le scope classe/organisation avant l'appel. Les groupes ajoutés sont idempotents.
- Les flux d'acceptation d'invitation matérialisent les liens parent-étudiant avec `ensureParentRelation` depuis `@/services/parent-relation/server`, en passant la transaction courante.
- Pour l'inscription étudiant issue d'une invitation, `resourceId` avec `resourceType === "CLASS"` est la seule source du `classId`; `details.enrollment` peut fournir les groupes, mais son `classId` n'est pas lu.

## Permissions / rôles

`persmission/acces.ts` → `authAccess({ requiredRole?, requiredFunction? })`  
Config des rôles : `persmission/config.ts`  
Types : `persmission/types.ts`

## Auth desktop (Tauri)

Hors de ce module. Voir :

- `apps/desktop/src/lib/supabase.ts`
- `apps/desktop/src/hooks/useAuth.ts`
- `apps/web/src/utils/supabase/api.ts` (vérification Bearer côté API routes)
