// src/hooks/data/planning/useFilterAvailability.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { filterAvailabilityAction } from "@/services/planning/conflict/actions";
import type { Room, Course } from "@/generated/prisma/client";
import type { GetTeacherDto as TeacherDTo } from "@/services/teacher/types";

export interface UseFilterAvailabilityOptions {
  start: Date | null;
  end: Date | null;
  excludeScheduleId?: string | null;
  rooms: Room[];
  courses: Course[];
  teachers: TeacherDTo[];
  enabled?: boolean;
  staleTime?: number;
}

/**
 * Hook pour filtrer les salles, cours et enseignants selon la disponibilité
 * 
 * Logique progressive :
 * - Date seule → availableRooms=[data], availableCourses=[], availableTeachers=[]
 * - Date + Room → availableRooms=[data], availableCourses=[data], availableTeachers=[]
 * - Date + Room + Cours → availableRooms=[data], availableCourses=[data], availableTeachers=[data]
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = useFilterAvailability({
 *   start: new Date("2025-01-15T08:00:00"),
 *   end: new Date("2025-01-15T10:00:00"),
 *   selectedRoomId: "room-123",
 *   selectedCourseId: "course-456",
 *   rooms: allRooms,
 *   courses: allCourses,
 *   teachers: allTeachers,
 * });
 * ```
 */
export function useFilterAvailability({
  start,
  end,
  excludeScheduleId,
  rooms,
  courses,
  teachers,
  enabled = true,
  staleTime = 30 * 1000, // 30 secondes
}: UseFilterAvailabilityOptions) {
  // Déterminer si on peut faire l'appel API
  const canFetch = enabled && !!start && !!end && rooms.length > 0;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      "filter-availability",
      start?.toISOString(),
      end?.toISOString(),
      excludeScheduleId,
      rooms.length,
      courses.length,
      teachers.length,
    ],
    queryFn: async () => {
      if (!start || !end) {
        throw new Error("Les dates de début et de fin sont requises");
      }

      const result = await filterAvailabilityAction({
        start,
        end,
        excludeScheduleId: excludeScheduleId || undefined,
        rooms: rooms.map((r) => ({ id: r.id, name: r.name })),
        courses: courses.map((c) => ({ id: c.id, name: c.name })),
        teachers: teachers.filter(t => t?.id).map((t) => ({ id: t!.id! })),
      });

      if ('error' in result) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: canFetch,
    staleTime,
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mapper les résultats avec les données complètes
  const availableRooms = useMemo(() => {
    if (!data) {
      return rooms.map((r) => ({ ...r, available: true }));
    }
    return data.availableRooms.map((filteredRoom) => {
      const fullRoom = rooms.find((r) => r.id === filteredRoom.id);
      return {
        ...fullRoom,
        ...filteredRoom,
      };
    });
  }, [data, rooms]);

  const availableCourses = useMemo(() => {
    if (!data) {
      return courses.map((c) => ({ ...c, available: true }));
    }
    return data.availableCourses.map((filteredCourse) => {
      const fullCourse = courses.find((c) => c.id === filteredCourse.id);
      return {
        ...fullCourse,
        ...filteredCourse,
      };
    });
  }, [data, courses]);

  const availableTeachers = useMemo(() => {
    if (!data) {
      return teachers.map((t) => ({ ...t, available: true }));
    }
    return data.availableTeachers.map((filteredTeacher) => {
      const fullTeacher = teachers.find((t) => t?.id === filteredTeacher.id);
      return {
        ...fullTeacher,
        ...filteredTeacher,
      };
    });
  }, [data, teachers]);

  return {
    availableRooms,
    availableCourses,
    availableTeachers,
    isLoading,
    error,
    refetch,
  };
}

