// src/modules/invitation/database.unit.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/cache/server/graph", () => ({ invalidateEvent: vi.fn() }));
vi.mock("@/services/notification/server", () => ({
  createInvitationNotification: vi.fn(),
}));

import { revokePendingInvitationsForResource } from "./database";

describe("revokePendingInvitationsForResource", () => {
  const params = {
    orgId: "org-1",
    email: "student@example.com",
    resourceId: "class-1",
    resourceType: "CLASS" as const,
    acceptedInvitationId: "accepted-1",
    revokedAt: new Date("2026-11-07T00:00:00.000Z"),
  };

  let findMany: ReturnType<typeof vi.fn>;
  let updateMany: ReturnType<typeof vi.fn>;
  let tx: Prisma.TransactionClient;

  beforeEach(() => {
    findMany = vi.fn().mockResolvedValue([
      { id: "duplicate-1", userId: "user-1" },
      { id: "duplicate-2", userId: null },
    ]);
    updateMany = vi.fn()
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });
    tx = {
      invitation: { findMany, updateMany },
    } as unknown as Prisma.TransactionClient;
  });

  it("révoque seulement les doublons en attente de la même ressource", async () => {
    const result = await revokePendingInvitationsForResource(tx, params);

    expect(findMany).toHaveBeenCalledWith({
      where: {
        orgId: params.orgId,
        email: { equals: params.email, mode: "insensitive" },
        resourceId: params.resourceId,
        resourceType: params.resourceType,
        status: "PENDING",
        id: { not: params.acceptedInvitationId },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: params.revokedAt } },
        ],
      },
      select: { id: true, userId: true },
    });
    expect(updateMany).toHaveBeenNthCalledWith(1, {
      where: expect.objectContaining({ id: "duplicate-1" }),
      data: { status: "REVOKED", usedAt: params.revokedAt },
    });
    expect(updateMany).toHaveBeenNthCalledWith(2, {
      where: expect.objectContaining({ id: "duplicate-2" }),
      data: { status: "REVOKED", usedAt: params.revokedAt },
    });
    expect(result).toEqual([{ id: "duplicate-1", userId: "user-1" }]);
  });
});
