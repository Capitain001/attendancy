import * as __generated_prisma_enums from '@/generated/prisma/enums';
import { Schedule, Level, AttendanceStatus } from '@/generated/prisma/browser';
import * as v from 'valibot';
import { InferOutput, InferInput } from 'valibot';
import * as _attendancy_user from '@attendancy/user';
import { Organization, UserInfo } from '@attendancy/user';
export { UserStatus } from '@attendancy/user';
import * as _prisma_client_runtime_client from '@prisma/client/runtime/client';
import { Level as Level$1, AttendanceStatus as AttendanceStatus$1 } from '@/generated/prisma/client';

type ScheduleFilterParams = Partial<Pick<Schedule, 'classId' | 'groupId' | 'teacherId' | 'roomId' | 'weekRecurrenceId' | 'status' | 'confirmed'>> & {
    orgId: string;
    academicYearId?: string;
    rangeStart: Date;
    rangeEnd: Date;
    groupIds?: string[];
};
declare function getSchedules(params: ScheduleFilterParams): Promise<({
    teacher: {
        id: string;
        user: {
            avatar_url: string | null;
            firstName: string | null;
            lastName: string | null;
        };
    };
    room: {
        id: string;
        name: string;
    };
    class: {
        id: string;
        name: string;
    };
    group: {
        id: string;
        name: string;
    } | null;
    course: {
        id: string;
        name: string;
    };
} & {
    id: string;
    classId: string;
    groupId: string | null;
    courseId: string;
    teacherId: string;
    roomId: string;
    weekRecurrenceId: string | null;
    createdAt: Date;
    deletedAt: Date | null;
    updatedAt: Date;
    status: __generated_prisma_enums.ScheduleStatus;
    notes: string | null;
    endTime: Date;
    startTime: Date;
    isLocked: boolean;
    confirmed: boolean;
    notifiedAt: Date | null;
    notifyState: __generated_prisma_enums.ScheduleNotifyState | null;
    scheduleType: __generated_prisma_enums.ScheduleType;
    statusChangedAt: Date | null;
})[]>;
declare function getTeacherNextSchedule(teacherId: string, orgId: string): Promise<{
    id: string;
    status: __generated_prisma_enums.ScheduleStatus;
    notes: string | null;
    endTime: Date;
    startTime: Date;
    confirmed: boolean;
    session: {
        id: string;
        status: __generated_prisma_enums.SessionStatus;
        checkIn: Date | null;
    } | null;
    room: {
        locationId: string | null;
        name: string;
    };
    class: {
        name: string;
        level: __generated_prisma_enums.Level;
        _count: {
            studentEnrollments: number;
        };
    };
    group: {
        name: string;
        _count: {
            studentGroups: number;
        };
    } | null;
    course: {
        name: string;
        ueCourse: {
            code: string | null;
        };
    };
} | null>;
declare function getTeacherDailySchedule(teacherId: string, orgId: string, dayKey: string): Promise<{
    id: string;
    status: __generated_prisma_enums.ScheduleStatus;
    notes: string | null;
    endTime: Date;
    startTime: Date;
    confirmed: boolean;
    session: {
        id: string;
        status: __generated_prisma_enums.SessionStatus;
        checkIn: Date | null;
    } | null;
    room: {
        locationId: string | null;
        name: string;
    };
    class: {
        name: string;
        level: __generated_prisma_enums.Level;
        _count: {
            studentEnrollments: number;
        };
    };
    group: {
        name: string;
        _count: {
            studentGroups: number;
        };
    } | null;
    course: {
        name: string;
    };
}[]>;

type GetSchedulesDto = Awaited<ReturnType<typeof getSchedules>>;
type GetTeacherNextScheduleDto = Awaited<ReturnType<typeof getTeacherNextSchedule>>;
type GetTeacherDailyScheduleDto = Awaited<ReturnType<typeof getTeacherDailySchedule>>;

