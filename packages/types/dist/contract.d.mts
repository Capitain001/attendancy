import * as __generated_prisma_enums from '@/generated/prisma/enums';
import { Schedule, Level, OrganizationType } from '@/generated/prisma/browser';
import * as v from 'valibot';
import { InferOutput, InferInput } from 'valibot';
import * as src from 'src';
import * as _prisma_client_runtime_client from '@prisma/client/runtime/client';
import { Level as Level$1 } from '@/generated/prisma/client';

type ScheduleFilterParams = Partial<Pick<Schedule, 'classId' | 'groupId' | 'teacherId' | 'roomId' | 'weekRecurrenceId' | 'status' | 'confirmed'>> & {
    orgId: string;
    academicYearId?: string;
    rangeStart: Date;
    rangeEnd: Date;
    groupIds?: string[];
};
declare function getSchedules(params: ScheduleFilterParams): Promise<({
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
})[]>;

type GetSchedulesDto = Awaited<ReturnType<typeof getSchedules>>;

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

declare function createScheduleAction(data: CreateScheduleOutput): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
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
    };
    error?: undefined;
}>;
declare function updateScheduleAction(input: UpdateScheduleInput): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
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
    name: string;
    id: string;
    academicYearId: string;
    programTrackId: string;
    level: Level$1;
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
            createdAt: Date;
            deviceId: string;
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

/**
 * Fonctions principales du système
 * Source unique de vérité
 */
declare const MAIN_FUNCTIONS: readonly [{
    readonly name: "PRINCIPAL";
    readonly description: "Chef d'établissement, responsable de la gestion globale de l'institution et de la supervision du personnel.";
    readonly icon: "principal.svg";
}, {
    readonly name: "SECRETARY";
    readonly description: "Secrétaire administratif, gestion des dossiers, de la correspondance et des tâches administratives courantes.";
    readonly icon: "secretary.svg";
}, {
    readonly name: "ASSISTANT";
    readonly description: "Assistant administratif, support opérationnel des tâches déléguées par les responsables.";
    readonly icon: "assistant.svg";
}, {
    readonly name: "DELEGATE";
    readonly description: "Délégué de classe, représente des élèves en liaison avec l'administration.";
    readonly icon: "delegate.svg";
}, {
    readonly name: "COORDINATOR";
    readonly description: "Coordinateur pédagogique ou Responsable de discipline";
    readonly icon: "coordinator.svg";
}, {
    readonly name: "MEMBER";
    readonly description: "Membre de l'administration pédagogique";
    readonly icon: "member.svg";
}];
/**
 * Type sécurisé dérivé automatiquement
 * inclue SUPER_ADMIN (admin principal) + les fonctions principales pedagogiques
 */
type FunctionName = (typeof MAIN_FUNCTIONS)[number]["name"] | "SUPER_ADMIN";

interface InvitedBy {
    id: string;
    name: string;
    email: string;
}

declare const UserRoles: {
    readonly ADMIN: "ADMIN";
    readonly TEACHER: "TEACHER";
    readonly STUDENT: "STUDENT";
    readonly PARENT: "PARENT";
    readonly DIRECTION: "DIRECTION";
    readonly GUEST: "GUEST";
};
type Role = typeof UserRoles[keyof typeof UserRoles];
declare const Functions: Record<FunctionName, FunctionName>;
type Functions = typeof Functions[keyof typeof Functions];
interface Organization {
    id?: string;
    name?: string;
    slug?: string;
    logo?: string;
    type?: OrganizationType;
    permissions?: string[];
    responsable?: boolean;
    departmentId?: string;
    studentId?: string;
    teacherId?: string;
    parentId?: string;
    directionId?: string;
}
declare const UserStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly INACTIVE: "INACTIVE";
    readonly SUSPENDED: "SUSPENDED";
    readonly ON_LEAVE: "ON_LEAVE";
    readonly PENDING: "PENDING";
    readonly NEW: "NEW";
    readonly INVITED: "INVITED";
};
type UserStatus = typeof UserStatus[keyof typeof UserStatus];
interface UserInfo {
    id?: string;
    email?: string;
    role?: Role;
    name?: string;
    avatar_url?: string;
    phone?: string;
    email_verified?: boolean;
    phone_verified?: boolean;
    function?: Functions;
    organization?: Organization;
    organizations?: Organization[];
    invited_by?: Partial<InvitedBy>;
    status?: UserStatus;
    invitationToken?: string;
    invitationType?: string;
    isConnected?: boolean;
    online_at?: string;
    /** Fourni nativement par Supabase Auth (user.updated_at), pas par user_metadata.
   *  Se met à jour automatiquement à chaque updateUser/updateUserById. */
    updated_at?: string;
}

