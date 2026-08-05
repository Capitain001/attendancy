"use client";

import { useCrudEntity } from "@/hooks/entity/useCrudEntity";
import { toFetchFn, toCreateFn, toUpdateFn, toDeleteFn } from "@/hooks/entity/actionHelpers";
import {
  getMessagesAction,
  sendMessageAction,
  updateMessageAction,
  removeMessageAction,
} from "@/services/chat/actions";
import type { AddMessageData, ChatMessage, UpdateMessageData } from "@/services/chat";

export type CreateMessageInput = Omit<AddMessageData, "userId">;

interface UseMessagesOptions {
  roomName: string;
  staleTime?: number;
  enabled?: boolean;
}

/**
 * Hook CRUD léger pour les messages de chat.
 *
 * - fetch : liste des messages d'une room (`roomName`)
 * - create : envoi d'un message (userId résolu côté serveur)
 * - update : modification du contenu d'un message (par id)
 * - delete : suppression logique d'un message (par id)
 *
 * @example
 * ```tsx
 * const { data, loading, create, update, delete: deleteMessage } = useMessages({
 *   roomName: "org-123:general",
 *   staleTime: 30_000,
 * });
 *
 * // Créer un message
 * await create({ roomName: "org-123:general", content: "Hello team!" });
 *
 * // Mettre à jour un message existant
 * await update("message-id", { content: "Message édité" });
 *
 * // Supprimer un message
 * deleteMessage("message-id");
 * ```
 */
export function useMessages({ roomName, staleTime, enabled }: UseMessagesOptions) {
  const fetchFn = toFetchFn(getMessagesAction, roomName);
  const create = toCreateFn(sendMessageAction);
  const update = toUpdateFn(updateMessageAction);
  const deleteMessage = toDeleteFn<string>(async (id) => {
    const r = await removeMessageAction(id);
    return 'error' in r ? { success: false as const, error: r.error } : { success: true as const };
  });

  return useCrudEntity<ChatMessage, CreateMessageInput>({
    entityName: `messages:${roomName}`,
    fetchFn,
    staleTime,
    enabled,
    crud: {
      create,
      update,
      delete: deleteMessage,
      messages: {
        create: "Message envoyé",
        update: "Message modifié",
        delete: "Message supprimé",
        error: "Une erreur est survenue",
      },
    },
  });
}

