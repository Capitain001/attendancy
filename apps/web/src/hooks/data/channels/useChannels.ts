// src/hooks/data/chat/useChannels.ts
"use client";

import { useCrudEntity } from "@/hooks/entity/useCrudEntity";
import { toFetchFn, toCreateFn, toUpdateFn, toDeleteFn } from "@/hooks/entity/actionHelpers";
import {
  getChannelsAction,
  createChannelAction,
  updateChannelAction,
  removeChannelAction,
} from "@/services/channel/actions";
import type { GetChannelsDto } from "@/services/channel/types";
import type {
  CreateChannelInput,
  UpdateChannelDataInput,
} from "@/services/channel/validation";

interface UseChannelsOptions {
  staleTime?: number;
  enabled?: boolean;
}

/**
 * Hook CRUD léger pour les channels de l'organisation courante.
 *
 * @example
 * ```tsx
 * const { data, loading, create, update, delete: deleteChannel } = useChannels();
 *
 * await create({ type: "DM", name: "Équipe pédagogique" });
 * await update({ id: "channel-id", data: { name: "Nouveau nom" } });
 * await deleteChannel("channel-id");
 * ```
 */
export function useChannels({ staleTime, enabled }: UseChannelsOptions = {}) {
  const fetchFn = toFetchFn(getChannelsAction);
  const create = toCreateFn(createChannelAction);
  const update = toUpdateFn(updateChannelAction, "channelId");
  const removeChannel = toDeleteFn(removeChannelAction);

  return useCrudEntity<GetChannelsDto[number], CreateChannelInput, UpdateChannelDataInput>({
    entityName: "channels",
    fetchFn,
    staleTime,
    enabled,
    crud: {
      create,
      update,
      delete: removeChannel,
      messages: {
        create: "Channel créé",
        update: "Channel modifié",
        delete: "Channel supprimé",
        error: "Une erreur est survenue",
      },
    },
  });
}