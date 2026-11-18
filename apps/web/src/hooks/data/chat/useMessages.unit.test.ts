import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GetMessagesDto } from "@/services/message";
import type {
  CreateMessageInput,
  UpdateMessageDataInput,
} from "@/services/message";

const { useCrudEntityMock } = vi.hoisted(() => ({
  useCrudEntityMock: vi.fn((options: unknown) => options),
}));

vi.mock("@/hooks/entity/useCrudEntity", () => ({
  useCrudEntity: useCrudEntityMock,
}));

vi.mock("@/services/message/actions", () => ({
  getMessagesAction: vi.fn(),
  createMessageAction: vi.fn(),
  updateMessageAction: vi.fn(),
  removeMessageAction: vi.fn(),
}));

import { useMessages } from "./useMessages";

interface CapturedCrudOptions {
  entityName: string;
  initialParams: { channelId: string };
  crud: {
    createDefaults?: Partial<GetMessagesDto[number]>;
    toEntityPatch: (
      input: CreateMessageInput | UpdateMessageDataInput,
    ) => Partial<GetMessagesDto[number]>;
  };
}

describe("useMessages", () => {
  beforeEach(() => {
    useCrudEntityMock.mockClear();
  });

  it("transmet messageEntityPatch à useCrudEntity et mappe la création pour le cache", () => {
    const channelId = "channel-1";
    const createdAt = "2026-11-17T18:00:00.000Z";

    const options = useMessages({ channelId }) as unknown as CapturedCrudOptions;

    expect(useCrudEntityMock).toHaveBeenCalledOnce();
    expect(options.entityName).toBe("messages");
    expect(options.initialParams).toEqual({ channelId });
    expect(
      options.crud.toEntityPatch({
        id: "message-1",
        createdAt,
        content: "Bonjour",
        channelId,
      }),
    ).toEqual({
      id: "message-1",
      content: "Bonjour",
      channelId,
      parentId: null,
      createdAt: new Date(createdAt),
    });
  });

  it("conserve un patch d'update dans la forme de l'entité", () => {
    const options = useMessages({
      channelId: "channel-1",
    }) as unknown as CapturedCrudOptions;

    expect(options.crud.toEntityPatch({ content: "Message modifié" })).toEqual({
      content: "Message modifié",
    });
  });

  it("construit createDefaults avec l'utilisateur connecté (name -> firstName)", () => {
    const options = useMessages({
      channelId: "channel-1",
      user: {
        id: "user-123",
        name: "Alice Martin",
        avatar_url: "https://avatar.png",
      },
    }) as unknown as CapturedCrudOptions;

    expect(options.crud.createDefaults).toEqual({
      user: {
        id: "user-123",
        firstName: "Alice Martin",
        lastName: null,
        avatar_url: "https://avatar.png",
      },
    });
  });

  it("laisse createDefaults à undefined si aucun user n'est fourni", () => {
    const withoutUser = useMessages({
      channelId: "channel-1",
    }) as unknown as CapturedCrudOptions;

    expect(withoutUser.crud.createDefaults).toBeUndefined();
  });

  it("garantit que le merge (createDefaults + toEntityPatch + newItem) conserve user et les champs du message", () => {
    const options = useMessages({
      channelId: "channel-1",
      user: {
        id: "user-123",
        name: "Alice",
        avatar_url: "https://avatar.png",
      },
    }) as unknown as CapturedCrudOptions;

    const variables: CreateMessageInput = {
      id: "msg-1",
      channelId: "channel-1",
      content: "Hello",
      createdAt: "2026-11-18T09:00:00.000Z",
    };
    const newItem = { id: "msg-1", created: true };

    const merged = {
      ...(options.crud.createDefaults ?? {}),
      ...(options.crud.toEntityPatch(variables) ?? {}),
      ...newItem,
    };

    expect(merged).toEqual({
      id: "msg-1",
      channelId: "channel-1",
      content: "Hello",
      parentId: null,
      createdAt: new Date("2026-11-18T09:00:00.000Z"),
      created: true,
      user: {
        id: "user-123",
        firstName: "Alice",
        lastName: null,
        avatar_url: "https://avatar.png",
      },
    });
  });
});