declare const createScheduleSchema: v.ObjectSchema<{
    courseId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "Cours invalide">]>;
    teacherId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "Enseignant invalide">]>;
    roomId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "Salle invalide">]>;
    classId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "Classe invalide">]>;
    groupId: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "Groupe invalide">]>, undefined>;
    startTime: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.NonEmptyAction<string, "Heure de début requise">]>;
    endTime: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.NonEmptyAction<string, "Heure de fin requise">]>;
    notes: v.NullableSchema<v.StringSchema<undefined>, undefined>;
    confirmed: v.BooleanSchema<undefined>;
}, undefined>;
type CreateScheduleInput = InferInput<typeof createScheduleSchema>;
type CreateScheduleOutput = InferOutput<typeof createScheduleSchema>;
declare const updateScheduleDataSchema: v.ObjectSchema<{
    courseId: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "Cours invalide">]>, undefined>;
    teacherId: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "Enseignant invalide">]>, undefined>;
    roomId: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "Salle invalide">]>, undefined>;
    classId: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "Classe invalide">]>, undefined>;
    groupId: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "Groupe invalide">]>, undefined>;
    startTime: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.NonEmptyAction<string, "Heure de début requise">]>, undefined>;
    endTime: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.NonEmptyAction<string, "Heure de fin requise">]>, undefined>;
    notes: v.OptionalSchema<v.NullableSchema<v.StringSchema<undefined>, undefined>, undefined>;
    confirmed: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
    status: v.OptionalSchema<v.PicklistSchema<("PENDING" | "CANCELED" | "COMPLETED" | "MISSED")[], undefined>, undefined>;
}, undefined>;
declare const updateScheduleSchema: v.ObjectSchema<Record<"scheduleId", v.SchemaWithPipe<[v.StringSchema<undefined>, v.UuidAction<string, undefined>]>> & {
    data: v.ObjectSchema<{
        courseId: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "Cours invalide">]>, undefined>;
        teacherId: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "Enseignant invalide">]>, undefined>;
        roomId: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "Salle invalide">]>, undefined>;
        classId: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "Classe invalide">]>, undefined>;
        groupId: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "Groupe invalide">]>, undefined>;
        startTime: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.NonEmptyAction<string, "Heure de début requise">]>, undefined>;
        endTime: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.NonEmptyAction<string, "Heure de fin requise">]>, undefined>;
        notes: v.OptionalSchema<v.NullableSchema<v.StringSchema<undefined>, undefined>, undefined>;
        confirmed: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
        status: v.OptionalSchema<v.PicklistSchema<("PENDING" | "CANCELED" | "COMPLETED" | "MISSED")[], undefined>, undefined>;
    }, undefined>;
}, undefined>;
type UpdateScheduleDataInput = InferInput<typeof updateScheduleDataSchema>;
type UpdateScheduleInput = InferInput<typeof updateScheduleSchema>;
declare const getTeacherDailyScheduleSchema: v.ObjectSchema<{
    readonly dayKey: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.IsoDateAction<string, undefined>, v.CheckAction<string, "Jour invalide">]>, () => string>;
}, undefined>;
type GetTeacherDailyScheduleInput = v.InferInput<typeof getTeacherDailyScheduleSchema>;

declare function getTeacherNextScheduleAction({ teacherId }: {
    teacherId: string;
}): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
        id: string;
        status: __generated_prisma_enums.ScheduleStatus;
        notes: string | null;
        endTime: Date;
        startTime: Date;
        confirmed: boolean;
        session: {
            id: string;
            status: __generated_prisma_enums.SessionStatus;
            checkIn: Date | null;
        } | null;
        room: {
            locationId: string | null;
            name: string;
        };
        class: {
            name: string;
            level: __generated_prisma_enums.Level;
            _count: {
                studentEnrollments: number;
            };
        };
        group: {
            name: string;
            _count: {
                studentGroups: number;
            };
        } | null;
        course: {
            name: string;
            ueCourse: {
                code: string | null;
            };
        };
    } | null;
    error?: undefined;
}>;
declare function getSchedulesAction(params: Omit<ScheduleFilterParams, 'orgId'>): Promise<{
    error: string;
    data?: undefined;
} | {
    data: ({
        teacher: {
            id: string;
            user: {
                avatar_url: string | null;
                firstName: string | null;
                lastName: string | null;
            };
        };
        room: {
            id: string;
            name: string;
        };
        class: {
            id: string;
            name: string;
        };
        group: {
            id: string;
            name: string;
        } | null;
        course: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        classId: string;
        groupId: string | null;
        courseId: string;
        teacherId: string;
        roomId: string;
        weekRecurrenceId: string | null;
        createdAt: Date;
        deletedAt: Date | null;
        updatedAt: Date;
        status: __generated_prisma_enums.ScheduleStatus;
        notes: string | null;
        endTime: Date;
        startTime: Date;
        isLocked: boolean;
        confirmed: boolean;
        notifiedAt: Date | null;
        notifyState: __generated_prisma_enums.ScheduleNotifyState | null;
        scheduleType: __generated_prisma_enums.ScheduleType;
        statusChangedAt: Date | null;
    })[];
    error?: undefined;
}>;
declare function getTeacherDailyScheduleAction(input?: GetTeacherDailyScheduleInput): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
        id: string;
        status: __generated_prisma_enums.ScheduleStatus;
        notes: string | null;
        endTime: Date;
        startTime: Date;
        confirmed: boolean;
        session: {
            id: string;
            status: __generated_prisma_enums.SessionStatus;
            checkIn: Date | null;
        } | null;
        room: {
            locationId: string | null;
            name: string;
        };
        class: {
            name: string;
            level: __generated_prisma_enums.Level;
            _count: {
                studentEnrollments: number;
            };
        };
        group: {
            name: string;
            _count: {
                studentGroups: number;
            };
        } | null;
        course: {
            name: string;
        };
    }[];
    error?: undefined;
}>;

