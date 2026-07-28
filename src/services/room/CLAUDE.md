# Service `room`

## Rôle

Gestion des salles et sites géolocalisés (Location) d'un établissement.
Salle = ressource physique réservable pour les séances planifiées.

## Fichiers

| Fichier | Rôle |
|---|---|
| `actions/room.mutations.ts` | `createRoomAction`, `deleteRoomAction`, `createLocationAction`, `toggleLocationActiveAction` |
| `actions/room.queries.ts` | `getRoomsAction`, `getRoomAction`, `getLocationsAction` |
| `database/room.mutations.ts` | Prisma — create/softDelete room + create/toggle location |
| `database/room.queries.ts` | Prisma — listRooms, getRoomById, listLocations |
| `cache.ts` | `ROOM_GRAPH` → invalide `CACHE.ROOM(orgId)` |
| `validation.ts` | `createRoomSchema`, `createLocationSchema` + InferInput/Output |
| `types.ts` | DTOs |

## Invariants

- `orgId` vient du token (`user.organization.id`) — jamais de l'input.
- Soft delete : `Room.deletedAt` — jamais de suppression physique.
- Location = site géolocalisé pour présence GPS ; `radius` en mètres (défaut 50m).

## Points d'extension (⚠ par projet)

- `validation.ts` → ajouter `updateRoomSchema` si édition de salle nécessaire
- `database/room.mutations.ts` → `updateRoom` si besoin