declare function getCurrentUserAction(): Promise<{
    data: src.UserInfo;
    error?: undefined;
} | {
    error: string;
    data?: undefined;
}>;

declare function getNotifications(limit?: number): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
        type: __generated_prisma_enums.NotificationType;
        metadata: _prisma_client_runtime_client.JsonValue;
        message: string;
        id: string;
        scheduleId: string | null;
        createdAt: Date;
        updatedAt: Date;
        read: boolean;
    }[];
    error?: undefined;
}>;
declare function getUnread(limit?: number): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
        type: __generated_prisma_enums.NotificationType;
        metadata: _prisma_client_runtime_client.JsonValue;
        message: string;
        id: string;
        scheduleId: string | null;
        createdAt: Date;
        updatedAt: Date;
        read: boolean;
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

declare function getNotificationsForUser(userId: string, limit?: number): Promise<{
    type: __generated_prisma_enums.NotificationType;
    metadata: _prisma_client_runtime_client.JsonValue;
    message: string;
    id: string;
    scheduleId: string | null;
    createdAt: Date;
    updatedAt: Date;
    read: boolean;
}[]>;
declare function getUnreadNotificationsForUser(userId: string, limit?: number): Promise<{
    type: __generated_prisma_enums.NotificationType;
    metadata: _prisma_client_runtime_client.JsonValue;
    message: string;
    id: string;
    scheduleId: string | null;
    createdAt: Date;
    updatedAt: Date;
    read: boolean;
}[]>;
declare function getUnreadCountForUser(userId: string): Promise<number>;

declare const notificationTypeSchema: v.PicklistSchema<["ABSENCE", "COURSE_CHANGE", "NEW_COURSE", "SCHEDULE_UPDATE", "GENERAL", "MESSAGE", "INVITATION"], undefined>;

type GetNotificationsForUserDto = Awaited<ReturnType<typeof getNotificationsForUser>>;
type GetUnreadNotificationsForUserDto = Awaited<ReturnType<typeof getUnreadNotificationsForUser>>;
type GetUnreadCountForUserDto = Awaited<ReturnType<typeof getUnreadCountForUser>>;

type NotificationItem = Awaited<ReturnType<typeof getNotificationsForUser>>[number];

declare const ACTIONS: {
    readonly getSchedulesAction: typeof getSchedulesAction;
    readonly createScheduleAction: typeof createScheduleAction;
    readonly updateScheduleAction: typeof updateScheduleAction;
    readonly deleteScheduleAction: typeof deleteScheduleAction;
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
};

type NotificationType = v.InferOutput<typeof notificationTypeSchema>;

type Actions = typeof ACTIONS;
type ApiClient = {
    [K in keyof Actions]: (...args: Parameters<Actions[K]>) => Promise<Awaited<ReturnType<Actions[K]>>>;
};
type ApiAction = keyof ApiClient;
type ApiInput<K extends ApiAction> = Parameters<ApiClient[K]>[0];
type ApiOutput<K extends ApiAction> = Awaited<ReturnType<ApiClient[K]>>;

export { type ApiAction, type ApiClient, type ApiInput, type ApiOutput, type CreateScheduleInput, type GetClassesDto, type GetNotificationsForUserDto, type GetSchedulesDto, type GetUnreadCountForUserDto, type GetUnreadNotificationsForUserDto, type NotificationItem, type NotificationType, type UpdateScheduleDataInput, type UserInfo, UserStatus };