declare function createScheduleAction(data: CreateScheduleOutput): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
        teacher: {
            id: string;
            userId: string;
            user: {
                id: string;
                avatar_url: string | null;
                firstName: string | null;
                lastName: string | null;
            };
        };
        room: {
            id: string;
            name: string;
        };
        class: {
            id: string;
            name: string;
        };
        group: {
            id: string;
            name: string;
        } | null;
        course: {
            id: string;
            name: string;
        };
    } & {
        orgId: string;
        id: string;
        classId: string;
        groupId: string | null;
        courseId: string;
        teacherId: string;
        roomId: string;
        weekRecurrenceId: string | null;
        createdAt: Date;
        deletedAt: Date | null;
        updatedAt: Date;
        status: __generated_prisma_enums.ScheduleStatus;
        notes: string | null;
        endTime: Date;
        startTime: Date;
        isLocked: boolean;
        confirmed: boolean;
        notifiedAt: Date | null;
        notifyState: __generated_prisma_enums.ScheduleNotifyState | null;
        scheduleType: __generated_prisma_enums.ScheduleType;
        statusChangedAt: Date | null;
    };
    error?: undefined;
}>;
declare function updateScheduleAction(input: UpdateScheduleInput): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
        teacher: {
            id: string;
            userId: string;
            user: {
                id: string;
                avatar_url: string | null;
                firstName: string | null;
                lastName: string | null;
            };
        };
        room: {
            id: string;
            name: string;
        };
        class: {
            id: string;
            name: string;
        };
        group: {
            id: string;
            name: string;
        } | null;
        course: {
            id: string;
            name: string;
        };
    } & {
        orgId: string;
        id: string;
        classId: string;
        groupId: string | null;
        courseId: string;
        teacherId: string;
        roomId: string;
        weekRecurrenceId: string | null;
        createdAt: Date;
        deletedAt: Date | null;
        updatedAt: Date;
        status: __generated_prisma_enums.ScheduleStatus;
        notes: string | null;
        endTime: Date;
        startTime: Date;
        isLocked: boolean;
        confirmed: boolean;
        notifiedAt: Date | null;
        notifyState: __generated_prisma_enums.ScheduleNotifyState | null;
        scheduleType: __generated_prisma_enums.ScheduleType;
        statusChangedAt: Date | null;
    };
    error?: undefined;
}>;
declare function deleteScheduleAction(scheduleId: string): Promise<{
    error: string;
    data?: undefined;
} | {
    data: true;
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
        id: string;
        academicYearId: string;
        programTrackId: string;
        name: string;
        level: Level;
        _count: {
            courses: number;
            studentEnrollments: number;
        };
        academicYear: {
            id: string;
            name: string;
        };
        programTrack: {
            id: string;
            name: string;
        };
    }[];
    error?: undefined;
}>;

/**
 * Liste des classes d'une organisation.
 * Peut être filtrée par année académique et filière.
 */
declare function getClasses({ orgId, yearId, programTrackId, name, level }: {
    orgId: string;
    yearId?: string;
    programTrackId?: string;
    name?: string;
    level?: Level$1;
}): Promise<{
    id: string;
    academicYearId: string;
    programTrackId: string;
    name: string;
    level: Level$1;
    _count: {
        courses: number;
        studentEnrollments: number;
    };
    academicYear: {
        id: string;
        name: string;
    };
    programTrack: {
        id: string;
        name: string;
    };
}[]>;

type GetClassesDto = Awaited<ReturnType<typeof getClasses>>;

declare const deviceIdInputSchema: v.ObjectSchema<{
    readonly deviceId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 8, "deviceId invalide">, v.MaxLengthAction<string, 200, undefined>]>;
}, undefined>;
type DeviceIdInput = v.InferInput<typeof deviceIdInputSchema>;

declare function registerDeviceAction(input: DeviceIdInput): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
        device: {
            id: string;
            revokedAt: Date | null;
        };
        session: {
            id: string;
            deviceId: string;
            createdAt: Date;
        };
    };
    error?: undefined;
}>;
declare function endSessionAction(input: DeviceIdInput): Promise<{
    error: string;
    data?: undefined;
} | {
    data: boolean;
    error?: undefined;
}>;

declare const signupPersonalSchema: v.ObjectSchema<{
    readonly email: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.TrimAction, v.EmailAction<string, "Email invalide">]>;
    readonly password: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 8, "Mot de passe trop court">]>;
}, undefined>;
type SignupPersonalInput = InferInput<typeof signupPersonalSchema>;

declare function signupPersonalDesktopAction(input: SignupPersonalInput): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
        email: string;
    };
    error?: undefined;
}>;

