// src/services/attendance/database/attendance.mutations.ts

import { prisma } from "@/lib/prisma";
import { AttendanceStatus, Prisma } from "@/generated/prisma/client";
import { getExpectedAttendees } from "./attendance.queries";

// --- create ---------------------------------------------
/**
 * Enregistre la présence d'un étudiant après validation du token.
 * Status initial : PENDING (en attente de confirmation du prof).
 * Idempotent : si déjà enregistré, retourne l'entrée existante.
 */
export async function recordAttendance(
  scheduleId: string,
  studentId: string,
  coords?: { lat: number; lng: number },
) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    select: { orgId: true },
  });
  if (!schedule) throw new Error("Schedule introuvable.");

  const enrollment = await prisma.studentEnrollment.findFirst({
    where: {
      studentId,
      class: { schedules: { some: { id: scheduleId } } },
    },
    select: { id: true },
  });

  if (!enrollment) throw new Error("Enrollment introuvable.");

  const existing = await prisma.attendance.findUnique({
    where: { scheduleId_studentId: { scheduleId, studentId } },
    select: { id: true, status: true },
  });

  if (existing) return { id: existing.id, status: existing.status, alreadyRecorded: true };

  return prisma.attendance.create({
    data: {
      scheduleId,
      studentId,
      enrollmentId: enrollment.id,
      status: "PENDING",
      orgId: schedule.orgId,
    },
    select: { id: true, status: true },
  });
}


export async function createAttendance(
  scheduleId: string,
  studentId: string,
  enrollmentId: string,
  orgId: string,
  status: AttendanceStatus = "PENDING",
) {
  return prisma.attendance.create({
    data: {
      scheduleId,
      studentId,
      enrollmentId,
      orgId,
      status,
      recordedAt: new Date(),
    },
    select: { id: true, status: true },
  });
}

// --- confirm one ----------------------------------------

export async function confirmAttendance(
  attendanceId: string
) {
  const attendance = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    select: { id: true, status: true, student: { select: { userId: true } } },
  });

  if (!attendance) {
    throw new Error("Présence introuvable.");
  }

  // déjà confirmé : idempotent, pas de re-notification (D20)
  if (attendance.status === "PRESENT") {
    return {
      id: attendance.id,
      status: "PRESENT" as const,
      userId: attendance.student.userId,
      confirmed: false,
    };
  }

  const updated = await prisma.attendance.update({
    where: { id: attendanceId },
    data: { status: "PRESENT" },
    select: { id: true, status: true, student: { select: { userId: true } } },
  });

  return {
    id: updated.id,
    status: updated.status,
    userId: updated.student.userId,
    confirmed: true,
  };
}

// --- confirm all ----------------------------------------

export async function confirmAllAttendances(
  scheduleId: string
) {
  // les PENDING d'abord : on a besoin des userId pour notifier (D20)
  const pending = await prisma.attendance.findMany({
    where: { scheduleId, status: "PENDING" },
    select: { id: true, student: { select: { userId: true } } },
  });

  if (pending.length === 0) {
    return { confirmed: 0, userIds: [] as string[] };
  }

  await prisma.attendance.updateMany({
    where: { id: { in: pending.map((p) => p.id) } },
    data: { status: "PRESENT" },
  });

  return {
    confirmed: pending.length,
    userIds: pending.map((p) => p.student.userId),
  };
}


// --- markScheduleAbsences : clôture  marquage des absences ---------------------
/**
 * Marque les absences d'un schedule à la clôture. Deux effets :
 *   1) PENDING non validés ? ABSENT (le prof a été averti avant clôture)
 *   2) inscrits attendus sans ligne ? ABSENT créé (createMany)
 * Idempotent : rejouable sans doublon (@@unique[scheduleId, studentId] + skipDuplicates).
 * Retourne les userId nouvellement absents (PENDING basculés ? non-scanneurs) + l'audience.
 * `tx` propagé : utilisable seule ou dans la transaction de completeSession.
 */
export async function markScheduleAbsences(
  scheduleId: string,
  tx: Prisma.TransactionClient = prisma,
) {
  const scheduleRecord = await (tx as typeof prisma).schedule.findUnique({
    where: { id: scheduleId },
    select: { orgId: true },
  });
  const orgId = scheduleRecord?.orgId ?? '';

  // Lignes existantes : un seul findMany (sert aux PENDING ET aux studentId déjà pris)
  const existing = await tx.attendance.findMany({
    where: { scheduleId },
    select: {
      id: true,
      status: true,
      studentId: true,
      student: { select: { userId: true } },
    },
  });

  const recordedStudentIds = new Set(existing.map((a) => a.studentId));

  // (1) PENDING ? ABSENT
  const pendings = existing.filter((a) => a.status === "PENDING");
  if (pendings.length > 0) {
    await tx.attendance.updateMany({
      where: { id: { in: pendings.map((p) => p.id) } },
      data: { status: "ABSENT" },
    });
  }

  // (2) attendus sans ligne ? ABSENT créé
  const expected = await getExpectedAttendees(scheduleId, tx);
  const absentStudents = expected.filter(
    (e) => !recordedStudentIds.has(e.studentId),
  );

  if (absentStudents.length > 0) {
    await tx.attendance.createMany({
      data: absentStudents.map((e) => ({
        scheduleId,
        studentId: e.studentId,
        enrollmentId: e.enrollmentId,
        orgId,
        status: "ABSENT" as const,
      })),
      skipDuplicates: true,
    });
  }

  // userId à notifier = PENDING basculés ? non-scanneurs créés
  const absentUserIds = [
    ...pendings.map((p) => p.student.userId),
    ...absentStudents.map((e) => e.userId),
  ];

  // studentId des absents  sert à notifier les PARENTS (gate org côté action).
  const absentStudentIds = [
    ...pendings.map((p) => p.studentId),
    ...absentStudents.map((e) => e.studentId),
  ];

  return { absentUserIds, absentStudentIds, audience: expected.length };
}
