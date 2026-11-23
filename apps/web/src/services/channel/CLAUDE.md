# Service channel

Propriétaire du modèle Prisma `Channel` (et de lui seul). Les modèles `ChannelMember`, `Message`
et `RealtimeItem` auront chacun leur propre service.

## Fichiers

| Fichier | Rôle |
|---|---|
| `constants.ts` | `CHANNEL_TYPES`, labels, longueur max du nom |
| `validation.ts` | Schémas Valibot : create, update (`validateWithId`), remove |
| `types.ts` / `generated.types.ts` | `CreateChannelData`, `UpdateChannelData`, DTOs `GetChannelsDto`, `GetChannelDto` |
| `cache.ts` | `CHANNEL_GRAPH` (CHANNEL_CREATED / UPDATED / REMOVED) |
| `database/` | Requêtes cachées + mutations Prisma (soft delete via `removeChannel`) |
| `actions/` | Server Actions : `getChannelsAction`, `getChannelAction`, `createChannelAction`, `updateChannelAction`, `removeChannelAction` |
| `server.ts` | Barrel server-only pour les autres services |

## Invariants

- **Aucun blocage de rôle** : les actions utilisent `authAccess()` sans `requiredRole` ni `requiredFunction`.
  Tout utilisateur authentifié de l'org peut créer / modifier / supprimer un channel.
- `orgId` vient du token uniquement, jamais de l'input.
- `type`, `classId`, `groupId` sont immuables après création (update = `name` + `isPrivate`).
- CLASS exige `classId`, GROUP exige `groupId`, jamais les deux à la fois.
- Les channels ORG/CLASS/GROUP sont aussi auto-provisionnés par triggers DB (voir `apply.sql`).

## Points d'extension (⚠)

- Vérifier que `classId` / `groupId` appartiennent à l'org (via `server.ts` des services class / group) avant `createChannel`.
- Ajouter le créateur comme `ChannelMember` OWNER : à orchestrer avec le futur service `channel-member`, pas ici.
- Audit log sur `removeChannelAction` à brancher (`logAuditAsync`).