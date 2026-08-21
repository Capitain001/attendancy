import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import type { Period } from "./constants";

export function resolveRange(
  period: Period,
  custom: { start: string; end: string },
): { start: Date; end: Date } {
  const now = new Date();
  switch (period) {
    case "day":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "week":
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case "month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "custom": {
      const s = custom.start ? startOfDay(new Date(custom.start)) : startOfDay(now);
      const e = custom.end ? endOfDay(new Date(custom.end)) : endOfDay(now);
      return { start: s, end: e };
    }
  }
}
