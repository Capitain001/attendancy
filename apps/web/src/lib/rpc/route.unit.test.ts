import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSchedulesAction, signupPersonalDesktopAction } = vi.hoisted(() => ({
  getSchedulesAction: vi.fn(),
  signupPersonalDesktopAction: vi.fn(),
}));

vi.mock("@/lib/rpc/actions", () => ({
  ACTIONS: { getSchedulesAction, signupPersonalDesktopAction },
}));

import { OPTIONS, POST } from "@/app/api/rpc/[action]/route";

function request(
  action: string,
  options: { authorization?: string; body?: string; origin?: string } = {},
) {
  return new NextRequest(`http://localhost/api/rpc/${action}`, {
    method: "POST",
    headers: {
      ...(options.authorization
        ? { authorization: options.authorization }
        : {}),
      ...(options.origin ? { origin: options.origin } : {}),
      ...(options.body === undefined
        ? {}
        : { "content-type": "application/json" }),
    },
    ...(options.body === undefined ? {} : { body: options.body }),
  });
}

describe("RPC route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires a Bearer before resolving an action", async () => {
    const response = await POST(request("getSchedulesAction"), {
      params: Promise.resolve({ action: "getSchedulesAction" }),
    });

    expect(response.status).toBe(401);
    expect(getSchedulesAction).not.toHaveBeenCalled();
  });

  it.each(["unknownAction", "constructor", "__proto__"])(
    "rejects non-registered action %s",
    async (action) => {
      const response = await POST(
        request(action, { authorization: "Bearer token" }),
        {
          params: Promise.resolve({ action }),
        },
      );

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: "Action inconnue" });
      expect(getSchedulesAction).not.toHaveBeenCalled();
    },
  );

  it("rejects malformed JSON before calling the action", async () => {
    const response = await POST(
      request("getSchedulesAction", {
        authorization: "Bearer token",
        body: "{",
      }),
      { params: Promise.resolve({ action: "getSchedulesAction" }) },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "JSON invalide" });
    expect(getSchedulesAction).not.toHaveBeenCalled();
  });

  it("passes one JSON input to the registered action and returns its data", async () => {
    getSchedulesAction.mockResolvedValue({ data: [{ id: "schedule-1" }] });

    const response = await POST(
      request("getSchedulesAction", {
        authorization: "Bearer verified-by-action",
        body: JSON.stringify({ orgId: "org-from-payload", date: "2030-01-01" }),
      }),
      { params: Promise.resolve({ action: "getSchedulesAction" }) },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: [{ id: "schedule-1" }] });
    expect(getSchedulesAction).toHaveBeenCalledWith({
      orgId: "org-from-payload",
      date: "2030-01-01",
    });
  });

  it("allows unauthenticated requests to the explicit signup action", async () => {
    signupPersonalDesktopAction.mockResolvedValue({
      data: { email: "person@example.com" },
    });

    const response = await POST(
      request("signupPersonalDesktopAction", {
        body: JSON.stringify({
          email: "person@example.com",
          password: "password123",
        }),
      }),
      { params: Promise.resolve({ action: "signupPersonalDesktopAction" }) },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: { email: "person@example.com" },
    });
    expect(signupPersonalDesktopAction).toHaveBeenCalledWith({
      email: "person@example.com",
      password: "password123",
    });
  });

  it("maps application errors and unexpected failures to non-success statuses", async () => {
    getSchedulesAction.mockResolvedValueOnce({ error: "Invalid input" });
    const invalidResponse = await POST(
      request("getSchedulesAction", { authorization: "Bearer token" }),
      { params: Promise.resolve({ action: "getSchedulesAction" }) },
    );
    expect(invalidResponse.status).toBe(400);
    expect(await invalidResponse.json()).toEqual({ error: "Invalid input" });

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    getSchedulesAction.mockRejectedValueOnce(new Error("unexpected"));
    const failedResponse = await POST(
      request("getSchedulesAction", { authorization: "Bearer token" }),
      { params: Promise.resolve({ action: "getSchedulesAction" }) },
    );

    expect(failedResponse.status).toBe(500);
    expect(await failedResponse.json()).toEqual({ error: expect.any(String) });
    expect(errorSpy).toHaveBeenCalledOnce();
    errorSpy.mockRestore();
  });

  it("answers CORS preflight without invoking an action", async () => {
    const response = await OPTIONS(
      request("getSchedulesAction", { origin: "http://desktop.local" }),
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
    expect(getSchedulesAction).not.toHaveBeenCalled();
  });
});