declare function getCurrentUserAction(): Promise<{
    data: _attendancy_user.ClientUser;
    error?: undefined;
} | {
    error: string;
    data?: undefined;
}>;

declare const resourceTypeSchema: v.EnumSchema<{
    readonly COURSE: "COURSE";
    readonly SCHEDULE: "SCHEDULE";
    readonly USER: "USER";
    readonly STUDENT: "STUDENT";
    readonly TEACHER: "TEACHER";
    readonly ROOM: "ROOM";
    readonly LOCATION: "LOCATION";
    readonly PROGRAM: "PROGRAM";
    readonly FILIERE: "FILIERE";
    readonly ATTENDANCE: "ATTENDANCE";
    readonly GRADE: "GRADE";
    readonly CLASS: "CLASS";
    readonly GROUP: "GROUP";
    readonly MESSAGE: "MESSAGE";
    readonly JUSTIFICATION: "JUSTIFICATION";
    readonly INVITATION: "INVITATION";
    readonly NOTE: "NOTE";
}, undefined>;
declare const notificationEventSchema: v.EnumSchema<{
    readonly CREATED: "CREATED";
    readonly UPDATED: "UPDATED";
    readonly REJECTED: "REJECTED";
    readonly CANCELED: "CANCELED";
    readonly CONFIRMED: "CONFIRMED";
    readonly ASSIGNED: "ASSIGNED";
    readonly UNASSIGNED: "UNASSIGNED";
}, undefined>;

declare function getNotifications(limit?: number): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
        metadata: _prisma_client_runtime_client.JsonValue;
        message: string;
        orgId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        resourceId: string | null;
        resourceType: __generated_prisma_enums.Resource | null;
        read: boolean;
        event: __generated_prisma_enums.NotificationEvent | null;
    }[];
    error?: undefined;
}>;
declare function getUnread(limit?: number): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
        metadata: _prisma_client_runtime_client.JsonValue;
        message: string;
        orgId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        resourceId: string | null;
        resourceType: __generated_prisma_enums.Resource | null;
        read: boolean;
        event: __generated_prisma_enums.NotificationEvent | null;
    }[];
    error?: undefined;
}>;
declare function getUnreadCount(): Promise<{
    error: string;
    data?: undefined;
} | {
    data: number;
    error?: undefined;
}>;

declare function markNotificationAsRead(notificationId: string): Promise<{
    error: string;
    data?: undefined;
} | {
    data: true;
    error?: undefined;
}>;
declare function markAllRead(): Promise<{
    error: string;
    data?: undefined;
} | {
    data: true;
    error?: undefined;
}>;
declare function deleteNotification(notificationId: string): Promise<{
    error: string;
    data?: undefined;
} | {
    data: true;
    error?: undefined;
}>;

declare const notifyChannelMembersSchema: v.ObjectSchema<{
    readonly channelId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "ID de canal invalide">]>;
    readonly messageId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "ID de message invalide">]>;
    readonly excludedIds: v.OptionalSchema<v.SchemaWithPipe<readonly [v.ArraySchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, undefined>]>, undefined>, v.MaxLengthAction<string[], 500, undefined>]>, readonly []>;
}, undefined>;
type NotifyChannelMembersInput = v.InferInput<typeof notifyChannelMembersSchema>;

/**
 * Notifie les membres d'un canal d'un nouveau message (en ligne ou non).
 * L'expéditeur et son organisation viennent de la session, jamais du client, et
 * le contenu vient de la base : un push ne peut annoncer qu'un message réel,
 * écrit par l'expéditeur, dans ce canal, et non supprimé.
 * `excludedIds` ne peut que réduire la liste des destinataires, jamais l'élargir.
 */
declare function notifyChannelMembersAction(input: NotifyChannelMembersInput): Promise<{
    error: string;
    data?: undefined;
} | {
    data: true;
    error?: undefined;
}>;

declare function getNotificationsForUser(userId: string, limit?: number): Promise<{
    metadata: _prisma_client_runtime_client.JsonValue;
    message: string;
    orgId: string | null;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    resourceId: string | null;
    resourceType: __generated_prisma_enums.Resource | null;
    read: boolean;
    event: __generated_prisma_enums.NotificationEvent | null;
}[]>;
declare function getUnreadNotificationsForUser(userId: string, limit?: number): Promise<{
    metadata: _prisma_client_runtime_client.JsonValue;
    message: string;
    orgId: string | null;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    resourceId: string | null;
    resourceType: __generated_prisma_enums.Resource | null;
    read: boolean;
    event: __generated_prisma_enums.NotificationEvent | null;
}[]>;
declare function getUnreadCountForUser(userId: string): Promise<number>;

