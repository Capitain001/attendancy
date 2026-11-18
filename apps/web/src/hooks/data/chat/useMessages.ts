// src/hooks/data/chat/useMessages.ts
"use client";

import { useCrudEntity } from "@/hooks/entity/useCrudEntity";
import { toFetchFn, toCreateFn, toUpdateFn, toDeleteFn } from "@/hooks/entity/actionHelpers";
import {
  getMessagesAction,
  createMessageAction,
  updateMessageAction,
  removeMessageAction,
} from "@/services/message/actions";
import type { GetMessagesDto } from "@/services/message";
import type { CreateMessageInput, UpdateMessageDataInput } from "@/services/message";
import {
  messageEntityPatch,
  mapMessageUser,
  type MessageUser,
} from "./utils";

export type { MessageUser } from "./utils";

interface UseMessagesOptions {
  channelId: string;
  user?: MessageUser;
  staleTime?: number;
  enabled?: boolean;
}

/**
 * Hook CRUD léger pour les messages du canal identifié par `channelId`.
 *
 * - fetch : récupère les messages du canal
 * - create : envoie un message ; son `id` est fourni par le client pour
 *   permettre les rejeux idempotents, tandis que l'utilisateur est résolu côté serveur
 * - update : modification du contenu d'un message (par id)
 * - delete : suppression logique d'un message (par id)
 *
 * @example
 * ```tsx
 * const channelId = "channelId_uuid";
 * const { data, loading, create, update, delete: deleteMessage } = useMessages({
 *   channelId,
 *   staleTime: 30_000,
 * });
 *
 * // Créer un message
 * const createdAt = new Date().toISOString();
 * await create({
 *   id: crypto.randomUUID(),
 *   createdAt,
 *   channelId,
 *   content: "Hello team!",
 * });
 *
 * // Mettre à jour un message existant
 * await update("message-id", { content: "Message édité" });
 *
 * // Supprimer un message
 * deleteMessage("message-id");
 * ```
 */
export function useMessages({ channelId, user, staleTime, enabled }: UseMessagesOptions) {
  const fetchFn = toFetchFn(getMessagesAction, { channelId });
  const create = toCreateFn(createMessageAction);
  const update = toUpdateFn(updateMessageAction, "messageId");
  const removeMessage = toDeleteFn(removeMessageAction);

  const createDefaults = mapMessageUser(user);

  return useCrudEntity<GetMessagesDto[number], CreateMessageInput, UpdateMessageDataInput>({
    entityName: "messages",
    initialParams: { channelId },
    fetchFn,
    staleTime,
    enabled,
    crud: {
      create,
      createDefaults,
      toEntityPatch: messageEntityPatch,
      update,
      delete: removeMessage,
      messages: {
        create: "Message envoyé",
        update: "Message modifié",
        delete: "Message supprimé",
        error: "Une erreur est survenue",
      },
    },
  });
}
