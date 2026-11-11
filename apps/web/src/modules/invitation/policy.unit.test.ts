// src/modules/invitation/policy.unit.test.ts
import { describe, expect, it } from "vitest";
import { resolveInvitationUiStatus } from "./policy";

const now = new Date("2026-11-06T09:00:00.000Z");

describe("resolveInvitationUiStatus", () => {
  it("derives expiration only from a pending invitation and expiresAt", () => {
    expect(
      resolveInvitationUiStatus(
        { status: "PENDING", expiresAt: new Date("2026-11-06T08:59:59.999Z") },
        now,
      ),
    ).toBe("EXPIRED");
    expect(
      resolveInvitationUiStatus(
        { status: "PENDING", expiresAt: new Date("2026-11-06T09:00:00.000Z") },
        now,
      ),
    ).toBe("PENDING");
    expect(
      resolveInvitationUiStatus({ status: "PENDING", expiresAt: null }, now),
    ).toBe("PENDING");
  });

  it.each([
    ["ACCEPTED", "ACCEPTED"],
    ["DECLINED", "DECLINED"],
    ["REVOKED", "REVOKED"],
  ] as const)("preserves terminal status %s even after expiresAt", (status, expected) => {
    expect(
      resolveInvitationUiStatus(
        { status, expiresAt: new Date("2026-11-06T08:00:00.000Z") },
        now,
      ),
    ).toBe(expected);
  });
});
