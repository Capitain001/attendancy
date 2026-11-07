import { randomUUID } from "node:crypto";
import { PrismaClient, Role, UserStatus } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { ensureUserOrganization } from "./user-organization.mutations";

vi.mock("server-only", () => ({}));

import {
  createRoleSpecificEntity,
  enrollStudentInClass,
} from "@/modules/auth/members/utils";

const testDatabaseUrl = process.env.DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error(
    "DATABASE_URL must point to TEST_DATABASE_URL for integration tests",
  );
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: testDatabaseUrl }),
});
const transactionOptions = { maxWait: 30_000, timeout: 60_000 };
const suffix = randomUUID();
const organizationName = `User organization test ${suffix}`;
const organizationSlug = `user-org-test-${suffix}`;
const className = `Enrollment test class ${suffix}`;

let organizationId: string;
let academicYearId: string;
let departmentId: string;
let programTrackId: string;
let classId: string;
let cleanupUserIds: string[] = [];

beforeAll(async () => {
  const organization = await db.organization.create({
    data: { name: organizationName, slug: organizationSlug },
    select: { id: true },
  });
  organizationId = organization.id;

  const academicYear = await db.academicYear.create({
    data: {
      name: `Year ${suffix}`,
      startDate: new Date("2026-01-01T00:00:00.000Z"),
      endDate: new Date("2027-01-01T00:00:00.000Z"),
      orgId: organizationId,
      isActive: true,
    },
    select: { id: true },
  });
  academicYearId = academicYear.id;

  const department = await db.department.create({
    data: { name: `Department ${suffix}`, orgId: organizationId },
    select: { id: true },
  });
  departmentId = department.id;

  const programTrack = await db.programTrack.create({
    data: {
      name: `Track ${suffix}`,
      orgId: organizationId,
      departmentId,
    },
    select: { id: true },
  });
  programTrackId = programTrack.id;

  const class_ = await db.class.create({
    data: { name: className, programTrackId, academicYearId },
    select: { id: true },
  });
  classId = class_.id;
});

afterAll(async () => {
  try {
    if (organizationId) {
      await db.invitation.deleteMany({ where: { orgId: organizationId } });
      await db.studentEnrollment.deleteMany({
        where: { student: { orgId: organizationId } },
      });
      await db.student.deleteMany({ where: { orgId: organizationId } });
      await db.userOrganization.deleteMany({
        where: { orgId: organizationId },
      });
      if (cleanupUserIds.length) {
        await db.user.deleteMany({ where: { id: { in: cleanupUserIds } } });
      }
      if (classId) await db.class.delete({ where: { id: classId } });
      if (programTrackId)
        await db.programTrack.delete({ where: { id: programTrackId } });
      if (departmentId)
        await db.department.delete({ where: { id: departmentId } });
      if (academicYearId)
        await db.academicYear.delete({ where: { id: academicYearId } });
      await db.organization.delete({ where: { id: organizationId } });
    }
  } finally {
    await db.$disconnect();
  }
}, 60_000);

async function createUser(label: string) {
  const user = await db.user.create({
    data: { email: `${label}-${suffix}@test.local` },
    select: { id: true, email: true },
  });
  cleanupUserIds.push(user.id);
  return user;
}

