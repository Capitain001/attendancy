# Service User — Contexte

## Rôle
Récupérer + maintenir le profil de l'utilisateur courant (id, role, fonction, organisation active, statut). Source : Supabase Auth `user_metadata`. Cache multi-niveaux.

## Entrée principale
```ts
getUserInfo(options?: { cache?: boolean; refresh?: boolean }): Promise<Partial<UserInfo> | null>
```
Voir [userInfo.ts](userInfo.ts).

| `cache` | `refresh` | Comportement                                      |
|---------|-----------|---------------------------------------------------|
| `true`  | `false`   | Défaut. React cache + LRU (10 min). O(1) en hit.  |
| `true`  | `true`    | Bypass LRU, fetch frais, met à jour LRU.          |
| `false` | —         | Ignore LRU. React cache reste actif par request.  |

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

## Source de vérité du rôle (à clarifier)
Actuellement : rôle lu depuis `user_metadata.role` Supabase. La table `UserOrganization.role` existe aussi en DB.
→ Question ouverte : voir **P-XX** (multi-org) et **A-XX** (sync metadata ↔ Prisma) une fois discutées.

## Contraintes
- Toujours passer par `getUserInfo()` — jamais lire `supabase.auth.getUser()` directement côté serveur.
- Après mutation profil → `removeUser(userId)` ou `getUserInfo({ refresh: true })`.
- `UserInfo` est `Partial<>` — toujours guard les champs avant usage.
- `organization` dans metadata = org **courante / active**. `organizations[]` = toutes appartenances.
