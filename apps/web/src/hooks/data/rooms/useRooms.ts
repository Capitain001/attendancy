// src/hooks/data/rooms/useRooms.ts
"use client";

import { useCrudEntity } from "@/hooks/entity/useCrudEntity";
import { toFetchFn, toCreateFn, toUpdateFn, toDeleteFn } from "@/hooks/entity/actionHelpers";
import { 
  addRoomAction, 
  updateRoomAction, 
  removeRoomAction, 
  getRoomsAction 
} from "@/services/room/actions";
import type { CreateRoomInput as RoomCreateInput, RoomDTo } from "@/services/room";
import type { UpdateRoomDataInput } from "@/services/room/validation";

export type CreateRoomInput = Omit<RoomCreateInput, "orgId">;

export interface UseRoomsOptions {
  locationId?: string;
  staleTime?: number;
  enabled?: boolean;
}

/**
 * Hook pour gérer les salles avec CRUD complet
 * 
 * @example
 * ```tsx
 * const { data, create, update, delete: deleteRoom, loading } = useRooms();
 * 
 * // Créer une salle
 * await create({ name: "Salle A101", capacity: 30, locationId: "loc-123" });
 * 
 * // Mettre à jour
 * await update({ id: "room-123", data: { name: "Salle B101" } });
 * 
 * // Supprimer
 * deleteRoom("room-123");
 * ```
 */
export function useRooms(options: UseRoomsOptions = {}) {
  const { locationId, staleTime, enabled } = options;

  // ✅ Utilisation des helpers réutilisables
  const fetchFn = toFetchFn(getRoomsAction, { locationId });
  const create = toCreateFn(addRoomAction);
  const update = toUpdateFn(updateRoomAction, "roomId");
  const deleteRoom = toDeleteFn(removeRoomAction);

  return useCrudEntity<RoomDTo, CreateRoomInput, UpdateRoomDataInput>({
    entityName: "rooms",
    fetchFn,
    staleTime,
    enabled,
    crud: {
      create,
      update,
      delete: deleteRoom,
      messages: {
        create: "Salle créée avec succès",
        update: "Salle modifiée avec succès",
        delete: "Salle supprimée avec succès",
        error: "Une erreur est survenue"
      }
    }
  });
}