type GetNotificationsForUserDto = Awaited<ReturnType<typeof getNotificationsForUser>>;
type GetUnreadNotificationsForUserDto = Awaited<ReturnType<typeof getUnreadNotificationsForUser>>;
type GetUnreadCountForUserDto = Awaited<ReturnType<typeof getUnreadCountForUser>>;

type NotificationItem = Awaited<ReturnType<typeof getNotificationsForUser>>[number];

declare const createMessageSchema: v.ObjectSchema<{
    id: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "ID de message invalide">]>;
    createdAt: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.IsoTimestampAction<string, "Date invalide">, v.TransformAction<string, Date>, v.CheckAction<Date, "Date invalide">]>, undefined>;
    content: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.TrimAction, v.MinLengthAction<string, 1, "Le message ne peut pas être vide">, v.MaxLengthAction<string, 4000, "Message trop long">]>;
    channelId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "ID de canal invalide">]>;
    parentId: v.OptionalSchema<v.NullableSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "ID parent invalide">]>, undefined>, undefined>;
}, undefined>;
type CreateMessageInput = v.InferInput<typeof createMessageSchema>;
declare const updateMessageDataSchema: v.ObjectSchema<{
    content: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.TrimAction, v.MinLengthAction<string, 1, "Le message ne peut pas être vide">, v.MaxLengthAction<string, 4000, "Message trop long">]>, undefined>;
}, undefined>;
type UpdateMessageDataInput = v.InferInput<typeof updateMessageDataSchema>;
declare const updateMessageSchema: v.ObjectSchema<Record<"messageId", v.SchemaWithPipe<[v.StringSchema<undefined>, v.UuidAction<string, undefined>]>> & {
    data: v.ObjectSchema<{
        content: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.TrimAction, v.MinLengthAction<string, 1, "Le message ne peut pas être vide">, v.MaxLengthAction<string, 4000, "Message trop long">]>, undefined>;
    }, undefined>;
}, undefined>;
type UpdateMessageInput = v.InferInput<typeof updateMessageSchema>;
declare const getMessagesSchema: v.ObjectSchema<{
    readonly channelId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "ID de canal invalide">]>;
}, undefined>;
type GetMessagesInput = v.InferInput<typeof getMessagesSchema>;
declare const getOlderMessagesSchema: v.ObjectSchema<{
    readonly channelId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "ID de canal invalide">]>;
    readonly before: v.ObjectSchema<{
        readonly createdAt: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.IsoTimestampAction<string, "Date de curseur invalide">, v.TransformAction<string, Date>, v.CheckAction<Date, "Date de curseur invalide">]>;
        readonly id: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "ID de curseur invalide">]>;
    }, undefined>;
}, undefined>;
type GetOlderMessagesInput = v.InferInput<typeof getOlderMessagesSchema>;

declare function getMessagesAction(input: GetMessagesInput): Promise<{
    readonly error: "Accès refusé au canal";
    readonly code: "FORBIDDEN";
} | {
    error: string;
    code: "UNAUTHORIZED" | "FORBIDDEN" | "SERVER" | "ORG_NOT_FOUND";
    data?: undefined;
} | {
    error: string;
    code?: undefined;
    data?: undefined;
} | {
    data: {
        parent: {
            id: string;
            deleted: boolean;
            content: string | null;
            user: {
                id: string;
                firstName: string | null;
                lastName: string | null;
            } | null;
        } | null;
        id: string;
        channelId: string;
        parentId: string | null;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        editedAt: Date | null;
        user: {
            id: string;
            avatar_url: string | null;
            firstName: string | null;
            lastName: string | null;
        } | null;
    }[];
    error?: undefined;
    code?: undefined;
}>;
/**
 * Page de messages antérieurs au curseur `before` (le plus ancien message déjà chargé).
 * La taille de page est fixée côté serveur : le client ne la choisit pas.
 */
declare function getOlderMessagesAction(input: GetOlderMessagesInput): Promise<{
    readonly error: "Accès refusé au canal";
    readonly code: "FORBIDDEN";
} | {
    error: string;
    code: "UNAUTHORIZED" | "FORBIDDEN" | "SERVER" | "ORG_NOT_FOUND";
    data?: undefined;
} | {
    error: string;
    code?: undefined;
    data?: undefined;
} | {
    data: {
        items: {
            parent: {
                id: string;
                deleted: boolean;
                content: string | null;
                user: {
                    id: string;
                    firstName: string | null;
                    lastName: string | null;
                } | null;
            } | null;
            id: string;
            channelId: string;
            parentId: string | null;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            editedAt: Date | null;
            user: {
                id: string;
                avatar_url: string | null;
                firstName: string | null;
                lastName: string | null;
            } | null;
        }[];
        hasMore: boolean;
    };
    error?: undefined;
    code?: undefined;
}>;

