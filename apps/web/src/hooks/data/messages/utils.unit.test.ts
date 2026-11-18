import { describe, expect, it } from "vitest";

import { messageEntityPatch } from "./utils";

describe("messageEntityPatch", () => {
  it("convertit l'entrée de création en patch d'entité et parse createdAt", () => {
    const createdAt = "2026-11-17T18:00:00.000Z";

    const patch = messageEntityPatch({
      id: "message-1",
      createdAt,
      content: "Bonjour",
      channelId: "channel-1",
    });

    expect(patch).toEqual({
      id: "message-1",
      content: "Bonjour",
      channelId: "channel-1",
      parentId: null,
      createdAt: new Date(createdAt),
    });
    expect(patch.createdAt).toBeInstanceOf(Date);
  });

  it("préserve le parent d'une réponse dans un fil", () => {
    const patch = messageEntityPatch({
      id: "message-2",
      createdAt: "2026-11-17T18:00:00.000Z",
      content: "Réponse",
      channelId: "channel-1",
      parentId: "message-1",
    });

    expect(patch.parentId).toBe("message-1");
  });

  it("laisse le patch d'update dans la forme de l'entité", () => {
    expect(messageEntityPatch({ content: "Message modifié" })).toEqual({
      content: "Message modifié",
    });
  });
});
