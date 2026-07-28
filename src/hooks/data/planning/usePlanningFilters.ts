"use client";

import { useCallback } from "react";
import {
  useQueryState,
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
} from "nuqs";
import type { ScheduleStatus } from "@/generated/prisma/client";

import { SCHEDULE_STATUS_VALUES } from "@/components/planning/filters/constants";

export interface PlanningFilters {
  classIds: string[];
  groupIds: string[];
  teacherIds: string[];
  roomIds: string[];
  statuses: ScheduleStatus[];
}

const strArr = () => parseAsArrayOf(parseAsString).withDefault([]);
// null => le param est retiré de l'URL quand la sélection est vide
const orNull = <T>(v: T[]) => (v.length ? v : null);

export function usePlanningFilters() {
  const [classIds, setClassIdsRaw] = useQueryState("classIds", strArr());
  const [groupIds, setGroupIds] = useQueryState("groupIds", strArr());
  const [teacherIds, setTeacherIds] = useQueryState("teacherIds", strArr());
  const [roomIds, setRoomIds] = useQueryState("roomIds", strArr());
  const [statuses, setStatuses] = useQueryState(
    "statuses",
    parseAsArrayOf(
      parseAsStringEnum<ScheduleStatus>([...SCHEDULE_STATUS_VALUES])
    ).withDefault([])
  );

  // Reset complet des groupes à chaque changement de classes
  // (Group.classId non nullable : un groupe appartient à exactement une classe).
  const setClassIds = useCallback(
    (next: string[]) => {
      setClassIdsRaw(orNull(next));
      setGroupIds(null);
    },
    [setClassIdsRaw, setGroupIds]
  );

  const set = {
    classIds: setClassIds,
    groupIds: (v: string[]) => setGroupIds(orNull(v)),
    teacherIds: (v: string[]) => setTeacherIds(orNull(v)),
    roomIds: (v: string[]) => setRoomIds(orNull(v)),
    statuses: (v: ScheduleStatus[]) => setStatuses(orNull(v)),
  };

  const resetAll = useCallback(() => {
    setClassIdsRaw(null);
    setGroupIds(null);
    setTeacherIds(null);
    setRoomIds(null);
    setStatuses(null);
  }, [setClassIdsRaw, setGroupIds, setTeacherIds, setRoomIds, setStatuses]);

  const filters: PlanningFilters = {
    classIds,
    groupIds,
    teacherIds,
    roomIds,
    statuses,
  };

  const activeCount =
    classIds.length +
    groupIds.length +
    teacherIds.length +
    roomIds.length +
    statuses.length;

  return { filters, set, resetAll, activeCount };
}
