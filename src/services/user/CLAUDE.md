# Service `user`

## Rôle

Identité de l'utilisateur courant côté serveur. Expose `getUserInfo()` — point
d'entrée auth unique de toutes les server actions et pages RSC — et les
utilitaires de mise à jour des métadonnées Supabase.

Ce service ne possède PAS le modèle Prisma `User` (le service `auth` gère la
création du record) — il lit et écrit exclusivement les métadonnées Supabase.

## Fichiers

| Fichier | Rôle |
|---|---|
| `userInfo.ts` | `getUserInfo()` — JWT + React.cache + LRU. Ne pas modifier la mécanique. |
| `lru-cache.ts` | Cache process-local (niveau 2). Invalidation par user ou par org. |
| `update.ts` | `setUserInfo`, `syncUserOrganizationProfile`, `setCurrentOrganization`… |
| `profile.ts` | Fonctions PURES : injection des IDs de profil dans Organization. |
| `types.ts` | `UserInfo`, `UserMetadata`, `Organization`, `Role`, `FunctionName`, `OrgContext` |

## Points d'extension (⚠ par projet)

- `types.ts` → `Role` : aligner sur l'enum Prisma du projet
- `types.ts` → `FunctionName` : fonctions RBAC du projet
- `types.ts` → `Organization` : ajouter les IDs de profils métier (`memberId`…)
- `profile.ts` → `ROLE_PROFILE_KEY` : une entrée par rôle qui porte un profil DB

## Invariants

- `orgId` vient de `user.organization.id` — JAMAIS d'un body/query/header.
- Après toute mutation des métadonnées Supabase : `removeUser(userId)` pour
  invalider le LRU (déjà fait automatiquement par `setUserInfo`/`updateUserMetadata`).
- Après mutation d'une organisation : `removeUsersByOrg(orgSlug)`.
- `getUserInfo()` est gratuit en appels multiples dans une même requête
  (React.cache) — ne pas faire circuler le user en paramètre entre actions.
- `updateUserMetadata` est best-effort — ne throw pas, log l'erreur.
  À utiliser uniquement hors transaction pour les syncs non-critiques.