declare const ERROR_CODES: {
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly BAD_REQUEST: "BAD_REQUEST";
    readonly SERVER: "SERVER";
    readonly ORG_NOT_FOUND: "ORG_NOT_FOUND";
    readonly CONFLICT: "CONFLICT";
    readonly UNAVAILABLE: "UNAVAILABLE";
    readonly VALIDATION: "VALIDATION";
};
type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

declare function createMessageAction(input: CreateMessageInput): Promise<{
    error: string;
    code: ErrorCode;
} | {
    data: {
        id: string;
        created: boolean;
        createdAt: Date;
    };
}>;
declare function updateMessageAction(input: UpdateMessageInput): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
        parent: {
            id: string;
            deleted: boolean;
            content: string | null;
            user: {
                id: string;
                firstName: string | null;
                lastName: string | null;
            } | null;
        } | null;
        id: string;
        channelId: string;
        parentId: string | null;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        editedAt: Date | null;
        user: {
            id: string;
            avatar_url: string | null;
            firstName: string | null;
            lastName: string | null;
        } | null;
    };
    error?: undefined;
}>;
declare function removeMessageAction(messageId: string): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
        id: string;
    };
    error?: undefined;
}>;

declare function getMessages(channelId: string, orgId: string, limit?: number): Promise<{
    parent: {
        id: string;
        deleted: boolean;
        content: string | null;
        user: {
            id: string;
            firstName: string | null;
            lastName: string | null;
        } | null;
    } | null;
    id: string;
    channelId: string;
    parentId: string | null;
    createdAt: Date;
    updatedAt: Date;
    content: string;
    editedAt: Date | null;
    user: {
        id: string;
        avatar_url: string | null;
        firstName: string | null;
        lastName: string | null;
    } | null;
}[]>;

type GetMessagesDto = Awaited<ReturnType<typeof getMessages>>;

type StartSessionInput$1 = {
    scheduleId: string;
    coords: {
        lat: number;
        lng: number;
    } | null;
};
declare function startSessionAction({ scheduleId, coords }: StartSessionInput$1): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
        sessionId: string;
        checkIn: Date;
        isLate: boolean;
        locationId: string | null;
        checkInMethod: string;
    };
    error?: undefined;
}>;
declare function completeSessionAction(scheduleId: string): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
        absentUserIds: string[];
        absentStudentIds: string[];
        audience: number;
        sessionId: string;
        checkOut: Date;
        durationMinutes: number;
    };
    error?: undefined;
}>;

declare function generateTokenAction(sessionId: string): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
        token: string;
        expiresAt: Date;
        url: string;
    };
    error?: undefined;
}>;

declare function getScheduleAttendancesAction({ scheduleId }: {
    scheduleId: string;
}): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
        id: string;
        status: __generated_prisma_enums.AttendanceStatus;
        recordedAt: Date;
        student: {
            user: {
                id: string;
                avatar_url: string | null;
                firstName: string | null;
                lastName: string | null;
            };
        };
    }[];
    error?: undefined;
}>;

declare function confirmAttendanceAction({ attendanceId }: {
    attendanceId: string;
}): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
        id: string;
        status: AttendanceStatus;
        userId: string;
        confirmed: boolean;
    };
    error?: undefined;
}>;
declare function confirmAllAttendancesAction({ scheduleId }: {
    scheduleId: string;
}): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
        confirmed: number;
        userIds: string[];
    };
    error?: undefined;
}>;

declare function getScheduleAttendances(scheduleId: string): Promise<{
    id: string;
    status: AttendanceStatus$1;
    recordedAt: Date;
    student: {
        user: {
            id: string;
            avatar_url: string | null;
            firstName: string | null;
            lastName: string | null;
        };
    };
}[]>;

type GetScheduleAttendancesDto = Awaited<ReturnType<typeof getScheduleAttendances>>;

declare const getChannelMuteByUserSchema: v.ObjectSchema<{
    readonly channelId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "ID de canal invalide">]>;
}, undefined>;
type GetChannelMuteByUserInput = v.InferInput<typeof getChannelMuteByUserSchema>;
declare const updateChannelMuteSchema: v.ObjectSchema<Record<"channelId", v.SchemaWithPipe<[v.StringSchema<undefined>, v.UuidAction<string, undefined>]>> & {
    data: v.ObjectSchema<{
        readonly muted: v.BooleanSchema<undefined>;
    }, undefined>;
}, undefined>;
type UpdateChannelMuteInput = v.InferInput<typeof updateChannelMuteSchema>;

declare function getChannelMuteByUserAction(input: GetChannelMuteByUserInput): Promise<{
    error: string;
    code: "UNAUTHORIZED" | "FORBIDDEN" | "SERVER" | "ORG_NOT_FOUND";
    data?: undefined;
} | {
    error: string;
    code?: undefined;
    data?: undefined;
} | {
    data: {
        muted: boolean;
    };
    error?: undefined;
    code?: undefined;
}>;

