import { describe, it, expect } from "vitest";

import { getParentCourseStatus, ageFromDateOfBirth } from "./utils";

const fmt = (d: Date) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

describe("getParentCourseStatus", () => {
  it("PENDING en séance ACTIVE => En cours (jamais absent)", () => {
    const r = getParentCourseStatus({
      courseName: "Maths",
      sessionStatus: "ACTIVE",
      attendanceStatus: "PENDING",
      formatTime: fmt,
    });
    expect(r.kind).toBe("active");
    expect(r.label).toBe("En cours - Maths");
  });

  it("ACTIVE sans Attendance => En attente de scan", () => {
    const r = getParentCourseStatus({
      courseName: "Maths",
      sessionStatus: "ACTIVE",
      attendanceStatus: null,
      formatTime: fmt,
    });
    expect(r.kind).toBe("waiting-scan");
  });

  it("ACTIVE + ABSENT => Absent", () => {
    const r = getParentCourseStatus({
      courseName: "Maths",
      sessionStatus: "ACTIVE",
      attendanceStatus: "ABSENT",
      formatTime: fmt,
    });
    expect(r.kind).toBe("absent");
    expect(r.label).toBe("Absent - Maths");
  });

  it("COMPLETED + PRESENT => cours terminé", () => {
    const r = getParentCourseStatus({
      courseName: "Maths",
      sessionStatus: "COMPLETED",
      attendanceStatus: "PRESENT",
      formatTime: fmt,
    });
    expect(r.kind).toBe("completed");
  });

  it("schedule futur sans session => Cours prévu à HH:mm", () => {
    const start = new Date(2026, 5, 13, 9, 30);
    const r = getParentCourseStatus({
      sessionStatus: null,
      attendanceStatus: null,
      nextScheduleStart: start,
      formatTime: fmt,
    });
    expect(r.kind).toBe("upcoming");
    expect(r.label).toBe("Cours prévu à 09:30");
  });

  it("rien => empty", () => {
    const r = getParentCourseStatus({
      sessionStatus: null,
      attendanceStatus: null,
      formatTime: fmt,
    });
    expect(r.kind).toBe("empty");
  });
});

describe("ageFromDateOfBirth", () => {
  it("calcule l'âge en années pleines", () => {
    const now = new Date(2026, 5, 13);
    expect(ageFromDateOfBirth(new Date(2010, 5, 13), now)).toBe(16);
    expect(ageFromDateOfBirth(new Date(2010, 5, 14), now)).toBe(15); // anniv pas encore passé
  });

  it("null si pas de date", () => {
    expect(ageFromDateOfBirth(null)).toBeNull();
  });
});
