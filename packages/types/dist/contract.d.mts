import * as __generated_prisma_enums from '@/generated/prisma/enums';
import { Schedule, Level, OrganizationType } from '@/generated/prisma/browser';
import * as v from 'valibot';
import { InferOutput, InferInput } from 'valibot';

type ScheduleFilterParams = Partial<Pick<Schedule, 'classId' | 'groupId' | 'teacherId' | 'roomId' | 'weekRecurrenceId' | 'status' | 'confirmed'>> & {
    orgId: string;
    academicYearId?: string;
    rangeStart: Date;
    rangeEnd: Date;
    groupIds?: string[];
};

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
    data: UserInfo;
    error?: undefined;
} | {
    error: string;
    data?: undefined;
}>;

declare const ACTIONS: {
    readonly getSchedulesAction: typeof getSchedulesAction;
    readonly createScheduleAction: typeof createScheduleAction;
    readonly updateScheduleAction: typeof updateScheduleAction;
    readonly deleteScheduleAction: typeof deleteScheduleAction;
    readonly getClassesAction: typeof getClassesAction;
    readonly registerDeviceAction: typeof registerDeviceAction;
    readonly endSessionAction: typeof endSessionAction;
    readonly getCurrentUserAction: typeof getCurrentUserAction;
    readonly ;signupPersonalDesktopAction: typeof signupPersonalDesktopAction;
};

type Actions = typeof ACTIONS;
type ApiClient = {
    [K in keyof Actions]: (...args: Parameters<Actions[K]>) => Promise<Awaited<ReturnType<Actions[K]>>>;
};
type ApiAction = keyof ApiClient;
type ApiInput<K extends ApiAction> = Parameters<ApiClient[K]>[0];
type ApiOutput<K extends ApiAction> = Awaited<ReturnType<ApiClient[K]>>;

export type { ApiAction, ApiClient, ApiInput, ApiOutput, CreateScheduleInput, UpdateScheduleDataInput };