declare function updateChannelMuteByUserAction(input: UpdateChannelMuteInput): Promise<{
    error: string;
    code: "UNAUTHORIZED" | "FORBIDDEN" | "SERVER" | "ORG_NOT_FOUND";
    data?: undefined;
} | {
    error: string;
    code?: undefined;
    data?: undefined;
} | {
    data: {
        muted: boolean;
    };
    error?: undefined;
    code?: undefined;
}>;

declare function getChannelsAction(): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
        type: __generated_prisma_enums.ChannelType;
        id: string;
        classId: string | null;
        groupId: string | null;
        name: string | null;
        createdAt: Date;
        isPrivate: boolean;
    }[];
    error?: undefined;
}>;
declare function getChannelAction(channelId: string): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
        type: __generated_prisma_enums.ChannelType;
        id: string;
        classId: string | null;
        groupId: string | null;
        name: string | null;
        createdAt: Date;
        isPrivate: boolean;
    } | null;
    error?: undefined;
}>;

declare const createChannelSchema: v.SchemaWithPipe<readonly [v.ObjectSchema<{
    type: v.PicklistSchema<readonly ["CLASS", "GROUP", "ORG", "DM"], "Type de channel invalide">;
    name: v.OptionalSchema<v.NullableSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.TrimAction, v.MinLengthAction<string, 1, "Nom requis">, v.MaxLengthAction<string, 100, undefined>]>, undefined>, undefined>;
    isPrivate: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
    classId: v.OptionalSchema<v.NullableSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "ID invalide">]>, undefined>, undefined>;
    groupId: v.OptionalSchema<v.NullableSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "ID invalide">]>, undefined>, undefined>;
}, undefined>, v.CheckAction<{
    type: "CLASS" | "GROUP" | "ORG" | "DM";
    name?: string | null | undefined;
    isPrivate?: boolean | undefined;
    classId?: string | null | undefined;
    groupId?: string | null | undefined;
}, "classId requis pour un channel CLASS">, v.CheckAction<{
    type: "CLASS" | "GROUP" | "ORG" | "DM";
    name?: string | null | undefined;
    isPrivate?: boolean | undefined;
    classId?: string | null | undefined;
    groupId?: string | null | undefined;
}, "groupId requis pour un channel GROUP">, v.CheckAction<{
    type: "CLASS" | "GROUP" | "ORG" | "DM";
    name?: string | null | undefined;
    isPrivate?: boolean | undefined;
    classId?: string | null | undefined;
    groupId?: string | null | undefined;
}, "Un channel ne peut cibler à la fois une classe et un groupe">]>;
type CreateChannelInput = v.InferInput<typeof createChannelSchema>;
declare const updateChannelDataSchema: v.ObjectSchema<{
    name: v.OptionalSchema<v.NullableSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.TrimAction, v.MinLengthAction<string, 1, "Nom requis">, v.MaxLengthAction<string, 100, undefined>]>, undefined>, undefined>;
    isPrivate: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
}, undefined>;
type UpdateChannelDataInput = v.InferInput<typeof updateChannelDataSchema>;
declare const updateChannelSchema: v.ObjectSchema<Record<"channelId", v.SchemaWithPipe<[v.StringSchema<undefined>, v.UuidAction<string, undefined>]>> & {
    data: v.ObjectSchema<{
        name: v.OptionalSchema<v.NullableSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.TrimAction, v.MinLengthAction<string, 1, "Nom requis">, v.MaxLengthAction<string, 100, undefined>]>, undefined>, undefined>;
        isPrivate: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
    }, undefined>;
}, undefined>;
type UpdateChannelInput = v.InferInput<typeof updateChannelSchema>;

declare function createChannelAction(input: CreateChannelInput): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
        type: __generated_prisma_enums.ChannelType;
        id: string;
        classId: string | null;
        groupId: string | null;
        name: string | null;
        createdAt: Date;
        isPrivate: boolean;
    };
    error?: undefined;
}>;
declare function updateChannelAction(input: UpdateChannelInput): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
        type: __generated_prisma_enums.ChannelType;
        id: string;
        classId: string | null;
        groupId: string | null;
        name: string | null;
        createdAt: Date;
        isPrivate: boolean;
    };
    error?: undefined;
}>;
declare function removeChannelAction(channelId: string): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
        id: string;
    };
    error?: undefined;
}>;

declare function getChannels(orgId: string): Promise<{
    type: __generated_prisma_enums.ChannelType;
    id: string;
    classId: string | null;
    groupId: string | null;
    name: string | null;
    createdAt: Date;
    isPrivate: boolean;
}[]>;
declare function getChannel(channelId: string, orgId: string): Promise<{
    type: __generated_prisma_enums.ChannelType;
    id: string;
    classId: string | null;
    groupId: string | null;
    name: string | null;
    createdAt: Date;
    isPrivate: boolean;
} | null>;

