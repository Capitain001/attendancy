import { describe, expect, it } from "vitest";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  Functions,
  PRESENCE_USER_KEYS,
  UserRoles,
  UserStatus,
  mapClientUser,
  mapUserInfo,
  toPresenceUser,
} from "../src";

function makeSupabaseUser(overrides: Partial<SupabaseUser> = {}): SupabaseUser {
  return {
    id: "user-123",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("mapUserInfo", () => {
  it("applies restrictive defaults when metadata is empty", () => {
    const info = mapUserInfo({
      user: makeSupabaseUser({ email: "alice@example.com" }),
    });

    expect(info.id).toBe("user-123");
    expect(info.email).toBe("alice@example.com");
    expect(info.role).toBe(UserRoles.GUEST);
    expect(info.function).toBe(Functions.MEMBER);
    expect(info.status).toBe(UserStatus.PENDING);
    expect(info.organizations).toEqual([]);
    expect(info.name).toBe("alice");
    expect(info.email_verified).toBe(false);
    expect(info.phone_verified).toBe(false);
    expect(info.isConnected).toBe(true);
  });

  it("reads access fields only from app_metadata without falling back to user_metadata", () => {
    const info = mapUserInfo({
      user: makeSupabaseUser({
        app_metadata: {},
        user_metadata: {
          role: UserRoles.ADMIN,
          function: "SUPER_ADMIN",
          status: UserStatus.ACTIVE,
          name: "Mallory",
        },
      }),
    });

    expect(info.role).toBe(UserRoles.GUEST);
    expect(info.function).toBe(Functions.MEMBER);
    expect(info.status).toBe(UserStatus.PENDING);
    expect(info.name).toBe("Mallory");
  });

  it("derives verification flags from confirmed_at timestamps", () => {
    const info = mapUserInfo({
      user: makeSupabaseUser({
        email: "bob@example.com",
        email_confirmed_at: "2026-01-02T00:00:00.000Z",
        phone_confirmed_at: "2026-01-03T00:00:00.000Z",
        app_metadata: {
          role: UserRoles.TEACHER,
          function: Functions.COORDINATOR,
          status: UserStatus.ACTIVE,
        },
      }),
    });

    expect(info.email_verified).toBe(true);
    expect(info.phone_verified).toBe(true);
    expect(info.role).toBe(UserRoles.TEACHER);
    expect(info.function).toBe(Functions.COORDINATOR);
    expect(info.status).toBe(UserStatus.ACTIVE);
  });
});

describe("toPresenceUser", () => {
  it("emits only PRESENCE_USER_KEYS and strips sensitive fields", () => {
    const info = mapUserInfo({
      user: makeSupabaseUser({
        email: "teacher@example.com",
        app_metadata: {
          role: UserRoles.TEACHER,
          organization: { id: "org-1", teacherId: "t-1", departmentId: "d-1" },
          organizations: [{ id: "org-1" }],
        },
        user_metadata: {
          name: "Prof. Ada",
          avatar_url: "https://cdn.example.com/ada.png",
          phone: "+33600000000",
          invitationToken: "secret-token",
        },
      }),
    });

    const presence = toPresenceUser(info);

    expect(Object.keys(presence).sort()).toEqual([...PRESENCE_USER_KEYS].sort());
    expect(presence).toEqual({
      id: "user-123",
      name: "Prof. Ada",
      avatar_url: "https://cdn.example.com/ada.png",
      email: "teacher@example.com",
      role: UserRoles.TEACHER,
      function: Functions.MEMBER,
      status: UserStatus.PENDING,
    });
  });
});

describe("mapClientUser", () => {
  it("always includes id alongside CLIENT_USER_KEYS", () => {
    const info = mapUserInfo({
      user: makeSupabaseUser({ email: "client@example.com" }),
    });
    const client = mapClientUser(info);

    expect(client.id).toBe("user-123");
    expect(client.email).toBe("client@example.com");
    expect(client.role).toBe(UserRoles.GUEST);
  });
});
