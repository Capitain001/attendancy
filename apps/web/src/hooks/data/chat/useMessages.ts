"use client";

import { useCrudEntity } from "@/hooks/entity/useCrudEntity";
import { toFetchFn, toCreateFn, toUpdateFn, toDeleteFn } from "@/hooks/entity/actionHelpers";
import {
  getMessagesAction,
  sendMessageAction,
  updateMessageAction,
  removeMessageAction,
} from "@/services/chat/actions";
import type { ChatMessage } from "@/services/chat";
import type { CreateMessageInput, UpdateMessageDataInput } from "@/services/chat/validation";

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
  const update = toUpdateFn(updateMessageAction, "messageId");
    const removeMessage = toDeleteFn(removeMessageAction);

  return useCrudEntity<ChatMessage, CreateMessageInput, UpdateMessageDataInput>({
    entityName: `messages:${roomName}`,
    fetchFn,
    staleTime,
    enabled,
    crud: {
      create,
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

