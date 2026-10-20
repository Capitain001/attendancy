# Service User — Contexte

## Rôle

Récupérer et maintenir les informations de l'utilisateur courant avec un cache multi-niveaux.

## Sources des métadonnées Supabase

Les schémas de [types/user.ts](../../types/user.ts) sont la source unique des types et des clés :

- `AppMetadataSchema` / `AppMetadata` / `APP_METADATA_KEYS` : `role`, `function`, `status`, `organization`, `organizations`. Ces données servent à l'accès et sont lues exclusivement depuis `app_metadata`.
- `UserMetadataSchema` / `UserMetadata` / `USER_METADATA_KEYS` : `name`, `avatar_url`, `phone`, `isConnected`, `invited_by`, `invitationToken`, `invitationType`. Ce sont des données de profil modifiables par l'utilisateur ; elles ne doivent jamais servir à autoriser une action.
- `AuthMetadata` : identifiant, email, états de confirmation et champs natifs/calculés — ce ne sont pas des clés de metadata à écrire.

Les types, les clés et les schémas Valibot sont dérivés des mêmes définitions dans `types/user.ts`. Pour ajouter ou déplacer une clé, modifier le bon schéma et vérifier les lectures/écritures concernées.

`mapUserInfo()` construit la vue unifiée en lisant l'accès dans `app_metadata` sans repli sur `user_metadata`, et le profil dans `user_metadata` : voir [utils.ts](utils.ts). Une clé d'accès absente ne doit pas être récupérée depuis le profil.

Écritures :

- Métadonnées de profil : `setUserInfo()` / `updateUserMetadata()` dans [update.ts](update.ts).
- Métadonnées d'accès : `setUserAccess()` / `updateUserAccess()` dans [access.ts](access.ts), côté serveur uniquement.

## Entrée principale

```ts
getUserInfo(options?: { cache?: boolean; refresh?: boolean }): Promise<Partial<UserInfo> | null>
```

Voir [userInfo.ts](userInfo.ts).

| `cache` | `refresh` | Comportement                                     |
| ------- | --------- | ------------------------------------------------ |
| `true`  | `false`   | Défaut. React cache + LRU (10 min). O(1) en hit. |
| `true`  | `true`    | Bypass LRU, fetch frais, met à jour LRU.         |
| `false` | —         | Ignore LRU. React cache reste actif par request. |

## Architecture de cache (3 niveaux)

1. **React `cache()`** — déduplication intra-request, clé `[userId, options]`.
2. **LRU** — inter-requests, TTL 10 min, max 1000 users → [lru-cache.ts](lru-cache.ts).
3. **Vérif sécurité** — `user.id === userId` avant retour (anti fuite).

## Fichiers clés

- [userInfo.ts](userInfo.ts) — `getUserInfo`, `fetchUserFromSupabase` (cache React)
- [lru-cache.ts](lru-cache.ts) — `getUser` / `setUser` / `removeUser`
- [profile.ts](profile.ts) — lecture profil enrichi
- [update.ts](update.ts) — mutations profil + invalidation cache
- [avatar_url.ts](avatar_url.ts) — gestion avatar
- [permissions.ts](permissions.ts) — helpers permissions user
- [actions.ts](actions.ts) — server actions exposées au client
- [createRandomUser.ts](createRandomUser.ts) — seeding/dev
- [utils.ts](utils.ts) — helpers purs

## Contraintes

- Dans les consommateurs serveur, préférer `getUserInfo()` plutôt que reconstruire manuellement la vue utilisateur.
- Ne jamais autoriser une action à partir de `user_metadata`.
- Ne jamais lire `role`, `function`, `status`, `organization` ou `organizations` dans `user_metadata`.
- Toute modification d'accès passe par les helpers de [access.ts](access.ts), et invalide/rafraîchit le cache selon le helper utilisé.
- Après mutation profil → `removeUser(userId)` ou `getUserInfo({ refresh: true })`.
- `UserInfo` est `Partial<>` — toujours guard les champs avant usage.
- Dans `app_metadata`, `organization` représente l'organisation **courante / active** et `organizations` les appartenances connues.