describe("adhésions et séquences d'inscription — intégration", () => {
  it("réutilise une seule adhésion pour deux appels du même couple user-org", async () => {
    const user = await createUser("idempotent");

    const first = await db.$transaction(
      (tx) =>
        ensureUserOrganization(tx, {
          userId: user.id,
          orgId: organizationId,
          role: Role.STUDENT,
        }),
      transactionOptions,
    );
    const second = await db.$transaction(
      (tx) =>
        ensureUserOrganization(tx, {
          userId: user.id,
          orgId: organizationId,
          role: Role.TEACHER,
        }),
      transactionOptions,
    );
    const rows = await db.userOrganization.findMany({
      where: { userId: user.id, orgId: organizationId },
      select: { id: true, role: true, status: true },
    });

    expect(second.id).toBe(first.id);
    expect(rows).toEqual([
      { id: first.id, role: Role.STUDENT, status: UserStatus.ACTIVE },
    ]);
  });

  it("ne modifie ni le rôle ni le statut d'une adhésion suspendue existante", async () => {
    const user = await createUser("suspended");
    const created = await ensureUserOrganization(db, {
      userId: user.id,
      orgId: organizationId,
      role: Role.PARENT,
    });
    await db.userOrganization.update({
      where: { id: created.id },
      data: { status: UserStatus.SUSPENDED },
    });

    await db.$transaction(
      (tx) =>
        ensureUserOrganization(tx, {
          userId: user.id,
          orgId: organizationId,
          role: Role.STUDENT,
        }),
      transactionOptions,
    );
    const persisted = await db.userOrganization.findUniqueOrThrow({
      where: { id: created.id },
      select: { role: true, status: true },
    });

    expect(persisted).toEqual({
      role: Role.PARENT,
      status: UserStatus.SUSPENDED,
    });
  });

  it("rejoue la séquence d'acceptation pour un membre sans dupliquer profil ni inscription", async () => {
    const user = await createUser("inbox-member");
    const membership = await ensureUserOrganization(db, {
      userId: user.id,
      orgId: organizationId,
      role: Role.PARENT,
    });
    const student = await db.student.create({
      data: { userId: user.id, orgId: organizationId },
      select: { id: true },
    });
    const oldEndedAt = new Date("2026-10-01T00:00:00.000Z");
    const enrollment = await db.studentEnrollment.create({
      data: { studentId: student.id, classId, endedAt: oldEndedAt },
      select: { id: true },
    });

    await db.$transaction(async (tx) => {
      await ensureUserOrganization(tx, {
        userId: user.id,
        orgId: organizationId,
        role: Role.STUDENT,
      });
      await createRoleSpecificEntity(tx, user.id, Role.STUDENT, organizationId);
      await enrollStudentInClass(tx, student.id, { classId });
    }, transactionOptions);

    const [persistedMembership, persistedStudents, persistedEnrollment] =
      await Promise.all([
        db.userOrganization.findUniqueOrThrow({
          where: { id: membership.id },
          select: { role: true, status: true },
        }),
        db.student.findMany({
          where: { userId: user.id, orgId: organizationId },
          select: { id: true },
        }),
        db.studentEnrollment.findUniqueOrThrow({
          where: { id: enrollment.id },
          select: { id: true, endedAt: true },
        }),
      ]);

    expect(persistedMembership).toEqual({
      role: Role.PARENT,
      status: UserStatus.ACTIVE,
    });
    expect(persistedStudents).toEqual([{ id: student.id }]);
    expect(persistedEnrollment).toEqual({ id: enrollment.id, endedAt: null });
  }, 60_000);

  it("rejoue la séquence de création de profil pour un utilisateur déjà membre", async () => {
    const user = await createUser("signup-member");
    const membership = await ensureUserOrganization(db, {
      userId: user.id,
      orgId: organizationId,
      role: Role.PARENT,
    });

    await db.$transaction(async (tx) => {
      const createdUser = await tx.user.upsert({
        where: { id: user.id },
        create: {
          id: user.id,
          email: user.email,
          firstName: "Signup",
          lastName: "Member",
          status: UserStatus.ACTIVE,
        },
        update: {},
      });
      await ensureUserOrganization(tx, {
        userId: createdUser.id,
        orgId: organizationId,
        role: Role.STUDENT,
      });
      await createRoleSpecificEntity(
        tx,
        createdUser.id,
        Role.STUDENT,
        organizationId,
      );
    }, transactionOptions);

    const [persistedMembership, persistedStudents] = await Promise.all([
      db.userOrganization.findUniqueOrThrow({
        where: { id: membership.id },
        select: { role: true, status: true },
      }),
      db.student.findMany({
        where: { userId: user.id, orgId: organizationId },
        select: { id: true },
      }),
    ]);

    expect(persistedMembership).toEqual({
      role: Role.PARENT,
      status: UserStatus.ACTIVE,
    });
    expect(persistedStudents).toHaveLength(1);
  }, 60_000);
});
