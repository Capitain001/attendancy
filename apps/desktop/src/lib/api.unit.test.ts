import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getToken, refreshSession } = vi.hoisted(() => ({
  getToken: vi.fn(),
  refreshSession: vi.fn(),
}));

vi.mock("./auth/session", () => ({ getToken }));
vi.mock("./supabase", () => ({
  supabase: { auth: { refreshSession } },
}));
vi.mock("../config/url", () => ({ API_URL: "https://api.test.local" }));

import { api, NetworkError } from "./api";

const scheduleFilter = {
  rangeStart: new Date("2030-02-03T00:00:00.000Z"),
  rangeEnd: new Date("2030-02-10T00:00:00.000Z"),
};

describe("desktop RPC transport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getToken.mockResolvedValue("access-token");
    refreshSession.mockResolvedValue({
      data: { session: { access_token: "refreshed-token" } },
      error: null,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not issue a request without an access token", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    getToken.mockResolvedValue(null);

    await expect(api.getSchedulesAction(scheduleFilter)).resolves.toEqual({
      error: "Not authenticated",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("allows the public personal-signup action without an access token", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ data: { email: "person@example.com" } })),
      );
    vi.stubGlobal("fetch", fetchMock);
    getToken.mockResolvedValue(null);

    await expect(
      api.signupPersonalDesktopAction({
        email: "person@example.com",
        password: "password123",
      }),
    ).resolves.toEqual({ data: { email: "person@example.com" } });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.test.local/api/rpc/signupPersonalDesktopAction",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "person@example.com",
          password: "password123",
        }),
      }),
    );
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it("sends one JSON input with a Bearer and revives ISO dates", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ data: { startsAt: "2030-02-03T04:05:06.000Z" } }),
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await api.getSchedulesAction(scheduleFilter);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.test.local/api/rpc/getSchedulesAction",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer access-token",
        },
        body: JSON.stringify(scheduleFilter),
      }),
    );
    expect(result).toEqual({
      data: { startsAt: new Date("2030-02-03T04:05:06.000Z") },
    });
  });

  it("refreshes once and retries the same request after a 401", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: true })));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      api.registerDeviceAction({ deviceId: "desktop-device-id" }),
    ).resolves.toEqual({ data: true });

    expect(refreshSession).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe(
      "Bearer refreshed-token",
    );
    expect(fetchMock.mock.calls[1][1].body).toBe(
      JSON.stringify({ deviceId: "desktop-device-id" }),
    );
  });

  it("returns unauthenticated when refresh fails and does not retry", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("", { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);
    refreshSession.mockResolvedValue({
      data: { session: null },
      error: new Error("refresh failed"),
    });

    await expect(api.getCurrentUserAction()).resolves.toEqual({
      error: "Not authenticated",
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("throws NetworkError on transport failures but preserves application errors as values", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(api.getSchedulesAction(scheduleFilter)).rejects.toBeInstanceOf(
      NetworkError,
    );

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Invalid input" }), {
          status: 400,
        }),
      ),
    );
    await expect(api.getSchedulesAction(scheduleFilter)).resolves.toEqual({
      error: "Invalid input",
    });
  });
});
