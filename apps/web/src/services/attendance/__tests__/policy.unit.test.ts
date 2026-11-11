// src/services/attendance/__tests__/policy.unit.test.ts
import { describe, expect, it } from "vitest";
import { computeAttendanceRate, countMissed } from "../policy";

describe("computeAttendanceRate", () => {
  it("counts PRESENT and LATE, excludes PENDING, and keeps EXCUSED in the denominator", () => {
    const result = computeAttendanceRate({
      PRESENT: 28,
      LATE: 3,
      ABSENT: 4,
      EXCUSED: 1,
      PENDING: 2,
    });

    expect(result).toEqual({
      attended: 31,
      total: 36,
      absent: 4,
      excused: 1,
      missed: 5,
      rate: 86,
    });
  });

  it("returns null when no completed attendance status can be measured", () => {
    expect(computeAttendanceRate({ PENDING: 3 })).toEqual({
      attended: 0,
      total: 0,
      absent: 0,
      excused: 0,
      missed: 0,
      rate: null,
    });
  });
});

describe("countMissed", () => {
  it("counts ABSENT and EXCUSED, but not PENDING", () => {
    expect(countMissed({ ABSENT: 2, EXCUSED: 3, PENDING: 5 })).toBe(5);
  });
});
