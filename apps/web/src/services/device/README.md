# Gestion des devices 

## Arborescence des fichiers 

src/services/device/
  database/
    device.queries.ts                 → nouveau
    device.mutations.ts               → nouveau
    index.ts                          → nouveau
  actions/
    device.queries.ts                 → nouveau
    device.mutations.ts               → nouveau
    index.ts                          → nouveau
  validation.ts                       → nouveau
  types.ts                            → nouveau
  generated.types.ts                  → nouveau
  cache.ts                            → nouveau (à spreader dans src/cache/server/key.ts)

src/modules/auth/
  actions/login.ts                    → REMPLACE ton fichier existant
  actions/logout.ts                   → REMPLACE ton fichier existant
  utils/jwt.ts                        → nouveau

src/utils/supabase/
  middleware.ts                       → REMPLACE ton fichier existant
  device-id.ts                        → nouveau
```

## Étapes d'intégration

1. **Dépendance** : `npm install ua-parser-js`

2. **Prisma**
   - Copier `prisma/schemas/device.prisma` dans ton dossier `prisma/schemas/`.
   - Dans `tenant.prisma`, ajouter sur `User` :
     ```prisma
     devices  UserDevice[]
     sessions UserSession[]
     ```
     et sur `Organization` :
     ```prisma
     userSessions UserSession[]
     ```
   - `npx prisma generate` puis `npx prisma migrate dev`.

3. **Cache**
   - Dans `src/cache/server/key.ts` : ajouter les clés `USER_DEVICES(userId)`,
     `USER_SESSIONS(userId)`, `USER_SESSION(sessionId)` à `CACHE`, et spreader
     `DEVICE_GRAPH` (exporté par `src/services/device/cache.ts`) dans
     `CACHE_GRAPH`.

4. **CLAUDE.md du service** (à créer, non fourni ici — dépend de la
   convention de contenu déjà en place sur tes autres services) : rôle,
   fichiers, invariants (`orgId` nullable sur `UserSession` volontairement,
   `authSessionId` best-effort, révocation = bookkeeping applicatif).

5. **Remplacer** `src/modules/auth/actions/login.ts`,
   `src/modules/auth/actions/logout.ts` et
   `src/utils/supabase/middleware.ts` par les versions fournies. Ajouter
   `src/modules/auth/utils/jwt.ts` et `src/utils/supabase/device-id.ts`.

## Points laissés ouverts (voir conversation pour détails)

- **Revoke effectif du JWT** : la révocation en base (`UserSession.status =
  REVOKED`) ne tue pas un access token déjà émis. Pour la rendre effective,
  brancher soit un check `UserSession.status` dans le middleware à chaque
  requête, soit un appel best-effort à l'API admin Supabase avec
  `authSessionId` au moment du `revokeSession`/`revokeDevice`. Non implémenté
  dans les fichiers fournis.
- **Redirection `/login`** dans `updateSession` : le bloc est resté commenté
  (neutralisé), fidèle à ton fichier original — à réactiver si besoin.
- **UI "mes appareils"** : les actions `getMyDevicesAction`,
  `getMySessionsAction`, `revokeSessionAction`, `revokeDeviceAction` sont
  prêtes côté serveur ; aucun composant front n'a été demandé/fourni.
