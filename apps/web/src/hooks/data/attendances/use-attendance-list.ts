// src/hooks/data/sessions/use-attendance-list.ts

import { useMemo, useCallback } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { toast } from "sonner";

import {
  confirmAttendanceAction,
  confirmAllAttendancesAction,
  getScheduleAttendancesAction,
} from "@/services/attendance";

import { type GetScheduleAttendancesDto as ScheduleAttendanceDTO } from "@/services/attendance/types";
import type { $Enums } from "@/generated/prisma/client";

import {
  CACHE_KEYS,
  QUERY_PRESETS,
} from "@/config/client_cache";

export const useAttendanceList = ({
  scheduleId,
}: {
  scheduleId: string;
}) => {
  const queryClient = useQueryClient();

  // ── Query Key ────────────────────────────────────────────────────────────

  const queryKey = CACHE_KEYS.ATTENDANCES.BY_SCHEDULE(scheduleId);

  // ── Query ───────────────────────────────────────────────────────────────

  const { data: response, isLoading } = useQuery({
    queryKey,
    queryFn: () => getScheduleAttendancesAction({ scheduleId }),
    enabled: !!scheduleId,
    ...QUERY_PRESETS.LIVE,
  });

  // ── Data ────────────────────────────────────────────────────────────────

  const attendances: ScheduleAttendanceDTO = response?.data ?? [];

  type AttendanceItem = ScheduleAttendanceDTO[number];
  const byStatus = useMemo(
    () =>
      attendances.reduce(
        (acc, a) => {
          const key = a.status;
          acc[key] = [...(acc[key] ?? []), a] as AttendanceItem[];
          return acc;
        },
        {} as Partial<Record<$Enums.AttendanceStatus, AttendanceItem[]>>
      ),
    [attendances]
  );

  // ── Confirm One ─────────────────────────────────────────────────────────

  const confirmOneMutation = useMutation({
    mutationFn: (attendanceId: string) =>
      confirmAttendanceAction({ attendanceId }),

    onSuccess: (response) => {
      if (response.error) {
        toast.error(response.error);
        return;
      }

      queryClient.invalidateQueries({ queryKey });
    },

    onError: () => {
      toast.error("Erreur lors de la confirmation.");
    },
  });

  // ── Confirm Many ─────────────────────────────────────────────────────────

  const confirmManyMutation = useMutation({
    mutationFn: (attendanceIds: string[]) =>
      Promise.all(
        attendanceIds.map((id) =>
          confirmAttendanceAction({ attendanceId: id })
        )
      ),

    onSuccess: (responses) => {
      const failed = responses.filter((r) => r.error);

      if (failed.length === responses.length) {
        toast.error("Toutes les confirmations ont échoué.");
        return;
      }

      if (failed.length > 0) {
        const ok = responses.length - failed.length;
        toast.warning(
          `${ok} confirmée${ok > 1 ? "s" : ""}, ${failed.length} échouée${failed.length > 1 ? "s" : ""}.`
        );
      } else {
        const count = responses.length;
        toast.success(
          `${count} présence${count > 1 ? "s" : ""} confirmée${count > 1 ? "s" : ""}.`
        );
      }

      queryClient.invalidateQueries({ queryKey });
    },

    onError: () => {
      toast.error("Erreur lors de la confirmation groupée.");
    },
  });

  // ── Confirm All ─────────────────────────────────────────────────────────

  const confirmAllMutation = useMutation({
    mutationFn: () => confirmAllAttendancesAction({ scheduleId }),

    onSuccess: (response) => {
      if (response.error) {
        toast.error(response.error);
        return;
      }

      const count = response.data?.confirmed ?? 0;

      toast.success(
        `${count} présence${count > 1 ? "s" : ""} validée${count > 1 ? "s" : ""}.`
      );

      queryClient.invalidateQueries({ queryKey });
    },

    onError: () => {
      toast.error("Erreur lors de la validation groupée.");
    },
  });

  // ── Derived State ────────────────────────────────────────────────────────

  const isConfirmingOne = confirmOneMutation.isPending;
  const isConfirmingMany = confirmManyMutation.isPending;
  const isConfirmingAll = confirmAllMutation.isPending;

  const confirmingOneId = confirmOneMutation.variables;
  const confirmingManyIds = useMemo(
    () => new Set(confirmManyMutation.variables ?? []),
    [confirmManyMutation.variables]
  );

  const isConfirmingId = useCallback(
    (id: string) =>
      (isConfirmingOne && confirmingOneId === id) ||
      (isConfirmingMany && confirmingManyIds.has(id)),
    [isConfirmingOne, confirmingOneId, isConfirmingMany, confirmingManyIds]
  );

  // ── Return ──────────────────────────────────────────────────────────────

  return {
    // data
    attendances,
    byStatus,

    // state
    isLoading,
    isPending: {
      one: isConfirmingOne,
      many: isConfirmingMany,
      all: isConfirmingAll,
      any: isLoading || isConfirmingOne || isConfirmingMany || isConfirmingAll,
    } as const,
    isConfirmingId,

    // actions
    confirmOne: (id: string) => confirmOneMutation.mutate(id),
    confirmMany: (ids: string[]) => confirmManyMutation.mutate(ids),
    confirmAll: () => confirmAllMutation.mutate(),
  };
};
