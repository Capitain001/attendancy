# Service `room`

## Rôle

Gestion des salles et sites géolocalisés (Location) d'un établissement.
Salle = ressource physique réservable pour les séances planifiées.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `actions/index.ts` | Barrel exports des actions |
| `actions/room.mutations.ts` | `createRoomAction`, `removeRoomAction`, `updateRoomAction`, `createLocationAction`, `toggleLocationActiveAction` |
| `actions/room.queries.ts` | `getRoomsAction`, `getRoomAction`, `getLocationsAction` |
| `cache.ts` | `ROOM_GRAPH` → invalide `CACHE.ROOM(orgId)` |
| `database/index.ts` | Barrel interne (non exporté) |
| `database/room.mutations.ts` | Prisma — `createRoom`, `removeRoom` (soft delete) + `createLocation`, `toggleLocationActive` |
| `database/room.queries.ts` | Prisma — `getRooms`, `getRoomById`, `getLocations` |
| `generated.types.ts` | Types générés automatiquement (DTOs de lecture) |
| `index.ts` | Point d'entrée du service (export actions + types) |
| `types.ts` | DTOs |
| `validation.ts` | `createRoomSchema`, `createLocationSchema` + InferInput/Output |
## Invariants

- `orgId` vient du token (`user.organization.id`) — jamais de l'input.
- Soft delete : `Room.deletedAt` — jamais de suppression physique.
- Location = site géolocalisé pour présence GPS ; `radius` en mètres (défaut 50m).

## Points d'extension (⚠ par projet)

- `validation.ts` → ajouter `updateRoomSchema` si édition de salle nécessaire
- `database/room.mutations.ts` → `updateRoom` si besoin
