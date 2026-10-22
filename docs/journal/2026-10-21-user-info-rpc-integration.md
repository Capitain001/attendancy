# Journal du 21 octobre 2026 : Intégration de `getCurrentUserAction` et hook `useCurrentUser`

> **Contexte :** Implémentation des écrans enseignant (`apps/teacher`) — Route `/_app/sessions`  
> **Statut :** ✅ Validé & implémenté  
> **Périmètre :** `@attendancy/auth`, `@attendancy/app`, `apps/teacher`

---

## 1. Contexte & Problématique

Lors de la mise en place de la route de session enseignant (`apps/teacher/src/routes/_app/sessions.tsx`), le composant `TeacherSessionPage` nécessitait l'identifiant enseignant (`teacherId`) du compte connecté pour requêter le cours actuel/suivant (`getTeacherNextScheduleAction`) et les présences associées (`getScheduleAttendancesAction`).

### Anomalies initiales identifiées
Une première approche locale tentait de déduire le `teacherId` en castant directement l'utilisateur de session Supabase :
```ts
// ❌ Approche dépréciée et incorrecte :
const meta = user?.user_metadata as { organization?: { teacherId?: string } } | undefined;
const teacherId = meta?.organization?.teacherId ?? "teacher-current";
```

Cette implémentation présentait trois défauts majeurs :
1. **Erreur de magasin de données :** Dans l'architecture de sécurité du projet (`apps/web/src/types/user.ts`), les métadonnées sont scindées en deux :
   - `user_metadata` : réservé au profil utilisateur modifiable côté client (`name`, `avatar_url`, etc.).
   - `app_metadata` : réservé aux droits et à l'organisation administrés par le serveur via le service role.  
   L'information `organization.teacherId` est stockée dans `app_metadata` et n'a jamais vocation à être dans `user_metadata`.
2. **Contournement de l'architecture RPC :** Le client n'a pas à inspecter ou reconstruire manuellement les métadonnées du token JWT Supabase. L'architecture monorepo a explicitement formalisé l'action RPC `getCurrentUserAction` (`apps/web/src/modules/auth/rpc/actions.ts`) pour remplacer `/api/auth/me` et fournir au client la source unique de vérité sur le profil complet (`UserInfo`).
3. **Incompatibilité de type dans `RootLayout.tsx` :** `packages/app/src/RootLayout.tsx` passait l'objet Supabase brut `auth.session.user` au composant `<Header user={user} />`, ce qui provoquait une erreur TypeScript car `Header` attend `PublicUserInfo`.

---

## 2. Solution d'architecture retenue

Mutualiser la lecture de `getCurrentUserAction` au niveau du package partagé `@attendancy/auth` via un hook réactif `useCurrentUser()`, typé par le contrat RPC `@attendancy/types`.

### Bénéfices
- **Centralisation :** Aucune duplication de logique ou de cast de token dans les applications clientes (`apps/teacher`, `apps/desktop`, `packages/app`).
- **Typage strict garanti :** L'utilisateur retourné est un `UserInfo` unifié et typé, conforme à la source de vérité serveur.
- **Mise en cache & invalidation :** Intégration native avec TanStack Query (`staleTime: 5 min`, clé liée à l'ID utilisateur).
- **Élimination des erreurs de typage :** `UserInfo` satisfait les contraintes de `PublicUserInfo` attendu par le `Header`.

---

## 3. Détail des modifications

### A. `@attendancy/auth`
1. **`packages/auth/package.json`** :
   - Ajout de `@tanstack/react-query` dans `peerDependencies` et `devDependencies`.
2. **`packages/auth/src/useCurrentUser.ts`** (nouveau fichier) :
   ```ts
   import { useQuery } from "@tanstack/react-query";
   import type { UserInfo } from "@attendancy/types";
   import { useAuth } from "./AuthProvider";
   import { api } from "./api";

   export function useCurrentUser() {
     const auth = useAuth();
     const isSignedIn = auth?.status === "signed-in";
     const userId = isSignedIn ? auth.session.user.id : null;

     return useQuery({
       queryKey: ["currentUser", userId],
       queryFn: async (): Promise<UserInfo | null> => {
         const res = await api.getCurrentUserAction();
         if ("error" in res && res.error) {
           throw new Error(res.error);
         }
         return (res.data as UserInfo) ?? null;
       },
       enabled: isSignedIn && !!userId,
       staleTime: 5 * 60 * 1000,
       retry: false,
     });
   }
   ```
3. **`packages/auth/src/index.ts`** :
   - Export de `useCurrentUser`.

### B. Route Enseignant `apps/teacher`
**`apps/teacher/src/routes/_app/sessions.tsx`** :
Refactorisation complète pour consommer `useCurrentUser()` :
```tsx
import { createFileRoute } from "@tanstack/react-router";
import TeacherSessionPage from "@/components/session/TeacherSessionPage";
import { useCurrentUser } from "@attendancy/auth";
import { CircleDashed } from "lucide-react";

export const Route = createFileRoute("/_app/sessions")({
  component: SessionsPage,
});

function SessionsPage() {
  const { data: user, isLoading } = useCurrentUser();
  const teacherId = user?.organization?.teacherId;

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <CircleDashed className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!teacherId) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 text-muted-foreground">
        <CircleDashed className="size-8" />
        <span className="text-sm">Aucun profil enseignant associé</span>
      </div>
    );
  }

  return <TeacherSessionPage teacherId={teacherId} />;
}
```

### C. `@attendancy/app`
**`packages/app/src/RootLayout.tsx`** :
- Remplacement de la lecture brute `auth.session.user` par `useCurrentUser()`.
- `<Header user={user ?? undefined} onSignOut={logout} />` reçoit désormais un profil compatible `PublicUserInfo`.

---

## 4. Vérifications & Résultats

| Commande | Périmètre | Résultat |
|---|---|---|
| `bun --filter @attendancy/auth check-types` | Package Auth | ✅ **0 erreur** (Code sortie 0) |
| `bun --filter @attendancy/app check-types` | Package App (Layout partagé) | ✅ **0 erreur** (Code sortie 0) |
| Typage `sessions.tsx` | Route Teacher | ✅ **0 erreur** (Conforme au contrat RPC) |
| Typage `RootLayout.tsx` | Header UI | ✅ **0 erreur** (Résolu) |
