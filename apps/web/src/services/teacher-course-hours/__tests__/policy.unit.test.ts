// src/services/teacher-course-hours/__tests__/policy.unit.test.ts
//
// Tests unitaires purs — aucune DB, aucun mock Prisma. Vérifie que
// scheduleDurationHours / countsTowardHours / aggregateHoursByScheduleType
// reproduisent EXACTEMENT la formule et les conditions du trigger SQL
// sync_teacher_course_hours_stats (post-migrate/40_schedule.sql).
//
// Lancer :
//   npx vitest run --project unit src/services/teacher-course-hours/__tests__/policy.unit.test.ts

import { describe, expect, it } from "vitest";
import {
  aggregateHoursByScheduleType,
  countsTowardHours,
  scheduleDurationHours,
  type ScheduleForHours,
} from "../policy";

// ─── Helpers de fixture ───────────────────────────────────────────────────────

function makeSchedule(overrides: Partial<ScheduleForHours> = {}): ScheduleForHours {
  return {
    startTime: new Date("2026-09-21T08:00:00.000Z"),
    endTime: new Date("2026-09-21T10:00:00.000Z"), // 2h par défaut
    status: "COMPLETED",
    deletedAt: null,
    scheduleType: "CM",
    ...overrides,
  };
}

// ─── scheduleDurationHours ─────────────────────────────────────────────────────

describe("scheduleDurationHours", () => {
  it("calcule 2h pour un créneau de 08:00 à 10:00", () => {
    const s = makeSchedule();
    expect(scheduleDurationHours(s)).toBe(2);
  });

  it("calcule une durée fractionnaire (1h30 → 1.5)", () => {
    const s = makeSchedule({
      startTime: new Date("2026-09-21T08:00:00.000Z"),
      endTime: new Date("2026-09-21T09:30:00.000Z"),
    });
    expect(scheduleDurationHours(s)).toBe(1.5);
  });

  it("accepte des dates en string (sérialisation JSON) comme le ferait la DB", () => {
    const s = makeSchedule({
      startTime: "2026-09-21T08:00:00.000Z" as unknown as Date,
      endTime: "2026-09-21T11:00:00.000Z" as unknown as Date,
    });
    expect(scheduleDurationHours(s)).toBe(3);
  });

  it("retourne 0 pour startTime === endTime (bord — normalement bloqué par check_schedule_time_order en DB)", () => {
    const s = makeSchedule({
      startTime: new Date("2026-09-21T08:00:00.000Z"),
      endTime: new Date("2026-09-21T08:00:00.000Z"),
    });
    expect(scheduleDurationHours(s)).toBe(0);
  });
});

// ─── countsTowardHours ──────────────────────────────────────────────────────────

describe("countsTowardHours", () => {
  it("compte une séance COMPLETED non supprimée", () => {
    expect(countsTowardHours(makeSchedule({ status: "COMPLETED", deletedAt: null }))).toBe(true);
  });

  it("ne compte pas une séance PENDING", () => {
    expect(countsTowardHours(makeSchedule({ status: "PENDING" }))).toBe(false);
  });

  it("ne compte pas une séance CANCELED", () => {
    expect(countsTowardHours(makeSchedule({ status: "CANCELED" }))).toBe(false);
  });

  it("ne compte pas une séance MISSED", () => {
    expect(countsTowardHours(makeSchedule({ status: "MISSED" }))).toBe(false);
  });

  it("ne compte pas une séance COMPLETED mais soft-deleted", () => {
    expect(
      countsTowardHours(makeSchedule({ status: "COMPLETED", deletedAt: new Date() })),
    ).toBe(false);
  });
});

// ─── aggregateHoursByScheduleType ───────────────────────────────────────────────

describe("aggregateHoursByScheduleType", () => {
  it("agrège plusieurs séances du même scheduleType", () => {
    const schedules = [
      makeSchedule({ scheduleType: "CM" }), // 2h
      makeSchedule({
        scheduleType: "CM",
        startTime: new Date("2026-09-22T08:00:00.000Z"),
        endTime: new Date("2026-09-22T09:00:00.000Z"), // 1h
      }),
    ];
    expect(aggregateHoursByScheduleType(schedules)).toEqual({ CM: 3 });
  });

  it("sépare les compteurs par scheduleType — pas de mélange CM/TD", () => {
    const schedules = [
      makeSchedule({ scheduleType: "CM" }), // 2h
      makeSchedule({
        scheduleType: "TD",
        startTime: new Date("2026-09-22T08:00:00.000Z"),
        endTime: new Date("2026-09-22T09:30:00.000Z"), // 1.5h
      }),
    ];
    expect(aggregateHoursByScheduleType(schedules)).toEqual({ CM: 2, TD: 1.5 });
  });

  it("ignore les séances qui ne comptent pas (PENDING, CANCELED, soft-deleted)", () => {
    const schedules = [
      makeSchedule({ scheduleType: "CM", status: "COMPLETED" }), // 2h — compte
      makeSchedule({ scheduleType: "CM", status: "PENDING" }), // ignoré
      makeSchedule({ scheduleType: "CM", status: "CANCELED" }), // ignoré
      makeSchedule({ scheduleType: "CM", status: "COMPLETED", deletedAt: new Date() }), // ignoré
    ];
    expect(aggregateHoursByScheduleType(schedules)).toEqual({ CM: 2 });
  });

  it("retourne un objet vide pour un tableau vide", () => {
    expect(aggregateHoursByScheduleType([])).toEqual({});
  });

  it("retourne un objet vide si aucune séance ne compte", () => {
    const schedules = [
      makeSchedule({ status: "PENDING" }),
      makeSchedule({ status: "MISSED" }),
    ];
    expect(aggregateHoursByScheduleType(schedules)).toEqual({});
  });

  it("gère les 5 valeurs de l'enum ScheduleType indépendamment", () => {
    const schedules = (["CM", "TD", "TP", "EXAM", "RATTRAPAGE"] as const).map((scheduleType) =>
      makeSchedule({ scheduleType, endTime: new Date("2026-09-21T09:00:00.000Z") }), // 1h chacune
    );
    expect(aggregateHoursByScheduleType(schedules)).toEqual({
      CM: 1,
      TD: 1,
      TP: 1,
      EXAM: 1,
      RATTRAPAGE: 1,
    });
  });
});