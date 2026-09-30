import * as __generated_prisma_enums from '@/generated/prisma/enums';
import { Schedule, Level } from '@/generated/prisma/browser';

type ScheduleFilterParams = Partial<Pick<Schedule, 'classId' | 'groupId' | 'teacherId' | 'roomId' | 'weekRecurrenceId' | 'status' | 'confirmed'>> & {
    orgId: string;
    academicYearId?: string;
    rangeStart: Date;
    rangeEnd: Date;
    groupIds?: string[];
};

declare function getSchedulesAction(params: Omit<ScheduleFilterParams, 'orgId'>): Promise<{
    error: string;
    data?: undefined;
} | {
    data: ({
        group: {
            name: string;
            id: string;
        } | null;
        teacher: {
            id: string;
            user: {
                firstName: string | null;
                lastName: string | null;
                avatar_url: string | null;
            };
        };
        class: {
            name: string;
            id: string;
        };
        course: {
            name: string;
            id: string;
        };
        room: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        status: __generated_prisma_enums.ScheduleStatus;
        orgId: string;
        classId: string;
        groupId: string | null;
        courseId: string;
        teacherId: string;
        roomId: string;
        weekRecurrenceId: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        isLocked: boolean;
        scheduleType: __generated_prisma_enums.ScheduleType;
        notes: string | null;
        startTime: Date;
        endTime: Date;
        statusChangedAt: Date | null;
        confirmed: boolean;
        notifyState: __generated_prisma_enums.ScheduleNotifyState | null;
        notifiedAt: Date | null;
    })[];
    error?: undefined;
}>;

declare function getClassesAction({ yearId, programTrackId, name, level }?: {
    yearId?: string;
    programTrackId?: string;
    name?: string;
    level?: Level;
}): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
        name: string;
        id: string;
        academicYearId: string;
        programTrackId: string;
        level: Level;
        academicYear: {
            name: string;
            id: string;
        };
        programTrack: {
            name: string;
            id: string;
        };
        _count: {
            courses: number;
            studentEnrollments: number;
        };
    }[];
    error?: undefined;
}>;

declare const ACTIONS: {
    readonly getSchedulesAction: typeof getSchedulesAction;
    readonly getClassesAction: typeof getClassesAction;
};

type Actions = typeof ACTIONS;
type ApiClient = {
    [K in keyof Actions]: (...args: Parameters<Actions[K]>) => Promise<Awaited<ReturnType<Actions[K]>>>;
};
type ApiAction = keyof ApiClient;
type ApiInput<K extends ApiAction> = Parameters<ApiClient[K]>[0];
type ApiOutput<K extends ApiAction> = Awaited<ReturnType<ApiClient[K]>>;

export type { ApiAction, ApiClient, ApiInput, ApiOutput };
