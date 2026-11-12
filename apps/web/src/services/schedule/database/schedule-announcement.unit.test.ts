import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateMany } = vi.hoisted(() => ({
  updateMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { schedule: { updateMany } },
}));
vi.mock("@/cache/server/graph", () => ({
  invalidateEvent: vi.fn(),
}));
vi.mock("@/utils/server/prisma", () => ({
  tryConstraint: vi.fn((query: Promise<unknown>) => query),
}));

import { claimScheduleAnnouncement } from "./schedule.mutations";

describe("claimScheduleAnnouncement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("claims only pending or null notification states, including recurring schedules", async () => {
    updateMany.mockResolvedValueOnce({ count: 1 });

    await expect(
      claimScheduleAnnouncement("schedule-1", "org-1"),
    ).resolves.toBe(true);

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: "schedule-1",
        orgId: "org-1",
        OR: [{ notifyState: "PENDING" }, { notifyState: null }],
      },
      data: {
        notifyState: "SENT",
        notifiedAt: expect.any(Date),
      },
    });
  });

  it("returns false when another invocation already claimed the announcement", async () => {
    updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(
      claimScheduleAnnouncement("schedule-1", "org-1"),
    ).resolves.toBe(false);
  });
});
