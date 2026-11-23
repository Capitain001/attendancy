import type {
  GetMessagesDto,
  CreateMessageInput,
  UpdateMessageDataInput,
} from "@attendancy/types";

export type MessageUser = {
  id: string;
  name?: string | null;
  avatar_url?: string | null;
};

/* : Partial<GetMessagesDto[number]> | undefined  */
export function mapMessageUser(
  user?: MessageUser,
){
  if (!user) return undefined;

  const { id, name, avatar_url } = user;

  return {
    user: {
      id,
      firstName: name ?? null,
      lastName: null,
      avatar_url: avatar_url ?? null,
    },
  };
}

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
