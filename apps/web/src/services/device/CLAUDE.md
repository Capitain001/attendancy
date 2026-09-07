# Service : device

Gère la sécurité et l'historique des connexions des utilisateurs en identifiant les appareils physiques (via un cookie opaque) et en traçant chaque session de connexion.
2 modèles Prisma : `UserDevice` et `UserSession`.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `actions/device.mutations.ts` | `captureLoginDeviceAction`, `endSessionOnLogoutAction`, `revokeSessionAction`, `revokeDeviceAction` |
| `actions/device.queries.ts` | `getMyDevicesAction`, `getMySessionsAction` |
| `actions/index.ts` | Barrel exports des actions |
| `cache.ts` | `DEVICE_GRAPH` — enregistré dans `src/cache/server/key.ts` |
| `database/device.mutations.ts` | `upsertDeviceOnLogin`, `expireSessionOnLogout`, `revokeSession`, `revokeDevice`, `touchSessionActivity` |
| `database/device.queries.ts` | Lectures avec `"use cache"` (`getUserDevices`, `getUserSessions`, `getSession`) |
| `database/index.ts` | Barrel interne (non exporté) |
| `generated.types.ts` | Types générés automatiquement (DTOs de lecture) |
| `index.ts` | Point d'entrée du service (export actions + types) |
| `types.ts` | DTOs et types du domaine |
| `utils.ts` | Décodage léger du JWT. ⚠ Ne pas importer côté Edge Runtime. |
| `validation.ts` | `captureLoginDeviceSchema`, `endSessionOnLogoutSchema`, `revokeSessionSchema`, `revokeDeviceSchema` |
## Invariants

- Identité vs Historique : `UserDevice` (machine physique persistante) vs `UserSession` (occurrence temporelle de connexion).
- Révocation d'un appareil révoque automatiquement toutes ses sessions actives, mais ne supprime pas l'historique.
- Cycle de vie du device_id : L'ID de l'appareil est généré côté Edge (middleware) et stocké dans un cookie `httpOnly`. N'est jamais généré par Prisma.
- Best-effort au Login/Logout : L'enregistrement du device ne doit jamais bloquer le flux principal d'authentification Supabase.
- Absence de suppression dure (Hard Delete) : Le cycle de vie est géré via `revokedAt` et des statuts (ACTIVE/REVOKED/EXPIRED) pour conserver la trace d'audit.

## Points d'extension (⚠)

- Révocation active Supabase : Synchroniser le `revokeDeviceAction` avec l'API Admin Supabase via `authSessionId` pour déconnecter réellement l'utilisateur côté serveur d'authentification.
- Détection d'appareil inconnu (Envoi de mail/notification "Nouvelle connexion détectée sur votre compte").

## Commandes

Générer l'index API, les types et le résumé pour ce service :
```bash
npx tsx scripts/generate/api/api.ts device
npx tsx scripts/generate/types/types.ts device
npx tsx scripts/generate/summary/summary.ts device
```

