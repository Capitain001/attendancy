import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  registerDeviceAction,
  endSessionAction,
  signupPersonalDesktopAction,
  removeQueries,
  signInWithPassword,
  signOut,
  getDeviceId,
} = vi.hoisted(() => ({
  registerDeviceAction: vi.fn(),
  endSessionAction: vi.fn(),
  signupPersonalDesktopAction: vi.fn(),
  removeQueries: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getDeviceId: vi.fn(),
}));

vi.mock("./api", () => ({
  api: { registerDeviceAction, endSessionAction, signupPersonalDesktopAction },
}));
vi.mock("./device-id", () => ({ getDeviceId }));
vi.mock("./query-client", () => ({ queryClient: { removeQueries } }));
vi.mock("./supabase", () => ({
  supabase: { auth: { signInWithPassword, signOut } },
}));

import { login, logout, signupPersonal } from "./account";

describe("desktop account adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDeviceId.mockReturnValue("persistent-device-id");
    signInWithPassword.mockResolvedValue({ error: null });
    signOut.mockResolvedValue({ error: null });
    registerDeviceAction.mockResolvedValue({ data: true });
    endSessionAction.mockResolvedValue({ data: true });
  });

  it("signs in and records the device without allowing a recording failure to block login", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    registerDeviceAction.mockRejectedValue(new Error("RPC offline"));

    await expect(
      login({ email: "user@example.test", password: "secret" }),
    ).resolves.toBeNull();

    expect(removeQueries).toHaveBeenCalledWith({ queryKey: ["me"] });
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "user@example.test",
      password: "secret",
    });
    expect(registerDeviceAction).toHaveBeenCalledWith({
      deviceId: "persistent-device-id",
    });
    expect(warning).toHaveBeenCalledOnce();
    warning.mockRestore();
  });

  it("does not register a device when Supabase rejects credentials", async () => {
    signInWithPassword.mockResolvedValue({
      error: new Error("bad credentials"),
    });

    await expect(
      login({ email: "user@example.test", password: "wrong" }),
    ).resolves.toBe("Adresse e-mail ou mot de passe incorrect.");

    expect(registerDeviceAction).not.toHaveBeenCalled();
  });

  it("submits a personal signup through the public signup RPC", async () => {
    signupPersonalDesktopAction.mockResolvedValue({
      data: { email: "user@example.test" },
    });

    await expect(
      signupPersonal("user@example.test", "password123"),
    ).resolves.toEqual({
      data: { email: "user@example.test" },
    });
    expect(signupPersonalDesktopAction).toHaveBeenCalledWith({
      email: "user@example.test",
      password: "password123",
    });
  });

  it("attempts session expiry before signing out and clears the profile cache", async () => {
    const calls: string[] = [];
    endSessionAction.mockImplementation(async () => {
      calls.push("end-session");
      return { error: "offline" };
    });
    signOut.mockImplementation(async () => {
      calls.push("sign-out");
      return { error: null };
    });
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});

    await logout();

    expect(calls).toEqual(["end-session", "sign-out"]);
    expect(endSessionAction).toHaveBeenCalledWith({
      deviceId: "persistent-device-id",
    });
    expect(removeQueries).toHaveBeenCalledWith({ queryKey: ["me"] });
    expect(warning).toHaveBeenCalledOnce();
    warning.mockRestore();
  });

  it("propagates sign-out failures instead of reporting a successful logout", async () => {
    signOut.mockResolvedValue({ error: { message: "Sign out failed" } });

    await expect(logout()).rejects.toThrow("Sign out failed");
    expect(removeQueries).not.toHaveBeenCalled();
  });
});
