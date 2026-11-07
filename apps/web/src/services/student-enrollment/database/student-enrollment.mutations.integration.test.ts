import { randomUUID } from "node:crypto";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createStudentEnrollmentRaw } from "./student-enrollment.mutations";

const testDatabaseUrl = process.env.DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error(
    "DATABASE_URL must point to TEST_DATABASE_URL for integration tests",
  );
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: testDatabaseUrl }),
});
const suffix = randomUUID();
const email = `student-enrollment-${suffix}@test.local`;
let organizationId: string;
let enrollmentData: { studentId: string; classId: string };

beforeAll(async () => {
  const organization = await db.organization.create({
    data: {
      name: `Student enrollment test ${suffix}`,
      slug: `enrollment-test-${suffix}`,
    },
    select: { id: true },
  });
  organizationId = organization.id;

  const user = await db.user.create({
    data: { email },
    select: { id: true },
  });
  const academicYear = await db.academicYear.create({
    data: {
      name: `Test year ${suffix}`,
      startDate: new Date("2026-01-01T00:00:00.000Z"),
      endDate: new Date("2027-01-01T00:00:00.000Z"),
      orgId: organizationId,
    },
    select: { id: true },
  });
  const department = await db.department.create({
    data: { name: `Test department ${suffix}`, orgId: organizationId },
    select: { id: true },
  });
  const programTrack = await db.programTrack.create({
    data: {
      name: `Test track ${suffix}`,
      orgId: organizationId,
      departmentId: department.id,
    },
    select: { id: true },
  });
  const student = await db.student.create({
    data: { userId: user.id, orgId: organizationId },
    select: { id: true },
  });
  const class_ = await db.class.create({
    data: {
      name: `Test class ${suffix}`,
      programTrackId: programTrack.id,
      academicYearId: academicYear.id,
    },
    select: { id: true },
  });
  enrollmentData = { studentId: student.id, classId: class_.id };
});

afterAll(async () => {
  try {
    if (organizationId) {
      await db.studentEnrollment.deleteMany({
        where: { student: { orgId: organizationId } },
      });
      await db.class.deleteMany({
        where: { programTrack: { orgId: organizationId } },
      });
      await db.programTrack.deleteMany({ where: { orgId: organizationId } });
      await db.department.deleteMany({ where: { orgId: organizationId } });
      await db.academicYear.deleteMany({ where: { orgId: organizationId } });
      await db.student.deleteMany({ where: { orgId: organizationId } });
      await db.user.deleteMany({ where: { email } });
      await db.organization.delete({ where: { id: organizationId } });
    }
  } finally {
    await db.$disconnect();
  }
}, 30_000);

describe("createStudentEnrollmentRaw — intégration", () => {
  it("crée puis réactive la même inscription dans le client transactionnel", async () => {
    const data = enrollmentData;
    const created = await db.$transaction(
      (tx) => createStudentEnrollmentRaw(tx, data),
      { maxWait: 15_000, timeout: 30_000 },
    );

    await db.studentEnrollment.update({
      where: { id: created.id },
      data: { endedAt: new Date("2026-11-01T00:00:00.000Z") },
    });

    const reactivated = await db.$transaction(
      (tx) => createStudentEnrollmentRaw(tx, data),
      { maxWait: 15_000, timeout: 30_000 },
    );
    const persisted = await db.studentEnrollment.findUniqueOrThrow({
      where: { id: created.id },
      select: { id: true, endedAt: true },
    });

    expect(reactivated.id).toBe(created.id);
    expect(persisted).toEqual({ id: created.id, endedAt: null });
  });
});
