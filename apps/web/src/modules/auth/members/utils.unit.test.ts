import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";

const { createStudentEnrollmentRaw } = vi.hoisted(() => ({
  createStudentEnrollmentRaw: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/services/student-enrollment/database", () => ({
  createStudentEnrollmentRaw,
}));

import { createRoleSpecificEntity, enrollStudentInClass } from "./utils";

describe("createRoleSpecificEntity", () => {
  it("crée ou réactive le profil étudiant pour le couple user-organisation", async () => {
    const upsert = vi.fn().mockResolvedValue({ id: "student-profile-1" });
    const tx = {
      student: { upsert },
    } as unknown as Parameters<typeof createRoleSpecificEntity>[0];

    await createRoleSpecificEntity(tx, "user-1", "STUDENT", "org-1");

    expect(upsert).toHaveBeenCalledWith({
      where: { userId_orgId: { userId: "user-1", orgId: "org-1" } },
      create: { userId: "user-1", orgId: "org-1" },
      update: { deletedAt: null },
    });
  });

  it("réactive le profil enseignant et met à jour son département si fourni", async () => {
    const upsert = vi.fn().mockResolvedValue({ id: "teacher-profile-1" });
    const tx = {
      teacher: { upsert },
    } as unknown as Parameters<typeof createRoleSpecificEntity>[0];

    await createRoleSpecificEntity(
      tx,
      "user-1",
      "TEACHER",
      "org-1",
      "department-1",
    );

    expect(upsert).toHaveBeenCalledWith({
      where: { userId_orgId: { userId: "user-1", orgId: "org-1" } },
      create: {
        userId: "user-1",
        orgId: "org-1",
        departmentId: "department-1",
      },
      update: { deletedAt: null, departmentId: "department-1" },
    });
  });

  it("réactive le profil parent sur le couple user-organisation", async () => {
    const upsert = vi.fn().mockResolvedValue({ id: "parent-profile-1" });
    const tx = {
      parent: { upsert },
    } as unknown as Parameters<typeof createRoleSpecificEntity>[0];

    await createRoleSpecificEntity(tx, "user-1", "PARENT", "org-1");

    expect(upsert).toHaveBeenCalledWith({
      where: { userId_orgId: { userId: "user-1", orgId: "org-1" } },
      create: { userId: "user-1", orgId: "org-1" },
      update: { deletedAt: null },
    });
  });

  it("réactive le profil direction sur le couple user-organisation", async () => {
    const upsert = vi.fn().mockResolvedValue({ id: "direction-profile-1" });
    const tx = {
      direction: { upsert },
    } as unknown as Parameters<typeof createRoleSpecificEntity>[0];

    await createRoleSpecificEntity(tx, "user-1", "DIRECTION", "org-1");

    expect(upsert).toHaveBeenCalledWith({
      where: { userId_orgId: { userId: "user-1", orgId: "org-1" } },
      create: { userId: "user-1", orgId: "org-1" },
      update: { deletedAt: null },
    });
  });

  it("réactive le profil admin par son identifiant utilisateur global", async () => {
    const upsert = vi.fn().mockResolvedValue({ id: "admin-profile-1" });
    const tx = {
      admin: { upsert },
    } as unknown as Parameters<typeof createRoleSpecificEntity>[0];

    await createRoleSpecificEntity(tx, "user-1", "ADMIN", "org-1");

    expect(upsert).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      create: { userId: "user-1" },
      update: { deletedAt: null },
    });
  });
});

describe("enrollStudentInClass", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("réutilise l'inscription idempotente puis ajoute les groupes sans doublons", async () => {
    createStudentEnrollmentRaw.mockResolvedValue({ id: "enrollment-1" });
    const createMany = vi.fn().mockResolvedValue({ count: 2 });
    const tx = {
      studentGroup: { createMany },
    } as unknown as PrismaClient;

    await enrollStudentInClass(tx, "student-1", {
      classId: "class-1",
      groupIds: ["group-1", "group-2"],
    });

    expect(createStudentEnrollmentRaw).toHaveBeenCalledWith(tx, {
      studentId: "student-1",
      classId: "class-1",
    });
    expect(createMany).toHaveBeenCalledWith({
      data: [
        { enrollmentId: "enrollment-1", groupId: "group-1" },
        { enrollmentId: "enrollment-1", groupId: "group-2" },
      ],
      skipDuplicates: true,
    });
  });

  it("ne touche pas la base lorsqu'aucune classe n'est fournie", async () => {
    const tx = {
      studentGroup: { createMany: vi.fn() },
    } as unknown as PrismaClient;

    await enrollStudentInClass(tx, "student-1");

    expect(createStudentEnrollmentRaw).not.toHaveBeenCalled();
    expect(tx.studentGroup.createMany).not.toHaveBeenCalled();
  });
});