type GetChannelsDto = Awaited<ReturnType<typeof getChannels>>;
type GetChannelDto = Awaited<ReturnType<typeof getChannel>>;

declare const ACTIONS: {
    readonly getSchedulesAction: typeof getSchedulesAction;
    readonly createScheduleAction: typeof createScheduleAction;
    readonly updateScheduleAction: typeof updateScheduleAction;
    readonly deleteScheduleAction: typeof deleteScheduleAction;
    readonly getTeacherDailyScheduleAction: typeof getTeacherDailyScheduleAction;
    readonly getTeacherNextScheduleAction: typeof getTeacherNextScheduleAction;
    readonly getClassesAction: typeof getClassesAction;
    readonly registerDeviceAction: typeof registerDeviceAction;
    readonly endSessionAction: typeof endSessionAction;
    readonly getCurrentUserAction: typeof getCurrentUserAction;
    readonly signupPersonalDesktopAction: typeof signupPersonalDesktopAction;
    readonly getNotifications: typeof getNotifications;
    readonly getUnread: typeof getUnread;
    readonly getUnreadCount: typeof getUnreadCount;
    readonly markNotificationAsRead: typeof markNotificationAsRead;
    readonly markAllRead: typeof markAllRead;
    readonly deleteNotification: typeof deleteNotification;
    readonly notifyChannelMembersAction: typeof notifyChannelMembersAction;
    readonly getMessagesAction: typeof getMessagesAction;
    readonly getOlderMessagesAction: typeof getOlderMessagesAction;
    readonly createMessageAction: typeof createMessageAction;
    readonly updateMessageAction: typeof updateMessageAction;
    readonly removeMessageAction: typeof removeMessageAction;
    readonly startSessionAction: typeof startSessionAction;
    readonly completeSessionAction: typeof completeSessionAction;
    readonly generateTokenAction: typeof generateTokenAction;
    readonly getScheduleAttendancesAction: typeof getScheduleAttendancesAction;
    readonly confirmAttendanceAction: typeof confirmAttendanceAction;
    readonly confirmAllAttendancesAction: typeof confirmAllAttendancesAction;
    readonly getChannelMuteByUserAction: typeof getChannelMuteByUserAction;
    readonly updateChannelMuteByUserAction: typeof updateChannelMuteByUserAction;
    readonly getChannelsAction: typeof getChannelsAction;
    readonly getChannelAction: typeof getChannelAction;
    readonly createChannelAction: typeof createChannelAction;
    readonly updateChannelAction: typeof updateChannelAction;
    readonly removeChannelAction: typeof removeChannelAction;
};

/**
 * Champs critiques : servent à autoriser ou à rejouer une invitation.
 * Ne doivent jamais atteindre un composant client.
 */
declare const SENSITIVE_USER_KEYS: readonly ["organizations", "invited_by", "invitationType"];
declare const SENSITIVE_ORGANIZATION_KEYS: readonly ["responsable", "departmentId", "studentId", "teacherId", "parentId", "directionId"];
type PublicOrganization = Omit<Organization, (typeof SENSITIVE_ORGANIZATION_KEYS)[number]>;
/**
 * UserInfo sans les champs critiques : le type à utiliser dans tous les composants client.
 * Pour un besoin ponctuel : `PublicUserInfo & { phone_verified: boolean }`.
 */
type PublicUserInfo = Omit<UserInfo, (typeof SENSITIVE_USER_KEYS)[number] | 'organization'> & {
    organization?: PublicOrganization;
};

type ResourceType = v.InferOutput<typeof resourceTypeSchema>;
type NotificationEvent = v.InferOutput<typeof notificationEventSchema>;

type Actions = typeof ACTIONS;
type ApiClient = {
    [K in keyof Actions]: (...args: Parameters<Actions[K]>) => Promise<Awaited<ReturnType<Actions[K]>>>;
};
type ApiAction = keyof ApiClient;
type ApiInput<K extends ApiAction> = Parameters<ApiClient[K]>[0];
type ApiOutput<K extends ApiAction> = Awaited<ReturnType<ApiClient[K]>>;
type StartSessionInput = ApiInput<'startSessionAction'>;

export type { ApiAction, ApiClient, ApiInput, ApiOutput, CreateChannelInput, CreateMessageInput, CreateScheduleInput, GetChannelDto, GetChannelsDto, GetClassesDto, GetMessagesDto, GetNotificationsForUserDto, GetScheduleAttendancesDto, GetSchedulesDto, GetTeacherDailyScheduleDto, GetTeacherNextScheduleDto, GetUnreadCountForUserDto, GetUnreadNotificationsForUserDto, NotificationEvent, NotificationItem, PublicOrganization, PublicUserInfo, ResourceType, StartSessionInput, UpdateChannelDataInput, UpdateMessageDataInput, UpdateScheduleDataInput };
