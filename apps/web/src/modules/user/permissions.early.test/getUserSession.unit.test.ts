import { describe, it, expect, vi, beforeEach } from "vitest";

import { getUserSession } from "../helpers";
import { getUserInfo } from "../userInfo";

vi.mock("../userInfo", () => ({
  getUserInfo: vi.fn(),
}));

const mockedGetUserInfo = vi.mocked(getUserInfo);

describe("getUserSession()", () => {
  beforeEach(() => {
    mockedGetUserInfo.mockReset();
  });

  describe("Happy Paths", () => {
    it("should return all fields correctly when user and organization have all properties", async () => {
      mockedGetUserInfo.mockResolvedValue({
        id: "user-123",
        role: "admin",
        organization: {
          id: "org-456",
          studentId: "stu-789",
          teacherId: "teach-101",
          parentId: "par-202",
          directionId: "dir-303",
        },
      } as unknown as Awaited<ReturnType<typeof getUserInfo>>);

      const session = await getUserSession();

      expect(session).toEqual({
        userId: "user-123",
        role: "admin",
        orgId: "org-456",
        studentId: "stu-789",
        teacherId: "teach-101",
        parentId: "par-202",
        directionId: "dir-303",
      });
    });

    it("should return null for organization-related fields if organization is missing", async () => {
      mockedGetUserInfo.mockResolvedValue({
        id: "user-123",
        role: "teacher",
      } as unknown as Awaited<ReturnType<typeof getUserInfo>>);

      const session = await getUserSession();

      expect(session).toEqual({
        userId: "user-123",
        role: "teacher",
        orgId: null,
        studentId: null,
        teacherId: null,
        parentId: null,
        directionId: null,
      });
    });

    it("should return null for userId and role if user is missing", async () => {
      mockedGetUserInfo.mockResolvedValue(undefined as unknown as Awaited<ReturnType<typeof getUserInfo>>);

      const session = await getUserSession();

      expect(session).toEqual({
        userId: null,
        role: null,
        orgId: null,
        studentId: null,
        teacherId: null,
        parentId: null,
        directionId: null,
      });
    });

    it("should return null for missing organization fields", async () => {
      mockedGetUserInfo.mockResolvedValue({
        id: "user-123",
        role: "student",
        organization: {
          id: "org-456",
        },
      } as unknown as Awaited<ReturnType<typeof getUserInfo>>);

      const session = await getUserSession();

      expect(session).toEqual({
        userId: "user-123",
        role: "student",
        orgId: "org-456",
        studentId: null,
        teacherId: null,
        parentId: null,
        directionId: null,
      });
    });

    it("should return null for userId and role if they are missing in user object", async () => {
      mockedGetUserInfo.mockResolvedValue({
        organization: {
          id: "org-456",
          studentId: "stu-789",
        },
      } as unknown as Awaited<ReturnType<typeof getUserInfo>>);

      const session = await getUserSession();

      expect(session).toEqual({
        userId: null,
        role: null,
        orgId: "org-456",
        studentId: "stu-789",
        teacherId: null,
        parentId: null,
        directionId: null,
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle organization property being null", async () => {
      mockedGetUserInfo.mockResolvedValue({
        id: "user-123",
        role: "admin",
        organization: null,
      } as unknown as Awaited<ReturnType<typeof getUserInfo>>);

      const session = await getUserSession();

      expect(session).toEqual({
        userId: "user-123",
        role: "admin",
        orgId: null,
        studentId: null,
        teacherId: null,
        parentId: null,
        directionId: null,
      });
    });

    it("should handle organization fields explicitly set to null", async () => {
      mockedGetUserInfo.mockResolvedValue({
        id: "user-123",
        role: "admin",
        organization: {
          id: null,
          studentId: null,
          teacherId: null,
          parentId: null,
          directionId: null,
        },
      } as unknown as Awaited<ReturnType<typeof getUserInfo>>);

      const session = await getUserSession();

      expect(session).toEqual({
        userId: "user-123",
        role: "admin",
        orgId: null,
        studentId: null,
        teacherId: null,
        parentId: null,
        directionId: null,
      });
    });

    it("should handle getUserInfo resolving to null", async () => {
      mockedGetUserInfo.mockResolvedValue(null);

      const session = await getUserSession();

      expect(session).toEqual({
        userId: null,
        role: null,
        orgId: null,
        studentId: null,
        teacherId: null,
        parentId: null,
        directionId: null,
      });
    });

    it("should handle getUserInfo throwing an error", async () => {
      mockedGetUserInfo.mockRejectedValue(new Error("Failed to fetch user"));

      await expect(getUserSession()).rejects.toThrow("Failed to fetch user");
    });

    it("should handle organization fields being undefined", async () => {
      mockedGetUserInfo.mockResolvedValue({
        id: "user-123",
        role: "admin",
        organization: {},
      } as unknown as Awaited<ReturnType<typeof getUserInfo>>);

      const session = await getUserSession();

      expect(session).toEqual({
        userId: "user-123",
        role: "admin",
        orgId: null,
        studentId: null,
        teacherId: null,
        parentId: null,
        directionId: null,
      });
    });
  });
});
