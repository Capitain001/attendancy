"use client"
// src/hooks/data/sessions/use-attendance-stats.ts

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { getScheduleAttendancesAction } from "@/services/attendance";
import { CACHE_KEYS, QUERY_PRESETS } from "@/config/client_cache";

// ── Types ─────────────────────────────────────────────────────────────────────

type AttendanceCounts = {
  checkedCount: number; // PRESENT + LATE + PENDING
  presentCount: number;
  pendingCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  totalCount: number;
};



export interface AttendanceStats extends AttendanceCounts {

 /** Cache partagé non encore peuplé */
  isStale: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const INITIAL_COUNTS: AttendanceCounts = {
  checkedCount: 0,
  presentCount: 0,
  pendingCount: 0,
  lateCount: 0,
  absentCount: 0,
  excusedCount: 0,
  totalCount: 0,
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAttendanceStats(scheduleId: string): AttendanceStats {
  const { data } = useQuery({
    queryKey: CACHE_KEYS.ATTENDANCES.BY_SCHEDULE(scheduleId),
    queryFn: () => getScheduleAttendancesAction({ scheduleId }),
    enabled: !!scheduleId,
    ...QUERY_PRESETS.LIVE,
  });

  const stats = useMemo(() => {
    const counts = { ...INITIAL_COUNTS };

    for (const attendance of data?.data ?? []) {
      counts.totalCount++;

      switch (attendance.status) {
        case "PRESENT": counts.presentCount++; break;
        case "PENDING": counts.pendingCount++; break;
        case "LATE":    counts.lateCount++;    break;
        case "ABSENT":  counts.absentCount++;  break;
        case "EXCUSED": counts.excusedCount++; break;
      }
    }

    counts.checkedCount =
      counts.presentCount +
      counts.lateCount +
      counts.pendingCount;

    return counts;
  }, [data]);

  return {
    ...stats,
    isStale: !data,
  };
}
