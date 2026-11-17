import type { GetMessagesDto } from "@/services/message";
import type {
  CreateMessageInput,
  UpdateMessageDataInput,
} from "@/services/message";

export function messageEntityPatch(
  input: CreateMessageInput | UpdateMessageDataInput,
): Partial<GetMessagesDto[number]> {
  if ("channelId" in input) {
    return {
      id: input.id,
      content: input.content,
      channelId: input.channelId,
      parentId: input.parentId ?? null,
      ...(input.createdAt ? { createdAt: new Date(input.createdAt) } : {}),
    };
  }

  return input;
}