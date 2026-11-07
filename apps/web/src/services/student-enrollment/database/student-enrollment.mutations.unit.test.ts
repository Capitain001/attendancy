import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/cache/server/graph", () => ({ invalidateEvent: vi.fn() }));

import { createStudentEnrollmentRaw } from "./student-enrollment.mutations";

describe("createStudentEnrollmentRaw", () => {
  const data = {
    studentId: "student-1",
    classId: "class-1",
  };

  let upsert: ReturnType<typeof vi.fn>;
  let client: Pick<Prisma.TransactionClient, "studentEnrollment">;

  beforeEach(() => {
    upsert = vi.fn().mockResolvedValue({
      id: "enrollment-1",
      studentId: data.studentId,
      classId: data.classId,
    });
    client = {
      studentEnrollment: { upsert },
    } as unknown as Pick<Prisma.TransactionClient, "studentEnrollment">;
  });

  it("crée ou réactive l'inscription sur la clé unique étudiant-classe", async () => {
    const result = await createStudentEnrollmentRaw(client, data);

    expect(upsert).toHaveBeenCalledWith({
      where: {
        studentId_classId: {
          studentId: data.studentId,
          classId: data.classId,
        },
      },
      create: data,
      update: { endedAt: null },
      select: { id: true, studentId: true, classId: true },
    });
    expect(result).toEqual({
      id: "enrollment-1",
      studentId: data.studentId,
      classId: data.classId,
    });
  });

  it("réutilise une date endedAt explicitement fournie", async () => {
    const endedAt = new Date("2026-11-06T12:00:00.000Z");

    await createStudentEnrollmentRaw(client, { ...data, endedAt });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { endedAt } }),
    );
  });
});
