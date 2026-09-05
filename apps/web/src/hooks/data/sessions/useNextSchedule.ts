"use client"
import { useQuery } from "@tanstack/react-query";
import { getTeacherNextScheduleAction } from "@/services/schedule";
import { CACHE_KEYS, QUERY_PRESETS } from "@/config/client_cache";

/* 
type TeacherNextScheduleResponse = {
    data: {
        id: string;
        startTime: Date;
        endTime: Date;
        status: $Enums.ScheduleStatus;
        confirmed: boolean;
        notes: string | null;
        course: {
            name: string;
            ueCourse: {
                code: string | null;
            };
        };
        room: {
            name: string;
            locationId: string | null;
        };
        class: {
            _count: {
                studentEnrollments: number;
            };
            name: string;
            level: $Enums.Level;
        };
        group: {
            _count: {
                studentGroups: : number;
            };
            name: string;
        } | null;
        session: {
            id: string;
            status: $Enums.SessionStatus;
            checkIn: Date | null;
        } | null;
    } | null;
    error?: undefined;
} | {
    error: string;
    data?: undefined;
}

*/


export const useNextSchedule = ({teacherId}:{teacherId: string}) => {
  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey:CACHE_KEYS.SCHEDULES.NEXT(teacherId),
    queryFn: () => getTeacherNextScheduleAction({ teacherId }),
   ...QUERY_PRESETS.SESSION,
    enabled: !!teacherId,
  });

  const schedule = response?.data ?? null;

  return { schedule, isLoading, error, refetch };
};
